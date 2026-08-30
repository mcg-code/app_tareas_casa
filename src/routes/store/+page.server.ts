import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { rewards, houseMembers, auditLogs } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '$lib/server/utils';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }

  const houseId = locals.user.houseId;
  let allRewards = await db.select().from(rewards).where(eq(rewards.houseId, houseId));
  

  return {
    rewards: allRewards
  };
};

export const actions = {
  buy: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const rewardId = data.get('rewardId')?.toString();
    const title = data.get('title')?.toString();
    const priceStr = data.get('price')?.toString();

    if (!rewardId || !title || !priceStr) return fail(400);

    const price = parseInt(priceStr);

    const member = await db.select().from(houseMembers).where(eq(houseMembers.id, locals.user.memberId)).get();
    
    if (!member || (member.points || 0) < price) {
      return fail(400, { error: 'No tienes suficientes puntos' });
    }

    // Restar puntos
    await db.update(houseMembers).set({
      points: (member.points || 0) - price
    }).where(eq(houseMembers.id, member.id));

    // Registrar en logs
    await db.insert(auditLogs).values({
      id: generateId(),
      houseId: locals.user.houseId,
      memberId: locals.user.memberId,
      actionType: 'BOUGHT_REWARD',
      description: `canjeó ${title} (-${price} pts)`,
      createdAt: new Date()
    });

    return { success: true };
  }
} satisfies Actions;
