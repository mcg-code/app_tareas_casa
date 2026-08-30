<script lang="ts">
  import { Trophy, CheckCircle, ArrowRight, Trash2 } from '@lucide/svelte';
  
  let { task, onComplete, onPass, onClaim, onUnclaim, onRemove } = $props<{
    task: { id: string, title: string, basePoints: number, status: string, assignedToId?: string | null, templateCreatedAt?: Date | null },
    onComplete: (id: string) => void,
    onPass?: (id: string) => void,
    onClaim: (id: string) => void,
    onUnclaim?: (id: string) => void,
    onRemove?: (id: string) => void
  }>();

  let swipeOffset = $state(0);
  let startX = 0;
  let isDragging = false;
  
  const THRESHOLD = 100;

  let isVerified = $derived(
    task.templateCreatedAt 
      ? new Date().getTime() - new Date(task.templateCreatedAt).getTime() > 24 * 60 * 60 * 1000
      : true
  );

  function handlePointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return;
    if (task.assignedToId !== null && task.assignedToId !== undefined) {
      // Solo puedes completarla si es tuya o está asignada
      startX = e.clientX;
      isDragging = true;
      e.currentTarget?.setPointerCapture(e.pointerId);
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
    e.currentTarget?.releasePointerCapture(e.pointerId);

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
    class="relative z-10 flex items-center justify-between p-5 bg-navy-surface rounded-2xl touch-none select-none cursor-grab active:cursor-grabbing"
    style="transform: translateX({swipeOffset}px); transition: {isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
  >
    <div class="flex flex-col gap-1 flex-1">
      <span class="text-lg font-medium text-gray-100 leading-tight flex items-center gap-2">
        {task.title}
        {#if !isVerified}
          <span class="text-[10px] bg-accent-orange/20 text-accent-orange px-1.5 py-0.5 rounded flex items-center gap-0.5" title="En cuarentena. Los puntos se congelarán.">
            ⏳
          </span>
        {/if}
      </span>
      <div class="flex items-center gap-1.5 text-accent-cyan font-bold whitespace-nowrap mt-1 text-sm">
        <Trophy size={14} />
        <span>{task.basePoints} pts</span>
      </div>
    </div>
    
    <div class="flex items-center gap-2 shrink-0">
      {#if !task.assignedToId}
        <button 
          onclick={(e) => { e.stopPropagation(); onClaim(task.id); }}
          class="px-3 py-2 bg-accent-cyan/10 hover:bg-accent-cyan text-accent-cyan hover:text-navy-bg rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-accent-cyan/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
        >
          ¡Me la pido!
        </button>
      {:else if onUnclaim}
        <button 
          onclick={(e) => { e.stopPropagation(); onUnclaim(task.id); }}
          class="p-2 text-gray-400 hover:text-accent-orange hover:bg-accent-orange/10 rounded-xl transition-colors shrink-0"
          title="Soltar tarea"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline><line x1="9" y1="2" x2="15" y2="8"></line></svg>
        </button>
      {/if}
      {#if onRemove}
        <button 
          onclick={(e) => { e.stopPropagation(); onRemove(task.id); }}
          class="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
          title="Eliminar de hoy"
        >
          <Trash2 size={18} />
        </button>
      {/if}
    </div>
  </div>
</div>
