import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { taskTemplates, tasks, taskApprovals, frozenPoints } from '$lib/server/db/schema';
import { eq, like, and } from 'drizzle-orm';
import { generateId } from '$lib/server/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) redirect(303, '/');
  
  const houseId = locals.user.houseId;
  const templates = await db.select().from(taskTemplates)
    .where(eq(taskTemplates.houseId, houseId))
    .orderBy(taskTemplates.createdAt);

  return { templates };
};

export const actions = {
  createTemplate: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const title = data.get('title')?.toString().trim();
    const pointsStr = data.get('points')?.toString();
    const frequency = data.get('frequency')?.toString() || 'none';
    const frequencyValueStr = data.get('frequencyValue')?.toString();

    if (!title || !pointsStr) return fail(400);

    const templateId = generateId();
    await db.insert(taskTemplates).values({
      id: templateId,
      houseId: locals.user.houseId,
      title,
      basePoints: parseInt(pointsStr),
      frequency: frequency as 'none' | 'daily' | 'weekly' | 'monthly',
      frequencyValue: frequencyValueStr ? parseInt(frequencyValueStr) : null,
      creatorId: locals.user.memberId,
      createdAt: new Date()
    });

    redirect(303, '/tasks/new?q=' + encodeURIComponent(title));
  },

  planTask: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const templateId = data.get('templateId')?.toString();

    if (!templateId) return fail(400);

    const template = await db.select().from(taskTemplates).where(eq(taskTemplates.id, templateId)).get();
    if (!template) return fail(404);

    // Planificamos para hoy
    await db.insert(tasks).values({
      id: generateId(),
      houseId: locals.user.houseId,
      templateId: template.id,
      title: template.title,
      basePoints: template.basePoints,
      currentPoints: template.basePoints
    });

    redirect(303, '/tasks');
  },

  updateTemplate: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const templateId = data.get('templateId')?.toString();
    const title = data.get('title')?.toString().trim();
    const pointsStr = data.get('points')?.toString();
    const frequency = data.get('frequency')?.toString() || 'none';
    const frequencyValueStr = data.get('frequencyValue')?.toString();

    if (!templateId || !title || !pointsStr) return fail(400);

    await db.update(taskTemplates).set({
      title,
      basePoints: parseInt(pointsStr),
      frequency: frequency as 'none' | 'daily' | 'weekly' | 'monthly',
      frequencyValue: frequencyValueStr ? parseInt(frequencyValueStr) : null,
    }).where(eq(taskTemplates.id, templateId));

    return { success: true };
  },

  deleteTemplate: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const templateId = data.get('templateId')?.toString();

    if (!templateId) return fail(400);

    // Borramos dependencias si hay (frozenPoints, approvals)
    await db.delete(taskApprovals).where(eq(taskApprovals.templateId, templateId));
    await db.delete(frozenPoints).where(eq(frozenPoints.templateId, templateId));
    // Luego borramos el template
    await db.delete(taskTemplates).where(eq(taskTemplates.id, templateId));

    return { success: true };
  }
} satisfies Actions;
