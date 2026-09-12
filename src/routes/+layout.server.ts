import type { LayoutServerLoad } from './$types';

import { db } from '$lib/server/db';
import { houseMembers, houses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, depends }) => {
  depends('app:settings');

  let currentStreak = 0;
  if (locals.user?.memberId) {
    const member = await db.select().from(houseMembers).where(eq(houseMembers.id, locals.user.memberId)).get();
    if (member) {
      currentStreak = member.currentStreak || 0;
      locals.user.role = (member.role || 'member') as 'admin' | 'member';
      locals.user.isAdmin = member.role === 'admin';
    }
  }

  if (locals.user?.houseId) {
    const house = await db.select().from(houses).where(eq(houses.id, locals.user.houseId)).get();
    if (house && locals.user.settings) {
      locals.user.settings = {
        enableStore: house.enableStore ?? true,
        enableFeed: house.enableFeed ?? true,
        enablePoints: house.enablePoints ?? true,
        enableQuarantine: house.enableQuarantine ?? true,
        enableDueDates: house.enableDueDates ?? false,
        enableInventory: house.enableInventory ?? false,
        enableTaskCategories: house.enableTaskCategories ?? true,
        enableInventoryLocations: house.enableInventoryLocations ?? true,
        theme: house.theme || 'warm-peach'
      };
    }
  }

  return {
    user: locals.user,
    currentStreak
  };
};
