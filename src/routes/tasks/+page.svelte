<script lang="ts">
  import { ListTodo, CheckCircle2, Search, AlertTriangle, ThumbsUp, ThumbsDown } from '@lucide/svelte';
  import TaskCard from '$lib/components/TaskCard.svelte';
  import { invalidateAll } from '$app/navigation';
  import confetti from 'canvas-confetti';
  
  let { data } = $props();

  let activeTab = $state<'today' | 'quarantine'>('today');

  let myTasks = $derived(data.tasks.filter(t => t.assignedToId === data.userId));
  let unassignedTasks = $derived(data.tasks.filter(t => !t.assignedToId));

  async function handleClaim(id: string) {
    const formData = new FormData();
    formData.append('taskId', id);
    fetch('?/claim', { method: 'POST', body: formData }).then(() => {
      invalidateAll();
    });
  }

  function handleUnclaim(id: string) {
    const formData = new FormData();
    formData.append('taskId', id);
    fetch('?/unclaim', { method: 'POST', body: formData }).then(() => {
      invalidateAll();
    });
  }

  async function handleComplete(taskId: string) {
    const formData = new FormData();
    formData.append('taskId', taskId);
    const res = await fetch('?/complete', { method: 'POST', body: formData });
    const result = await res.json();
    
    // Si la tarea es verificada salta confeti, sino mostramos alerta
    if (result.data) {
      const isVerified = JSON.parse(result.data).find((d: any) => d && d.isVerified !== undefined)?.isVerified;
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
</script>

<div class="h-full w-full flex flex-col relative z-10 pt-4 pb-24">
  <header class="mb-6 px-1 flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="text-3xl">🎯</span> Tareas
      </h2>
    </div>

    <a 
      href="/houses" 
      class="flex items-center gap-1.5 px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-white/5 shadow-glass transition-all"
      title="Cambiar de casa"
    >
      <span>🏡</span>
      <span class="max-w-[120px] truncate">{data.houseName || 'Mis Casas'}</span>
    </a>
  </header>

  <!-- Pestañas -->
  <div class="flex gap-2 p-1 bg-navy-surface rounded-xl border border-white/5 mb-6">
    <button 
      onclick={() => activeTab = 'today'}
      class="flex-1 py-2 text-sm font-bold rounded-lg transition-all {activeTab === 'today' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}"
    >
      Para Hoy
    </button>
    <button 
      onclick={() => activeTab = 'quarantine'}
      class="flex-1 py-2 text-sm font-bold rounded-lg transition-all relative {activeTab === 'quarantine' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}"
    >
      En Cuarentena
      {#if data.quarantine.length > 0}
        <span class="absolute top-1 right-2 w-2 h-2 bg-accent-orange rounded-full animate-pulse"></span>
      {/if}
    </button>
  </div>

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
      {:else}
        <!-- Tareas sin asignar -->
        {#if unassignedTasks.length > 0}
          <div class="mb-6 fade-in">
            <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-3 ml-1">
              <ListTodo size={12} /> Para hacer (Sin dueño)
            </h3>
            <div class="space-y-3">
              {#each unassignedTasks as task}
                <TaskCard {task} onClaim={() => handleClaim(task.id)} onComplete={() => handleComplete(task.id)} onRemove={() => handleDelete(task.id)} />
              {/each}
            </div>
          </div>
        {/if}

        <!-- Tareas Mías -->
        {#if myTasks.length > 0}
          <div class="mb-6 fade-in">
            <h3 class="text-[10px] font-bold text-accent-cyan uppercase tracking-wider flex items-center gap-1 mb-3 ml-1">
              <ListTodo size={12} /> Mis Tareas
            </h3>
            <div class="space-y-3">
              {#each myTasks as task}
                <TaskCard {task} onClaim={() => handleClaim(task.id)} onUnclaim={() => handleUnclaim(task.id)} onComplete={() => handleComplete(task.id)} onRemove={() => handleDelete(task.id)} />
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
  <div class="fixed bottom-24 left-0 w-full flex justify-center pointer-events-none z-50">
    <div class="w-full max-w-md relative h-0">
      <a 
        href="/tasks/new" 
        class="absolute right-6 -top-6 w-14 h-14 bg-accent-cyan text-navy-bg rounded-2xl flex items-center justify-center shadow-glow pointer-events-auto hover:bg-cyan-300 transition-all hover:scale-110 active:scale-95"
        aria-label="Buscar en Catálogo"
      >
        <Search size={24} strokeWidth={2.5} />
      </a>
    </div>
  </div>
</div>
