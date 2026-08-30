import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, houseMembers, houses } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session');
  
  if (!sessionToken) {
    event.locals.user = null;
    return resolve(event);
  }

  try {
    // Para mantenerlo minimalista, el token de sesión es simplemente el ID del miembro (houseMembers.id)
    // En una app más grande usaríamos JWT o tablas de sesiones.
    const memberId = sessionToken;
    
    // Obtener datos del miembro y usuario
    const memberRecord = await db.select().from(houseMembers).where(eq(houseMembers.id, memberId)).get();
    
    if (memberRecord) {
      const userRecord = await db.select().from(users).where(eq(users.id, memberRecord.userId)).get();
      const houseRecord = await db.select().from(houses).where(eq(houses.id, memberRecord.houseId)).get();
      
      if (userRecord && houseRecord) {
        event.locals.user = {
          memberId: memberRecord.id,
          userId: userRecord.id,
          houseId: memberRecord.houseId,
          houseCode: houseRecord.code,
          name: userRecord.name,
          emoji: memberRecord.emoji ?? '👤',
          points: memberRecord.points ?? 0
        };
      } else {
        event.locals.user = null;
      }
    } else {
      event.locals.user = null;
      event.cookies.delete('session', { path: '/' });
    }
  } catch (error) {
    console.error("Auth error", error);
    event.locals.user = null;
  }

  return resolve(event);
};
