import { fail, redirect, type Cookies } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, houses, houseMembers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
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

export const load: PageServerLoad = async ({ locals, cookies }) => {
  if (locals.user) {
    redirect(303, '/tasks');
  }

  const savedMembersCookie = cookies.get('saved_members');
  const savedProfiles: Array<{
    memberId: string;
    userName: string;
    emoji: string;
    houseName: string;
    houseCode: string;
  }> = [];

  if (savedMembersCookie) {
    try {
      const memberIds: string[] = JSON.parse(savedMembersCookie);
      for (const mId of memberIds) {
        const m = await db.select().from(houseMembers).where(eq(houseMembers.id, mId)).get();
        if (m) {
          const u = await db.select().from(users).where(eq(users.id, m.userId)).get();
          const h = await db.select().from(houses).where(eq(houses.id, m.houseId)).get();
          if (u && h) {
            savedProfiles.push({
              memberId: m.id,
              userName: u.name,
              emoji: m.emoji || '👤',
              houseName: h.name,
              houseCode: h.code
            });
          }
        }
      }
    } catch {
      // Ignorar cookie corrupta
    }
  }

  return {
    savedProfiles
  };
};

export const actions = {
  quickLogin: async ({ request, cookies }) => {
    const data = await request.formData();
    const memberId = data.get('memberId')?.toString();
    if (!memberId) return fail(400);

    const member = await db.select().from(houseMembers).where(eq(houseMembers.id, memberId)).get();
    if (!member) {
      return fail(404, { error: 'Perfil no encontrado' });
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

  forgetProfile: async ({ request, cookies }) => {
    const data = await request.formData();
    const memberId = data.get('memberId')?.toString();
    if (!memberId) return fail(400);

    let list: string[] = [];
    try {
      const raw = cookies.get('saved_members');
      if (raw) list = JSON.parse(raw);
    } catch {
      list = [];
    }

    list = list.filter((id) => id !== memberId);
    cookies.set('saved_members', JSON.stringify(list), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 365 * 2
    });

    return { success: true };
  },

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

    // Crear o buscar usuario
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

    rememberMember(cookies, member.id);
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

    rememberMember(cookies, memberId);
    redirect(303, '/tasks');
  },

  searchHouses: async ({ request }) => {
    const data = await request.formData();
    const query = data.get('query')?.toString().trim();
    if (!query) return fail(400, { searchError: 'Escribe tu nombre o el de la casa' });

    // Buscar usuarios con ese nombre
    const matchedUsers = await db.select().from(users).all();
    const userMatches = matchedUsers.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

    // Buscar casas con ese nombre
    const allHouses = await db.select().from(houses).all();
    const houseMatches = allHouses.filter((h) => h.name.toLowerCase().includes(query.toLowerCase()));

    const foundResults: Array<{
      memberId: string;
      userName: string;
      emoji: string;
      houseName: string;
      houseCode: string;
    }> = [];

    // Casas encontradas
    for (const h of houseMatches) {
      const members = await db.select().from(houseMembers).where(eq(houseMembers.houseId, h.id));
      for (const m of members) {
        const u = await db.select().from(users).where(eq(users.id, m.userId)).get();
        if (u && !foundResults.some((r) => r.memberId === m.id)) {
          foundResults.push({
            memberId: m.id,
            userName: u.name,
            emoji: m.emoji || '👤',
            houseName: h.name,
            houseCode: h.code
          });
        }
      }
    }

    // Usuarios encontrados
    for (const u of userMatches) {
      const members = await db.select().from(houseMembers).where(eq(houseMembers.userId, u.id));
      for (const m of members) {
        const h = await db.select().from(houses).where(eq(houses.id, m.houseId)).get();
        if (h && !foundResults.some((r) => r.memberId === m.id)) {
          foundResults.push({
            memberId: m.id,
            userName: u.name,
            emoji: m.emoji || '👤',
            houseName: h.name,
            houseCode: h.code
          });
        }
      }
    }

    if (foundResults.length === 0) {
      return fail(404, { searchError: `No se encontraron casas ni perfiles con "${query}"` });
    }

    return { searchResults: foundResults };
  }
} satisfies Actions;
