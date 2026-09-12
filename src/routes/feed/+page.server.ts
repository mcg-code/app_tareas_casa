import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { auditLogs, houseMembers, users } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }
  if (!locals.user.houseId) {
    redirect(303, '/houses');
  }
  if (locals.user.settings?.enableFeed === false) {
    redirect(303, '/tasks');
  }

  const houseId = locals.user.houseId;

  // Cargar los últimos 50 eventos
  const rawLogs = await db
    .select({
      id: auditLogs.id,
      actionType: auditLogs.actionType,
      description: auditLogs.description,
      createdAt: auditLogs.createdAt,
      emoji: houseMembers.emoji,
      avatarUrl: houseMembers.avatarUrl,
      displayName: houseMembers.displayName,
      userName: users.name
    })
    .from(auditLogs)
    .leftJoin(houseMembers, eq(auditLogs.memberId, houseMembers.id))
    .leftJoin(users, eq(houseMembers.userId, users.id))
    .where(eq(auditLogs.houseId, houseId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  const logs = rawLogs.map(l => ({
    ...l,
    userName: l.displayName || l.userName || 'Alguien'
  }));

  return {
    activities: logs
  };
};
