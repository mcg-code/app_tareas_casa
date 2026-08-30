<script lang="ts">
  import { ArrowRight, Plus, UserCheck, Trash2, Home } from '@lucide/svelte';
  
  let { data, form } = $props();
  
  let mode = $state('join'); // 'join' or 'create'
  let showOtherOptions = $state(!data.savedProfiles || data.savedProfiles.length === 0);
</script>

<div class="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-navy-bg relative overflow-y-auto text-gray-100 font-sans z-50 py-10">
  <!-- Efectos de fondo -->
  <div class="absolute top-[-10%] left-[-10%] w-64 h-64 bg-accent-cyan/10 rounded-full blur-[80px]"></div>
  <div class="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-accent-orange/10 rounded-full blur-[80px]"></div>

  <div class="z-10 w-full max-w-sm space-y-6 animate-fade-in-up">
    <!-- Header -->
    <div class="text-center space-y-2">
      <div class="w-16 h-16 bg-navy-surface rounded-2xl mx-auto flex items-center justify-center shadow-glass border border-white/5 mb-4">
        <span class="text-3xl">🏡</span>
      </div>
      <h1 class="text-3xl font-black tracking-tight text-white">Tareas en Familia</h1>
      <p class="text-gray-400 font-medium text-sm">Repartiendo el esfuerzo, sin discusiones.</p>
    </div>

    {#if form?.error}
      <div class="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm font-medium text-center">
        {form.error}
      </div>
    {/if}

    <!-- Perfiles guardados en este dispositivo -->
    {#if data.savedProfiles && data.savedProfiles.length > 0}
      <div class="space-y-3 bg-navy-surface/80 p-4 rounded-2xl border border-white/5 shadow-glass">
        <div class="flex justify-between items-center px-1">
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck size={14} class="text-accent-cyan" /> Cuentas en este móvil
          </span>
        </div>

        <div class="space-y-2">
          {#each data.savedProfiles as profile}
            <div class="flex items-center gap-2 bg-navy-bg p-2.5 rounded-xl border border-white/5 hover:border-accent-cyan/30 transition-all group">
              <form method="POST" action="?/quickLogin" class="flex-1 flex items-center gap-3">
                <input type="hidden" name="memberId" value={profile.memberId} />
                <button type="submit" class="flex items-center gap-3 flex-1 text-left">
                  <div class="w-10 h-10 bg-navy-surface rounded-lg flex items-center justify-center text-xl border border-white/5 shrink-0">
                    {profile.emoji}
                  </div>
                  <div class="overflow-hidden">
                    <span class="font-bold text-white text-sm block truncate">{profile.userName}</span>
                    <span class="text-[11px] text-accent-cyan font-medium block truncate flex items-center gap-1">
                      <Home size={10} /> {profile.houseName}
                    </span>
                  </div>
                </button>
              </form>

              <form method="POST" action="?/forgetProfile">
                <input type="hidden" name="memberId" value={profile.memberId} />
                <button 
                  type="submit" 
                  class="p-2 text-gray-600 hover:text-red-400 rounded-lg transition-colors"
                  title="Olvidar en este dispositivo"
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
          {/each}
        </div>

        <button 
          onclick={() => showOtherOptions = !showOtherOptions}
          class="w-full text-xs text-gray-400 hover:text-white py-1 font-medium transition-colors text-center block pt-1"
        >
          {showOtherOptions ? '▲ Ocultar otras opciones' : '▼ Entrar a otra casa o crear una nueva'}
        </button>
      </div>
    {/if}

    <!-- Modos (Tabs) y Formularios -->
    {#if showOtherOptions}
      <div class="space-y-4 pt-1 animate-fade-in-up">
        <!-- Selector de pestañas -->
        <div class="flex gap-2 p-1 bg-navy-surface rounded-2xl border border-white/5">
          <button 
            onclick={() => mode = 'join'} 
            class="flex-1 py-2 text-sm font-bold rounded-xl transition-all {mode === 'join' ? 'bg-navy-bg text-accent-cyan shadow-glass' : 'text-gray-500'}"
          >
            Unirme con Código
          </button>
          <button 
            onclick={() => mode = 'create'} 
            class="flex-1 py-2 text-sm font-bold rounded-xl transition-all {mode === 'create' ? 'bg-navy-bg text-accent-orange shadow-glass' : 'text-gray-500'}"
          >
            Crear Nueva Casa
          </button>
        </div>

        {#if mode === 'join'}
          <form method="POST" action="?/join" class="space-y-4">
            <div class="space-y-1.5">
              <label for="code" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Código de Casa</label>
              <input 
                type="text" 
                id="code" 
                name="code" 
                placeholder="CASA-XXXXX" 
                value={form?.code || ''}
                class="w-full bg-navy-surface px-5 py-4 rounded-2xl border border-white/5 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-white placeholder-gray-600 outline-none transition-all font-mono uppercase font-bold"
                required
              />
            </div>
            
            <div class="grid grid-cols-[1fr_4rem] gap-3">
              <div class="space-y-1.5">
                <label for="name" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Tu Nombre</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  placeholder="Ej: Mamá, Leo..." 
                  value={form?.name || ''}
                  class="w-full bg-navy-surface px-5 py-4 rounded-2xl border border-white/5 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-white placeholder-gray-600 outline-none transition-all font-medium"
                  required
                />
              </div>
              <div class="space-y-1.5">
                <label for="emoji" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 text-center block">Icono</label>
                <input 
                  type="text" 
                  id="emoji" 
                  name="emoji" 
                  placeholder="👤"
                  class="w-full bg-navy-surface px-0 py-4 rounded-2xl border border-white/5 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-white placeholder-gray-600 outline-none transition-all text-center text-xl"
                />
              </div>
            </div>

            <button 
              type="submit" 
              class="w-full bg-accent-cyan hover:bg-cyan-400 text-navy-bg font-bold py-4 rounded-2xl transition-all shadow-glow flex items-center justify-center gap-2 mt-2"
            >
              Entrar a la Casa <ArrowRight size={20} strokeWidth={3} />
            </button>
          </form>
        {:else}
          <form method="POST" action="?/create" class="space-y-4">
            <div class="space-y-1.5">
              <label for="c_house" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nombre del Hogar</label>
              <input 
                type="text" 
                id="c_house" 
                name="houseName" 
                placeholder="Ej: Piso Centro, La Cabaña, Casa Familiar..." 
                class="w-full bg-navy-surface px-5 py-4 rounded-2xl border border-white/5 focus:border-accent-orange focus:ring-1 focus:ring-accent-orange text-white placeholder-gray-600 outline-none transition-all font-medium"
              />
            </div>

            <div class="grid grid-cols-[1fr_4rem] gap-3">
              <div class="space-y-1.5">
                <label for="c_name" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Tu Nombre</label>
                <input 
                  type="text" 
                  id="c_name" 
                  name="name" 
                  placeholder="Ej: Papá, Laura..." 
                  class="w-full bg-navy-surface px-5 py-4 rounded-2xl border border-white/5 focus:border-accent-orange focus:ring-1 focus:ring-accent-orange text-white placeholder-gray-600 outline-none transition-all font-medium"
                  required
                />
              </div>
              <div class="space-y-1.5">
                <label for="c_emoji" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 text-center block">Icono</label>
                <input 
                  type="text" 
                  id="c_emoji" 
                  name="emoji" 
                  placeholder="👑"
                  class="w-full bg-navy-surface px-0 py-4 rounded-2xl border border-white/5 focus:border-accent-orange focus:ring-1 focus:ring-accent-orange text-white placeholder-gray-600 outline-none transition-all text-center text-xl"
                />
              </div>
            </div>

            <button 
              type="submit" 
              class="w-full bg-accent-orange hover:bg-orange-400 text-navy-bg font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 mt-2"
            >
              Crear Nueva Casa <Plus size={20} strokeWidth={3} />
            </button>
          </form>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .animate-fade-in-up {
    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
