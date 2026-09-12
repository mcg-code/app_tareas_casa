<script lang="ts">
  import type { PageData } from './$types';
  import { 
    Boxes, ShoppingCart, Plus, Check, Trash2, Edit2, ChevronDown, ChevronUp, 
    Search, X, AlertCircle, Sparkles, RefreshCw, CheckCheck, PackagePlus 
  } from '@lucide/svelte';
  import { invalidateAll } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  let showLocations = $derived(data.settings?.enableInventoryLocations !== false);
  let activeTab = $state<'inventory' | 'shopping'>('inventory');
  let searchQuery = $state('');
  let showLocationModal = $state(false);
  let showItemModal = $state(false);

  // Estados para creación/edición de cajones
  let newLocationName = $state('');
  let newLocationIcon = $state('🧊');
  let editingLocationId = $state<string | null>(null);
  let editLocationName = $state('');
  let editLocationIcon = $state('🧊');

  // Estados para añadir nuevo objeto
  let newItemName = $state('');
  let newItemIcon = $state('📦');
  let newItemLocationId = $state('none');
  let newItemQuantity = $state(1);
  let newItemUnit = $state('uds');
  let newItemTarget = $state<'inventory' | 'shopping'>('inventory');

  // Estados para editar objeto existente
  let showEditItemModal = $state(false);
  let editItemId = $state('');
  let editItemName = $state('');
  let editItemIcon = $state('📦');
  let editItemLocationId = $state('none');
  let editItemQuantity = $state(1);
  let editItemShoppingQuantity = $state(1);
  let editItemUnit = $state('uds');

  let collapsedLocations = $state<Record<string, boolean>>({});

  const popularLocationEmojis = ['🧊', '🥦', '🥫', '🥖', '🧃', '🍪', '🧴', '🧹', '✏️', '📓', '📦'];
  const popularItemEmojis = [
    '🥛', '🍞', '🧀', '🥩', '🥚', '🍎', '🥦', '🧊', '🥫', 
    '🍪', '☕', '🧻', '🧴', '🧼', '✏️', '📓', '✂️', '📦'
  ];

  function toggleCollapse(locId: string) {
    collapsedLocations[locId] = !collapsedLocations[locId];
  }

  // Lista de la compra y ordenación
  let shoppingItems = $derived(
    data.items.filter(i => i.neededInShoppingList)
  );

  let pendingShoppingItems = $derived(
    shoppingItems.filter(i => !i.isBought)
  );

  let boughtShoppingItems = $derived(
    shoppingItems.filter(i => i.isBought)
  );

  // Orden: los pendientes primero, los comprados al final
  let sortedShoppingItems = $derived([
    ...pendingShoppingItems,
    ...boughtShoppingItems
  ]);

  // Ítems de inventario en stock
  let inStockItems = $derived(
    data.items.filter(i => i.inStock)
  );

  // Sugerencias de catálogo cuando se escribe en el buscador
  let catalogSuggestions = $derived(
    searchQuery.trim() === '' 
      ? [] 
      : data.items.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  async function handleCreateLocation(e: SubmitEvent) {
    e.preventDefault();
    if (!newLocationName.trim()) return;
    const formData = new FormData();
    formData.append('name', newLocationName.trim());
    formData.append('icon', newLocationIcon);
    await fetch('?/createLocation', { method: 'POST', body: formData });
    newLocationName = '';
    await invalidateAll();
  }

  async function handleUpdateLocation(e: SubmitEvent) {
    e.preventDefault();
    if (!editingLocationId || !editLocationName.trim()) return;
    const formData = new FormData();
    formData.append('locationId', editingLocationId);
    formData.append('name', editLocationName.trim());
    formData.append('icon', editLocationIcon);
    await fetch('?/updateLocation', { method: 'POST', body: formData });
    editingLocationId = null;
    await invalidateAll();
  }

  async function handleDeleteLocation(locationId: string) {
    if (!confirm('¿Eliminar este cajón? Las cosas que contenga pasarán a Sin clasificar sin borrarse.')) return;
    const formData = new FormData();
    formData.append('locationId', locationId);
    await fetch('?/deleteLocation', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleCreateItem(e: SubmitEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const formData = new FormData();
    formData.append('name', newItemName.trim());
    formData.append('icon', newItemIcon);
    formData.append('locationId', newItemLocationId);
    formData.append('quantity', newItemQuantity.toString());
    formData.append('unit', newItemUnit);
    formData.append('target', newItemTarget);

    await fetch('?/createItem', { method: 'POST', body: formData });
    newItemName = '';
    showItemModal = false;
    await invalidateAll();
  }

  async function handleUpdateStock(itemId: string, delta?: number, setOut = false) {
    const formData = new FormData();
    formData.append('itemId', itemId);
    if (setOut) {
      formData.append('setOut', 'true');
    } else if (delta !== undefined) {
      formData.append('delta', delta.toString());
    }
    await fetch('?/updateStock', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleToggleShopping(itemId: string, currentBought: boolean) {
    const formData = new FormData();
    formData.append('itemId', itemId);
    formData.append('isBought', (!currentBought).toString());
    await fetch('?/toggleShoppingItem', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleClearBought() {
    const formData = new FormData();
    await fetch('?/clearBoughtItems', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleSendToShopping(itemId: string) {
    const formData = new FormData();
    formData.append('itemId', itemId);
    await fetch('?/moveToShopping', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleRemoveFromShopping(itemId: string) {
    const formData = new FormData();
    formData.append('itemId', itemId);
    await fetch('?/removeFromShopping', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('¿Eliminar este objeto del inventario y catálogo para siempre?')) return;
    const formData = new FormData();
    formData.append('itemId', itemId);
    await fetch('?/deleteItem', { method: 'POST', body: formData });
    await invalidateAll();
  }

  function openAddItemModal(target: 'inventory' | 'shopping', defaultLocationId = 'none') {
    newItemTarget = target;
    newItemLocationId = defaultLocationId;
    newItemQuantity = 1;
    newItemName = '';
    newItemIcon = '📦';
    showItemModal = true;
  }

  function openEditItemModal(item: typeof data.items[0]) {
    editItemId = item.id;
    editItemName = item.name;
    editItemIcon = item.icon || '📦';
    editItemLocationId = item.locationId || 'none';
    editItemQuantity = item.quantity ?? 0;
    editItemShoppingQuantity = item.shoppingQuantity ?? 1;
    editItemUnit = item.unit || '';
    showEditItemModal = true;
  }

  async function handleUpdateItem(e: SubmitEvent) {
    e.preventDefault();
    if (!editItemId || !editItemName.trim()) return;
    const formData = new FormData();
    formData.append('itemId', editItemId);
    formData.append('name', editItemName.trim());
    formData.append('icon', editItemIcon);
    formData.append('locationId', editItemLocationId);
    formData.append('quantity', editItemQuantity.toString());
    formData.append('shoppingQuantity', editItemShoppingQuantity.toString());
    formData.append('unit', editItemUnit);

    await fetch('?/updateItem', { method: 'POST', body: formData });
    showEditItemModal = false;
    await invalidateAll();
  }

  async function handleUpdateShoppingQuantity(itemId: string, delta: number) {
    const formData = new FormData();
    formData.append('itemId', itemId);
    formData.append('delta', delta.toString());
    await fetch('?/updateShoppingQuantity', { method: 'POST', body: formData });
    await invalidateAll();
  }
</script>

<div class="w-full flex flex-col relative z-10 pt-2">
  <!-- Cabecera -->
  <header class="mb-5 px-1 flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold flex items-center gap-2 text-white">
        <span class="text-3xl">📦</span> Inventario y Compra
      </h2>
    </div>

    <div class="flex items-center gap-2">
      {#if showLocations && data.user?.isAdmin}
        <button 
          type="button" 
          onclick={() => showLocationModal = true}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-amber-400 rounded-xl text-xs font-bold border border-amber-400/30 shadow-glass transition-all"
          title="Gestionar cajones/ubicaciones"
        >
          <PackagePlus size={15} />
          <span class="hidden sm:inline">Cajones</span>
        </button>
      {/if}

      <a 
        href="/houses" 
        class="flex items-center gap-1.5 px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-white/5 shadow-glass transition-all"
        title="Cambiar de casa"
      >
        <span>🏡</span>
        <span class="max-w-[120px] truncate">{data.houseName || 'Mis Casas'}</span>
      </a>
    </div>
  </header>

  <!-- Pestañas Principales: Inventario vs Lista de la Compra -->
  <div class="flex gap-1.5 p-1.5 bg-navy-surface rounded-2xl border border-white/5 mb-5 shadow-glass">
    <button 
      onclick={() => activeTab = 'inventory'}
      class="flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 {activeTab === 'inventory' ? 'bg-accent-cyan text-navy-bg shadow-sm' : 'text-gray-400 hover:text-white'}"
    >
      <Boxes size={16} />
      <span>Inventario ({data.items.length})</span>
    </button>
    <button 
      onclick={() => activeTab = 'shopping'}
      class="flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative {activeTab === 'shopping' ? 'bg-accent-cyan text-navy-bg shadow-sm' : 'text-gray-400 hover:text-white'}"
    >
      <ShoppingCart size={16} />
      <span>Lista Compra</span>
      {#if pendingShoppingItems.length > 0}
        <span class="px-1.5 py-0.2 rounded-full text-[10px] font-black {activeTab === 'shopping' ? 'bg-navy-bg text-accent-cyan' : 'bg-accent-cyan text-navy-bg'}">
          {pendingShoppingItems.length}
        </span>
      {/if}
    </button>
  </div>

  <div class="w-full">
    {#if activeTab === 'inventory'}
      <!-- VISTA INVENTARIO -->
      <div class="flex items-center justify-between gap-2 mb-4">
        <p class="text-xs text-gray-400">
          {#if showLocations && data.locations.length > 0}
            Objetos y provisiones disponibles en cada cajón:
          {:else}
            Objetos y provisiones disponibles en el inventario:
          {/if}
        </p>
        <button 
          type="button" 
          onclick={() => openAddItemModal('inventory')}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-navy-bg font-bold text-xs rounded-xl transition-all shadow-glow shrink-0"
        >
          <Plus size={14} /> + Objeto
        </button>
      </div>

      {#if data.items.length === 0}
        <div class="text-center py-12 px-4 bg-navy-surface/30 border border-white/5 rounded-2xl">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-400/10 flex items-center justify-center text-3xl">
            🧊
          </div>
          <h3 class="text-base font-bold text-white mb-1">Inventario vacío</h3>
          <p class="text-xs text-gray-400 max-w-xs mx-auto mb-4">
            {#if showLocations}
              Crea cajones como <em>Congelador</em>, <em>Nevera</em> o <em>Despensa</em> para empezar a organizar la comida o el material.
            {:else}
              Añade objetos para empezar a organizar la comida o el material de la casa.
            {/if}
          </p>
          <div class="flex justify-center gap-2">
            {#if showLocations && data.user?.isAdmin}
              <button 
                type="button" 
                onclick={() => showLocationModal = true}
                class="px-4 py-2 bg-navy-surface hover:bg-white/10 text-amber-400 border border-amber-400/30 rounded-xl font-bold text-xs"
              >
                + Crear primer cajón
              </button>
            {/if}
            <button 
              type="button" 
              onclick={() => openAddItemModal('inventory')}
              class="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-navy-bg rounded-xl font-bold text-xs shadow-glow"
            >
              + Añadir objeto
            </button>
          </div>
        </div>
      {:else if showLocations && data.locations.length > 0}
        <!-- Cajones personalizados -->
        {#each data.locations as loc}
          {@const locItems = data.items.filter(i => i.locationId === loc.id)}
          {@const availableItems = locItems.filter(i => (i.quantity || 0) > 0)}
          {@const outOfStockItems = locItems.filter(i => (i.quantity || 0) === 0)}
          {@const isCollapsed = collapsedLocations[loc.id]}
          <div class="mb-4 bg-navy-surface/50 border border-white/10 rounded-2xl p-4 shadow-glass transition-all fade-in">
            <div class="flex items-center justify-between gap-2 {isCollapsed && locItems.length === 0 ? '' : 'mb-3'}">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="text-2xl shrink-0">{loc.icon || '🧊'}</span>
                <h3 class="font-bold text-white text-base truncate flex items-center gap-2">
                  <span>{loc.name}</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-amber-400 shrink-0">
                    {availableItems.length}{#if outOfStockItems.length > 0}<span class="text-gray-400 font-normal">/{locItems.length}</span>{/if}
                  </span>
                </h3>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button 
                  type="button" 
                  onclick={() => openAddItemModal('inventory', loc.id)}
                  class="flex items-center gap-1 px-2.5 py-1.5 bg-amber-400/10 hover:bg-amber-400 hover:text-navy-bg text-amber-400 text-xs font-bold rounded-xl transition-all border border-amber-400/30"
                  title="Añadir a este cajón"
                >
                  <Plus size={14} />
                  <span class="hidden xs:inline">Añadir</span>
                </button>
                <button 
                  type="button" 
                  onclick={() => toggleCollapse(loc.id)}
                  class="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  {#if isCollapsed}
                    <ChevronDown size={18} />
                  {:else}
                    <ChevronUp size={18} />
                  {/if}
                </button>
              </div>
            </div>

            {#if !isCollapsed}
              {#if locItems.length > 0}
                <div class="space-y-2 mt-2">
                  <!-- Productos Disponibles (Stock > 0) -->
                  {#each availableItems as item}
                    <div class="flex items-center justify-between p-3 rounded-xl bg-navy-surface border border-white/5 hover:border-white/15 transition-all">
                      <div class="flex items-center gap-3 min-w-0">
                        <span class="text-2xl shrink-0">{item.icon || '📦'}</span>
                        <div class="min-w-0">
                          <h4 class="font-bold text-sm text-gray-100 truncate">{item.name}</h4>
                          <p class="text-[11px] text-gray-400 font-medium">
                            Stock: <strong class="text-amber-400">{item.quantity}</strong> {item.unit || 'uds'}
                          </p>
                        </div>
                      </div>

                      <div class="flex items-center gap-1.5 shrink-0">
                        <!-- Ajuste rápido de stock -->
                        <div class="flex items-center bg-navy-bg/80 border border-white/5 rounded-xl overflow-hidden mr-1">
                          <button 
                            type="button"
                            onclick={() => handleUpdateStock(item.id, -1)}
                            class="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                            title="Restar 1"
                          >
                            -
                          </button>
                          <span class="px-2 text-xs font-bold text-white">{item.quantity}</span>
                          <button 
                            type="button"
                            onclick={() => handleUpdateStock(item.id, 1)}
                            class="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                            title="Sumar 1"
                          >
                            +
                          </button>
                        </div>

                        <!-- Botón directo: ¡Se acabó! (pasa a la lista de compra) -->
                        <button 
                          type="button" 
                          onclick={() => handleUpdateStock(item.id, undefined, true)}
                          class="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-xl border border-red-500/20 transition-colors"
                          title="Se acabó: enviar a la lista de la compra"
                        >
                          <ShoppingCart size={13} />
                          <span class="hidden xs:inline">Se acabó</span>
                        </button>

                        <button 
                          type="button" 
                          onclick={() => openEditItemModal(item)}
                          class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          title="Editar producto"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button 
                          type="button" 
                          onclick={() => handleDeleteItem(item.id)}
                          class="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                          title="Borrar del catálogo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  {/each}

                  <!-- Productos Agotados (Stock = 0): Permanecen en su cajón para no perder la referencia -->
                  {#if outOfStockItems.length > 0}
                    <div class="mt-3 pt-3 border-t border-white/5 space-y-2">
                      <div class="flex items-center justify-between px-1">
                        <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Agotados ({outOfStockItems.length})
                        </span>
                        <span class="text-[10px] text-gray-500">Referencia guardada en este cajón</span>
                      </div>
                      {#each outOfStockItems as item}
                        <div class="flex items-center justify-between p-3 rounded-xl bg-navy-surface/40 border border-white/5 hover:border-white/10 transition-all opacity-85 hover:opacity-100">
                          <div class="flex items-center gap-3 min-w-0">
                            <span class="text-2xl shrink-0 grayscale">{item.icon || '📦'}</span>
                            <div class="min-w-0">
                              <h4 class="font-bold text-sm text-gray-300 truncate">{item.name}</h4>
                              <div class="flex items-center gap-1.5 mt-0.5">
                                {#if item.neededInShoppingList}
                                  <span class="text-[10px] bg-amber-400/15 text-amber-300 font-semibold px-2 py-0.5 rounded-md border border-amber-400/20 flex items-center gap-1">
                                    <ShoppingCart size={10} /> En la compra ({item.shoppingQuantity || 1} {item.unit || 'uds'})
                                  </span>
                                {:else}
                                  <span class="text-[10px] bg-rose-500/15 text-rose-300 font-semibold px-2 py-0.5 rounded-md border border-rose-500/20">
                                    🔴 Agotado (0 {item.unit || 'uds'})
                                  </span>
                                {/if}
                              </div>
                            </div>
                          </div>

                          <div class="flex items-center gap-1.5 shrink-0">
                            {#if !item.neededInShoppingList}
                              <button 
                                type="button" 
                                onclick={() => handleSendToShopping(item.id)}
                                class="flex items-center gap-1 px-2.5 py-1.5 bg-accent-cyan/10 hover:bg-accent-cyan hover:text-navy-bg text-accent-cyan text-xs font-bold rounded-xl border border-accent-cyan/30 transition-colors"
                                title="Añadir a la lista de la compra"
                              >
                                <ShoppingCart size={13} />
                                <span class="hidden xs:inline">+ Compra</span>
                              </button>
                            {/if}

                            <!-- Botón para reponer 1 unidad directo -->
                            <button 
                              type="button"
                              onclick={() => handleUpdateStock(item.id, 1)}
                              class="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs font-bold rounded-xl border border-emerald-500/20 transition-colors flex items-center gap-1"
                              title="Reponer 1 unidad"
                            >
                              <Plus size={12} /> Reponer
                            </button>

                            <button 
                              type="button" 
                              onclick={() => openEditItemModal(item)}
                              class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                              title="Editar producto"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button 
                              type="button" 
                              onclick={() => handleDeleteItem(item.id)}
                              class="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                              title="Borrar del catálogo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="py-3 text-center text-gray-500 text-xs border border-dashed border-white/5 rounded-xl mt-1">
                  Cajón vacío · <button onclick={() => openAddItemModal('inventory', loc.id)} class="text-amber-400 hover:underline font-bold">+ Añadir producto</button>
                </div>
              {/if}
            {/if}
          </div>
        {/each}

        <!-- Objetos sin cajón asignado -->
        {@const unassignedAll = data.items.filter(i => !i.locationId)}
        {@const unassignedAvailable = unassignedAll.filter(i => (i.quantity || 0) > 0)}
        {@const unassignedOutOfStock = unassignedAll.filter(i => (i.quantity || 0) === 0)}
        {#if unassignedAll.length > 0}
          {@const isCollapsed = collapsedLocations['unassigned']}
          <div class="mb-4 bg-navy-surface/30 border border-white/5 rounded-2xl p-4 shadow-glass transition-all fade-in">
            <div class="flex items-center justify-between gap-2 {isCollapsed ? '' : 'mb-3'}">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl shrink-0">📦</span>
                <h3 class="font-bold text-gray-300 text-base flex items-center gap-2">
                  <span>General / Sin cajón</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                    {unassignedAvailable.length}{#if unassignedOutOfStock.length > 0}<span class="text-gray-400 font-normal">/{unassignedAll.length}</span>{/if}
                  </span>
                </h3>
              </div>
              <button 
                type="button" 
                onclick={() => toggleCollapse('unassigned')}
                class="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
              >
                {#if isCollapsed}
                  <ChevronDown size={18} />
                {:else}
                  <ChevronUp size={18} />
                {/if}
              </button>
            </div>

            {#if !isCollapsed}
              <div class="space-y-2 mt-2">
                {#each unassignedAvailable as item}
                  <div class="flex items-center justify-between p-3 rounded-xl bg-navy-surface border border-white/5">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-2xl shrink-0">{item.icon || '📦'}</span>
                      <div class="min-w-0">
                        <h4 class="font-bold text-sm text-gray-100 truncate">{item.name}</h4>
                        <p class="text-[11px] text-gray-400 font-medium">Stock: {item.quantity} {item.unit || 'uds'}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <button 
                        type="button" 
                        onclick={() => handleUpdateStock(item.id, undefined, true)}
                        class="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-xl border border-red-500/20 transition-colors"
                      >
                        Se acabó
                      </button>
                      <button 
                        type="button" 
                        onclick={() => openEditItemModal(item)}
                        class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        title="Editar producto"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        type="button" 
                        onclick={() => handleDeleteItem(item.id)}
                        class="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                        title="Borrar del catálogo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                {/each}

                {#if unassignedOutOfStock.length > 0}
                  <div class="mt-3 pt-3 border-t border-white/5 space-y-2">
                    <div class="flex items-center justify-between px-1">
                      <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Agotados ({unassignedOutOfStock.length})
                      </span>
                    </div>
                    {#each unassignedOutOfStock as item}
                      <div class="flex items-center justify-between p-3 rounded-xl bg-navy-surface/40 border border-white/5 opacity-85 hover:opacity-100">
                        <div class="flex items-center gap-3 min-w-0">
                          <span class="text-2xl shrink-0 grayscale">{item.icon || '📦'}</span>
                          <div class="min-w-0">
                            <h4 class="font-bold text-sm text-gray-300 truncate">{item.name}</h4>
                            <div class="flex items-center gap-1.5 mt-0.5">
                              {#if item.neededInShoppingList}
                                <span class="text-[10px] bg-amber-400/15 text-amber-300 font-semibold px-2 py-0.5 rounded-md border border-amber-400/20 flex items-center gap-1">
                                  <ShoppingCart size={10} /> En la compra ({item.shoppingQuantity || 1} {item.unit || 'uds'})
                                </span>
                              {:else}
                                <span class="text-[10px] bg-rose-500/15 text-rose-300 font-semibold px-2 py-0.5 rounded-md border border-rose-500/20">
                                  🔴 Agotado
                                </span>
                              {/if}
                            </div>
                          </div>
                        </div>

                        <div class="flex items-center gap-1.5 shrink-0">
                          {#if !item.neededInShoppingList}
                            <button 
                              type="button" 
                              onclick={() => handleSendToShopping(item.id)}
                              class="flex items-center gap-1 px-2.5 py-1.5 bg-accent-cyan/10 hover:bg-accent-cyan hover:text-navy-bg text-accent-cyan text-xs font-bold rounded-xl border border-accent-cyan/30 transition-colors"
                            >
                              <ShoppingCart size={13} /> + Compra
                            </button>
                          {/if}
                          <button 
                            type="button"
                            onclick={() => handleUpdateStock(item.id, 1)}
                            class="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs font-bold rounded-xl border border-emerald-500/20 transition-colors flex items-center gap-1"
                          >
                            <Plus size={12} /> Reponer
                          </button>
                          <button 
                            type="button" 
                            onclick={() => openEditItemModal(item)}
                            class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            type="button" 
                            onclick={() => handleDeleteItem(item.id)}
                            class="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      {:else}
        <!-- VISTA PLANA SIN CAJONES -->
        {@const availableFlat = data.items.filter(i => (i.quantity || 0) > 0)}
        {@const outOfStockFlat = data.items.filter(i => (i.quantity || 0) === 0)}

        {#if availableFlat.length > 0}
          <div class="space-y-2 mb-5">
            {#each availableFlat as item}
              <div class="flex items-center justify-between p-3.5 rounded-2xl bg-navy-surface border border-white/10 hover:border-white/20 transition-all shadow-glass">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-2xl shrink-0">{item.icon || '📦'}</span>
                  <div class="min-w-0">
                    <h4 class="font-bold text-sm text-gray-100 truncate">{item.name}</h4>
                    <p class="text-[11px] text-gray-400 font-medium">
                      Stock: <strong class="text-amber-400">{item.quantity}</strong> {item.unit || 'uds'}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <!-- Ajuste rápido de stock -->
                  <div class="flex items-center bg-navy-bg/90 border border-white/10 rounded-xl overflow-hidden mr-1 shadow-inner">
                    <button 
                      type="button"
                      onclick={() => handleUpdateStock(item.id, -1)}
                      class="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                      title="Restar 1"
                    >
                      -
                    </button>
                    <span class="px-2 text-xs font-bold text-white min-w-[20px] text-center">{item.quantity}</span>
                    <button 
                      type="button"
                      onclick={() => handleUpdateStock(item.id, 1)}
                      class="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors"
                      title="Sumar 1"
                    >
                      +
                    </button>
                  </div>

                  <!-- Botón directo: ¡Se acabó! (pasa a la lista de compra) -->
                  <button 
                    type="button" 
                    onclick={() => handleUpdateStock(item.id, undefined, true)}
                    class="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-xl border border-red-500/20 transition-colors"
                    title="Se acabó: enviar a la lista de la compra"
                  >
                    <ShoppingCart size={13} />
                    <span class="hidden xs:inline">Se acabó</span>
                  </button>

                  <button 
                    type="button" 
                    onclick={() => openEditItemModal(item)}
                    class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    title="Editar producto"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button 
                    type="button" 
                    onclick={() => handleDeleteItem(item.id)}
                    class="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                    title="Borrar del catálogo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if outOfStockFlat.length > 0}
          <div class="bg-navy-surface/30 border border-white/5 rounded-2xl p-4 space-y-2">
            <div class="flex items-center justify-between px-1 mb-2">
              <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Agotados ({outOfStockFlat.length})
              </span>
              <span class="text-[10px] text-gray-500">Historial y catálogo guardado</span>
            </div>
            {#each outOfStockFlat as item}
              <div class="flex items-center justify-between p-3 rounded-xl bg-navy-surface/40 border border-white/5 hover:border-white/10 transition-all opacity-85 hover:opacity-100">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-2xl shrink-0 grayscale">{item.icon || '📦'}</span>
                  <div class="min-w-0">
                    <h4 class="font-bold text-sm text-gray-300 truncate">{item.name}</h4>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      {#if item.neededInShoppingList}
                        <span class="text-[10px] bg-amber-400/15 text-amber-300 font-semibold px-2 py-0.5 rounded-md border border-amber-400/20 flex items-center gap-1">
                          <ShoppingCart size={10} /> En la compra ({item.shoppingQuantity || 1} {item.unit || 'uds'})
                        </span>
                      {:else}
                        <span class="text-[10px] bg-rose-500/15 text-rose-300 font-semibold px-2 py-0.5 rounded-md border border-rose-500/20">
                          🔴 Agotado (0 {item.unit || 'uds'})
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  {#if !item.neededInShoppingList}
                    <button 
                      type="button" 
                      onclick={() => handleSendToShopping(item.id)}
                      class="flex items-center gap-1 px-2.5 py-1.5 bg-accent-cyan/10 hover:bg-accent-cyan hover:text-navy-bg text-accent-cyan text-xs font-bold rounded-xl border border-accent-cyan/30 transition-colors"
                      title="Añadir a la lista de la compra"
                    >
                      <ShoppingCart size={13} />
                      <span class="hidden xs:inline">+ Compra</span>
                    </button>
                  {/if}
                  <button 
                    type="button"
                    onclick={() => handleUpdateStock(item.id, 1)}
                    class="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white text-xs font-bold rounded-xl border border-emerald-500/20 transition-colors flex items-center gap-1"
                    title="Reponer 1 unidad"
                  >
                    <Plus size={12} />
                    <span class="hidden xs:inline">Reponer</span>
                  </button>
                  <button 
                    type="button" 
                    onclick={() => openEditItemModal(item)}
                    class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    title="Editar producto"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    type="button" 
                    onclick={() => handleDeleteItem(item.id)}
                    class="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                    title="Borrar del catálogo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

    {:else}
      <!-- VISTA LISTA DE LA COMPRA -->
      <div class="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <span>🛒</span> Lista de la Compra
          </h3>
          <p class="text-xs text-gray-400">
            {pendingShoppingItems.length} pendiente{pendingShoppingItems.length === 1 ? '' : 's'} · {boughtShoppingItems.length} en el carrito
          </p>
        </div>

        <!-- Botón superior derecho: Se habilita cuando hay al menos 1 producto comprado -->
        <button 
          type="button" 
          onclick={handleClearBought}
          disabled={boughtShoppingItems.length === 0}
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all {boughtShoppingItems.length > 0 ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-gray-500 border border-white/5 opacity-50 cursor-not-allowed'}"
          title="Borrar de la lista y reponer en el inventario"
        >
          <CheckCheck size={16} />
          <span>Borrar comprados ({boughtShoppingItems.length})</span>
        </button>
      </div>

      <!-- Barra para Añadir Rápido a la compra con autocompletado de catálogo -->
      <div class="mb-5 bg-navy-surface/80 border border-white/10 p-3 rounded-2xl shadow-glass">
        <form 
          onsubmit={(e) => {
            e.preventDefault();
            if (!searchQuery.trim()) return;
            const form = new FormData();
            form.append('name', searchQuery.trim());
            form.append('target', 'shopping');
            fetch('?/createItem', { method: 'POST', body: form }).then(() => {
              searchQuery = '';
              invalidateAll();
            });
          }}
          class="flex items-center gap-2"
        >
          <div class="relative flex-1">
            <input 
              type="text" 
              bind:value={searchQuery}
              placeholder="Escribe algo para comprar (ej: Leche, Arroz...)"
              class="w-full bg-navy-bg border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none focus:border-accent-cyan"
            />
          </div>
          <button 
            type="submit" 
            class="px-4 py-2.5 bg-accent-cyan hover:bg-cyan-300 text-navy-bg font-bold text-xs rounded-xl transition-all shadow-glow shrink-0 flex items-center gap-1"
          >
            <Plus size={15} /> Añadir
          </button>
        </form>

        <!-- Sugerencias automáticas del catálogo existente -->
        {#if searchQuery.trim() && catalogSuggestions.length > 0}
          <div class="mt-2.5 pt-2 border-t border-white/5">
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">Objetos en tu catálogo:</p>
            <div class="flex flex-wrap gap-1.5">
              {#each catalogSuggestions as sug}
                <button 
                  type="button" 
                  onclick={() => {
                    handleSendToShopping(sug.id);
                    searchQuery = '';
                  }}
                  class="px-2.5 py-1 bg-white/5 hover:bg-accent-cyan/15 hover:border-accent-cyan/40 border border-white/5 text-gray-200 hover:text-white rounded-lg text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>{sug.icon || '📦'}</span>
                  <span>{sug.name}</span>
                  <Plus size={12} class="text-accent-cyan" />
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Listado de Productos de la Compra -->
      {#if sortedShoppingItems.length === 0}
        <div class="text-center py-12 px-4 bg-navy-surface/30 border border-white/5 rounded-2xl">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-cyan/10 flex items-center justify-center text-3xl">
            🛒
          </div>
          <h3 class="text-base font-bold text-white mb-1">¡Lista de la compra vacía!</h3>
          <p class="text-xs text-gray-400 max-w-xs mx-auto">
            No falta nada en la despensa. Cuando algo se acabe en el inventario, pulsa <strong>«Se acabó»</strong> o escribe arriba para apuntarlo.
          </p>
        </div>
      {:else}
        <div class="space-y-2.5">
          {#each sortedShoppingItems as item}
            {@const loc = data.locations.find(l => l.id === item.locationId)}
            <div class="flex items-center justify-between p-3.5 rounded-2xl border transition-all {item.isBought ? 'bg-navy-surface/30 border-white/5 opacity-60' : 'bg-navy-surface border-white/10 shadow-glass'}">
              <div class="flex items-center gap-3 min-w-0">
                <!-- Checkbox táctil -->
                <button 
                  type="button" 
                  onclick={() => handleToggleShopping(item.id, item.isBought)}
                  class="w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 {item.isBought ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-white/20 bg-navy-bg hover:border-accent-cyan'}"
                  title={item.isBought ? "Desmarcar" : "Marcar como comprado"}
                >
                  {#if item.isBought}
                    <Check size={16} strokeWidth={3} />
                  {/if}
                </button>

                <span class="text-2xl shrink-0">{item.icon || '📦'}</span>

                <div class="min-w-0">
                  <h4 class="font-bold text-sm truncate {item.isBought ? 'line-through text-gray-400' : 'text-white'}">
                    {item.name}
                  </h4>
                  <div class="flex items-center gap-2 mt-0.5">
                    {#if showLocations && loc}
                      <span class="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/5">
                        <span>{loc.icon || '🧊'}</span> {loc.name}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <!-- Stepper de unidades a comprar -->
                <div class="flex items-center bg-navy-bg/90 border border-white/10 rounded-xl overflow-hidden shadow-inner">
                  <button 
                    type="button"
                    disabled={item.isBought || (item.shoppingQuantity || 1) <= 1}
                    onclick={() => handleUpdateShoppingQuantity(item.id, -1)}
                    class="px-2.5 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors disabled:opacity-25"
                    title="Comprar 1 menos"
                  >
                    -
                  </button>
                  <span class="px-2 text-xs font-bold text-accent-cyan whitespace-nowrap min-w-[45px] text-center">
                    {item.shoppingQuantity || 1} {item.unit || 'uds'}
                  </span>
                  <button 
                    type="button"
                    disabled={item.isBought}
                    onclick={() => handleUpdateShoppingQuantity(item.id, 1)}
                    class="px-2.5 py-1.5 text-gray-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-colors disabled:opacity-25"
                    title="Comprar 1 más"
                  >
                    +
                  </button>
                </div>

                <button 
                  type="button" 
                  onclick={() => openEditItemModal(item)}
                  class="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                  title="Editar producto"
                >
                  <Edit2 size={14} />
                </button>

                <button 
                  type="button" 
                  onclick={() => handleRemoveFromShopping(item.id)}
                  class="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                  title="Quitar de la lista de compra (permanece en inventario como agotado)"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Modal para Crear / Editar Cajones (Ubicaciones) -->
{#if showLocationModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in" onclick={() => showLocationModal = false}>
    <div class="bg-navy-bg border border-white/15 w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden" onclick={(e) => e.stopPropagation()}>
      
      <!-- Cabecera Fija -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-navy-surface/40">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span>🧊</span> Cajones y Ubicaciones
        </h3>
        <button type="button" onclick={() => showLocationModal = false} class="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors">
          <X size={20} />
        </button>
      </div>

      <!-- Contenido scrolleable completo -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
        <p class="text-xs text-gray-400 leading-relaxed">
          Organiza las provisiones en diferentes sitios (ej: <em>Congelador</em>, <em>Nevera</em>, <em>Despensa</em>, <em>Cajón de oficina</em>).
        </p>

        <!-- Formulario Nuevo Cajón -->
        <form onsubmit={handleCreateLocation} class="space-y-3.5 bg-navy-surface/60 p-4 rounded-2xl border border-white/5 shadow-inner">
          <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Plus size={14} /> Nuevo Cajón
          </h4>
          
          <div class="space-y-1">
            <label class="text-[11px] text-gray-400">Nombre del cajón</label>
            <input 
              type="text" 
              bind:value={newLocationName}
              placeholder="Ej: Congelador, Nevera, Despensa..." 
              class="w-full px-3.5 py-2.5 rounded-xl bg-navy-bg border border-white/10 text-white text-sm outline-none focus:border-amber-400"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] text-gray-400">Icono / Emoji</label>
            <div class="flex flex-wrap gap-1.5">
              {#each popularLocationEmojis as em}
                <button 
                  type="button" 
                  onclick={() => newLocationIcon = em}
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-base border transition-all {newLocationIcon === em ? 'bg-amber-400/20 border-amber-400 scale-110 shadow-sm' : 'bg-navy-bg border-white/5 hover:bg-white/5'}"
                >
                  {em}
                </button>
              {/each}
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-navy-bg font-bold text-xs rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5"
          >
            <Plus size={15} /> Crear Cajón
          </button>
        </form>

        <!-- Lista de Cajones Existentes -->
        {#if data.locations.length > 0}
          <div class="space-y-2.5 pt-1 pb-8">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-gray-300 uppercase tracking-wider">Cajones actuales ({data.locations.length})</h4>
              <span class="text-[11px] text-gray-400">Desplaza abajo para ver todos</span>
            </div>
            <div class="space-y-2">
              {#each data.locations as loc}
                <div class="flex items-center justify-between p-3.5 rounded-2xl bg-navy-surface border border-white/5 shadow-glass">
                  {#if editingLocationId === loc.id}
                    <form onsubmit={handleUpdateLocation} class="flex items-center gap-2 flex-1">
                      <input type="text" bind:value={editLocationIcon} class="w-10 px-1 py-1.5 text-center bg-navy-bg border border-white/10 rounded-lg text-sm" />
                      <input type="text" bind:value={editLocationName} class="flex-1 px-3 py-1.5 bg-navy-bg border border-white/10 rounded-lg text-sm text-white" required />
                      <button type="submit" class="p-2 text-amber-400 hover:bg-amber-400/10 rounded-lg">
                        <Check size={16} />
                      </button>
                      <button type="button" onclick={() => editingLocationId = null} class="p-2 text-gray-400 hover:bg-white/5 rounded-lg">
                        <X size={16} />
                      </button>
                    </form>
                  {:else}
                    <div class="flex items-center gap-2.5">
                      <span class="text-2xl">{loc.icon || '🧊'}</span>
                      <span class="font-bold text-white text-sm">{loc.name}</span>
                    </div>

                    <div class="flex items-center gap-1">
                      <button 
                        type="button" 
                        onclick={() => { editingLocationId = loc.id; editLocationName = loc.name; editLocationIcon = loc.icon || '🧊'; }}
                        class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                        title="Editar nombre"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button 
                        type="button" 
                        onclick={() => handleDeleteLocation(loc.id)}
                        class="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                        title="Eliminar cajón"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Modal para Añadir Nuevo Objeto al Catálogo -->
{#if showItemModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in" onclick={() => showItemModal = false}>
    <div class="bg-navy-bg border border-white/15 w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden" onclick={(e) => e.stopPropagation()}>
      
      <!-- Cabecera Fija -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-navy-surface/40">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span>📦</span> {newItemTarget === 'inventory' ? 'Añadir al Inventario' : 'Añadir a la Compra'}
        </h3>
        <button type="button" onclick={() => showItemModal = false} class="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors">
          <X size={20} />
        </button>
      </div>

      <!-- Formulario scrolleable -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
        <form onsubmit={handleCreateItem} class="space-y-4">
          <div class="space-y-1">
            <label class="text-[11px] text-gray-400">Nombre del objeto o producto</label>
            <input 
              type="text" 
              bind:value={newItemName}
              placeholder="Ej: Leche desnatada, Cuaderno, Pizza..." 
              class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none focus:border-amber-400 font-medium"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] text-gray-400">Emoji / Icono</label>
            <div class="flex flex-wrap gap-1.5">
              {#each popularItemEmojis as em}
                <button 
                  type="button" 
                  onclick={() => newItemIcon = em}
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-base border transition-all {newItemIcon === em ? 'bg-amber-400/20 border-amber-400 scale-110' : 'bg-navy-surface border-white/5 hover:bg-white/5'}"
                >
                  {em}
                </button>
              {/each}
            </div>
          </div>

          {#if showLocations && data.locations.length > 0}
            <div class="space-y-1">
              <label class="text-[11px] text-gray-400">Cajón habitual</label>
              <select 
                bind:value={newItemLocationId}
                class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none"
              >
                <option value="none">General (Sin cajón)</option>
                {#each data.locations as loc}
                  <option value={loc.id}>{loc.icon || '🧊'} {loc.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] text-gray-400">Cantidad</label>
              <input 
                type="number" 
                bind:value={newItemQuantity}
                min="1"
                max="999"
                class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[11px] text-gray-400">Unidad</label>
              <input 
                type="text" 
                bind:value={newItemUnit}
                placeholder="uds, kg, L, paq"
                class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none"
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full py-3 bg-amber-400 hover:bg-amber-300 text-navy-bg font-bold text-xs rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5 mt-2"
          >
            <Plus size={16} /> Guardar Objeto
          </button>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Modal para Editar Objeto / Producto -->
{#if showEditItemModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in" onclick={() => showEditItemModal = false}>
    <div class="bg-navy-bg border border-white/15 w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-hidden" onclick={(e) => e.stopPropagation()}>
      
      <!-- Cabecera Fija -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-navy-surface/40">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span>✏️</span> Editar Producto
        </h3>
        <button type="button" onclick={() => showEditItemModal = false} class="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors">
          <X size={20} />
        </button>
      </div>

      <!-- Formulario scrolleable -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
        <form onsubmit={handleUpdateItem} class="space-y-4">
          <div class="space-y-1">
            <label class="text-[11px] text-gray-400">Nombre del objeto o producto</label>
            <input 
              type="text" 
              bind:value={editItemName}
              class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none focus:border-amber-400 font-medium"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] text-gray-400">Emoji / Icono</label>
            <div class="flex flex-wrap gap-1.5">
              {#each popularItemEmojis as em}
                <button 
                  type="button" 
                  onclick={() => editItemIcon = em}
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-base border transition-all {editItemIcon === em ? 'bg-amber-400/20 border-amber-400 scale-110 shadow-sm' : 'bg-navy-surface border-white/5 hover:bg-white/5'}"
                >
                  {em}
                </button>
              {/each}
            </div>
          </div>

          {#if showLocations && data.locations.length > 0}
            <div class="space-y-1">
              <label class="text-[11px] text-gray-400">Cajón habitual</label>
              <select 
                bind:value={editItemLocationId}
                class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none"
              >
                <option value="none">General (Sin cajón)</option>
                {#each data.locations as loc}
                  <option value={loc.id}>{loc.icon || '🧊'} {loc.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-[11px] text-gray-400">Existencias actuales en inventario</label>
              <input 
                type="number" 
                bind:value={editItemQuantity}
                min="0"
                max="999"
                class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none"
              />
            </div>
            <div class="space-y-1">
              <label class="text-[11px] text-gray-400">Unidad</label>
              <input 
                type="text" 
                bind:value={editItemUnit}
                placeholder="uds, kg, L, paq"
                class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-[11px] text-gray-400">Cantidad habitual a comprar</label>
            <input 
              type="number" 
              bind:value={editItemShoppingQuantity}
              min="1"
              max="999"
              class="w-full px-3.5 py-2.5 rounded-xl bg-navy-surface border border-white/10 text-white text-sm outline-none"
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button 
              type="button"
              onclick={() => showEditItemModal = false}
              class="flex-1 py-3 bg-navy-surface hover:bg-white/10 text-gray-300 font-bold text-xs rounded-xl transition-all border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              class="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-navy-bg font-bold text-xs rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5"
            >
              <Check size={16} /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
