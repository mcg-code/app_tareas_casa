<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Settings, Store, Trophy, ShieldAlert, Sparkles, ArrowLeft, Check, Loader2 } from '@lucide/svelte';
  
  let { data, form } = $props();

  let storeActive = $state(data.settings?.enableStore ?? true);
  let feedActive = $state(data.settings?.enableFeed ?? true);
  let pointsActive = $state(data.settings?.enablePoints ?? true);
  let quarantineActive = $state(data.settings?.enableQuarantine ?? true);
  let showSavedNotification = $state(false);
  let isSaving = $state(false);

  let formElement: HTMLFormElement | undefined = $state();
  let saveTimeout: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (data.settings) {
      storeActive = data.settings.enableStore ?? true;
      feedActive = data.settings.enableFeed ?? true;
      pointsActive = data.settings.enablePoints ?? true;
      quarantineActive = data.settings.enableQuarantine ?? true;
    }
  });

  $effect(() => {
    if (form?.success) {
      showSavedNotification = true;
      const t = setTimeout(() => showSavedNotification = false, 3000);
      return () => clearTimeout(t);
    }
  });

  function triggerAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (formElement) {
        formElement.requestSubmit();
      }
    }, 100);
  }
</script>

<div class="h-full w-full flex flex-col relative z-10 pt-4 pb-28 max-w-md mx-auto fade-in">
  <!-- Cabecera sin botón de menú principal / casas a la derecha -->
  <header class="mb-6 px-1 flex items-center gap-3">
    <a 
      href="/tasks" 
      onclick={async () => { await invalidateAll(); }}
      class="p-2.5 bg-navy-surface hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all border border-white/5 shadow-glass"
      title="Volver a Tareas"
    >
      <ArrowLeft size={18} />
    </a>
    <div>
      <h2 class="text-xl font-bold flex items-center gap-2 text-white">
        <Settings size={22} class="text-accent-cyan" /> Ajustes del Espacio
      </h2>
      <p class="text-xs text-gray-400 mt-0.5">{data.houseName} • <span class="font-mono">{data.houseCode}</span></p>
    </div>
  </header>

  {#if showSavedNotification}
    <div class="mb-4 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 p-3.5 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in-up">
      <Check size={16} class="text-emerald-400" /> ¡Ajustes guardados correctamente!
    </div>
  {/if}

  <p class="text-xs text-gray-400 mb-4 px-1 leading-relaxed">
    Elige qué funciones están activas en este espacio. Las funciones desactivadas se ocultarán de la barra inferior y de la interfaz para todos los miembros.
  </p>

  <form 
    bind:this={formElement}
    method="POST" 
    action="?/saveSettings" 
    use:enhance={() => {
      isSaving = true;
      return async ({ update }) => {
        await update({ reset: false });
        await invalidateAll();
        isSaving = false;
        showSavedNotification = true;
        const t = setTimeout(() => showSavedNotification = false, 3000);
      };
    }}
    class="space-y-3"
  >
    <!-- Tienda de Recompensas -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {storeActive ? 'border-accent-orange/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {storeActive ? 'bg-accent-orange/20 text-accent-orange' : 'bg-white/5 text-gray-500'} transition-colors">
            <Store size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Tienda de Recompensas</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Canjea puntos por caprichos o premios fijados en la casa. Desactívala si solo queréis una lista de tareas.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableStore" 
          bind:checked={storeActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-accent-orange rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Muro de Actividad -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {feedActive ? 'border-accent-cyan/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {feedActive ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-gray-500'} transition-colors">
            <Trophy size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Muro de Actividad</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Registro cronológico de quién completó cada tarea y canjes recientes.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableFeed" 
          bind:checked={feedActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-accent-cyan rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Sistema de Puntos y Rachas -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {pointsActive ? 'border-yellow-400/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {pointsActive ? 'bg-yellow-400/20 text-yellow-400' : 'bg-white/5 text-gray-500'} transition-colors">
            <Sparkles size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Puntos y Rachas</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Gamificación: asigna puntos a tareas y cuenta rachas de días cumplidos. Si lo apagas, será una lista colaborativa simple sin puntuaciones.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enablePoints" 
          bind:checked={pointsActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-yellow-400 rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <!-- Cuarentena de Tareas Nuevas -->
    <label class="block cursor-pointer bg-navy-surface p-4 rounded-2xl border transition-all {quarantineActive ? 'border-emerald-400/40 bg-navy-surface/90' : 'border-white/5 opacity-70'} hover:border-white/20">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <div class="p-2.5 rounded-xl {quarantineActive ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/5 text-gray-500'} transition-colors">
            <ShieldAlert size={22} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-white">Cuarentena de Tareas</span>
            </div>
            <p class="text-xs text-gray-400 mt-1 leading-relaxed">
              Las tareas nuevas creadas quedan congeladas 24h hasta que el grupo las valide. Desactívala para grupos de confianza o viajes donde queréis crear tareas al instante.
            </p>
          </div>
        </div>
        <input 
          type="checkbox" 
          name="enableQuarantine" 
          bind:checked={quarantineActive} 
          onchange={triggerAutoSave}
          class="w-5 h-5 accent-emerald-400 rounded-md cursor-pointer mt-1" 
        />
      </div>
    </label>

    <div class="pt-4">
      <button 
        type="submit" 
        disabled={isSaving}
        class="w-full py-3.5 bg-accent-cyan hover:bg-cyan-400 disabled:opacity-60 text-navy-bg font-bold text-sm rounded-xl transition-all shadow-glow flex items-center justify-center gap-2"
      >
        {#if isSaving}
          <Loader2 size={18} class="animate-spin" /> Guardando cambios...
        {:else}
          Guardar Configuración <Check size={18} strokeWidth={2.5} />
        {/if}
      </button>
    </div>
  </form>
</div>
