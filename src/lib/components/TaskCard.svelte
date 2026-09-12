<script lang="ts">
  import { Trophy, CheckCircle, ArrowRight, Trash2, Users, UserPlus, Check, X, LogOut } from '@lucide/svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  
  type Member = { id: string, name: string, emoji: string, avatarUrl?: string | null };

  let { 
    task, 
    currentUserId,
    houseMembers = [],
    onComplete, 
    onPass, 
    onClaim, 
    onJoin,
    onUnclaim, 
    onToggleAssignee,
    onRemove 
  } = $props<{
    task: { 
      id: string, 
      title: string, 
      basePoints: number, 
      status: string, 
      assignedToId?: string | null, 
      assignees?: Member[],
      templateCreatedAt?: Date | null 
    },
    currentUserId?: string,
    houseMembers?: Member[],
    onComplete: (id: string) => void,
    onPass?: (id: string) => void,
    onClaim: (id: string) => void,
    onJoin?: (id: string) => void,
    onUnclaim?: (id: string, memberId?: string) => void,
    onToggleAssignee?: (taskId: string, memberId: string) => void,
    onRemove?: (id: string) => void
  }>();

  let swipeOffset = $state(0);
  let startX = 0;
  let isDragging = $state(false);
  let showTeamModal = $state(false);
  
  const THRESHOLD = 100;

  let effectiveAssignees: Member[] = $derived(
    task.assignees && task.assignees.length > 0 
      ? task.assignees 
      : (task.assignedToId ? houseMembers.filter((m: Member) => m.id === task.assignedToId) : [])
  );

  let isAssignedToMe = $derived(
    currentUserId ? effectiveAssignees.some((a: Member) => a.id === currentUserId) : !!task.assignedToId
  );

  let assigneeCount = $derived(effectiveAssignees.length);

  let pointsPerPerson = $derived(
    assigneeCount > 1 ? Math.max(1, Math.round(task.basePoints / assigneeCount)) : task.basePoints
  );

  let isVerified = $derived(
    task.templateCreatedAt 
      ? new Date().getTime() - new Date(task.templateCreatedAt).getTime() > 24 * 60 * 60 * 1000
      : true
  );

  function handlePointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    if (isAssignedToMe) {
      // Solo puedes completarla si es tuya o estás asignado
      startX = e.clientX;
      isDragging = true;
      (e.currentTarget as HTMLElement)?.setPointerCapture(e.pointerId);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const currentX = e.clientX;
    swipeOffset = currentX - startX;
    if (swipeOffset > 150) swipeOffset = 150;
    if (swipeOffset < -150) swipeOffset = -150;
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    (e.currentTarget as HTMLElement)?.releasePointerCapture(e.pointerId);

    if (swipeOffset > THRESHOLD) {
      setTimeout(() => onComplete(task.id), 300);
    } else if (onPass && swipeOffset < -THRESHOLD) {
      onPass(task.id);
    } else {
      swipeOffset = 0;
    }
  }
</script>

<div class="relative w-full overflow-hidden rounded-2xl mb-3 shadow-glass bg-navy-surface border border-white/5">
  <div class="absolute inset-0 flex items-center justify-between px-6 z-0">
    <div class="flex items-center gap-2 text-green-400 opacity-{swipeOffset > 0 ? '100' : '0'} transition-opacity">
      <CheckCircle size={24} />
      <span class="font-bold">¡Hecho!</span>
    </div>
    {#if onPass}
      <div class="flex items-center gap-2 text-gray-400 opacity-{swipeOffset < 0 ? '100' : '0'} transition-opacity">
        <span class="font-bold">Pasar</span>
        <ArrowRight size={24} />
      </div>
    {/if}
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
    class="relative z-10 flex items-center justify-between p-5 bg-navy-surface rounded-2xl touch-none select-none {isAssignedToMe ? 'cursor-grab active:cursor-grabbing' : ''}"
    style="transform: translateX({swipeOffset}px); transition: {isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
  >
    <div class="flex flex-col gap-1.5 flex-1 min-w-0 mr-3">
      <span class="text-lg font-medium text-gray-100 leading-tight flex items-center gap-2 flex-wrap">
        <span class="truncate">{task.title}</span>
        {#if !isVerified}
          <span class="text-[10px] bg-accent-orange/20 text-accent-orange px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0" title="En cuarentena. Los puntos se congelarán.">
            ⏳
          </span>
        {/if}
      </span>

      <!-- Puntos y desglose por persona -->
      <div class="flex items-center flex-wrap gap-2 text-sm">
        <div class="flex items-center gap-1.5 text-accent-cyan font-bold whitespace-nowrap">
          <Trophy size={14} />
          <span>{task.basePoints} pts</span>
        </div>

        {#if assigneeCount > 1}
          <span class="text-xs text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap">
            <Users size={11} /> {pointsPerPerson} pts c/u
          </span>
        {/if}

        <!-- Emojis y fotos de participantes -->
        {#if assigneeCount > 0}
          <div class="flex items-center -space-x-1.5 ml-1" title={effectiveAssignees.map((a: Member) => a.name).join(', ')}>
            {#each effectiveAssignees as member}
              <Avatar src={member.avatarUrl} emoji={member.emoji || '👤'} size="xs" alt={member.name} class="ring-1 ring-navy-bg" />
            {/each}
          </div>
        {/if}
      </div>
    </div>
    
    <div class="flex items-center gap-1.5 shrink-0">
      {#if !isAssignedToMe && assigneeCount === 0}
        <!-- Tarea sin dueño -->
        <button 
          onclick={(e) => { e.stopPropagation(); onClaim(task.id); }}
          class="px-3 py-2 bg-accent-cyan/10 hover:bg-accent-cyan text-accent-cyan hover:text-navy-bg rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-accent-cyan/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
        >
          ¡Me la pido!
        </button>
        {#if onToggleAssignee}
          <button 
            type="button"
            onclick={(e) => { e.stopPropagation(); showTeamModal = true; }}
            class="p-2 text-gray-400 hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-xl transition-colors border border-white/5"
            title="Asignar en equipo"
          >
            <Users size={16} />
          </button>
        {/if}
      {:else if !isAssignedToMe && assigneeCount > 0}
        <!-- Asignada a otros, puedo unirme -->
        <button 
          onclick={(e) => { e.stopPropagation(); if (onJoin) onJoin(task.id); else onClaim(task.id); }}
          class="px-3 py-2 bg-accent-cyan/15 hover:bg-accent-cyan text-accent-cyan hover:text-navy-bg rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-accent-cyan/40 shadow-glow-sm flex items-center gap-1"
        >
          <UserPlus size={14} /> ¡Me sumo!
        </button>
        {#if onToggleAssignee}
          <button 
            type="button"
            onclick={(e) => { e.stopPropagation(); showTeamModal = true; }}
            class="p-2 text-gray-400 hover:text-accent-cyan hover:bg-accent-cyan/10 rounded-xl transition-colors border border-white/5"
            title="Ver / gestionar equipo"
          >
            <Users size={16} />
          </button>
        {/if}
      {:else}
        <!-- Tarea asignada a mí (sólo o en equipo) -->
        {#if onToggleAssignee}
          <button 
            type="button"
            onclick={(e) => { e.stopPropagation(); showTeamModal = true; }}
            class="p-2 text-accent-cyan bg-accent-cyan/10 hover:bg-accent-cyan/20 rounded-xl transition-colors border border-accent-cyan/30 flex items-center gap-1 text-xs font-bold"
            title="Gestionar quién ayuda en esta tarea"
          >
            <Users size={15} />
            {#if assigneeCount > 1}
              <span>{assigneeCount}</span>
            {/if}
          </button>
        {/if}

        {#if onUnclaim}
          <button 
            onclick={(e) => { e.stopPropagation(); onUnclaim(task.id, currentUserId); }}
            class="p-2 text-gray-400 hover:text-accent-orange hover:bg-accent-orange/10 rounded-xl transition-colors shrink-0"
            title={assigneeCount > 1 ? "Salirme de la tarea" : "Soltar tarea"}
          >
            <LogOut size={16} />
          </button>
        {/if}
      {/if}

      {#if onRemove}
        <button 
          onclick={(e) => { e.stopPropagation(); onRemove(task.id); }}
          class="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          title="Eliminar de hoy"
        >
          <Trash2 size={16} />
        </button>
      {/if}
    </div>
  </div>
</div>

<!-- Modal selector de equipo / participantes -->
{#if showTeamModal}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-navy-surface border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-fade-in-up">
      <div class="flex justify-between items-center">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <Users size={18} class="text-accent-cyan" /> Tarea en Equipo
        </h3>
        <button 
          type="button"
          onclick={() => showTeamModal = false}
          class="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div>
        <p class="text-sm font-semibold text-gray-200">{task.title}</p>
        <p class="text-xs text-gray-400 mt-1">
          Marca quiénes participan. Los <strong class="text-accent-cyan font-bold">{task.basePoints} pts</strong> se reparten a partes iguales entre todos.
        </p>
      </div>

      <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
        {#each houseMembers as member}
          {@const isSelected = effectiveAssignees.some((a: Member) => a.id === member.id)}
          <button
            type="button"
            onclick={() => onToggleAssignee && onToggleAssignee(task.id, member.id)}
            class="w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left {isSelected ? 'bg-accent-cyan/15 border-accent-cyan/50 text-white shadow-glow-sm' : 'bg-navy-bg/60 border-white/5 text-gray-300 hover:bg-white/5'}"
          >
            <div class="flex items-center gap-3">
              <Avatar src={member.avatarUrl} emoji={member.emoji || '👤'} size="sm" />
              <span class="font-medium text-sm">{member.name}</span>
            </div>
            {#if isSelected}
              <div class="w-6 h-6 rounded-full bg-accent-cyan text-navy-bg flex items-center justify-center font-bold">
                <Check size={14} strokeWidth={3} />
              </div>
            {:else}
              <div class="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-gray-500">
                <UserPlus size={12} />
              </div>
            {/if}
          </button>
        {/each}
      </div>

      <div class="pt-3 border-t border-white/5 flex items-center justify-between">
        <div>
          <span class="text-xs text-gray-400 block">Puntos por persona:</span>
          <span class="text-sm font-bold text-accent-cyan">
            {#if assigneeCount > 0}
              {pointsPerPerson} pts c/u ({assigneeCount} pers.)
            {:else}
              Sin asignar (0)
            {/if}
          </span>
        </div>
        <button
          type="button"
          onclick={() => showTeamModal = false}
          class="px-5 py-2.5 bg-accent-cyan hover:bg-cyan-400 text-navy-bg font-bold text-xs rounded-xl transition-all shadow-glow"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
{/if}
