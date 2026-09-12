<script lang="ts">
  import { ListTodo, CheckCircle2, Plus, AlertTriangle, ThumbsUp, ThumbsDown, Users, Settings, PackagePlus, ChevronDown, ChevronUp, Edit2, Trash2, X, Check } from '@lucide/svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import { invalidateAll } from '$app/navigation';
  import confetti from 'canvas-confetti';
  
  let { data } = $props();

  let activeTab = $state<'today' | 'quarantine'>('today');
  let showQuarantine = $derived(data.settings?.enableQuarantine !== false);
  let showPoints = $derived(data.settings?.enablePoints !== false);
  let showDueDates = $derived(data.settings?.enableDueDates === true);
  let showTaskCategories = $derived(data.settings?.enableTaskCategories !== false);

  let showCategoryManagerModal = $state(false);
  let newCategoryName = $state('');
  let newCategoryIcon = $state('🏠');
  let editingCategoryId = $state<string | null>(null);
  let editCategoryName = $state('');
  let editCategoryIcon = $state('📦');
  let collapsedBoxes = $state<Record<string, boolean>>({});

  const popularEmojis = ['🏠', '🛒', '🧳', '🚗', '🏕️', '🧹', '🍳', '💼', '📋', '🎒', '🐾', '🔧'];

  function toggleCollapse(boxId: string) {
    collapsedBoxes[boxId] = !collapsedBoxes[boxId];
  }

  let myTasks = $derived(
    data.tasks.filter(t => t.assignees?.some(a => a.id === data.userId) || t.assignedToId === data.userId)
  );
  
  let otherTasks = $derived(
    data.tasks.filter(t => !(t.assignees?.some(a => a.id === data.userId) || t.assignedToId === data.userId))
  );

  let teamTasks = $derived(
    otherTasks.filter(t => (t.assignees && t.assignees.length > 0) || t.assignedToId)
  );

  let unassignedTasks = $derived(
    otherTasks.filter(t => (!t.assignees || t.assignees.length === 0) && !t.assignedToId)
  );

  async function handleClaim(id: string) {
    const formData = new FormData();
    formData.append('taskId', id);
    await fetch('?/claim', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleJoin(id: string) {
    const formData = new FormData();
    formData.append('taskId', id);
    await fetch('?/join', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleUnclaim(id: string, memberId?: string) {
    const formData = new FormData();
    formData.append('taskId', id);
    if (memberId) formData.append('memberId', memberId);
    await fetch('?/unclaim', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleToggleAssignee(taskId: string, memberId: string) {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('memberId', memberId);
    await fetch('?/toggleAssignee', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleComplete(taskId: string) {
    const formData = new FormData();
    formData.append('taskId', taskId);
    const res = await fetch('?/complete', { method: 'POST', body: formData });
    const result = await res.json();
    
    // Si la tarea es verificada salta confeti, sino mostramos alerta
    if (result.data) {
      const dataObj = JSON.parse(result.data);
      const isVerified = dataObj.find((d: any) => d && d.isVerified !== undefined)?.isVerified;
      if (isVerified) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        alert("¡Puntos congelados! Se sumarán cuando la tarea sea verificada (o pasen 24h).");
      }
    }
    
    await invalidateAll();
  }

  async function handleApprove(templateId: string) {
    const formData = new FormData();
    formData.append('templateId', templateId);
    await fetch('?/approveTemplate', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleReject(templateId: string) {
    if (!confirm("¿Seguro que quieres rechazar esta tarea? Se eliminará del catálogo.")) return;
    const formData = new FormData();
    formData.append('templateId', templateId);
    await fetch('?/rejectTemplate', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleDelete(taskId: string) {
    if (!confirm("¿Seguro que quieres eliminar esta tarea de hoy?")) return;
    const formData = new FormData();
    formData.append('taskId', taskId);
    await fetch('?/deleteTask', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleUpdateDueDate(taskId: string, dueDate: string | null) {
    const formData = new FormData();
    formData.append('taskId', taskId);
    if (dueDate) formData.append('dueDate', dueDate);
    await fetch('?/updateDueDate', { method: 'POST', body: formData });
    await invalidateAll();
  }

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
    if (!editingCategoryId || !editCategoryName.trim()) return;
    const formData = new FormData();
    formData.append('categoryId', editingCategoryId);
    formData.append('name', editCategoryName.trim());
    formData.append('icon', editCategoryIcon);
    await fetch('?/updateCategory', { method: 'POST', body: formData });
    editingCategoryId = null;
    await invalidateAll();
  }

  async function handleDeleteBox(categoryId: string) {
    if (!confirm('¿Eliminar esta caja? Las tareas que contenga no se borrarán, pasarán a General.')) return;
    const formData = new FormData();
    formData.append('categoryId', categoryId);
    await fetch('?/deleteCategory', { method: 'POST', body: formData });
    await invalidateAll();
  }

  async function handleMoveTaskCategory(taskId: string, categoryId: string | null) {
    const formData = new FormData();
    formData.append('taskId', taskId);
    if (categoryId) formData.append('categoryId', categoryId);
    await fetch('?/setTaskCategory', { method: 'POST', body: formData });
    await invalidateAll();
  }
</script>

<div class="h-full w-full flex flex-col relative z-10 pt-4 pb-28">
  <header class="mb-6 px-1 flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="text-3xl">🎯</span> Tareas
      </h2>
    </div>

    <div class="flex items-center gap-2">
      {#if showTaskCategories && data.user?.isAdmin}
        <button 
          type="button" 
          onclick={() => showCategoryManagerModal = true}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-accent-cyan rounded-xl text-xs font-bold border border-accent-cyan/30 shadow-glass transition-all"
          title="Organizar cajas de tareas"
        >
          <PackagePlus size={15} />
          <span class="hidden sm:inline">{data.categories && data.categories.length > 0 ? 'Cajas' : '+ Cajas'}</span>
        </button>

        <a 
          href="/settings" 
          class="p-2 bg-navy-surface hover:bg-white/10 text-gray-400 hover:text-accent-cyan rounded-xl transition-all border border-white/5 shadow-glass"
          title="Ajustes de este espacio"
        >
          <Settings size={16} />
        </a>
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

  <!-- Pestañas (solo si la cuarentena está activa) -->
  {#if showQuarantine}
    <div class="flex gap-1.5 p-1.5 bg-navy-surface rounded-2xl border border-white/5 mb-6 shadow-glass">
      <button 
        onclick={() => activeTab = 'today'}
        class="flex-1 py-2 text-xs font-bold rounded-xl transition-all {activeTab === 'today' ? 'bg-accent-cyan text-navy-bg shadow-sm' : 'text-gray-400 hover:text-white'}"
      >
        Para Hoy
      </button>
      <button 
        onclick={() => activeTab = 'quarantine'}
        class="flex-1 py-2 text-xs font-bold rounded-xl transition-all relative {activeTab === 'quarantine' ? 'bg-accent-cyan text-navy-bg shadow-sm' : 'text-gray-400 hover:text-white'}"
      >
        En Cuarentena
        {#if data.quarantine.length > 0}
          <span class="absolute top-1 right-2 w-2 h-2 bg-accent-orange rounded-full animate-pulse"></span>
        {/if}
      </button>
    </div>
  {/if}

  <div class="flex-1 overflow-y-auto pr-1">
    {#if activeTab === 'today'}
      <!-- SECCIÓN: TAREAS DE HOY -->
      {#if data.tasks.length === 0}
        <div class="h-full flex flex-col items-center justify-center text-center px-4 fade-in">
          <div class="w-24 h-24 mb-6 rounded-full bg-navy-surface border border-white/5 flex items-center justify-center">
            <CheckCircle2 size={48} class="text-accent-cyan opacity-80" />
          </div>
          <h3 class="text-xl font-bold text-gray-200 mb-2">¡Todo limpio por aquí!</h3>
          <p class="text-gray-400 text-sm max-w-[250px] leading-relaxed">No hay tareas planificadas para hoy. Busca en el catálogo para añadir una.</p>
        </div>
      {:else if showTaskCategories && data.categories && data.categories.length > 0}
        <!-- VISTA VERTICAL DIVIDIDA EN CAJAS -->
        {#each data.categories as cat}
          {@const catTasks = data.tasks.filter(t => t.categoryId === cat.id)}
          {@const isCollapsed = collapsedBoxes[cat.id]}
          <div class="mb-5 bg-navy-surface/50 border border-white/10 rounded-2xl p-4 shadow-glass transition-all fade-in">
            <!-- Cabecera de la Caja -->
            <div class="flex items-center justify-between gap-2 {isCollapsed && catTasks.length === 0 ? '' : 'mb-3'}">
              <div class="flex items-center gap-2.5 min-w-0">
                <span class="text-2xl shrink-0">{cat.icon || '📦'}</span>
                <div class="min-w-0">
                  <h3 class="font-bold text-white text-base truncate flex items-center gap-2">
                    <span>{cat.name}</span>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-accent-cyan shrink-0">
                      {catTasks.length}
                    </span>
                  </h3>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <a 
                  href="/tasks/new?categoryId={cat.id}" 
                  class="flex items-center gap-1 px-2.5 py-1.5 bg-accent-cyan/10 hover:bg-accent-cyan hover:text-navy-bg text-accent-cyan text-xs font-bold rounded-xl transition-all border border-accent-cyan/30"
                  title="Añadir tarea a esta caja"
                >
                  <Plus size={14} />
                  <span class="hidden xs:inline">Tarea</span>
                </a>

                <button 
                  type="button" 
                  onclick={() => toggleCollapse(cat.id)}
                  class="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  title={isCollapsed ? "Expandir caja" : "Plegar caja"}
                >
                  {#if isCollapsed}
                    <ChevronDown size={18} />
                  {:else}
                    <ChevronUp size={18} />
                  {/if}
                </button>
              </div>
            </div>

            <!-- Tareas de la Caja -->
            {#if !isCollapsed}
              {#if catTasks.length > 0}
                <div class="space-y-3 mt-3">
                  {#each catTasks as task}
                    <TaskCard 
                      {task} 
                      currentUserId={data.userId}
                      houseMembers={data.houseMembers}
                      categories={data.categories}
                      {showPoints}
                      {showDueDates}
                      {showTaskCategories}
                      onUpdateDueDate={handleUpdateDueDate}
                      onMoveCategory={handleMoveTaskCategory}
                      onClaim={() => handleClaim(task.id)} 
                      onJoin={() => handleJoin(task.id)}
                      onUnclaim={() => handleUnclaim(task.id, data.userId)} 
                      onToggleAssignee={handleToggleAssignee}
                      onComplete={() => handleComplete(task.id)} 
                      onRemove={() => handleDelete(task.id)} 
                    />
                  {/each}
                </div>
              {:else}
                <div class="py-4 text-center text-gray-500 text-xs flex items-center justify-center gap-2 border border-dashed border-white/5 rounded-xl mt-2">
                  <span>Sin tareas pendientes</span>
                  <span>·</span>
                  <a href="/tasks/new?categoryId={cat.id}" class="text-accent-cyan hover:underline font-bold">
                    + Añadir
                  </a>
                </div>
              {/if}
            {/if}
          </div>
        {/each}

        <!-- Tareas sin caja asignada (si las hay) -->
        {@const unclassifiedTasks = data.tasks.filter(t => !t.categoryId)}
        {#if unclassifiedTasks.length > 0}
          {@const isCollapsed = collapsedBoxes['unclassified']}
          <div class="mb-5 bg-navy-surface/30 border border-white/5 rounded-2xl p-4 shadow-glass transition-all fade-in">
            <div class="flex items-center justify-between gap-2 {isCollapsed ? '' : 'mb-3'}">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl shrink-0">📋</span>
                <h3 class="font-bold text-gray-300 text-base flex items-center gap-2">
                  <span>General / Sin clasificar</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                    {unclassifiedTasks.length}
                  </span>
                </h3>
              </div>

              <div class="flex items-center gap-1.5">
                <a 
                  href="/tasks/new" 
                  class="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl transition-all border border-white/10"
                >
                  <Plus size={14} />
                  <span class="hidden xs:inline">Tarea</span>
                </a>
                <button 
                  type="button" 
                  onclick={() => toggleCollapse('unclassified')}
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
              <div class="space-y-3 mt-3">
                {#each unclassifiedTasks as task}
                  <TaskCard 
                    {task} 
                    currentUserId={data.userId}
                    houseMembers={data.houseMembers}
                    categories={data.categories}
                    {showPoints}
                    {showDueDates}
                    onUpdateDueDate={handleUpdateDueDate}
                    onMoveCategory={handleMoveTaskCategory}
                    onClaim={() => handleClaim(task.id)} 
                    onJoin={() => handleJoin(task.id)}
                    onUnclaim={() => handleUnclaim(task.id, data.userId)} 
                    onToggleAssignee={handleToggleAssignee}
                    onComplete={() => handleComplete(task.id)} 
                    onRemove={() => handleDelete(task.id)} 
                  />
                {/each}
              </div>
            {/if}
          </div>
        {/if}

      {:else}
        <!-- MODO CLÁSICO (SIN CAJAS CREADAS O CAJAS DESACTIVADAS) -->
        {#if showTaskCategories && data.user?.isAdmin}
          <div class="mb-6 p-4 rounded-2xl bg-gradient-to-r from-accent-cyan/10 to-indigo-500/10 border border-accent-cyan/20 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-3xl">📦</span>
              <div>
                <h4 class="text-sm font-bold text-white">Divide tus tareas en Cajas</h4>
                <p class="text-xs text-gray-400">Crea secciones como "En casa", "Compras", "Equipaje" para organizar mejor este espacio.</p>
              </div>
            </div>
            <button 
              type="button"
              onclick={() => showCategoryManagerModal = true}
              class="px-3 py-2 bg-accent-cyan text-navy-bg font-bold text-xs rounded-xl hover:bg-cyan-300 transition-all shrink-0 shadow-glow"
            >
              + Crear Cajas
            </button>
          </div>
        {/if}

        <!-- Tareas Mías (Individuales o en equipo) -->
        {#if myTasks.length > 0}
          <div class="mb-6 fade-in">
            <h3 class="text-[10px] font-bold text-accent-cyan uppercase tracking-wider flex items-center gap-1 mb-3 ml-1">
              <ListTodo size={12} /> Mis Tareas ({myTasks.length})
            </h3>
            <div class="space-y-3">
              {#each myTasks as task}
                <TaskCard 
                  {task} 
                  currentUserId={data.userId}
                  houseMembers={data.houseMembers}
                  categories={data.categories}
                  {showPoints}
                  {showDueDates}
                  onUpdateDueDate={handleUpdateDueDate}
                  onMoveCategory={handleMoveTaskCategory}
                  onClaim={() => handleClaim(task.id)} 
                  onJoin={() => handleJoin(task.id)}
                  onUnclaim={() => handleUnclaim(task.id, data.userId)} 
                  onToggleAssignee={handleToggleAssignee}
                  onComplete={() => handleComplete(task.id)} 
                  onRemove={() => handleDelete(task.id)} 
                />
              {/each}
            </div>
          </div>
        {/if}

        <!-- Tareas en marcha de otros (puedes sumarte) -->
        {#if teamTasks.length > 0}
          <div class="mb-6 fade-in">
            <h3 class="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1 mb-3 ml-1">
              <Users size={12} /> Tareas en marcha ({teamTasks.length}) · ¡Súmate al equipo!
            </h3>
            <div class="space-y-3">
              {#each teamTasks as task}
                <TaskCard 
                  {task} 
                  currentUserId={data.userId}
                  houseMembers={data.houseMembers}
                  categories={data.categories}
                  {showPoints}
                  {showDueDates}
                  onUpdateDueDate={handleUpdateDueDate}
                  onMoveCategory={handleMoveTaskCategory}
                  onClaim={() => handleClaim(task.id)} 
                  onJoin={() => handleJoin(task.id)}
                  onUnclaim={() => handleUnclaim(task.id, data.userId)} 
                  onToggleAssignee={handleToggleAssignee}
                  onComplete={() => handleComplete(task.id)} 
                  onRemove={() => handleDelete(task.id)} 
                />
              {/each}
            </div>
          </div>
        {/if}

        <!-- Tareas sin asignar -->
        {#if unassignedTasks.length > 0}
          <div class="mb-6 fade-in">
            <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-3 ml-1">
              <ListTodo size={12} /> Para hacer (Sin dueño) ({unassignedTasks.length})
            </h3>
            <div class="space-y-3">
              {#each unassignedTasks as task}
                <TaskCard 
                  {task} 
                  currentUserId={data.userId}
                  houseMembers={data.houseMembers}
                  categories={data.categories}
                  {showPoints}
                  {showDueDates}
                  onUpdateDueDate={handleUpdateDueDate}
                  onMoveCategory={handleMoveTaskCategory}
                  onClaim={() => handleClaim(task.id)} 
                  onJoin={() => handleJoin(task.id)}
                  onUnclaim={() => handleUnclaim(task.id, data.userId)} 
                  onToggleAssignee={handleToggleAssignee}
                  onComplete={() => handleComplete(task.id)} 
                  onRemove={() => handleDelete(task.id)} 
                />
              {/each}
            </div>
          </div>
        {/if}
      {/if}
    
    {:else}
      <!-- SECCIÓN: CUARENTENA -->
      <div class="fade-in">
        <p class="text-xs text-gray-400 mb-4 ml-1">Estas tareas han sido creadas en las últimas 24h. Revísalas para evitar trampas.</p>
        
        {#if data.quarantine.length === 0}
          <div class="text-center py-12 text-gray-500">No hay tareas en cuarentena.</div>
        {:else}
          <div class="space-y-3">
            {#each data.quarantine as template}
              <div class="bg-navy-surface p-4 rounded-2xl border border-accent-orange/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                <div class="flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} class="text-accent-orange" />
                  <h4 class="font-bold text-gray-100">{template.title}</h4>
                </div>
                <div class="flex justify-between items-end">
                  <div>
                    <p class="text-xs text-accent-cyan font-bold mb-1">{template.basePoints} pts</p>
                    <p class="text-[10px] text-gray-500">Aprobaciones: {template.approvalsCount} / {template.houseMemberCount}</p>
                  </div>
                  
                  <div class="flex gap-2">
                    <button 
                      onclick={() => handleReject(template.id)}
                      class="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/30"
                      title="Rechazar (Eliminar)"
                    >
                      <ThumbsDown size={18} />
                    </button>
                    {#if !template.hasVoted}
                      <button 
                        onclick={() => handleApprove(template.id)}
                        class="p-2 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-colors border border-green-500/30"
                        title="Visto Bueno"
                      >
                        <ThumbsUp size={18} />
                      </button>
                    {:else}
                      <div class="p-2 rounded-xl bg-green-500/20 text-green-500 border border-green-500/30 flex items-center justify-center opacity-50 cursor-not-allowed">
                        <ThumbsUp size={18} />
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Botón Flotante Nueva Tarea -->
  <div class="fixed bottom-[calc(env(safe-area-inset-bottom,16px)+5.5rem)] left-0 w-full flex justify-center pointer-events-none z-40">
    <div class="w-full max-w-md relative flex justify-end px-6">
      <a 
        href="/tasks/new" 
        class="w-14 h-14 bg-accent-cyan text-navy-bg rounded-full flex items-center justify-center shadow-glow pointer-events-auto hover:opacity-90 transition-all hover:scale-105 active:scale-95"
        aria-label="Añadir Tarea"
        title="Añadir Tarea"
      >
        <Plus size={28} strokeWidth={2.5} />
      </a>
    </div>
  </div>
</div>

<!-- Modal para Administrar Cajas de Tareas -->
{#if showCategoryManagerModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in" onclick={() => showCategoryManagerModal = false}>
    <div class="bg-navy-bg border border-white/15 w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden" onclick={(e) => e.stopPropagation()}>
      
      <!-- Cabecera Fija -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0 bg-navy-surface/40">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <span>📦</span> Organizar Cajas de Tareas
        </h3>
        <button type="button" onclick={() => showCategoryManagerModal = false} class="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors">
          <X size={20} />
        </button>
      </div>

      <!-- Contenido scrolleable completo -->
      <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
        <p class="text-xs text-gray-400 leading-relaxed">
          Las cajas dividen la lista de tareas en secciones temáticas (ej: <em>En casa</em>, <em>Compras</em>, <em>Equipaje</em>, <em>Campamento</em>).
        </p>

        <!-- Formulario para Crear Nueva Caja -->
        <form onsubmit={handleCreateBox} class="space-y-3.5 bg-navy-surface/60 p-4 rounded-2xl border border-white/5 shadow-inner">
          <h4 class="text-xs font-bold text-accent-cyan uppercase tracking-wider flex items-center gap-1.5">
            <Plus size={14} /> Nueva Caja
          </h4>
          
          <div class="space-y-1">
            <label class="text-[11px] text-gray-400">Nombre de la caja</label>
            <input 
              type="text" 
              bind:value={newCategoryName} 
              placeholder="Ej: En casa, Compras, Equipaje..." 
              class="w-full px-3.5 py-2.5 rounded-xl bg-navy-bg border border-white/10 text-white text-sm outline-none focus:border-accent-cyan"
              required
            />
          </div>

          <div class="space-y-1.5">
            <label class="text-[11px] text-gray-400">Elige un emoji</label>
            <div class="flex flex-wrap gap-1.5">
              {#each popularEmojis as em}
                <button 
                  type="button" 
                  onclick={() => newCategoryIcon = em}
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-base border transition-all {newCategoryIcon === em ? 'bg-accent-cyan/20 border-accent-cyan scale-110 shadow-sm' : 'bg-navy-bg border-white/5 hover:bg-white/5'}"
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
            <Plus size={15} /> Crear Caja
          </button>
        </form>

        <!-- Lista de Cajas Existentes -->
        {#if data.categories && data.categories.length > 0}
          <div class="space-y-2.5 pt-1 pb-8">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold text-gray-300 uppercase tracking-wider">Cajas actuales ({data.categories.length})</h4>
              <span class="text-[11px] text-gray-400">Desplaza abajo para ver todas</span>
            </div>
            <div class="space-y-2">
              {#each data.categories as cat}
                <div class="flex items-center justify-between p-3.5 rounded-2xl bg-navy-surface border border-white/5 shadow-glass">
                  {#if editingCategoryId === cat.id}
                    <form onsubmit={handleUpdateBox} class="flex items-center gap-2 flex-1">
                      <input type="text" bind:value={editCategoryIcon} class="w-10 px-1 py-1.5 text-center bg-navy-bg border border-white/10 rounded-lg text-sm" />
                      <input type="text" bind:value={editCategoryName} class="flex-1 px-3 py-1.5 bg-navy-bg border border-white/10 rounded-lg text-sm text-white" required />
                      <button type="submit" class="p-2 text-accent-cyan hover:bg-accent-cyan/10 rounded-lg">
                        <Check size={16} />
                      </button>
                      <button type="button" onclick={() => editingCategoryId = null} class="p-2 text-gray-400 hover:bg-white/5 rounded-lg">
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
                        onclick={() => { editingCategoryId = cat.id; editCategoryName = cat.name; editCategoryIcon = cat.icon || '📦'; }}
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
  </div>
{/if}
