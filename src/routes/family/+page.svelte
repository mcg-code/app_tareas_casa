<script lang="ts">
  import { Trophy, Flame, ChevronDown, ListTodo, Gift, Home } from '@lucide/svelte';
  import { slide } from 'svelte/transition';
  
  let { data } = $props();
  
  let expandedMember = $state<string | null>(null);

  function toggleExpand(id: string) {
    expandedMember = expandedMember === id ? null : id;
  }
</script>

<div class="space-y-6 pb-6 fade-in h-full">
  <header>
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="text-3xl">👨‍👩‍👧‍👦</span> Familia
      </h2>

      <a 
        href="/houses" 
        class="flex items-center gap-1.5 px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-accent-cyan rounded-xl text-xs font-bold border border-white/5 shadow-glass transition-all"
      >
        <Home size={14} /> Mis Casas
      </a>
    </div>

    <div class="mt-4 p-3 bg-accent-cyan/10 border border-accent-cyan/30 rounded-xl text-center">
      <p class="text-xs text-gray-300">Código de la casa para invitar a otros:</p>
      <p class="text-lg font-mono font-bold text-accent-cyan mt-1">{data.user?.houseCode || 'Código Oculto'}</p>
    </div>
  </header>

  <div class="space-y-3">
    {#each data.members as member, i}
      <div class="bg-navy-surface rounded-2xl border {expandedMember === member.id ? 'border-accent-cyan/30' : 'border-white/5'} overflow-hidden transition-colors">
        
        <button 
          onclick={() => toggleExpand(member.id)}
          class="w-full p-4 flex items-center justify-between group"
        >
          <div class="flex items-center gap-4">
            <div class="relative">
              <div class="w-12 h-12 bg-navy-bg rounded-xl flex items-center justify-center text-2xl border border-white/5 shadow-inner">
                {member.emoji || '👤'}
              </div>
              {#if i === 0}
                <div class="absolute -top-2 -right-2 text-xl filter drop-shadow-md">👑</div>
              {/if}
            </div>
            
            <div class="text-left">
              <h3 class="font-bold text-gray-100 flex items-center gap-2">
                {member.name || 'Alguien'}
                <span class="text-[10px] {member.currentStreak ? 'bg-accent-orange/20 text-accent-orange' : 'bg-white/5 text-gray-500'} px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Días seguidos cumpliendo tareas">
                  <Flame size={10} class={member.currentStreak ? '' : 'opacity-50'} /> {member.currentStreak || 0}
                </span>
              </h3>
              <p class="text-xs text-accent-cyan font-bold flex items-center gap-1 mt-0.5">
                <Trophy size={12} /> {member.points} pts
              </p>
            </div>
          </div>
          
          <div class="text-gray-500 transition-transform duration-300 {expandedMember === member.id ? 'rotate-180 text-accent-cyan' : ''}">
            <ChevronDown size={20} />
          </div>
        </button>

        {#if expandedMember === member.id}
          <div transition:slide={{ duration: 200 }} class="px-4 pb-4 pt-2 border-t border-white/5 bg-navy-bg/30">
            <div class="grid grid-cols-2 gap-4">
              
              <div class="space-y-2">
                <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <ListTodo size={12} /> Sus tareas ({member.assignedTasksCount})
                </h4>
                {#if member.assignedTasks.length > 0}
                  <ul class="space-y-1">
                    {#each member.assignedTasks as t}
                      <li class="text-xs text-gray-300 truncate bg-navy-surface px-2 py-1 rounded-md border border-white/5">{t}</li>
                    {/each}
                  </ul>
                {:else}
                  <p class="text-xs text-gray-500 italic">No tiene tareas</p>
                {/if}
              </div>

              <div class="space-y-2">
                <h4 class="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Gift size={12} /> Últimos caprichos
                </h4>
                {#if member.redeemedRewards.length > 0}
                  <ul class="space-y-1">
                    {#each member.redeemedRewards as r}
                      <li class="text-xs text-accent-orange truncate bg-accent-orange/10 px-2 py-1 rounded-md border border-accent-orange/20">{r}</li>
                    {/each}
                  </ul>
                {:else}
                  <p class="text-xs text-gray-500 italic">Ninguno aún</p>
                {/if}
              </div>
              
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
