<script lang="ts">
  import { Search, Plus, CalendarPlus, AlertTriangle, Edit2, Trash2, Clock, ArrowLeft, X, ChevronDown, Sparkles } from '@lucide/svelte';
  import { page } from '$app/state';
  
  let { data } = $props();

  let searchQuery = $state('');
  let showCreateModal = $state(false);
  let newTaskTitle = $state('');
  let newTaskPoints = $state(50);
  let selectedFrequency = $state('none');
  let selectedCategory = $state(page.url.searchParams.get('categoryId') || 'none');
  let newDueDate = $state('');
  let showAllTemplates = $state(false);

  // Edición de plantillas existentes
  let editingTemplate = $state<string | null>(null);
  let editingFrequency = $state('none');
  let editingFrequencyValue = $state<number | null>(null);

  // Opciones de configuración de la casa
  let showPoints = $derived(data.house?.enablePoints ?? (data.user?.settings?.enablePoints ?? true));
  let showDueDates = $derived(data.house?.enableDueDates ?? (data.user?.settings?.enableDueDates === true));
  let showQuarantine = $derived(data.house?.enableQuarantine ?? (data.user?.settings?.enableQuarantine ?? true));

  function setPresetToday(hours: number) {
    const d = new Date();
    d.setHours(hours, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    newDueDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function setPresetTomorrow(hours: number) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hours, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    newDueDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openCreateModal(initialTitle?: string) {
    newTaskTitle = initialTitle !== undefined ? initialTitle : searchQuery.trim();
    showCreateModal = true;
  }

  function openEdit(template: any) {
    editingTemplate = template.id;
    editingFrequency = template.frequency;
    editingFrequencyValue = template.frequencyValue;
  }

  // Comprobar coincidencia exacta con alguna tarea creada
  let hasExactMatch = $derived(
    data.templates.some(t => t.title.trim().toLowerCase() === searchQuery.trim().toLowerCase())
  );

  let showAddButton = $derived(
    searchQuery.trim().length > 0 && !hasExactMatch
  );

  let filteredTemplates = $derived(
    searchQuery.trim() === '' 
      ? data.templates 
      : data.templates.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  let frequentTemplates = $derived(data.templates.slice(0, 5));
  let remainingTemplates = $derived(data.templates.slice(5));
</script>

<div class="h-full w-full flex flex-col relative z-10 pt-2 pb-6 max-w-xl mx-auto">
  <!-- Cabecera limpia -->
  <header class="mb-4 px-1 flex items-center justify-between">
    <div>
      <a href="/tasks" class="text-xs font-semibold text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5 mb-1">
        <ArrowLeft size={16} /> Volver a Tareas
      </a>
      <h2 class="text-2xl font-bold flex items-center gap-2 text-white">
        <span>📋</span> Añadir Tarea
      </h2>
    </div>
  </header>

  <!-- Buscador Minimalista con botón '+' condicional -->
  <div class="relative mb-6">
    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Search size={20} class="text-gray-500" />
    </div>
    <input 
      type="text" 
      bind:value={searchQuery}
      onkeydown={(e) => {
        if (e.key === 'Enter' && showAddButton) {
          e.preventDefault();
          openCreateModal(searchQuery);
        }
      }}
      placeholder="Buscar o escribir nueva tarea..." 
      class="bg-navy-surface w-full pl-12 pr-28 py-4 rounded-2xl border border-white/10 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-white placeholder-gray-500 outline-none transition-all font-medium shadow-glass"
    />

    <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
      {#if searchQuery.trim().length > 0 && !showAddButton}
        <button 
          type="button" 
          onclick={() => searchQuery = ''} 
          class="p-2 text-gray-500 hover:text-white transition-colors"
          title="Borrar búsqueda"
        >
          <X size={16} />
        </button>
      {/if}

      <!-- Botón '+' cuando no concuerda con ninguna tarea existente -->
      {#if showAddButton}
        <button 
          type="button" 
          onclick={() => openCreateModal(searchQuery)}
          class="bg-accent-cyan text-navy-bg font-bold px-3.5 py-1.5 rounded-xl hover:bg-cyan-300 transition-all flex items-center gap-1 shadow-[0_0_12px_rgba(34,211,238,0.3)] text-xs active:scale-95 animate-in fade-in zoom-in-95"
          title="Crear nueva tarea"
        >
          <Plus size={16} />
          <span>Crear</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Contenido Principal: Frecuentes o Búsqueda -->
  <div class="flex-1 flex flex-col gap-4 overflow-y-auto pr-0.5">
    {#if searchQuery.trim() === ''}
      <!-- Sección Tareas Frecuentes (Top 5) -->
      <div>
        <div class="flex items-center justify-between mb-3 px-1">
          <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={13} class="text-accent-cyan" /> Tareas más frecuentes
          </h3>
          {#if data.templates.length > 0}
            <span class="text-xs text-gray-500 font-medium">
              {Math.min(5, data.templates.length)} de {data.templates.length}
            </span>
          {/if}
        </div>

        {#if data.templates.length === 0}
          <div class="text-center py-10 px-4 bg-navy-surface/40 rounded-3xl border border-dashed border-white/10">
            <span class="text-4xl block mb-2">✨</span>
            <p class="font-bold text-gray-200">Aún no hay tareas en el catálogo</p>
            <p class="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
              Escribe el nombre de la tarea en la barra superior o pulsa el botón para proponer tu primera tarea.
            </p>
            <button 
              type="button" 
              onclick={() => openCreateModal()}
              class="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-accent-cyan text-navy-bg font-bold rounded-xl text-sm hover:bg-cyan-300 transition-all shadow-glass active:scale-95"
            >
              <Plus size={18} /> Proponer nueva tarea
            </button>
          </div>
        {:else}
          <div class="space-y-2.5">
            {#each frequentTemplates as template}
              {@render templateRow(template)}
            {/each}
          </div>

          <!-- Botón Destacado: Proponer Nueva Tarea -->
          <button 
            type="button" 
            onclick={() => openCreateModal()}
            class="w-full mt-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-glass group"
          >
            <div class="w-7 h-7 rounded-lg bg-accent-cyan/20 text-accent-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus size={16} />
            </div>
            <span>Proponer nueva tarea</span>
          </button>

          <!-- Ver resto del catálogo desplegable si hay más de 5 -->
          {#if data.templates.length > 5}
            <div class="mt-4 pt-3 border-t border-white/5">
              <button 
                type="button" 
                onclick={() => showAllTemplates = !showAllTemplates}
                class="text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center gap-1.5 w-full py-2 transition-colors"
              >
                <span>{showAllTemplates ? 'Ocultar catálogo restante' : `Ver catálogo completo (${remainingTemplates.length} más)`}</span>
                <ChevronDown size={14} class="transition-transform duration-200 {showAllTemplates ? 'rotate-180' : ''}" />
              </button>

              {#if showAllTemplates}
                <div class="space-y-2.5 mt-3 animate-in fade-in slide-in-from-top-2">
                  {#each remainingTemplates as template}
                    {@render templateRow(template)}
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {/if}
      </div>

    {:else}
      <!-- Resultados de Búsqueda -->
      <div>
        <div class="flex items-center justify-between mb-3 px-1">
          <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Resultados del catálogo
          </h3>
          <span class="text-xs text-gray-500 font-medium">
            {filteredTemplates.length} encontrada{filteredTemplates.length === 1 ? '' : 's'}
          </span>
        </div>

        {#if filteredTemplates.length > 0}
          <div class="space-y-2.5">
            {#each filteredTemplates as template}
              {@render templateRow(template)}
            {/each}
          </div>
        {/if}

        <!-- Tarjeta para crear la tarea si no concuerda exactamente -->
        {#if showAddButton}
          <div class="mt-3 p-4 rounded-2xl bg-navy-surface/90 border border-accent-cyan/30 flex items-center justify-between gap-3 shadow-glass animate-in fade-in">
            <div class="min-w-0">
              <p class="text-[11px] text-gray-400 font-medium">¿No encuentras lo que buscas?</p>
              <p class="font-bold text-white truncate text-sm">Crear "{searchQuery.trim()}"</p>
            </div>
            <button 
              type="button" 
              onclick={() => openCreateModal(searchQuery)}
              class="shrink-0 bg-accent-cyan text-navy-bg font-bold px-3.5 py-2 rounded-xl text-xs hover:bg-cyan-300 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Plus size={16} /> Crear tarea
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Snippet para una fila de plantilla -->
{#snippet templateRow(template: any)}
  {@const category = data.categories.find(c => c.id === template.categoryId)}
  {@const isVerified = !showQuarantine || (new Date().getTime() - new Date(template.createdAt).getTime() > 24 * 60 * 60 * 1000)}
  <div class="bg-navy-surface hover:bg-navy-surface/90 p-3.5 rounded-2xl border border-white/5 shadow-glass flex items-center justify-between gap-3 transition-all group">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2 flex-wrap">
        <h4 class="font-bold text-gray-100 text-sm truncate">{template.title}</h4>
        {#if category}
          <span class="text-[10px] bg-white/5 text-gray-300 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-white/5">
            <span>{category.icon || '📦'}</span> {category.name}
          </span>
        {/if}
        {#if showQuarantine && !isVerified}
          <span class="text-[9px] bg-accent-orange/20 text-accent-orange px-1.5 py-0.5 rounded flex items-center gap-0.5" title="En cuarentena (24h)">
            <AlertTriangle size={10} /> En revisión
          </span>
        {/if}
      </div>

      <div class="flex items-center gap-3 mt-1 text-xs">
        {#if showPoints && template.basePoints > 0}
          <span class="text-accent-cyan font-bold">{template.basePoints} pts</span>
        {/if}
        {#if template.frequency && template.frequency !== 'none'}
          <span class="text-gray-500 capitalize text-[11px]">
            {template.frequency === 'daily' ? 'Diaria' : template.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
          </span>
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-1 shrink-0">
      <button 
        type="button" 
        onclick={() => openEdit(template)} 
        class="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5" 
        title="Editar tarea"
      >
        <Edit2 size={15} />
      </button>

      <form method="POST" action="?/deleteTemplate" onsubmit={(e) => { if(!confirm(`¿Borrar "${template.title}" del catálogo?`)) e.preventDefault(); }}>
        <input type="hidden" name="templateId" value={template.id} />
        <button class="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5" title="Borrar del catálogo">
          <Trash2 size={15} />
        </button>
      </form>

      <form method="POST" action="?/planTask" class="ml-1">
        <input type="hidden" name="templateId" value={template.id} />
        <button 
          type="submit" 
          class="h-9 px-3.5 rounded-xl bg-accent-cyan text-navy-bg font-bold text-xs hover:bg-cyan-300 transition-all flex items-center gap-1.5 shadow-md active:scale-95" 
          title="Añadir a la jornada de Hoy"
        >
          <CalendarPlus size={15} />
          <span>Añadir</span>
        </button>
      </form>
    </div>
  </div>
{/snippet}

<!-- Modal para Proponer / Crear Nueva Tarea -->
{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in" onclick={() => showCreateModal = false}>
    <div 
      class="bg-navy-bg border border-white/15 w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh] overflow-hidden" 
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Cabecera Fija -->
      <div class="p-5 border-b border-white/10 flex justify-between items-center bg-navy-surface/40 shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-accent-cyan/20 text-accent-cyan flex items-center justify-center">
            <Plus size={20} />
          </div>
          <div>
            <h3 class="text-base font-bold text-white">Proponer Nueva Tarea</h3>
            <p class="text-[11px] text-gray-400">Configura los detalles de la tarea</p>
          </div>
        </div>
        <button 
          type="button" 
          onclick={() => showCreateModal = false} 
          class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Contenido Scrolleable -->
      <form method="POST" action="?/createTemplate" class="p-5 overflow-y-auto flex flex-col gap-4">
        <!-- Nombre de la tarea -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-300 ml-1">Nombre de la tarea</label>
          <input 
            type="text" 
            name="title" 
            bind:value={newTaskTitle} 
            placeholder="Ej: Fregar los platos" 
            class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none font-medium focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan" 
            required 
            autofocus
          />
        </div>

        <!-- Puntos (solo si habilitados en la casa) -->
        {#if showPoints}
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-300 ml-1">Puntos asignados</label>
            <div class="flex items-center gap-4 bg-navy-surface px-4 py-2.5 rounded-xl border border-white/10">
              <input 
                type="range" 
                name="points"
                bind:value={newTaskPoints}
                min="5" max="500" step="5"
                class="flex-1 accent-accent-cyan"
              />
              <span class="text-base font-bold text-accent-cyan w-14 text-right">{newTaskPoints} pts</span>
            </div>
          </div>
        {/if}

        <!-- ¿Se repite? -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-gray-300 ml-1">¿Con qué frecuencia se realiza?</label>
          <select 
            name="frequency" 
            bind:value={selectedFrequency}
            class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none"
          >
            <option value="none">Normal (Una sola vez)</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        {#if selectedFrequency === 'weekly'}
          <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
            <label class="text-xs font-semibold text-gray-300 ml-1">¿Qué día de la semana?</label>
            <select name="frequencyValue" class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none">
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
              <option value="0">Domingo</option>
            </select>
          </div>
        {:else if selectedFrequency === 'monthly'}
          <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
            <label class="text-xs font-semibold text-gray-300 ml-1">¿Qué día del mes?</label>
            <select name="frequencyValue" class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none">
              {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                <option value={day}>Día {day}</option>
              {/each}
            </select>
          </div>
        {/if}

        <!-- Caja / Categoría -->
        {#if data.categories && data.categories.length > 0}
          <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
            <label class="text-xs font-semibold text-gray-300 ml-1 flex items-center gap-1.5">
              <span>📦</span> Caja / Categoría
            </label>
            <select 
              name="categoryId" 
              bind:value={selectedCategory}
              class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none font-medium"
            >
              <option value="none">General (Sin clasificar)</option>
              {#each data.categories as cat}
                <option value={cat.id}>{cat.icon || '📦'} {cat.name}</option>
              {/each}
            </select>
          </div>
        {/if}

        <!-- Fecha y hora límite (solo si habilitadas) -->
        {#if showDueDates}
          <div class="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label class="text-xs font-semibold text-gray-300 ml-1 flex items-center gap-1.5">
              <Clock size={14} class="text-accent-cyan" /> Fecha y hora límite (opcional)
            </label>
            <input 
              type="datetime-local" 
              name="dueDate" 
              bind:value={newDueDate}
              class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none text-sm focus:border-accent-cyan"
            />
            <div class="flex flex-wrap gap-2 text-xs">
              <button type="button" onclick={() => setPresetToday(14)} class="px-2.5 py-1 rounded-lg bg-navy-surface hover:bg-white/10 text-gray-300 border border-white/5 transition-colors">Hoy 14:00</button>
              <button type="button" onclick={() => setPresetToday(20)} class="px-2.5 py-1 rounded-lg bg-navy-surface hover:bg-white/10 text-gray-300 border border-white/5 transition-colors">Hoy 20:00</button>
              <button type="button" onclick={() => setPresetTomorrow(12)} class="px-2.5 py-1 rounded-lg bg-navy-surface hover:bg-white/10 text-gray-300 border border-white/5 transition-colors">Mañana 12:00</button>
              {#if newDueDate}
                <button type="button" onclick={() => newDueDate = ''} class="px-2 py-1 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors">Quitar</button>
              {/if}
            </div>
          </div>
        {/if}

        {#if showQuarantine}
          <div class="text-xs text-accent-orange/90 bg-accent-orange/10 p-3 rounded-xl border border-accent-orange/20 flex items-start gap-2">
            <AlertTriangle size={15} class="shrink-0 mt-0.5 text-accent-orange" />
            <span>Al ser una tarea nueva, los puntos se validarán pasadas 24h tras completarla.</span>
          </div>
        {/if}

        <div class="pt-2 flex gap-3">
          <button 
            type="button" 
            onclick={() => showCreateModal = false} 
            class="flex-1 py-3 font-bold text-gray-400 bg-navy-surface rounded-xl hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            class="flex-1 bg-accent-cyan hover:bg-cyan-300 text-navy-bg font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          >
            Crear y Añadir a Hoy
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal de Edición de Plantilla Existente -->
{#if editingTemplate}
  {@const t = data.templates.find(t => t.id === editingTemplate)}
  {#if t}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in" onclick={() => editingTemplate = null}>
      <div class="bg-navy-bg border border-white/15 w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[85vh] overflow-hidden" onclick={(e) => e.stopPropagation()}>
        <div class="p-5 border-b border-white/10 flex justify-between items-center bg-navy-surface/40 shrink-0">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <Edit2 size={18} class="text-accent-cyan" /> Editar Tarea
          </h3>
          <button type="button" onclick={() => editingTemplate = null} class="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form method="POST" action="?/updateTemplate" class="p-5 overflow-y-auto flex flex-col gap-4">
          <input type="hidden" name="templateId" value={t.id} />
          
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-300 ml-1">Nombre</label>
            <input type="text" name="title" value={t.title} class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none font-medium focus:border-accent-cyan" required />
          </div>

          {#if showPoints}
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-gray-300 ml-1">Puntos</label>
              <div class="flex items-center gap-4 bg-navy-surface px-4 py-2.5 rounded-xl border border-white/10">
                <input 
                  type="range" 
                  name="points"
                  value={t.basePoints}
                  min="5" max="500" step="5"
                  class="flex-1 accent-accent-cyan"
                  oninput={(e) => e.currentTarget.nextElementSibling!.textContent = `${e.currentTarget.value} pts`}
                />
                <span class="text-base font-bold text-accent-cyan w-14 text-right">{t.basePoints} pts</span>
              </div>
            </div>
          {/if}
          
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-gray-300 ml-1">¿Se repite?</label>
            <select 
              name="frequency" 
              bind:value={editingFrequency}
              class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none"
            >
              <option value="none">Normal (Una sola vez)</option>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          {#if editingFrequency === 'weekly'}
            <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label class="text-xs font-semibold text-gray-300 ml-1">¿Qué día de la semana?</label>
              <select name="frequencyValue" bind:value={editingFrequencyValue} class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none">
                <option value={1}>Lunes</option>
                <option value={2}>Martes</option>
                <option value={3}>Miércoles</option>
                <option value={4}>Jueves</option>
                <option value={5}>Viernes</option>
                <option value={6}>Sábado</option>
                <option value={0}>Domingo</option>
              </select>
            </div>
          {:else if editingFrequency === 'monthly'}
            <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label class="text-xs font-semibold text-gray-300 ml-1">¿Qué día del mes?</label>
              <select name="frequencyValue" bind:value={editingFrequencyValue} class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/10 text-white outline-none">
                {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                  <option value={day}>Día {day}</option>
                {/each}
              </select>
            </div>
          {/if}
          
          <div class="flex gap-3 mt-2">
            <button type="button" onclick={() => editingTemplate = null} class="flex-1 py-3 font-bold text-gray-400 bg-navy-surface rounded-xl hover:text-white transition-colors">Cancelar</button>
            <button type="submit" class="flex-1 py-3 font-bold bg-accent-cyan text-navy-bg rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all hover:bg-cyan-300">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
{/if}
