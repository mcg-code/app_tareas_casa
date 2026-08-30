<script lang="ts">
  import { Trophy, Star, Check } from '@lucide/svelte';
  import confetti from 'canvas-confetti';
  
  let { data } = $props();
  
  let recentlyPurchased = $state<string | null>(null);

  async function buyReward(reward: any) {
    if ((data.user?.points || 0) >= reward.price) {
      const formData = new FormData();
      formData.append('rewardId', reward.id);
      formData.append('title', reward.title);
      formData.append('price', reward.price.toString());
      
      const res = await fetch('?/buy', { method: 'POST', body: formData });
      
      if (res.ok) {
        recentlyPurchased = reward.id;
        triggerEpicAnimation();
        
        // Quitar el check después de 2 segundos y recargar para refrescar puntos
        setTimeout(() => {
          recentlyPurchased = null;
          window.location.reload();
        }, 2000);
      }
    }
  }

  function triggerEpicAnimation() {
    // Vibración corta
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    
    // Explosión dorada rápida
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#ffffff']
    });
  }
</script>

<div class="space-y-6 pb-6 fade-in relative h-full">
  <!-- Cabecera -->
  <header class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold flex items-center gap-2">
        <StoreIcon /> Tienda
      </h2>
    </div>
    
    <div class="bg-navy-surface px-4 py-2 rounded-2xl border border-accent-orange/30 text-center shadow-[0_0_15px_rgba(249,115,22,0.15)]">
      <span class="block text-[10px] text-accent-orange uppercase tracking-widest font-bold">Mis Puntos</span>
      <span class="text-xl font-black text-white transition-all">{data.user?.points || 0}</span>
    </div>
  </header>

  <!-- Lista de Recompensas -->
  <div class="space-y-3 mt-4">
    {#each data.rewards as reward}
      <button 
        onclick={() => buyReward(reward)}
        class="w-full relative overflow-hidden flex items-center justify-between p-4 bg-navy-surface rounded-2xl border {(data.user?.points || 0) >= reward.price ? 'border-white/10 hover:border-accent-orange/50 active:scale-[0.98]' : 'border-white/5 opacity-60'} transition-all group text-left"
      >
        <div class="flex items-center gap-4 relative z-10">
          <div class="w-12 h-12 bg-navy-bg rounded-xl flex items-center justify-center text-2xl border border-white/5">
            {reward.icon}
          </div>
          <div>
            <h3 class="font-bold text-gray-100">{reward.title}</h3>
            <p class="text-xs text-gray-400 font-medium">Recompensa</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3 relative z-10">
          {#if recentlyPurchased === reward.id}
            <div class="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/30 font-bold fade-in-fast">
              <Check size={14} />
            </div>
          {:else}
            <div class="flex items-center gap-1.5 px-3 py-1 bg-navy-bg rounded-full border {(data.user?.points || 0) >= reward.price ? 'border-accent-orange/30 text-accent-orange' : 'border-white/5 text-gray-500'} font-bold">
              <Star size={14} class={(data.user?.points || 0) >= reward.price ? 'fill-accent-orange/20' : ''} />
              <span>{reward.price}</span>
            </div>
          {/if}
        </div>
      </button>
    {/each}
  </div>

</div>

<!-- FAB Añadir Recompensa (Fuera del div animado para no romper el fixed position) -->
<div class="fixed bottom-24 left-0 w-full flex justify-center pointer-events-none z-50">
  <div class="w-full max-w-md relative h-0">
    <a 
      href="/store/new" 
      class="absolute right-6 -top-6 w-14 h-14 bg-accent-orange text-navy-bg rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] pointer-events-auto hover:bg-orange-400 transition-all hover:scale-110 active:scale-95 text-3xl font-light"
      aria-label="Nueva recompensa"
    >
      +
    </a>
  </div>
</div>

<script lang="ts" module>
  import { Store as StoreIcon } from '@lucide/svelte';
</script>

<style>
  .fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }
  
  .fade-in-fast {
    animation: fadeIn 0.15s ease-out forwards;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
