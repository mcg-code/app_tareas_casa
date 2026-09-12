import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { houses, taskCategories, tasks, taskTemplates } from '$lib/server/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { generateId } from '$lib/server/utils';

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

  const categories = await db.select().from(taskCategories)
    .where(eq(taskCategories.houseId, locals.user.houseId))
    .orderBy(asc(taskCategories.order), asc(taskCategories.createdAt));

  return {
    houseName: house.name,
    houseCode: house.code,
    categories,
    settings: {
      enableStore: house.enableStore ?? true,
      enableFeed: house.enableFeed ?? true,
      enablePoints: house.enablePoints ?? true,
      enableQuarantine: house.enableQuarantine ?? true,
      enableDueDates: house.enableDueDates ?? false
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
    const enableDueDates = data.get('enableDueDates') === 'on';

    await db.update(houses).set({
      enableStore,
      enableFeed,
      enablePoints,
      enableQuarantine,
      enableDueDates
    }).where(eq(houses.id, houseId));

    if (locals.user) {
      locals.user.settings = {
        enableStore,
        enableFeed,
        enablePoints,
        enableQuarantine,
        enableDueDates
      };
    }

    return { 
      success: true,
      settings: {
        enableStore,
        enableFeed,
        enablePoints,
        enableQuarantine,
        enableDueDates
      }
    };
  },

  createCategory: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    if (!locals.user.isAdmin) return fail(403);

    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    const icon = data.get('icon')?.toString().trim() || '📦';
    const color = data.get('color')?.toString().trim() || 'cyan';

    if (!name) return fail(400);

    const existing = await db.select().from(taskCategories).where(eq(taskCategories.houseId, locals.user.houseId));

    await db.insert(taskCategories).values({
      id: generateId(),
      houseId: locals.user.houseId,
      name,
      icon,
      color,
      order: existing.length,
      createdAt: new Date()
    });

    return { success: true };
  },

  updateCategory: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    if (!locals.user.isAdmin) return fail(403);

    const data = await request.formData();
    const categoryId = data.get('categoryId')?.toString();
    const name = data.get('name')?.toString().trim();
    const icon = data.get('icon')?.toString().trim() || '📦';

    if (!categoryId || !name) return fail(400);

    await db.update(taskCategories).set({
      name,
      icon
    }).where(and(eq(taskCategories.id, categoryId), eq(taskCategories.houseId, locals.user.houseId)));

    return { success: true };
  },

  deleteCategory: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    if (!locals.user.isAdmin) return fail(403);

    const data = await request.formData();
    const categoryId = data.get('categoryId')?.toString();
    if (!categoryId) return fail(400);

    await db.update(tasks).set({ categoryId: null })
      .where(and(eq(tasks.categoryId, categoryId), eq(tasks.houseId, locals.user.houseId)));
    await db.update(taskTemplates).set({ categoryId: null })
      .where(and(eq(taskTemplates.categoryId, categoryId), eq(taskTemplates.houseId, locals.user.houseId)));

    await db.delete(taskCategories)
      .where(and(eq(taskCategories.id, categoryId), eq(taskCategories.houseId, locals.user.houseId)));

    return { success: true };
  }
} satisfies Actions;
