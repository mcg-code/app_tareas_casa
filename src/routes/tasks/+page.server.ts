import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { tasks, houseMembers, auditLogs, taskTemplates, taskApprovals, frozenPoints, taskAssignees, users } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateId } from '$lib/server/utils';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }
  if (!locals.user.houseId || !locals.user.memberId) {
    redirect(303, '/houses');
  }

  const houseId = locals.user.houseId;
  const currentMemberId = locals.user.memberId;

  // Lógica de autogeneración de tareas recurrentes
  const allTemplates = await db.select().from(taskTemplates).where(eq(taskTemplates.houseId, houseId));
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Buscar si ya hemos generado tareas hoy
  const tasksCreatedToday = await db.select().from(tasks)
    .where(and(
      eq(tasks.houseId, houseId)
    ))
    .then(res => res.filter(t => t.createdAt && new Date(t.createdAt) >= startOfToday));

  const newTasksToInsert = [];

  for (const template of allTemplates) {
    if (template.frequency !== 'none') {
      const todayDayOfWeek = new Date().getDay(); // 0-6 (0=Dom)
      const todayDayOfMonth = new Date().getDate(); // 1-31

      let shouldSpawn = false;
      if (template.frequency === 'daily') {
        shouldSpawn = true;
      } else if (template.frequency === 'weekly' && template.frequencyValue === todayDayOfWeek) {
        shouldSpawn = true;
      } else if (template.frequency === 'monthly' && template.frequencyValue === todayDayOfMonth) {
        shouldSpawn = true;
      }

      if (shouldSpawn) {
        const alreadySpawned = tasksCreatedToday.some(t => t.templateId === template.id);
        if (!alreadySpawned) {
          newTasksToInsert.push({
            id: generateId(),
            houseId,
            templateId: template.id,
            title: template.title,
            basePoints: template.basePoints,
            currentPoints: template.basePoints,
            createdAt: new Date(),
            status: 'pending' as const
          });
        }
      }
    }
  }

  if (newTasksToInsert.length > 0) {
    await db.insert(tasks).values(newTasksToInsert);
  }

  // Lógica de inflación de puntos (Dynamic Reward 10% diario)
  const pendingTasks = await db.select().from(tasks).where(and(eq(tasks.houseId, houseId), eq(tasks.status, 'pending')));
  for (const t of pendingTasks) {
    if (t.createdAt) {
      const taskCreated = new Date(t.createdAt);
      const startOfTaskCreate = new Date(taskCreated.getFullYear(), taskCreated.getMonth(), taskCreated.getDate());
      const ageInDays = Math.floor((startOfToday.getTime() - startOfTaskCreate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (ageInDays > 0) {
        const inflatedPoints = Math.round(t.basePoints * Math.pow(1.1, ageInDays));
        if (inflatedPoints !== t.currentPoints) {
          await db.update(tasks).set({ currentPoints: inflatedPoints }).where(eq(tasks.id, t.id));
        }
      }
    }
  }

  // Cargar miembros de la casa para asignaciones
  const currentHouseMembers = await db
    .select({
      id: houseMembers.id,
      name: users.name,
      displayName: houseMembers.displayName,
      emoji: houseMembers.emoji,
      avatarUrl: houseMembers.avatarUrl
    })
    .from(houseMembers)
    .innerJoin(users, eq(houseMembers.userId, users.id))
    .where(eq(houseMembers.houseId, houseId));

  // Cargar asignaciones de tareas
  const allTaskAssignees = await db
    .select({
      id: taskAssignees.id,
      taskId: taskAssignees.taskId,
      memberId: taskAssignees.memberId,
      name: users.name,
      displayName: houseMembers.displayName,
      emoji: houseMembers.emoji,
      avatarUrl: houseMembers.avatarUrl
    })
    .from(taskAssignees)
    .innerJoin(houseMembers, eq(taskAssignees.memberId, houseMembers.id))
    .innerJoin(users, eq(houseMembers.userId, users.id));

  // Cargar tareas de hoy (pendientes o reclamadas)
  const rawTodayTasks = await db.select({
    id: tasks.id,
    title: tasks.title,
    basePoints: tasks.currentPoints,
    assignedToId: tasks.assignedToId,
    status: tasks.status,
    dueDate: tasks.dueDate,
    templateId: tasks.templateId,
    templateCreatedAt: taskTemplates.createdAt
  }).from(tasks)
    .leftJoin(taskTemplates, eq(tasks.templateId, taskTemplates.id))
    .where(and(eq(tasks.houseId, houseId), eq(tasks.status, 'pending')))
    .orderBy(desc(tasks.id));

  const todayTasks = rawTodayTasks.map(t => {
    let assigneesForTask = allTaskAssignees
      .filter(a => a.taskId === t.id)
      .map(a => ({ id: a.memberId, name: a.displayName || a.name, emoji: a.emoji || '👤', avatarUrl: a.avatarUrl }));

    // Si no hay asignaciones en taskAssignees pero hay assignedToId histórico
    if (assigneesForTask.length === 0 && t.assignedToId) {
      const m = currentHouseMembers.find(member => member.id === t.assignedToId);
      if (m) {
        assigneesForTask = [{ id: m.id, name: m.displayName || m.name, emoji: m.emoji || '👤', avatarUrl: m.avatarUrl }];
      }
    }

    return {
      id: t.id,
      title: t.title,
      basePoints: t.basePoints,
      assignedToId: t.assignedToId || (assigneesForTask[0]?.id ?? null),
      assignees: assigneesForTask,
      status: (t.status || 'pending') as 'pending' | 'up_for_grabs' | 'completed',
      dueDate: t.dueDate,
      templateId: t.templateId,
      templateCreatedAt: t.templateCreatedAt
    };
  });

  // Si está activada la opción de fechas límite, ordenar cronológicamente
  // (las que antes acaban primero, las que más tarde acaban van al final)
  if (locals.user.settings?.enableDueDates) {
    todayTasks.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return 0;
    });
  }

  const quarantineTemplates = await db.select().from(taskTemplates)
    .where(eq(taskTemplates.houseId, houseId));

  const templatesInQuarantine = quarantineTemplates.filter(t => new Date(t.createdAt) > yesterday);

  const approvals = await db.select().from(taskApprovals);
  const houseMemberCount = currentHouseMembers.length;

  const quarantineWithVotes = templatesInQuarantine.map(t => {
    const templateApprovals = approvals.filter(a => a.templateId === t.id);
    const hasVoted = templateApprovals.some(a => a.memberId === currentMemberId);
    return {
      ...t,
      approvalsCount: templateApprovals.length,
      houseMemberCount,
      hasVoted
    };
  });

  return {
    tasks: todayTasks,
    houseMembers: currentHouseMembers.map(m => ({ id: m.id, name: m.displayName || m.name, emoji: m.emoji || '👤', avatarUrl: m.avatarUrl })),
    quarantine: quarantineWithVotes,
    userId: currentMemberId,
    houseName: locals.user.houseName,
    settings: locals.user.settings,
    user: locals.user
  };
};

export const actions = {
  claim: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId || !locals.user.memberId) return fail(401);
    const memberId = locals.user.memberId;
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    if (!taskId) return fail(400);

    // Asignar al usuario actual
    await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    await db.insert(taskAssignees).values({
      id: generateId(),
      taskId,
      memberId,
      createdAt: new Date()
    });

    await db.update(tasks).set({
      assignedToId: memberId
    }).where(eq(tasks.id, taskId));

    return { success: true };
  },

  join: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId || !locals.user.memberId) return fail(401);
    const memberId = locals.user.memberId;
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    if (!taskId) return fail(400);

    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
    if (!task) return fail(404);

    const existingAssignees = await db.select().from(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    
    // Si tenía assignedToId pero no en taskAssignees, sincronizar el existente
    if (existingAssignees.length === 0 && task.assignedToId) {
      await db.insert(taskAssignees).values({
        id: generateId(),
        taskId,
        memberId: task.assignedToId,
        createdAt: new Date()
      });
      existingAssignees.push({
        id: '',
        taskId,
        memberId: task.assignedToId,
        createdAt: new Date()
      });
    }

    const alreadyIn = existingAssignees.some(a => a.memberId === memberId);
    if (!alreadyIn) {
      await db.insert(taskAssignees).values({
        id: generateId(),
        taskId,
        memberId,
        createdAt: new Date()
      });
    }

    await db.update(tasks).set({
      assignedToId: memberId
    }).where(eq(tasks.id, taskId));

    return { success: true };
  },

  unclaim: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId || !locals.user.memberId) return fail(401);
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    const targetMemberId = data.get('memberId')?.toString() || locals.user.memberId;
    if (!taskId) return fail(400);

    await db.delete(taskAssignees).where(
      and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.memberId, targetMemberId))
    );

    const remaining = await db.select().from(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    await db.update(tasks).set({
      assignedToId: remaining.length > 0 ? remaining[0].memberId : null
    }).where(eq(tasks.id, taskId));

    return { success: true };
  },

  toggleAssignee: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    const memberId = data.get('memberId')?.toString();
    if (!taskId || !memberId) return fail(400);

    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
    if (!task) return fail(404);

    const existing = await db.select().from(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    if (existing.length === 0 && task.assignedToId) {
      await db.insert(taskAssignees).values({
        id: generateId(),
        taskId,
        memberId: task.assignedToId,
        createdAt: new Date()
      });
      existing.push({ id: '', taskId, memberId: task.assignedToId, createdAt: new Date() });
    }

    const found = existing.find(a => a.memberId === memberId);
    if (found) {
      await db.delete(taskAssignees).where(
        and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.memberId, memberId))
      );
    } else {
      await db.insert(taskAssignees).values({
        id: generateId(),
        taskId,
        memberId,
        createdAt: new Date()
      });
    }

    const remaining = await db.select().from(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    await db.update(tasks).set({
      assignedToId: remaining.length > 0 ? remaining[0].memberId : null
    }).where(eq(tasks.id, taskId));

    return { success: true };
  },

  deleteTask: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    if (!taskId) return fail(400);

    await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    await db.delete(tasks).where(eq(tasks.id, taskId));

    return { success: true };
  },

  complete: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId || !locals.user.memberId) return fail(401);
    const currentMemberId = locals.user.memberId;
    const currentHouseId = locals.user.houseId;

    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    if (!taskId) return fail(400);

    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
    if (!task) return fail(404);

    const template = task.templateId 
      ? await db.select().from(taskTemplates).where(eq(taskTemplates.id, task.templateId)).get()
      : null;

    const isVerified = template 
      ? (new Date().getTime() - new Date(template.createdAt).getTime() > 24 * 60 * 60 * 1000)
      : true;

    // Obtener todas las personas asignadas
    let assignees = await db.select().from(taskAssignees).where(eq(taskAssignees.taskId, taskId));
    if (assignees.length === 0) {
      const fallbackMemberId = task.assignedToId || currentMemberId;
      assignees = [{
        id: generateId(),
        taskId,
        memberId: fallbackMemberId,
        createdAt: new Date()
      }];
    }

    const memberCount = assignees.length;
    // Reparto equitativo de los puntos
    const pointsPerMember = Math.max(1, Math.round(task.currentPoints / memberCount));

    await db.update(tasks).set({
      status: 'completed',
      completedById: currentMemberId,
      completedAt: new Date()
    }).where(eq(tasks.id, taskId));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Cargar información de miembros para registro y descripción
    const assigneeMembers = [];
    for (const a of assignees) {
      const m = await db.select().from(houseMembers).where(eq(houseMembers.id, a.memberId)).get();
      if (m) {
        const u = await db.select().from(users).where(eq(users.id, m.userId)).get();
        assigneeMembers.push({ member: m, userName: m.displayName || u?.name || 'Alguien' });
      }
    }

    for (const { member, userName } of assigneeMembers) {
      let newStreak = member.currentStreak || 0;
      const lastActive = member.lastActiveDate ? new Date(member.lastActiveDate) : null;

      if (lastActive) {
        const startOfLastActive = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
        const diffDays = Math.floor((startOfToday.getTime() - startOfLastActive.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0 && newStreak === 0) {
          newStreak = 1;
        } else if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      if (isVerified) {
        await db.update(houseMembers).set({
          points: (member.points || 0) + pointsPerMember,
          lifetimePoints: (member.lifetimePoints || 0) + pointsPerMember,
          currentStreak: newStreak,
          lastActiveDate: now
        }).where(eq(houseMembers.id, member.id));

        const teamNote = memberCount > 1 
          ? ` en equipo con ${assigneeMembers.filter(x => x.member.id !== member.id).map(x => x.userName).join(', ')}` 
          : '';

        await db.insert(auditLogs).values({
          id: generateId(),
          houseId: currentHouseId,
          memberId: member.id,
          actionType: 'COMPLETED_TASK',
          description: `completó ${task.title}${teamNote} (+${pointsPerMember} pts)${newStreak > 1 ? ` 🔥${newStreak}` : ''}`,
          createdAt: now
        });
      } else {
        await db.update(houseMembers).set({
          currentStreak: newStreak,
          lastActiveDate: now
        }).where(eq(houseMembers.id, member.id));

        await db.insert(frozenPoints).values({
          id: generateId(),
          houseId: currentHouseId,
          memberId: member.id,
          taskId: task.id,
          templateId: template!.id,
          points: pointsPerMember,
          createdAt: now
        });
      }
    }

    return { 
      success: true, 
      isVerified, 
      memberCount, 
      pointsPerMember 
    };
  },

  approveTemplate: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId || !locals.user.memberId) return fail(401);
    const currentMemberId = locals.user.memberId;
    const currentHouseId = locals.user.houseId;

    const data = await request.formData();
    const templateId = data.get('templateId')?.toString();
    if (!templateId) return fail(400);

    await db.insert(taskApprovals).values({
      id: generateId(),
      templateId,
      memberId: currentMemberId,
      createdAt: new Date()
    });

    const templateApprovals = await db.select().from(taskApprovals).where(eq(taskApprovals.templateId, templateId));
    const houseMemberCount = (await db.select().from(houseMembers).where(eq(houseMembers.houseId, currentHouseId))).length;

    if (templateApprovals.length >= houseMemberCount) {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25);
      await db.update(taskTemplates).set({ createdAt: oldDate }).where(eq(taskTemplates.id, templateId));

      const templateForLog = await db.select().from(taskTemplates).where(eq(taskTemplates.id, templateId)).get();
      const titleForLog = templateForLog?.title || 'una tarea';

      const frozen = await db.select().from(frozenPoints).where(eq(frozenPoints.templateId, templateId));
      for (const f of frozen) {
        const member = await db.select().from(houseMembers).where(eq(houseMembers.id, f.memberId)).get();
        if (member) {
          await db.update(houseMembers).set({
            points: (member.points || 0) + f.points,
            lifetimePoints: (member.lifetimePoints || 0) + f.points
          }).where(eq(houseMembers.id, f.memberId));

          await db.insert(auditLogs).values({
            id: generateId(),
            houseId: f.houseId,
            memberId: f.memberId,
            actionType: 'COMPLETED_TASK',
            description: `completó ${titleForLog} tras ser verificada (+${f.points} pts)`,
            createdAt: new Date()
          });
        }
        await db.delete(frozenPoints).where(eq(frozenPoints.id, f.id));
      }
    }

    return { success: true };
  },

  rejectTemplate: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId || !locals.user.memberId) return fail(401);
    const data = await request.formData();
    const templateId = data.get('templateId')?.toString();
    if (!templateId) return fail(400);

    const pendingWithTemplate = await db.select().from(tasks).where(and(eq(tasks.templateId, templateId), eq(tasks.status, 'pending')));
    for (const pt of pendingWithTemplate) {
      await db.delete(taskAssignees).where(eq(taskAssignees.taskId, pt.id));
    }

    await db.delete(taskTemplates).where(eq(taskTemplates.id, templateId));
    await db.delete(frozenPoints).where(eq(frozenPoints.templateId, templateId));
    await db.delete(tasks).where(and(eq(tasks.templateId, templateId), eq(tasks.status, 'pending')));

    return { success: true };
  },

  updateDueDate: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    const dueDateStr = data.get('dueDate')?.toString();

    if (!taskId) return fail(400);

    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    await db.update(tasks).set({ dueDate }).where(eq(tasks.id, taskId));

    return { success: true };
  }
} satisfies Actions;
