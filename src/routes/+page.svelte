<script lang="ts">
  import { ArrowRight, UserPlus, LogIn, Lock, User } from '@lucide/svelte';
  
  let { form } = $props();
  
  let mode = $state<'login' | 'register'>('login');
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
      <p class="text-gray-400 font-medium text-sm">Gestiona tu hogar y tareas en equipo.</p>
    </div>

    {#if form?.error}
      <div class="bg-red-500/20 border border-red-500/50 text-red-200 p-3.5 rounded-xl text-sm font-medium text-center shadow-lg">
        {form.error}
      </div>
    {/if}

    {#if form?.registerError}
      <div class="bg-red-500/20 border border-red-500/50 text-red-200 p-3.5 rounded-xl text-sm font-medium text-center shadow-lg">
        {form.registerError}
      </div>
    {/if}

    <!-- Selector de Pestañas (Iniciar Sesión / Crear Cuenta) -->
    <div class="space-y-4 pt-1">
      <div class="flex gap-1.5 p-1 bg-navy-surface rounded-2xl border border-white/5 text-xs font-bold">
        <button 
          onclick={() => mode = 'login'} 
          class="flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 {mode === 'login' ? 'bg-navy-bg text-accent-cyan shadow-glass' : 'text-gray-400 hover:text-white'}"
        >
          <LogIn size={15} /> Iniciar Sesión
        </button>
        <button 
          onclick={() => mode = 'register'} 
          class="flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 {mode === 'register' ? 'bg-navy-bg text-accent-orange shadow-glass' : 'text-gray-400 hover:text-white'}"
        >
          <UserPlus size={15} /> Crear Cuenta
        </button>
      </div>

      {#if mode === 'login'}
        <!-- Formulario Iniciar Sesión -->
        <form method="POST" action="?/login" class="space-y-4 bg-navy-surface/60 p-5 rounded-2xl border border-white/5 shadow-glass">
          <div class="space-y-1.5">
            <label for="login_user" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
              <User size={12} /> Usuario o Nombre
            </label>
            <input 
              type="text" 
              id="login_user" 
              name="username" 
              placeholder="Ej: Manu, Papá..." 
              value={form?.username || ''}
              class="w-full bg-navy-bg px-4 py-3.5 rounded-xl border border-white/10 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-white placeholder-gray-600 outline-none transition-all font-medium"
              required
              autocomplete="username"
            />
          </div>
          
          <div class="space-y-1.5">
            <label for="login_pass" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
              <Lock size={12} /> Contraseña
            </label>
            <input 
              type="password" 
              id="login_pass" 
              name="password" 
              placeholder="••••••••" 
              class="w-full bg-navy-bg px-4 py-3.5 rounded-xl border border-white/10 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-white placeholder-gray-600 outline-none transition-all font-medium"
              required
              autocomplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            class="w-full bg-accent-cyan hover:bg-cyan-400 text-navy-bg font-bold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 mt-2"
          >
            Entrar a mi Cuenta <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </form>

      {:else}
        <!-- Formulario Crear Cuenta -->
        <form method="POST" action="?/register" class="space-y-4 bg-navy-surface/60 p-5 rounded-2xl border border-white/5 shadow-glass">
          <div class="grid grid-cols-[1fr_4.5rem] gap-3">
            <div class="space-y-1.5">
              <label for="reg_user" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
                <User size={12} /> Tu Nombre
              </label>
              <input 
                type="text" 
                id="reg_user" 
                name="username" 
                placeholder="Ej: Manu, Laura..." 
                value={form?.username || ''}
                class="w-full bg-navy-bg px-4 py-3.5 rounded-xl border border-white/10 focus:border-accent-orange focus:ring-1 focus:ring-accent-orange text-white placeholder-gray-600 outline-none transition-all font-medium"
                required
                autocomplete="username"
              />
            </div>
            <div class="space-y-1.5">
              <label for="reg_emoji" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 text-center block">Icono</label>
              <input 
                type="text" 
                id="reg_emoji" 
                name="emoji" 
                value={form?.emoji || '👤'}
                class="w-full bg-navy-bg px-0 py-3.5 rounded-xl border border-white/10 focus:border-accent-orange focus:ring-1 focus:ring-accent-orange text-white outline-none transition-all text-center text-xl"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="reg_pass" class="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1">
              <Lock size={12} /> Elige tu Contraseña
            </label>
            <input 
              type="password" 
              id="reg_pass" 
              name="password" 
              placeholder="Mínimo 4 caracteres" 
              minlength="4"
              class="w-full bg-navy-bg px-4 py-3.5 rounded-xl border border-white/10 focus:border-accent-orange focus:ring-1 focus:ring-accent-orange text-white placeholder-gray-600 outline-none transition-all font-medium"
              required
              autocomplete="new-password"
            />
          </div>

          <button 
            type="submit" 
            class="w-full bg-accent-orange hover:bg-orange-400 text-navy-bg font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 mt-2"
          >
            Crear mi Cuenta <UserPlus size={18} strokeWidth={2.5} />
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>

<style>
  .animate-fade-in-up {
    animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
