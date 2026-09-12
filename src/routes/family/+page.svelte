<script lang="ts">
  import { Trophy, Flame, ChevronDown, ListTodo, Gift, Home, Pencil, Check, Camera } from '@lucide/svelte';
  import { slide } from 'svelte/transition';
  import Avatar from '$lib/components/Avatar.svelte';
  import AvatarPicker from '$lib/components/AvatarPicker.svelte';
  
  let { data } = $props();
  
  let expandedMember = $state<string | null>(null);
  let isEditingHouseName = $state(false);
  let isEditingMyAvatar = $state(false);

  const currentMember = $derived(data.members.find(m => m.isCurrent));
  let myDisplayName = $state('');
  let myEmoji = $state('👤');
  let myAvatarUrl = $state('');

  function openEditMyAvatar() {
    if (currentMember) {
      myDisplayName = currentMember.displayName || currentMember.name || '';
      myEmoji = currentMember.emoji || '👤';
      myAvatarUrl = currentMember.avatarUrl || '';
    }
    isEditingMyAvatar = true;
  }

  function toggleExpand(id: string) {
    expandedMember = expandedMember === id ? null : id;
  }
</script>

<div class="space-y-6 pb-6 fade-in h-full">
  <header>
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <span class="text-3xl">👨‍👩‍👧‍👦</span> Familia
        </h2>
        
        <!-- Nombre de la casa con botón de editar -->
        <div class="flex items-center gap-2 mt-1">
          <span class="text-sm font-bold text-gray-200">{data.houseName || data.user?.houseName || 'Mi Casa'}</span>
          <button 
            onclick={() => isEditingHouseName = true}
            class="text-gray-500 hover:text-accent-cyan p-1 rounded-lg transition-colors"
            title="Cambiar nombre de la casa"
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick={openEditMyAvatar}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-accent-cyan rounded-xl text-xs font-bold border border-white/5 shadow-glass transition-all"
          title="Personalizar mi perfil (nombre y foto) para esta casa"
        >
          <Camera size={14} /> Mi Perfil
        </button>

        <a 
          href="/houses" 
          class="flex items-center gap-1.5 px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-white/5 shadow-glass transition-all"
        >
          <Home size={14} /> Casas
        </a>
      </div>
    </div>

    <div class="mt-4 p-3 bg-accent-cyan/10 border border-accent-cyan/30 rounded-xl text-center">
      <p class="text-xs text-gray-300">Código de la casa para invitar a otros:</p>
      <p class="text-lg font-mono font-bold text-accent-cyan mt-1">{data.user?.houseCode || 'Código Oculto'}</p>
    </div>
  </header>

  <!-- Modal editar nombre de casa -->
  {#if isEditingHouseName}
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-navy-surface border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <Pencil size={18} class="text-accent-cyan" /> Cambiar Nombre del Hogar
        </h3>

        <form method="POST" action="?/renameHouse" class="space-y-4">
          <div class="space-y-1.5">
            <label for="new_house_name" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Nuevo Nombre</label>
            <input
              type="text"
              id="new_house_name"
              name="houseName"
              value={data.houseName || data.user?.houseName || ''}
              class="w-full bg-navy-bg px-4 py-3 rounded-xl border border-white/10 text-white font-medium focus:border-accent-cyan outline-none"
              required
            />
          </div>

          <div class="flex gap-2 pt-2">
            <button
              type="button"
              onclick={() => isEditingHouseName = false}
              class="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 py-3 text-sm font-bold text-navy-bg bg-accent-cyan hover:bg-cyan-400 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5"
            >
              Guardar <Check size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Modal cambiar mi foto o avatar en esta casa -->
  {#if isEditingMyAvatar}
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-navy-surface border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <Camera size={18} class="text-accent-cyan" /> Mi Perfil en esta Casa
        </h3>

        <form method="POST" action="?/updateProfile" class="space-y-4">
          <div class="space-y-1.5">
            <label for="profile_display_name" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Tu Nombre en esta Casa</label>
            <input
              type="text"
              id="profile_display_name"
              name="displayName"
              bind:value={myDisplayName}
              placeholder="Ej: Papá, Manu, Mamá..."
              class="w-full bg-navy-bg px-4 py-3 rounded-xl border border-white/10 text-white font-medium focus:border-accent-cyan outline-none"
              required
            />
          </div>

          <AvatarPicker bind:emoji={myEmoji} bind:avatarUrl={myAvatarUrl} label="Elige cómo te verán los demás" />

          <div class="flex gap-2 pt-2">
            <button
              type="button"
              onclick={() => isEditingMyAvatar = false}
              class="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 py-3 text-sm font-bold text-navy-bg bg-accent-cyan hover:bg-cyan-400 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5"
            >
              Guardar <Check size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <div class="space-y-3">
    {#each data.members as member, i}
      <div class="bg-navy-surface rounded-2xl border {member.isCurrent ? 'border-accent-cyan/40 bg-navy-surface/90' : expandedMember === member.id ? 'border-accent-cyan/30' : 'border-white/5'} overflow-hidden transition-colors">
        
        <div class="w-full p-4 flex items-center justify-between group">
          <button 
            type="button"
            onclick={() => toggleExpand(member.id)}
            class="flex items-center gap-4 flex-1 text-left"
          >
            <div class="relative">
              <Avatar src={member.avatarUrl} emoji={member.emoji || '👤'} size="lg" />
              {#if i === 0}
                <div class="absolute -top-2 -right-2 text-xl filter drop-shadow-md">👑</div>
              {/if}
            </div>
            
            <div>
              <h3 class="font-bold text-gray-100 flex items-center gap-2">
                {member.name || 'Alguien'}
                {#if member.username && member.username !== member.name}
                  <span class="text-xs font-normal text-gray-400">(@{member.username})</span>
                {/if}
                {#if member.isCurrent}
                  <span class="text-[9px] bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded font-bold uppercase">Tú</span>
                {/if}
                <span class="text-[10px] {member.currentStreak ? 'bg-accent-orange/20 text-accent-orange' : 'bg-white/5 text-gray-500'} px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Días seguidos cumpliendo tareas">
                  <Flame size={10} class={member.currentStreak ? '' : 'opacity-50'} /> {member.currentStreak || 0}
                </span>
              </h3>
              <p class="text-xs text-accent-cyan font-bold flex items-center gap-1 mt-0.5">
                <Trophy size={12} /> {member.points} pts
              </p>
            </div>
          </button>
          
          <div class="flex items-center gap-2">
            {#if member.isCurrent}
              <button
                type="button"
                onclick={openEditMyAvatar}
                class="p-2 text-gray-400 hover:text-accent-cyan bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                title="Cambiar mi foto"
              >
                <Camera size={16} />
              </button>
            {/if}
            <button
              type="button"
              onclick={() => toggleExpand(member.id)}
              class="p-1.5 text-gray-500 hover:text-gray-300 transition-transform duration-300 {expandedMember === member.id ? 'rotate-180 text-accent-cyan' : ''}"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>

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
