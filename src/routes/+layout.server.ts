import type { LayoutServerLoad } from './$types';

import { db } from '$lib/server/db';
import { houseMembers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
  let currentStreak = 0;
  if (locals.user?.memberId) {
    const member = await db.select().from(houseMembers).where(eq(houseMembers.id, locals.user.memberId)).get();
    if (member) {
      currentStreak = member.currentStreak || 0;
    }
  }

  return {
    user: locals.user,
    currentStreak
  };
};
