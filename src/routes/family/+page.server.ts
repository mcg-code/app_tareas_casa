import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { houseMembers, users, tasks, auditLogs } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }

  const houseId = locals.user.houseId;

  // Cargar miembros
  const members = await db
    .select({
      id: houseMembers.id,
      name: users.name,
      emoji: houseMembers.emoji,
      points: houseMembers.points,
      currentStreak: houseMembers.currentStreak
    })
    .from(houseMembers)
    .leftJoin(users, eq(houseMembers.userId, users.id))
    .where(eq(houseMembers.houseId, houseId))
    .orderBy(desc(houseMembers.points));

  // Cargar tareas pendientes para contar cuántas tiene cada uno
  const pendingTasks = await db.select().from(tasks).where(eq(tasks.status, 'pending'));
  
  // Cargar recompensas canjeadas por cada uno (últimas 3)
  const logs = await db.select().from(auditLogs)
    .where(eq(auditLogs.houseId, houseId))
    .orderBy(desc(auditLogs.createdAt));
    
  const membersWithDetails = members.map(m => {
    const assignedTasks = pendingTasks.filter(t => t.assignedToId === m.id);
    const redeemedRewards = logs
      .filter(l => l.memberId === m.id && l.actionType === 'BOUGHT_REWARD')
      .slice(0, 3)
      .map(l => l.description.replace(/ \(-.*?\)/, '')); // Quitar los puntos de la descripción

    return {
      ...m,
      assignedTasksCount: assignedTasks.length,
      assignedTasks: assignedTasks.slice(0, 3).map(t => t.title),
      redeemedRewards
    };
  });

  return {
    members: membersWithDetails
  };
};
