<script lang="ts">
  import { Trophy, Gift, ArrowRightLeft } from '@lucide/svelte';
  
  let { data } = $props();

  function formatTime(dateStr: Date | string | null) {
    if (!dateStr) return 'Hace poco';
    const date = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000); // mins
    if (diff < 1) return 'Ahora mismo';
    if (diff < 60) return `Hace ${diff} min`;
    if (diff < 1440) return `Hace ${Math.floor(diff/60)} h`;
    return `Hace ${Math.floor(diff/1440)} d`;
  }

  function parsePoints(description: string, actionType: string) {
    const match = description.match(/([+-]\d+)\s*pts/);
    return match ? match[1] : (actionType === 'COMPLETED_TASK' ? '+?' : '-?');
  }

  function parseText(description: string) {
    return description.replace(/\s*\([+-]\d+\s*pts\)/, '');
  }
</script>

<div class="space-y-6 pb-6 fade-in h-full">
  <header>
    <h2 class="text-2xl font-bold flex items-center gap-2">
      <span class="text-3xl">📜</span> Actividad
    </h2>
  </header>

  <div class="space-y-4 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
    
    {#if data.activities.length === 0}
      <div class="text-center py-12 text-gray-400 font-medium">Aún no hay actividad en la casa.</div>
    {/if}

    {#each data.activities as item}
      <div class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
        <!-- Icono central del Timeline -->
        <div class="flex items-center justify-center w-12 h-12 rounded-full border-4 border-navy-bg bg-navy-surface shadow-glass z-10 text-xl flex-shrink-0">
          {item.emoji || '👤'}
        </div>
        
        <!-- Tarjeta de Contenido -->
        <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-navy-surface border border-white/5 shadow-glass ml-4 md:ml-0">
          <div class="flex justify-between items-start mb-1">
            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{formatTime(item.createdAt)}</span>
            {#if item.actionType === 'COMPLETED_TASK'}
              <span class="text-xs font-bold text-accent-cyan flex items-center gap-1"><Trophy size={12} /> {parsePoints(item.description, item.actionType)}</span>
            {:else if item.actionType === 'BOUGHT_REWARD'}
              <span class="text-xs font-bold text-accent-orange flex items-center gap-1"><Gift size={12} /> {parsePoints(item.description, item.actionType)}</span>
            {:else}
              <span class="text-xs font-bold text-gray-500 flex items-center gap-1"><ArrowRightLeft size={12} /></span>
            {/if}
          </div>
          <p class="text-sm text-gray-300">
            <span class="font-bold text-white">{item.userName || 'Alguien'}</span> {parseText(item.description)}
          </p>
        </div>
      </div>
    {/each}

  </div>
</div>

<style>
  .fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
