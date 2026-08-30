import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { rewards } from '$lib/server/db/schema';
import { generateId } from '$lib/server/utils';

export const actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      redirect(303, '/');
    }

    const data = await request.formData();
    const title = data.get('title')?.toString().trim();
    const priceStr = data.get('price')?.toString();
    const icon = data.get('icon')?.toString().trim() || '🎁';

    if (!title || !priceStr) {
      return fail(400, { error: 'Faltan datos' });
    }

    const price = parseInt(priceStr);
    const houseId = locals.user.houseId;

    await db.insert(rewards).values({
      id: generateId(),
      houseId,
      title,
      price,
      icon
    });

    redirect(303, '/store');
  }
} satisfies Actions;
