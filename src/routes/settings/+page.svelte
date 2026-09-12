<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Settings, Store, Trophy, ShieldAlert, Sparkles, ArrowLeft, Check, Loader2, Clock, Package, Plus, Trash2, Edit2, X, Boxes, PackagePlus } from '@lucide/svelte';
  
  let { data, form } = $props();

  let storeActive = $state(data.settings?.enableStore ?? true);
  let feedActive = $state(data.settings?.enableFeed ?? true);
  let pointsActive = $state(data.settings?.enablePoints ?? true);
  let quarantineActive = $state(data.settings?.enableQuarantine ?? true);
  let dueDatesActive = $state(data.settings?.enableDueDates ?? false);
  let inventoryActive = $state(data.settings?.enableInventory ?? false);
  let taskCategoriesActive = $state(data.settings?.enableTaskCategories ?? true);
  let inventoryLocationsActive = $state(data.settings?.enableInventoryLocations ?? true);
  let showSavedNotification = $state(false);
  let isSaving = $state(false);

  let newCategoryName = $state('');
  let newCategoryIcon = $state('🏠');
  let editingCatId = $state<string | null>(null);
  let editCatName = $state('');
  let editCatIcon = $state('📦');

  const popularEmojis = ['🏠', '🛒', '🧳', '🚗', '🏕️', '🧹', '🍳', '💼', '📋', '🎒', '🐾', '🔧'];

  async function handleCreateBox(e: SubmitEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const formData = new FormData();
    formData.append('name', newCategoryName.trim());
    formData.append('icon', newCategoryIcon);
    await fetch('?/createCategory', { method: 'POST', body: formData });
    newCategoryName = '';
    await invalidateAll();
  }

  async function handleUpdateBox(e: SubmitEvent) {
    e.preventDefault();
    if (!editingCatId || !editCatName.trim()) return;
    const formData = new FormData();
    formData.append('categoryId', editingCatId);
    formData.append('name', editCatName.trim());
    formData.append('icon', editCatIcon);
    await fetch('?/updateCategory', { method: 'POST', body: formData });
    editingCatId = null;
    await invalidateAll();
  }

  async function handleDeleteBox(categoryId: string) {
    if (!confirm('¿Eliminar esta caja? Las tareas que contenga no se borrarán, pasarán a General.')) return;
    const formData = new FormData();
    formData.append('categoryId', categoryId);
    await fetch('?/deleteCategory', { method: 'POST', body: formData });
    await invalidateAll();
  }

  let formElement: HTMLFormElement | undefined = $state();
  let saveTimeout: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (data.settings) {
      storeActive = data.settings.enableStore ?? true;
      feedActive = data.settings.enableFeed ?? true;
      pointsActive = data.settings.enablePoints ?? true;
      quarantineActive = data.settings.enableQuarantine ?? true;
      dueDatesActive = data.settings.enableDueDates ?? false;
      inventoryActive = data.settings.enableInventory ?? false;
      taskCategoriesActive = data.settings.enableTaskCategories ?? true;
      inventoryLocationsActive = data.settings.enableInventoryLocations ?? true;
    }
  });

  $effect(() => {
    if (form?.success) {
      showSavedNotification = true;
      const t = setTimeout(() => showSavedNotification = false, 3000);
      return () => clearTimeout(t);
    }
  });

  function triggerAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (formElement) {
        formElement.requestSubmit();
      }
    }, 100);
  }
</script>

<div class="h-full w-full flex flex-col relative z-10 pt-4 pb-28 max-w-md mx-auto fade-in">
  <!-- Cabecera sin botón de menú principal / casas a la derecha -->
  <header class="mb-6 px-1 flex items-center gap-3">
    <a 
      href="/tasks" 
      onclick={async () => { await invalidateAll(); }}
      class="p-2.5 bg-navy-surface hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all border border-white/5 shadow-glass"
      title="Volver a Tareas"
    >
      <ArrowLeft size={18} />
    </a>
    <div>
      <h2 class="text-xl font-bold flex items-center gap-2 text-white">
        <Settings size={22} class="text-accent-cyan" /> Ajustes del Espacio
      </h2>
      <p class="text-xs text-gray-400 mt-0.5">{data.houseName} • <span class="font-mono">{data.houseCode}</span></p>
    </div>
  </header>

  {#if showSavedNotification}
    <div class="mb-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in-up">
      <Check size={16} class="text-emerald-400" /> ¡Ajustes guardados correctamente!
    </div>
  {/if}

  <p class="text-xs text-gray-400 mb-4 px-1 leading-relaxed">
    Elige qué funciones están activas en este espacio. Las funciones desactivadas se ocultarán de la barra inferior y de la interfaz para todos los miembros.
  </p>

  <form 
    bind:this={formElement}
    method="POST" 
    action="?/saveSettings" 
    use:enhance={() => {
      isSaving = true;
      return async ({ update }) => {
        await update({ reset: false });
        await invalidateAll();
        isSaving = false;
        showSavedNotification = true;
        const t = setTimeout(() => showSavedNotification = false, 3000);
      };
    }}
    class="space-y-3"
  >
    <!-- Tienda de Recompensas -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {storeActive ? 'border-accent-orange/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {storeActive ? 'bg-accent-orange/20 text-accent-orange' : 'bg-white/5 text-gray-500'} transition-colors">
            <Store size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Tienda de Recompensas</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Canjea puntos por caprichos o premios fijados en la casa. Desactívala si solo queréis una lista de tareas.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableStore" 
          bind:checked={storeActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-accent-orange rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Muro de Actividad -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {feedActive ? 'border-accent-cyan/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {feedActive ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-gray-500'} transition-colors">
            <Trophy size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Muro de Actividad</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Registro cronológico de quién completó cada tarea y canjes recientes.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableFeed" 
          bind:checked={feedActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-accent-cyan rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Sistema de Puntos y Rachas -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {pointsActive ? 'border-yellow-400/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {pointsActive ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/5 text-gray-500'} transition-colors">
            <Sparkles size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Puntos y Rachas</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Gamificación: asigna puntos a tareas y cuenta rachas de días cumplidos. Si lo apagas, será una lista colaborativa simple sin puntuaciones.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enablePoints" 
          bind:checked={pointsActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-yellow-400 rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Cuarentena de Tareas Nuevas -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {quarantineActive ? 'border-emerald-400/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {quarantineActive ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-gray-500'} transition-colors">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Cuarentena de Tareas</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Las tareas nuevas creadas quedan congeladas 24h hasta que el grupo las valide. Desactívala para grupos de confianza o viajes donde queréis crear tareas al instante.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableQuarantine" 
          bind:checked={quarantineActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-emerald-400 rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Fechas y Horas Límite -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {dueDatesActive ? 'border-indigo-400/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {dueDatesActive ? 'bg-indigo-400/20 text-indigo-400' : 'bg-white/5 text-gray-500'} transition-colors">
            <Clock size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Fechas y Horas Límite</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Fija horas o fechas de finalización a las tareas y ordénalas cronológicamente: las más urgentes arriba y las que más tarde acaban abajo.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableDueDates" 
          bind:checked={dueDatesActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-indigo-400 rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Cajas de Tareas -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {taskCategoriesActive ? 'border-cyan-400/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {taskCategoriesActive ? 'bg-cyan-400/20 text-cyan-400' : 'bg-white/5 text-gray-500'} transition-colors">
            <Boxes size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Cajas de Tareas</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Organiza las tareas en secciones temáticas personalizables (En casa, Compras, Equipaje). Si se desactiva, las tareas se gestionan en una lista directa y unificada sin cajas.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableTaskCategories" 
          bind:checked={taskCategoriesActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-cyan-400 rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Inventario y Lista de la Compra -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {inventoryActive ? 'border-amber-400/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {inventoryActive ? 'bg-amber-400/20 text-amber-400' : 'bg-white/5 text-gray-500'} transition-colors">
            <Package size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Inventario y Lista de la Compra</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Módulo para gestionar provisiones, comida o material y sincronizar automáticamente las cosas agotadas con la lista de la compra.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableInventory" 
          bind:checked={inventoryActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-amber-400 rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Cajones del Inventario (solo si el módulo de inventario está activo) -->
    {#if inventoryActive}
      <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {inventoryLocationsActive ? 'border-amber-400/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20 animate-in fade-in slide-in-from-top-1 ml-3 border-l-2 border-l-amber-400">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="p-2.5 rounded-xl {inventoryLocationsActive ? 'bg-amber-400/20 text-amber-400' : 'bg-white/5 text-gray-500'} transition-colors">
              <PackagePlus size={22} />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-white">Cajones del Inventario</span>
              </div>
              <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                Clasifica los productos por cajones o zonas (congelador, nevera, despensa...). Si se desactiva, todo el inventario se muestra en una lista directa y unificada.
              </p>
            </div>
          </div>
          <input 
            type="checkbox" 
            name="enableInventoryLocations" 
            bind:checked={inventoryLocationsActive} 
            onchange={triggerAutoSave}
            class="w-5 h-5 accent-amber-400 rounded-md cursor-pointer mt-1" 
          />
        </div>
      </label>
    {/if}

    <div class="pt-4">
      <button 
        type="submit" 
        disabled={isSaving}
        class="w-full py-3.5 bg-accent-cyan hover:bg-cyan-400 disabled:opacity-60 text-navy-bg font-bold text-sm rounded-xl transition-all shadow-glow flex items-center justify-center gap-2"
      >
        {#if isSaving}
          <Loader2 size={18} class="animate-spin" /> Guardando cambios...
        {:else}
          Guardar Configuración <Check size={18} strokeWidth={2.5} />
        {/if}
      </button>
    </div>
  </form>

  <!-- Sección Cajas y Secciones de Tareas -->
  <div class="mt-8 pt-6 border-t border-white/10 space-y-4">
    <div>
      <h3 class="font-bold text-white text-base flex items-center gap-2">
        <span>📦</span> Cajas de Tareas
      </h3>
      <p class="text-xs text-gray-400 mt-0.5">
        Divide la lista de tareas en secciones temáticas (ej: En casa, Compras, Equipaje).
      </p>
    </div>

    {#if !taskCategoriesActive}
      <div class="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
        <Boxes size={16} class="shrink-0" />
        <span>Las cajas de tareas están desactivadas en los ajustes superiores. Puedes administrarlas aquí para cuando decidas reactivarlas.</span>
      </div>
    {/if}

    <!-- Formulario Nueva Caja -->
    <form onsubmit={handleCreateBox} class="bg-navy-surface p-4 rounded-2xl border border-white/5 space-y-3">
      <h4 class="text-xs font-bold text-accent-cyan uppercase tracking-wider">+ Nueva Caja</h4>
      
      <div class="space-y-1">
        <label class="text-[11px] text-gray-400">Nombre de la caja</label>
        <input 
          type="text" 
          bind:value={newCategoryName} 
          placeholder="Ej: En casa, Fuera, Compras, Equipaje..." 
          class="w-full px-3 py-2.5 rounded-xl bg-navy-bg border border-white/10 text-white text-sm outline-none focus:border-accent-cyan"
          required
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-[11px] text-gray-400">Icono / Emoji</label>
        <div class="flex flex-wrap gap-2">
          {#each popularEmojis as em}
            <button 
              type="button" 
              onclick={() => newCategoryIcon = em}
              class="w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all {newCategoryIcon === em ? 'bg-accent-cyan/20 border-accent-cyan scale-110' : 'bg-navy-bg border-white/5 hover:bg-white/5'}"
            >
              {em}
            </button>
          {/each}
        </div>
      </div>

      <button 
        type="submit" 
        class="w-full py-2.5 bg-accent-cyan hover:bg-cyan-300 text-navy-bg font-bold text-xs rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5"
      >
        <Plus size={15} /> Añadir Caja
      </button>
    </form>

    <!-- Lista de Cajas Existentes -->
    {#if data.categories && data.categories.length > 0}
      <div class="space-y-2">
        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Cajas actuales ({data.categories.length})</h4>
        <div class="space-y-2">
          {#each data.categories as cat}
            <div class="flex items-center justify-between p-3.5 rounded-2xl bg-navy-surface border border-white/5 shadow-glass">
              {#if editingCatId === cat.id}
                <form onsubmit={handleUpdateBox} class="flex items-center gap-2 flex-1">
                  <input type="text" bind:value={editCatIcon} class="w-10 px-1 py-1.5 text-center bg-navy-bg border border-white/10 rounded-lg text-sm" />
                  <input type="text" bind:value={editCatName} class="flex-1 px-3 py-1.5 bg-navy-bg border border-white/10 rounded-lg text-sm text-white" required />
                  <button type="submit" class="p-2 text-accent-cyan hover:bg-accent-cyan/10 rounded-lg">
                    <Check size={16} />
                  </button>
                  <button type="button" onclick={() => editingCatId = null} class="p-2 text-gray-400 hover:bg-white/5 rounded-lg">
                    <X size={16} />
                  </button>
                </form>
              {:else}
                <div class="flex items-center gap-2.5">
                  <span class="text-2xl">{cat.icon || '📦'}</span>
                  <span class="font-bold text-white text-sm">{cat.name}</span>
                </div>

                <div class="flex items-center gap-1">
                  <button 
                    type="button" 
                    onclick={() => { editingCatId = cat.id; editCatName = cat.name; editCatIcon = cat.icon || '📦'; }}
                    class="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    title="Editar nombre"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button 
                    type="button" 
                    onclick={() => handleDeleteBox(cat.id)}
                    class="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
                    title="Eliminar caja"
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
