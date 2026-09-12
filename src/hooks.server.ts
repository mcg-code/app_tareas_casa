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
    // El token de sesión representa el ID de usuario (users.id)
    const userId = sessionToken;
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).get();
    
    if (userRecord) {
      // Buscar membresías de casa que tenga el usuario
      const memberships = await db.select().from(houseMembers).where(eq(houseMembers.userId, userRecord.id));
      
      const activeMemberCookie = event.cookies.get('active_member');
      let activeMembership = memberships.find(m => m.id === activeMemberCookie);
      
      if (!activeMembership && memberships.length > 0) {
        activeMembership = memberships[0];
      }

      if (activeMembership) {
        const houseRecord = await db.select().from(houses).where(eq(houses.id, activeMembership.houseId)).get();
        if (houseRecord) {
          event.locals.user = {
            userId: userRecord.id,
            username: userRecord.name,
            name: activeMembership.displayName || userRecord.name,
            displayName: activeMembership.displayName || userRecord.name,
            emoji: activeMembership.emoji || userRecord.emoji || '👤',
            avatarUrl: activeMembership.avatarUrl || userRecord.avatarUrl || null,
            memberId: activeMembership.id,
            houseId: houseRecord.id,
            houseCode: houseRecord.code,
            houseName: houseRecord.name,
            points: activeMembership.points ?? 0,
            role: (activeMembership.role || 'member') as 'admin' | 'member',
            isAdmin: activeMembership.role === 'admin',
            settings: {
              enableStore: houseRecord.enableStore ?? true,
              enableFeed: houseRecord.enableFeed ?? true,
              enablePoints: houseRecord.enablePoints ?? true,
              enableQuarantine: houseRecord.enableQuarantine ?? true,
              enableDueDates: houseRecord.enableDueDates ?? false,
              enableInventory: houseRecord.enableInventory ?? false,
              enableTaskCategories: houseRecord.enableTaskCategories ?? true,
              enableInventoryLocations: houseRecord.enableInventoryLocations ?? true
            }
          };
        } else {
          event.locals.user = {
            userId: userRecord.id,
            username: userRecord.name,
            name: userRecord.name,
            displayName: userRecord.name,
            emoji: userRecord.emoji || '👤',
            avatarUrl: userRecord.avatarUrl || null,
            memberId: null,
            houseId: null,
            houseCode: null,
            houseName: null,
            points: 0
          };
        }
      } else {
        // Usuario logueado pero sin casas todavía
        event.locals.user = {
          userId: userRecord.id,
          username: userRecord.name,
          name: userRecord.name,
          displayName: userRecord.name,
          emoji: userRecord.emoji || '👤',
          avatarUrl: userRecord.avatarUrl || null,
          memberId: null,
          houseId: null,
          houseCode: null,
          houseName: null,
          points: 0
        };
      }
    } else {
      // Compatibilidad con cookies antiguas donde sessionToken era un memberId
      const legacyMember = await db.select().from(houseMembers).where(eq(houseMembers.id, sessionToken)).get();
      if (legacyMember) {
        event.cookies.set('session', legacyMember.userId, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          maxAge: 60 * 60 * 24 * 365
        });
        event.cookies.set('active_member', legacyMember.id, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          maxAge: 60 * 60 * 24 * 365
        });
        const legacyUser = await db.select().from(users).where(eq(users.id, legacyMember.userId)).get();
        const legacyHouse = await db.select().from(houses).where(eq(houses.id, legacyMember.houseId)).get();
        if (legacyUser && legacyHouse) {
          event.locals.user = {
            userId: legacyUser.id,
            username: legacyUser.name,
            name: legacyMember.displayName || legacyUser.name,
            displayName: legacyMember.displayName || legacyUser.name,
            emoji: legacyMember.emoji || legacyUser.emoji || '👤',
            avatarUrl: legacyMember.avatarUrl || legacyUser.avatarUrl || null,
            memberId: legacyMember.id,
            houseId: legacyHouse.id,
            houseCode: legacyHouse.code,
            houseName: legacyHouse.name,
            points: legacyMember.points ?? 0,
            role: (legacyMember.role || 'member') as 'admin' | 'member',
            isAdmin: legacyMember.role === 'admin',
            settings: {
              enableStore: legacyHouse.enableStore ?? true,
              enableFeed: legacyHouse.enableFeed ?? true,
              enablePoints: legacyHouse.enablePoints ?? true,
              enableQuarantine: legacyHouse.enableQuarantine ?? true,
              enableDueDates: legacyHouse.enableDueDates ?? false,
              enableInventory: legacyHouse.enableInventory ?? false
            }
          };
          return resolve(event);
        }
      }

      event.locals.user = null;
      event.cookies.delete('session', { path: '/' });
      event.cookies.delete('active_member', { path: '/' });
    }
  } catch (error) {
    console.error("Auth error", error);
    event.locals.user = null;
  }

  return resolve(event);
};
