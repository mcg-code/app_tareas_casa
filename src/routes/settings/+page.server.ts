import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { houses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }
  if (!locals.user.houseId) {
    redirect(303, '/houses');
  }

  if (!locals.user.isAdmin) {
    redirect(303, '/tasks');
  }

  const house = await db.select().from(houses).where(eq(houses.id, locals.user.houseId)).get();
  if (!house) {
    redirect(303, '/houses');
  }

  return {
    houseName: house.name,
    houseCode: house.code,
    settings: {
      enableStore: house.enableStore ?? true,
      enableFeed: house.enableFeed ?? true,
      enablePoints: house.enablePoints ?? true,
      enableQuarantine: house.enableQuarantine ?? true
    }
  };
};

export const actions = {
  saveSettings: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    if (!locals.user.isAdmin) return fail(403, { error: 'Solo el administrador puede modificar los ajustes de la casa' });
    const houseId = locals.user.houseId;

    const data = await request.formData();
    const enableStore = data.get('enableStore') === 'on';
    const enableFeed = data.get('enableFeed') === 'on';
    const enablePoints = data.get('enablePoints') === 'on';
    const enableQuarantine = data.get('enableQuarantine') === 'on';

    await db.update(houses).set({
      enableStore,
      enableFeed,
      enablePoints,
      enableQuarantine
    }).where(eq(houses.id, houseId));

    if (locals.user) {
      locals.user.settings = {
        enableStore,
        enableFeed,
        enablePoints,
        enableQuarantine
      };
    }

    return { 
      success: true,
      settings: {
        enableStore,
        enableFeed,
        enablePoints,
        enableQuarantine
      }
    };
  }
} satisfies Actions;
