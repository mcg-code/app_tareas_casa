import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { auditLogs, houseMembers, users } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }

  const houseId = locals.user.houseId;

  // Cargar los últimos 50 eventos
  const logs = await db
    .select({
      id: auditLogs.id,
      actionType: auditLogs.actionType,
      description: auditLogs.description,
      createdAt: auditLogs.createdAt,
      emoji: houseMembers.emoji,
      userName: users.name
    })
    .from(auditLogs)
    .leftJoin(houseMembers, eq(auditLogs.memberId, houseMembers.id))
    .leftJoin(users, eq(houseMembers.userId, users.id))
    .where(eq(auditLogs.houseId, houseId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return {
    activities: logs
  };
};
