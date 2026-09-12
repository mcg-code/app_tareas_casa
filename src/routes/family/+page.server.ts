import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { houseMembers, users, tasks, auditLogs, houses, taskAssignees } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }
  if (!locals.user.houseId) {
    redirect(303, '/houses');
  }

  const houseId = locals.user.houseId;

  // Cargar miembros
  const members = await db
    .select({
      id: houseMembers.id,
      userId: houseMembers.userId,
      name: users.name,
      emoji: houseMembers.emoji,
      avatarUrl: houseMembers.avatarUrl,
      points: houseMembers.points,
      currentStreak: houseMembers.currentStreak
    })
    .from(houseMembers)
    .leftJoin(users, eq(houseMembers.userId, users.id))
    .where(eq(houseMembers.houseId, houseId))
    .orderBy(desc(houseMembers.points));

  // Cargar tareas pendientes para contar cuántas tiene cada uno
  const pendingTasks = await db.select().from(tasks).where(eq(tasks.status, 'pending'));
  const allAssignees = await db.select().from(taskAssignees);
  
  // Cargar recompensas canjeadas por cada uno (últimas 3)
  const logs = await db.select().from(auditLogs)
    .where(eq(auditLogs.houseId, houseId))
    .orderBy(desc(auditLogs.createdAt));
    
  const membersWithDetails = members.map(m => {
    const assignedTasks = pendingTasks.filter(t => {
      const hasAssignee = allAssignees.some(a => a.taskId === t.id && a.memberId === m.id);
      return hasAssignee || t.assignedToId === m.id;
    });
    const redeemedRewards = logs
      .filter(l => l.memberId === m.id && l.actionType === 'BOUGHT_REWARD')
      .slice(0, 3)
      .map(l => l.description.replace(/ \(-.*?\)/, '')); // Quitar los puntos de la descripción

    return {
      ...m,
      isCurrent: m.id === locals.user?.memberId,
      assignedTasksCount: assignedTasks.length,
      assignedTasks: assignedTasks.slice(0, 3).map(t => t.title),
      redeemedRewards
    };
  });

  return {
    members: membersWithDetails,
    houseName: locals.user.houseName,
    currentMemberId: locals.user.memberId
  };
};

export const actions = {
  renameHouse: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    const houseId = locals.user.houseId;
    const data = await request.formData();
    const newName = data.get('houseName')?.toString().trim();

    if (!newName) {
      return fail(400, { error: 'El nombre de la casa no puede estar vacío' });
    }

    await db.update(houses).set({ name: newName }).where(eq(houses.id, houseId));

    return { success: true };
  },

  updateProfile: async ({ request, locals }) => {
    if (!locals.user || !locals.user.memberId) return fail(401);
    const memberId = locals.user.memberId;
    const data = await request.formData();
    const emoji = data.get('emoji')?.toString().trim() || '👤';
    const avatarUrl = data.get('avatarUrl')?.toString().trim() || null;

    await db.update(houseMembers).set({
      emoji,
      avatarUrl,
      lastActiveDate: new Date()
    }).where(eq(houseMembers.id, memberId));

    return { success: true };
  }
} satisfies Actions;
