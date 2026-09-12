import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { taskTemplates, tasks, taskApprovals, frozenPoints, taskCategories } from '$lib/server/db/schema';
import { eq, like, and, asc } from 'drizzle-orm';
import { generateId } from '$lib/server/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.user) redirect(303, '/');
  if (!locals.user.houseId) redirect(303, '/houses');
  
  const houseId = locals.user.houseId;
  const templates = await db.select().from(taskTemplates)
    .where(eq(taskTemplates.houseId, houseId))
    .orderBy(taskTemplates.createdAt);

  const categories = await db.select().from(taskCategories)
    .where(eq(taskCategories.houseId, houseId))
    .orderBy(asc(taskCategories.order), asc(taskCategories.createdAt));

  return { templates, categories, user: locals.user };
};

export const actions = {
  createTemplate: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId || !locals.user.memberId) return fail(401);
    const houseId = locals.user.houseId;
    const memberId = locals.user.memberId;

    const data = await request.formData();
    const title = data.get('title')?.toString().trim();
    const pointsStr = data.get('points')?.toString();
    const frequency = data.get('frequency')?.toString() || 'none';
    const frequencyValueStr = data.get('frequencyValue')?.toString();
    const dueDateStr = data.get('dueDate')?.toString();
    const categoryIdRaw = data.get('categoryId')?.toString();
    const categoryId = categoryIdRaw && categoryIdRaw !== 'none' ? categoryIdRaw : null;

    if (!title || !pointsStr) return fail(400);

    const templateId = generateId();
    await db.insert(taskTemplates).values({
      id: templateId,
      houseId,
      categoryId,
      title,
      basePoints: parseInt(pointsStr),
      frequency: frequency as 'none' | 'daily' | 'weekly' | 'monthly',
      frequencyValue: frequencyValueStr ? parseInt(frequencyValueStr) : null,
      creatorId: memberId,
      createdAt: new Date()
    });

    // Crear la instancia de hoy directamente
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    await db.insert(tasks).values({
      id: generateId(),
      houseId,
      categoryId,
      templateId,
      title,
      basePoints: parseInt(pointsStr),
      currentPoints: parseInt(pointsStr),
      dueDate
    });

    redirect(303, '/tasks');
  },

  planTask: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    const houseId = locals.user.houseId;

    const data = await request.formData();
    const templateId = data.get('templateId')?.toString();
    const dueDateStr = data.get('dueDate')?.toString();
    const categoryIdRaw = data.get('categoryId')?.toString();

    if (!templateId) return fail(400);

    const template = await db.select().from(taskTemplates).where(eq(taskTemplates.id, templateId)).get();
    if (!template) return fail(404);

    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    const categoryId = categoryIdRaw && categoryIdRaw !== 'none' ? categoryIdRaw : template.categoryId;

    // Planificamos para hoy
    await db.insert(tasks).values({
      id: generateId(),
      houseId,
      categoryId,
      templateId: template.id,
      title: template.title,
      basePoints: template.basePoints,
      currentPoints: template.basePoints,
      dueDate
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
