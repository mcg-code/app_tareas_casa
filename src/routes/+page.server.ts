import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, houseMembers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { generateId, hashPassword, verifyPassword } from '$lib/server/utils';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    redirect(303, '/houses');
  }

  return {};
};

export const actions = {
  login: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString().trim();
    const password = data.get('password')?.toString();

    if (!username || !password) {
      return fail(400, { error: 'Por favor, introduce usuario y contraseña', username });
    }

    // Buscar usuario por nombre (case-insensitive)
    const allUsers = await db.select().from(users).all();
    const user = allUsers.find(u => u.name.toLowerCase() === username.toLowerCase());

    if (!user) {
      return fail(400, { error: 'No existe ninguna cuenta con ese usuario. ¿Quieres crear una?', username });
    }

    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return fail(400, { error: 'Contraseña incorrecta', username });
      }
    } else {
      // Usuario existente anterior a las contraseñas: se le asigna la contraseña indicada
      await db.update(users).set({
        passwordHash: hashPassword(password)
      }).where(eq(users.id, user.id));
    }

    cookies.set('session', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 365
    });

    // Si tiene una casa, la dejamos activa
    const memberships = await db.select().from(houseMembers).where(eq(houseMembers.userId, user.id));
    if (memberships.length > 0) {
      cookies.set('active_member', memberships[0].id, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 60 * 60 * 24 * 365
      });
    }

    redirect(303, '/houses');
  },

  register: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString().trim();
    const password = data.get('password')?.toString();
    const emoji = data.get('emoji')?.toString().trim() || '👤';

    if (!username || username.length < 2) {
      return fail(400, { registerError: 'El nombre de usuario debe tener al menos 2 caracteres', username, emoji });
    }

    if (!password || password.length < 4) {
      return fail(400, { registerError: 'La contraseña debe tener al menos 4 caracteres', username, emoji });
    }

    const allUsers = await db.select().from(users).all();
    const existing = allUsers.find(u => u.name.toLowerCase() === username.toLowerCase());

    if (existing) {
      if (existing.passwordHash) {
        return fail(400, { registerError: 'Ya existe una cuenta con este nombre. Inicia sesión.', username, emoji });
      } else {
        // Asignar contraseña a cuenta previa
        await db.update(users).set({
          passwordHash: hashPassword(password),
          emoji: emoji || existing.emoji || '👤'
        }).where(eq(users.id, existing.id));

        cookies.set('session', existing.id, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          maxAge: 60 * 60 * 24 * 365
        });

        redirect(303, '/houses');
      }
    }

    const userId = generateId();
    await db.insert(users).values({
      id: userId,
      name: username,
      passwordHash: hashPassword(password),
      emoji
    });

    cookies.set('session', userId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 365
    });

    redirect(303, '/houses');
  }
} satisfies Actions;
