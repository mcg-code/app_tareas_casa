<script lang="ts">
  import { Trophy, Flame, ChevronDown, ListTodo, Gift, Home, Pencil, Check, Camera, Settings, Crown, Loader2 } from '@lucide/svelte';
  import { slide } from 'svelte/transition';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import Avatar from '$lib/components/Avatar.svelte';
  import AvatarPicker from '$lib/components/AvatarPicker.svelte';
  
  let { data } = $props();

  let showPoints = $derived(data.user?.settings?.enablePoints !== false);
  
  let expandedMember = $state<string | null>(null);
  let isEditingHouseName = $state(false);
  let isEditingMyAvatar = $state(false);
  let memberToTransfer = $state<{ id: string; name: string } | null>(null);
  let isTransferring = $state(false);

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
          {#if data.user?.isAdmin}
            <button 
              onclick={() => isEditingHouseName = true}
              class="text-gray-500 hover:text-accent-cyan p-1 rounded-lg transition-colors"
              title="Cambiar nombre de la casa (solo administrador)"
            >
              <Pencil size={13} />
            </button>
          {/if}
        </div>
      </div>

      <div class="flex items-center gap-2">
        {#if data.user?.isAdmin}
          <a 
            href="/settings" 
            class="flex items-center gap-1.5 px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-gray-300 hover:text-accent-cyan rounded-xl text-xs font-bold border border-white/5 shadow-glass transition-all"
            title="Ajustes de esta casa"
          >
            <Settings size={14} /> Ajustes
          </a>
        {/if}

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

  <!-- Modal ceder administración -->
  {#if memberToTransfer}
    <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-navy-surface border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <Crown size={20} class="text-amber-400" /> Ceder Administración
        </h3>
        
        <p class="text-xs text-gray-300 leading-relaxed">
          ¿Estás seguro de que quieres ceder la administración a <strong class="text-white">{memberToTransfer.name}</strong>?
        </p>
        
        <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 leading-relaxed">
          ⚠️ Esta persona pasará a ser el Administrador y podrá modificar los ajustes de la casa. Tú pasarás a ser un miembro normal.
        </div>

        <form 
          method="POST" 
          action="?/transferAdmin" 
          use:enhance={() => {
            isTransferring = true;
            return async ({ update }) => {
              await update();
              await invalidateAll();
              isTransferring = false;
              memberToTransfer = null;
            };
          }}
          class="flex gap-2 pt-2"
        >
          <input type="hidden" name="targetMemberId" value={memberToTransfer.id} />
          
          <button
            type="button"
            onclick={() => memberToTransfer = null}
            disabled={isTransferring}
            class="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isTransferring}
            class="flex-1 py-3 text-sm font-bold text-navy-bg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5"
          >
            {#if isTransferring}
              <Loader2 size={16} class="animate-spin" /> Transfiriendo...
            {:else}
              Confirmar y Ceder
            {/if}
          </button>
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
              {#if member.role === 'admin'}
                <div class="absolute -top-2 -right-2 text-xl filter drop-shadow-md" title="Administrador de la casa">👑</div>
              {/if}
            </div>
            
            <div>
              <h3 class="font-bold text-gray-100 flex items-center flex-wrap gap-2">
                {member.name || 'Alguien'}
                {#if member.username && member.username !== member.name}
                  <span class="text-xs font-normal text-gray-400">(@{member.username})</span>
                {/if}
                {#if member.isCurrent}
                  <span class="text-[9px] bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded font-bold uppercase">Tú</span>
                {/if}
                {#if member.role === 'admin'}
                  <span class="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-0.5">
                    👑 Admin
                  </span>
                {:else}
                  <span class="text-[9px] bg-white/5 text-gray-400 border border-white/5 px-1.5 py-0.5 rounded font-medium uppercase">
                    Miembro
                  </span>
                {/if}
                {#if showPoints}
                  <span class="text-[10px] {member.currentStreak ? 'bg-accent-orange/20 text-accent-orange' : 'bg-white/5 text-gray-500'} px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Días seguidos cumpliendo tareas">
                    <Flame size={10} class={member.currentStreak ? '' : 'opacity-50'} /> {member.currentStreak || 0}
                  </span>
                {/if}
              </h3>
              {#if showPoints}
                <p class="text-xs text-accent-cyan font-bold flex items-center gap-1 mt-0.5">
                  <Trophy size={12} /> {member.points} pts
                </p>
              {/if}
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
          <div transition:slide={{ duration: 200 }} class="px-4 pb-4 pt-2 border-t border-white/5 bg-navy-bg/30 space-y-4">
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

            <!-- Acción de ceder administración si soy admin y este miembro no es admin -->
            {#if data.user?.isAdmin && !member.isCurrent && member.role !== 'admin'}
              <div class="pt-3 border-t border-white/5 flex items-center justify-between">
                <span class="text-xs text-gray-400">Rol: <strong class="text-gray-200">Miembro</strong></span>
                <button
                  type="button"
                  onclick={() => memberToTransfer = { id: member.id, name: member.name }}
                  class="text-xs text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Crown size={14} /> Ceder administración
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
