<script lang="ts">
  import '../app.css';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { page } from '$app/stores';
  
  let { children, data } = $props();

  $effect(() => {
    if (typeof window !== 'undefined' && data.user) {
      try {
        const saved = JSON.parse(localStorage.getItem('tf_saved_profiles') || '[]');
        const existingIdx = saved.findIndex((p: any) => p.memberId === data.user?.memberId);
        const profileObj = {
          memberId: data.user.memberId,
          userName: data.user.name,
          emoji: data.user.emoji,
          houseName: data.user.houseName,
          houseCode: data.user.houseCode
        };
        if (existingIdx >= 0) {
          saved[existingIdx] = profileObj;
        } else {
          saved.unshift(profileObj);
        }
        localStorage.setItem('tf_saved_profiles', JSON.stringify(saved.slice(0, 8)));
      } catch (e) {
        console.error('Error saving profile to localStorage', e);
      }
    }
  });
</script>

<div class="min-h-screen max-w-md mx-auto relative bg-navy-bg shadow-2xl overflow-hidden pb-20 text-gray-100 font-sans">
  <!-- Contenido principal -->
  <main class="h-full w-full overflow-y-auto p-4 { data.user ? 'pb-24' : '' }">
    {@render children()}
  </main>

  <!-- Barra de Navegación Inferior (solo si hay sesión y dentro de una casa) -->
  {#if data.user && !$page.url.pathname.startsWith('/houses')}
    <BottomNav />
  {/if}
</div>
