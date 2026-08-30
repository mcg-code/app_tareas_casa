import { fail, redirect, type Cookies } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users, houses, houseMembers, tasks } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId, generateHouseCode } from '$lib/server/utils';

function rememberMember(cookies: Cookies, memberId: string) {
  let list: string[] = [];
  try {
    const raw = cookies.get('saved_members');
    if (raw) list = JSON.parse(raw);
  } catch {
    list = [];
  }
  if (!list.includes(memberId)) {
    list.unshift(memberId);
  }
  list = list.slice(0, 8);
  cookies.set('saved_members', JSON.stringify(list), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 60 * 60 * 24 * 365 * 2
  });
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    redirect(303, '/');
  }

  const userId = locals.user.userId;

  // Obtener todas las casas a las que pertenece este usuario
  const userMemberships = await db
    .select({
      memberId: houseMembers.id,
      houseId: houseMembers.houseId,
      houseName: houses.name,
      houseCode: houses.code,
      emoji: houseMembers.emoji,
      points: houseMembers.points,
      currentStreak: houseMembers.currentStreak
    })
    .from(houseMembers)
    .innerJoin(houses, eq(houseMembers.houseId, houses.id))
    .where(eq(houseMembers.userId, userId));

  // Obtener tareas pendientes asignadas a cada membresía
  const allPendingTasks = await db
    .select({
      id: tasks.id,
      assignedToId: tasks.assignedToId
    })
    .from(tasks)
    .where(eq(tasks.status, 'pending'));

  const housesWithDetails = userMemberships.map((m) => {
    const assignedCount = allPendingTasks.filter((t) => t.assignedToId === m.memberId).length;
    return {
      ...m,
      isActive: m.memberId === locals.user?.memberId,
      assignedTasksCount: assignedCount
    };
  });

  return {
    user: locals.user,
    houses: housesWithDetails
  };
};

export const actions = {
  switch: async ({ request, cookies, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const targetMemberId = data.get('memberId')?.toString();
    if (!targetMemberId) return fail(400);

    // Verificar que esta membresía pertenece al usuario actual
    const memberRecord = await db
      .select()
      .from(houseMembers)
      .where(and(eq(houseMembers.id, targetMemberId), eq(houseMembers.userId, locals.user.userId)))
      .get();

    if (!memberRecord) {
      return fail(403, { error: 'No tienes acceso a esta casa' });
    }

    cookies.set('session', memberRecord.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 365
    });

    rememberMember(cookies, memberRecord.id);
    redirect(303, '/tasks');
  },

  join: async ({ request, cookies, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const code = data.get('code')?.toString().toUpperCase().trim();
    const emoji = data.get('emoji')?.toString().trim() || locals.user.emoji || '👤';

    if (!code) {
      return fail(400, { error: 'Debes introducir un código de casa', code });
    }

    // Buscar la casa
    const house = await db.select().from(houses).where(eq(houses.code, code)).get();
    if (!house) {
      return fail(400, { error: 'No existe ninguna casa con ese código', code });
    }

    // Comprobar si ya es miembro
    let member = await db
      .select()
      .from(houseMembers)
      .where(and(eq(houseMembers.houseId, house.id), eq(houseMembers.userId, locals.user.userId)))
      .get();

    if (!member) {
      member = {
        id: generateId(),
        userId: locals.user.userId,
        houseId: house.id,
        points: 0,
        lifetimePoints: 0,
        currentStreak: 0,
        emoji,
        lastActiveDate: new Date()
      };
      await db.insert(houseMembers).values(member);
    } else {
      await db.update(houseMembers).set({ emoji, lastActiveDate: new Date() }).where(eq(houseMembers.id, member.id));
    }

    cookies.set('session', member.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 365
    });

    rememberMember(cookies, member.id);
    redirect(303, '/tasks');
  },

  create: async ({ request, cookies, locals }) => {
    if (!locals.user) return fail(401);
    const data = await request.formData();
    const houseName = data.get('houseName')?.toString().trim();
    const emoji = data.get('emoji')?.toString().trim() || locals.user.emoji || '👑';

    const finalName = houseName || `Casa de ${locals.user.name}`;

    const houseId = generateId();
    const joinCode = generateHouseCode();
    await db.insert(houses).values({ id: houseId, code: joinCode, name: finalName });

    const memberId = generateId();
    await db.insert(houseMembers).values({
      id: memberId,
      userId: locals.user.userId,
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

    rememberMember(cookies, memberId);
    redirect(303, '/tasks');
  },

  logout: async ({ cookies }) => {
    cookies.delete('session', { path: '/' });
    redirect(303, '/');
  }
} satisfies Actions;
