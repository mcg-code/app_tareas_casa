import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { tasks, houseMembers, auditLogs, taskTemplates, taskApprovals, frozenPoints } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateId } from '$lib/server/utils';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }

  const houseId = locals.user.houseId;

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

  // Cargar tareas de hoy (pendientes o reclamadas)
  const todayTasks = await db.select({
    id: tasks.id,
    title: tasks.title,
    basePoints: tasks.currentPoints,
    assignedToId: tasks.assignedToId,
    status: tasks.status,
    templateId: tasks.templateId,
    templateCreatedAt: taskTemplates.createdAt
  }).from(tasks)
    .leftJoin(taskTemplates, eq(tasks.templateId, taskTemplates.id))
    .where(and(eq(tasks.houseId, houseId), eq(tasks.status, 'pending')))
    .orderBy(desc(tasks.id));



  const quarantineTemplates = await db.select().from(taskTemplates)
    .where(eq(taskTemplates.houseId, houseId));

  const templatesInQuarantine = quarantineTemplates.filter(t => new Date(t.createdAt) > yesterday);

  const approvals = await db.select().from(taskApprovals);
  const houseMemberCount = (await db.select().from(houseMembers).where(eq(houseMembers.houseId, houseId))).length;

  const quarantineWithVotes = templatesInQuarantine.map(t => {
    const templateApprovals = approvals.filter(a => a.templateId === t.id);
    const hasVoted = templateApprovals.some(a => a.memberId === locals.user.memberId);
    return {
      ...t,
      approvalsCount: templateApprovals.length,
      houseMemberCount,
      hasVoted
    };
  });

  return {
    tasks: todayTasks,
    quarantine: quarantineWithVotes,
    userId: locals.user.memberId,
    houseName: locals.user.houseName
  };
};

export const actions = {
  claim: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    if (!taskId) return fail(400);

    await db.update(tasks).set({
      assignedToId: locals.user.memberId
    }).where(eq(tasks.id, taskId));

    return { success: true };
  },

  unclaim: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    if (!taskId) return fail(400);

    await db.update(tasks).set({
      assignedToId: null
    }).where(and(eq(tasks.id, taskId), eq(tasks.assignedToId, locals.user.memberId)));

    return { success: true };
  },

  deleteTask: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const taskId = data.get('taskId')?.toString();
    if (!taskId) return fail(400);

    // Solo se pueden borrar tareas de hoy, eliminándolas de la tabla tasks (instancia)
    await db.delete(tasks).where(eq(tasks.id, taskId));

    return { success: true };
  },

  complete: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
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

    await db.update(tasks).set({
      status: 'completed',
      completedById: locals.user.memberId,
      completedAt: new Date()
    }).where(eq(tasks.id, taskId));

    if (isVerified) {
      const member = await db.select().from(houseMembers).where(eq(houseMembers.id, locals.user.memberId)).get();
      if (member) {
        let newStreak = member.currentStreak || 0;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastActive = member.lastActiveDate ? new Date(member.lastActiveDate) : null;
        
        if (lastActive) {
          const startOfLastActive = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
          const diffDays = Math.floor((startOfToday.getTime() - startOfLastActive.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0 && newStreak === 0) {
            newStreak = 1; // Hoy se conectó pero no tenía racha
          } else if (diffDays === 1) {
            newStreak += 1; // Fue ayer
          } else if (diffDays > 1) {
            newStreak = 1; // Se rompió
          }
        } else {
          newStreak = 1; // Primera vez
        }

        await db.update(houseMembers).set({
          points: (member.points || 0) + task.currentPoints,
          lifetimePoints: (member.lifetimePoints || 0) + task.currentPoints,
          currentStreak: newStreak,
          lastActiveDate: now
        }).where(eq(houseMembers.id, locals.user.memberId));

        await db.insert(auditLogs).values({
          id: generateId(),
          houseId: locals.user.houseId,
          memberId: locals.user.memberId,
          actionType: 'COMPLETED_TASK',
          description: `completó ${task.title} (+${task.currentPoints} pts)${newStreak > 1 ? ` 🔥${newStreak}` : ''}`,
          createdAt: now
        });
      }
    } else {
      const member = await db.select().from(houseMembers).where(eq(houseMembers.id, locals.user.memberId)).get();
      if (member) {
        let newStreak = member.currentStreak || 0;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

        await db.update(houseMembers).set({
          currentStreak: newStreak,
          lastActiveDate: now
        }).where(eq(houseMembers.id, locals.user.memberId));
      }

      await db.insert(frozenPoints).values({
        id: generateId(),
        houseId: locals.user.houseId,
        memberId: locals.user.memberId,
        taskId: task.id,
        templateId: template!.id,
        points: task.currentPoints,
        createdAt: new Date()
      });
    }

    return { success: true, isVerified };
  },

  approveTemplate: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const templateId = data.get('templateId')?.toString();
    if (!templateId) return fail(400);

    await db.insert(taskApprovals).values({
      id: generateId(),
      templateId,
      memberId: locals.user.memberId,
      createdAt: new Date()
    });

    const templateApprovals = await db.select().from(taskApprovals).where(eq(taskApprovals.templateId, templateId));
    const houseMemberCount = (await db.select().from(houseMembers).where(eq(houseMembers.houseId, locals.user.houseId))).length;

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
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const templateId = data.get('templateId')?.toString();
    if (!templateId) return fail(400);

    await db.delete(taskTemplates).where(eq(taskTemplates.id, templateId));
    await db.delete(frozenPoints).where(eq(frozenPoints.templateId, templateId));
    await db.delete(tasks).where(and(eq(tasks.templateId, templateId), eq(tasks.status, 'pending')));

    return { success: true };
  }
} satisfies Actions;
