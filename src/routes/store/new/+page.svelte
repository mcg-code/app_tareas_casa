<script lang="ts">
  import { Gift } from '@lucide/svelte';
  
  let title = $state('');
  let price = $state(100);
  let icon = $state('🎁');
</script>

<div class="h-full w-full flex flex-col relative z-10 pt-4">
  <header class="mb-6 flex items-center justify-between px-1">
    <div>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <span class="text-3xl">✨</span> Nueva Recompensa
      </h2>
    </div>
  </header>

  <form method="POST" class="flex-1 flex flex-col gap-5">
    
    <div class="space-y-1.5">
      <label for="title" class="text-sm font-medium text-gray-400 ml-1">Nombre del premio</label>
      <input 
        type="text" 
        id="title" 
        name="title"
        bind:value={title}
        placeholder="Ej: Elegir la peli, No fregar hoy..." 
        class="bg-navy-surface w-full px-5 py-4 rounded-2xl border border-white/5 focus:border-accent-orange focus:ring-1 focus:ring-accent-orange text-white placeholder-gray-600 outline-none transition-all text-lg font-medium"
        required
      />
    </div>

    <div class="space-y-1.5">
      <label for="price" class="text-sm font-medium text-gray-400 ml-1">Precio en puntos</label>
      <div class="flex items-center gap-4 bg-navy-surface px-5 py-3 rounded-2xl border border-white/5">
        <input 
          type="range" 
          id="price" 
          name="price"
          bind:value={price}
          min="50" max="2000" step="50"
          class="flex-1 accent-accent-orange"
        />
        <span class="text-xl font-bold text-accent-orange w-16 text-right">{price}</span>
      </div>
    </div>

    <div class="space-y-1.5">
      <label for="icon" class="text-sm font-medium text-gray-400 ml-1">Icono (Emoji)</label>
      <input 
        type="text" 
        id="icon" 
        name="icon"
        bind:value={icon}
        class="bg-navy-surface w-full px-5 py-4 rounded-2xl border border-white/5 focus:border-accent-orange focus:ring-1 focus:ring-accent-orange text-white text-center text-4xl outline-none transition-all"
        required
      />
    </div>

    <div class="mt-auto pt-4">
      <button 
        type="submit" 
        class="w-full bg-accent-orange hover:bg-orange-400 text-navy-bg font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] text-lg flex items-center justify-center gap-2"
      >
        Añadir a la Tienda <Gift size={20} strokeWidth={2.5} />
      </button>
    </div>
  </form>
</div>
