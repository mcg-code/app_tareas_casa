import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { inventoryLocations, inventoryItems } from '$lib/server/db/schema';
import { eq, asc, desc, and } from 'drizzle-orm';
import { generateId } from '$lib/server/utils';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) redirect(303, '/');
  if (!locals.user.houseId) redirect(303, '/houses');
  if (locals.user.settings?.enableInventory === false) redirect(303, '/tasks');

  const houseId = locals.user.houseId;

  const locations = await db.select().from(inventoryLocations)
    .where(eq(inventoryLocations.houseId, houseId))
    .orderBy(asc(inventoryLocations.order), asc(inventoryLocations.createdAt));

  const items = await db.select().from(inventoryItems)
    .where(eq(inventoryItems.houseId, houseId))
    .orderBy(desc(inventoryItems.createdAt));

  return {
    locations,
    items,
    user: locals.user,
    houseName: locals.user.houseName,
    settings: locals.user.settings
  };
};

export const actions = {
  createLocation: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    if (!locals.user.isAdmin) return fail(403, { message: 'Solo el administrador puede crear cajones' });

    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    const icon = data.get('icon')?.toString().trim() || '🧊';

    if (!name) return fail(400, { message: 'El nombre es obligatorio' });

    const existing = await db.select().from(inventoryLocations).where(eq(inventoryLocations.houseId, locals.user.houseId));

    await db.insert(inventoryLocations).values({
      id: generateId(),
      houseId: locals.user.houseId,
      name,
      icon,
      order: existing.length,
      createdAt: new Date()
    });

    return { success: true };
  },

  updateLocation: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    if (!locals.user.isAdmin) return fail(403);

    const data = await request.formData();
    const locationId = data.get('locationId')?.toString();
    const name = data.get('name')?.toString().trim();
    const icon = data.get('icon')?.toString().trim() || '🧊';

    if (!locationId || !name) return fail(400);

    await db.update(inventoryLocations).set({
      name,
      icon
    }).where(and(eq(inventoryLocations.id, locationId), eq(inventoryLocations.houseId, locals.user.houseId)));

    return { success: true };
  },

  deleteLocation: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);
    if (!locals.user.isAdmin) return fail(403);

    const data = await request.formData();
    const locationId = data.get('locationId')?.toString();
    if (!locationId) return fail(400);

    await db.update(inventoryItems).set({ locationId: null })
      .where(and(eq(inventoryItems.locationId, locationId), eq(inventoryItems.houseId, locals.user.houseId)));

    await db.delete(inventoryLocations)
      .where(and(eq(inventoryLocations.id, locationId), eq(inventoryLocations.houseId, locals.user.houseId)));

    return { success: true };
  },

  createItem: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    const data = await request.formData();
    const name = data.get('name')?.toString().trim();
    const icon = data.get('icon')?.toString().trim() || '📦';
    const locationIdRaw = data.get('locationId')?.toString();
    const locationId = locationIdRaw && locationIdRaw !== 'none' ? locationIdRaw : null;
    const quantityStr = data.get('quantity')?.toString() || '1';
    const unit = data.get('unit')?.toString().trim() || null;
    const target = data.get('target')?.toString() || 'inventory'; // 'inventory' | 'shopping'

    if (!name) return fail(400, { message: 'El nombre es obligatorio' });

    const qty = Math.max(1, parseInt(quantityStr) || 1);

    // Si ya existe un objeto con ese nombre en el catálogo de esta casa, lo actualizamos/reactivamos
    const existing = await db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.houseId, locals.user.houseId), eq(inventoryItems.name, name)))
      .get();

    if (existing) {
      if (target === 'shopping') {
        await db.update(inventoryItems).set({
          neededInShoppingList: true,
          isBought: false,
          shoppingQuantity: qty,
          locationId: locationId || existing.locationId,
          icon: icon !== '📦' ? icon : existing.icon
        }).where(eq(inventoryItems.id, existing.id));
      } else {
        await db.update(inventoryItems).set({
          inStock: true,
          quantity: (existing.quantity || 0) + qty,
          locationId: locationId || existing.locationId,
          icon: icon !== '📦' ? icon : existing.icon
        }).where(eq(inventoryItems.id, existing.id));
      }
      return { success: true };
    }

    await db.insert(inventoryItems).values({
      id: generateId(),
      houseId: locals.user.houseId,
      locationId,
      name,
      icon,
      quantity: target === 'shopping' ? 0 : qty,
      unit,
      inStock: target !== 'shopping',
      neededInShoppingList: target === 'shopping',
      shoppingQuantity: target === 'shopping' ? qty : 1,
      isBought: false,
      createdAt: new Date()
    });

    return { success: true };
  },

  updateStock: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    const data = await request.formData();
    const itemId = data.get('itemId')?.toString();
    const deltaStr = data.get('delta')?.toString();
    const setOut = data.get('setOut')?.toString() === 'true';

    if (!itemId) return fail(400);

    const item = await db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.houseId, locals.user.houseId)))
      .get();

    if (!item) return fail(404);

    if (setOut) {
      // Se ha acabado: se pone a 0 y pasa a la lista de la compra
      await db.update(inventoryItems).set({
        quantity: 0,
        inStock: false,
        neededInShoppingList: true,
        isBought: false,
        shoppingQuantity: 1
      }).where(eq(inventoryItems.id, itemId));
    } else if (deltaStr) {
      const delta = parseInt(deltaStr) || 0;
      const newQuantity = Math.max(0, (item.quantity || 0) + delta);
      const inStock = newQuantity > 0;
      const neededInShoppingList = newQuantity === 0 ? true : item.neededInShoppingList;

      await db.update(inventoryItems).set({
        quantity: newQuantity,
        inStock,
        neededInShoppingList: neededInShoppingList ? true : false,
        isBought: newQuantity === 0 ? false : item.isBought
      }).where(eq(inventoryItems.id, itemId));
    }

    return { success: true };
  },

  toggleShoppingItem: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    const data = await request.formData();
    const itemId = data.get('itemId')?.toString();
    const isBought = data.get('isBought')?.toString() === 'true';

    if (!itemId) return fail(400);

    await db.update(inventoryItems).set({
      isBought
    }).where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.houseId, locals.user.houseId)));

    return { success: true };
  },

  clearBoughtItems: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    // Obtener todos los ítems marcados como comprados
    const bought = await db.select().from(inventoryItems)
      .where(and(
        eq(inventoryItems.houseId, locals.user.houseId),
        eq(inventoryItems.neededInShoppingList, true),
        eq(inventoryItems.isBought, true)
      ));

    for (const b of bought) {
      const toAdd = Math.max(1, b.shoppingQuantity || 1);
      await db.update(inventoryItems).set({
        inStock: true,
        quantity: (b.quantity || 0) + toAdd,
        neededInShoppingList: false,
        isBought: false
      }).where(eq(inventoryItems.id, b.id));
    }

    return { success: true, count: bought.length };
  },

  moveToShopping: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    const data = await request.formData();
    const itemId = data.get('itemId')?.toString();
    if (!itemId) return fail(400);

    await db.update(inventoryItems).set({
      neededInShoppingList: true,
      isBought: false,
      shoppingQuantity: 1
    }).where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.houseId, locals.user.houseId)));

    return { success: true };
  },

  removeFromShopping: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    const data = await request.formData();
    const itemId = data.get('itemId')?.toString();
    if (!itemId) return fail(400);

    await db.update(inventoryItems).set({
      neededInShoppingList: false,
      isBought: false
    }).where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.houseId, locals.user.houseId)));

    return { success: true };
  },

  updateShoppingQuantity: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    const data = await request.formData();
    const itemId = data.get('itemId')?.toString();
    const deltaStr = data.get('delta')?.toString();
    if (!itemId || !deltaStr) return fail(400);

    const delta = parseInt(deltaStr) || 0;
    const item = await db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.houseId, locals.user.houseId)))
      .get();

    if (!item) return fail(404);

    const newQty = Math.max(1, (item.shoppingQuantity || 1) + delta);
    await db.update(inventoryItems).set({
      shoppingQuantity: newQty
    }).where(eq(inventoryItems.id, itemId));

    return { success: true };
  },

  updateItem: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    const data = await request.formData();
    const itemId = data.get('itemId')?.toString();
    const name = data.get('name')?.toString().trim();
    const icon = data.get('icon')?.toString().trim() || '📦';
    const locationIdRaw = data.get('locationId')?.toString();
    const locationId = locationIdRaw && locationIdRaw !== 'none' ? locationIdRaw : null;
    const quantityStr = data.get('quantity')?.toString();
    const shoppingQuantityStr = data.get('shoppingQuantity')?.toString();
    const unit = data.get('unit')?.toString().trim() || null;

    if (!itemId || !name) return fail(400);

    const quantity = Math.max(0, parseInt(quantityStr ?? '0') || 0);
    const shoppingQuantity = Math.max(1, parseInt(shoppingQuantityStr ?? '1') || 1);

    await db.update(inventoryItems).set({
      name,
      icon,
      locationId,
      quantity,
      inStock: quantity > 0,
      shoppingQuantity,
      unit
    }).where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.houseId, locals.user.houseId)));

    return { success: true };
  },

  deleteItem: async ({ request, locals }) => {
    if (!locals.user || !locals.user.houseId) return fail(401);

    const data = await request.formData();
    const itemId = data.get('itemId')?.toString();
    if (!itemId) return fail(400);

    await db.delete(inventoryItems)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.houseId, locals.user.houseId)));

    return { success: true };
  }
} satisfies Actions;
