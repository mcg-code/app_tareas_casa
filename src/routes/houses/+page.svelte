<script lang="ts">
  import { Trophy, Flame, ListTodo, Plus, ArrowRight, Home, LogOut, Check, Sparkles } from '@lucide/svelte';
  
  let { data, form } = $props();

  let showJoinModal = $state(false);
  let showCreateModal = $state(false);
</script>

<div class="h-full w-full flex flex-col relative z-10 pt-4 pb-20 max-w-md mx-auto">
  <!-- Header -->
  <header class="mb-6 px-1 flex justify-between items-center">
    <div>
      <h2 class="text-2xl font-bold flex items-center gap-2 text-white">
        <span class="text-3xl">🏡</span> Mis Casas
      </h2>
      <p class="text-xs text-gray-400 mt-0.5">Hola {data.user?.name}, gestiona tus hogares</p>
    </div>
    
    <div class="w-10 h-10 bg-navy-surface rounded-xl flex items-center justify-center text-xl border border-white/5 shadow-inner">
      {data.user?.emoji || '👤'}
    </div>
  </header>

  {#if form?.error}
    <div class="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm font-medium text-center mb-4">
      {form.error}
    </div>
  {/if}

  <!-- Listado de casas -->
  <div class="flex-1 overflow-y-auto space-y-3 pr-0.5 mb-6">
    {#each data.houses as house}
      <div 
        class="bg-navy-surface p-4 rounded-2xl border transition-all relative {house.isActive ? 'border-accent-cyan/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-white/5 hover:border-white/10'}"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 bg-navy-bg rounded-xl flex items-center justify-center text-2xl border border-white/5">
              {house.emoji || '🏠'}
            </div>
            <div>
              <h3 class="font-bold text-gray-100 text-base flex items-center gap-2">
                {house.houseName}
                {#if house.isActive}
                  <span class="text-[10px] bg-accent-cyan/20 text-accent-cyan px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                    <Check size={10} strokeWidth={3} /> Activa
                  </span>
                {/if}
              </h3>
              <p class="text-xs text-gray-500 font-mono">Código: {house.houseCode}</p>
            </div>
          </div>
        </div>

        <!-- Estadísticas en esta casa -->
        <div class="grid grid-cols-3 gap-2 py-2.5 px-3 bg-navy-bg/60 rounded-xl border border-white/5 mb-3 text-center">
          <div>
            <span class="text-[10px] text-gray-500 font-medium block">Puntos</span>
            <span class="text-xs font-bold text-accent-cyan flex items-center justify-center gap-1 mt-0.5">
              <Trophy size={11} /> {house.points ?? 0}
            </span>
          </div>
          <div>
            <span class="text-[10px] text-gray-500 font-medium block">Racha</span>
            <span class="text-xs font-bold {house.currentStreak ? 'text-accent-orange' : 'text-gray-500'} flex items-center justify-center gap-1 mt-0.5">
              <Flame size={11} /> {house.currentStreak ?? 0}
            </span>
          </div>
          <div>
            <span class="text-[10px] text-gray-500 font-medium block">Por hacer</span>
            <span class="text-xs font-bold text-gray-300 flex items-center justify-center gap-1 mt-0.5">
              <ListTodo size={11} /> {house.assignedTasksCount}
            </span>
          </div>
        </div>

        <!-- Acción entrar / cambiar -->
        {#if house.isActive}
          <a
            href="/tasks"
            class="w-full py-2.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-accent-cyan/30"
          >
            Ir a Tareas <ArrowRight size={14} />
          </a>
        {:else}
          <form method="POST" action="?/switch">
            <input type="hidden" name="memberId" value={house.memberId} />
            <button
              type="submit"
              class="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-white/5 hover:text-white"
            >
              Cambiar a esta casa <ArrowRight size={14} />
            </button>
          </form>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Botones de Acción inferior -->
  <div class="space-y-2.5 pt-2 border-t border-white/5">
    <div class="grid grid-cols-2 gap-2">
      <button
        onclick={() => showJoinModal = true}
        class="py-3 px-3 bg-navy-surface hover:bg-white/10 text-accent-cyan font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 shadow-glass"
      >
        <Home size={15} /> Unirme con Código
      </button>

      <button
        onclick={() => showCreateModal = true}
        class="py-3 px-3 bg-navy-surface hover:bg-white/10 text-accent-orange font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 shadow-glass"
      >
        <Plus size={15} /> Crear Otra Casa
      </button>
    </div>

    <form method="POST" action="?/logout" class="pt-1">
      <button
        type="submit"
        class="w-full py-2.5 text-gray-500 hover:text-red-400 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
      >
        <LogOut size={14} /> Cerrar Sesión
      </button>
    </form>
  </div>
</div>

<!-- Modal Unirme con Código -->
{#if showJoinModal}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-navy-surface border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-fade-in-up">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <Home size={20} class="text-accent-cyan" /> Unirme a una Casa
        </h3>
        <button 
          onclick={() => showJoinModal = false}
          class="text-gray-500 hover:text-white p-1 rounded-lg"
        >
          ✕
        </button>
      </div>

      <form method="POST" action="?/join" class="space-y-4">
        <div class="space-y-1.5">
          <label for="join_code" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Código de la Casa</label>
          <input
            type="text"
            id="join_code"
            name="code"
            placeholder="CASA-XXXXX"
            class="w-full bg-navy-bg px-4 py-3 rounded-xl border border-white/10 text-white font-mono uppercase font-bold focus:border-accent-cyan outline-none"
            required
          />
        </div>

        <div class="space-y-1.5">
          <label for="join_emoji" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Tu Icono en esta Casa</label>
          <input
            type="text"
            id="join_emoji"
            name="emoji"
            value={data.user?.emoji || '👤'}
            class="w-full bg-navy-bg px-4 py-3 rounded-xl border border-white/10 text-white text-center text-xl focus:border-accent-cyan outline-none"
          />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            onclick={() => showJoinModal = false}
            class="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 py-3 text-sm font-bold text-navy-bg bg-accent-cyan hover:bg-cyan-400 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1.5"
          >
            Unirme <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Modal Crear Nueva Casa -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-navy-surface border border-white/10 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-fade-in-up">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles size={20} class="text-accent-orange" /> Crear Otra Casa
        </h3>
        <button 
          onclick={() => showCreateModal = false}
          class="text-gray-500 hover:text-white p-1 rounded-lg"
        >
          ✕
        </button>
      </div>

      <form method="POST" action="?/create" class="space-y-4">
        <div class="space-y-1.5">
          <label for="create_name" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre del Hogar</label>
          <input
            type="text"
            id="create_name"
            name="houseName"
            placeholder="Ej: Piso Playa, Casa Papá..."
            class="w-full bg-navy-bg px-4 py-3 rounded-xl border border-white/10 text-white font-medium focus:border-accent-orange outline-none"
            required
          />
        </div>

        <div class="space-y-1.5">
          <label for="create_emoji" class="text-xs font-bold text-gray-400 uppercase tracking-wider">Tu Icono de Creador</label>
          <input
            type="text"
            id="create_emoji"
            name="emoji"
            value={data.user?.emoji || '👑'}
            class="w-full bg-navy-bg px-4 py-3 rounded-xl border border-white/10 text-white text-center text-xl focus:border-accent-orange outline-none"
          />
        </div>

        <div class="flex gap-2 pt-2">
          <button
            type="button"
            onclick={() => showCreateModal = false}
            class="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white bg-white/5 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="flex-1 py-3 text-sm font-bold text-navy-bg bg-accent-orange hover:bg-orange-400 rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] flex items-center justify-center gap-1.5"
          >
            Crear Casa <Plus size={16} />
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
