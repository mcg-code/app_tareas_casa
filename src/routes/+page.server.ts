import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, houses, houseMembers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId, generateHouseCode } from '$lib/server/utils';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    redirect(303, '/tasks');
  }
  return {};
};

export const actions = {
  join: async ({ request, cookies }) => {
    const data = await request.formData();
    const code = data.get('code')?.toString().toUpperCase().trim();
    const name = data.get('name')?.toString().trim();
    const emoji = data.get('emoji')?.toString().trim() || '👤';

    if (!code || !name) {
      return fail(400, { error: 'Faltan campos por rellenar', code, name });
    }

    // Buscar la casa
    const house = await db.select().from(houses).where(eq(houses.code, code)).get();
    
    if (!house) {
      return fail(400, { error: 'Código de casa inválido', code, name });
    }

    // Crear o buscar usuario (simplificado)
    let user = await db.select().from(users).where(eq(users.name, name)).get();
    
    if (!user) {
      user = { id: generateId(), name, avatarUrl: null };
      await db.insert(users).values(user);
    }

    // Comprobar si ya es miembro
    const membersList = await db.select().from(houseMembers).where(eq(houseMembers.houseId, house.id));
    let member = membersList.find(m => m.userId === user?.id);

    if (!member) {
      member = {
        id: generateId(),
        userId: user.id,
        houseId: house.id,
        points: 0,
        lifetimePoints: 0,
        currentStreak: 0,
        emoji,
        lastActiveDate: new Date()
      };
      await db.insert(houseMembers).values(member);
    } else {
      // Actualizar emoji si cambió
      await db.update(houseMembers).set({ emoji, lastActiveDate: new Date() }).where(eq(houseMembers.id, member.id));
    }

    // Set cookie (1 año)
    cookies.set('session', member.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 365 
    });

    redirect(303, '/tasks');
  },

  create: async ({ request, cookies }) => {
    const data = await request.formData();
    const houseName = data.get('houseName')?.toString().trim();
    const name = data.get('name')?.toString().trim();
    const emoji = data.get('emoji')?.toString().trim() || '👑';

    if (!name) {
      return fail(400, { error: 'Necesitas un nombre', name });
    }

    const finalHouseName = houseName || `Casa de ${name}`;

    // Crear la casa
    const houseId = generateId();
    const joinCode = generateHouseCode();
    await db.insert(houses).values({ id: houseId, code: joinCode, name: finalHouseName });

    // Crear usuario
    const userId = generateId();
    await db.insert(users).values({ id: userId, name });

    // Crear miembro (Dueño/Primer miembro)
    const memberId = generateId();
    await db.insert(houseMembers).values({
      id: memberId,
      userId,
      houseId,
      points: 0,
      lifetimePoints: 0,
      currentStreak: 0,
      emoji,
      lastActiveDate: new Date()
    });


    cookies.set('session', memberId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 365 
    });

    redirect(303, '/tasks');
  }
} satisfies Actions;
