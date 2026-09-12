<script lang="ts">
  import '../app.css';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { page } from '$app/stores';
  
  let { children, data } = $props();

  let activeTheme = $derived(data.user?.settings?.theme || 'warm-peach');

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', activeTheme);
      try {
        localStorage.setItem('app_theme', activeTheme);
      } catch (e) {}

      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const themeColors: Record<string, string> = {
          'warm-peach': '#15100e',
          'cyber-cyan': '#0f172a',
          'forest-emerald': '#0b1510',
          'lavender-night': '#130f1c',
          'pure-black': '#000000'
        };
        metaThemeColor.setAttribute('content', themeColors[activeTheme] || '#15100e');
      }
    }
  });
</script>

<div data-theme={activeTheme} class="min-h-screen max-w-md mx-auto relative bg-navy-bg shadow-2xl overflow-hidden pb-20 text-gray-100 font-sans transition-colors duration-200">
  <!-- Contenido principal -->
  <main class="h-full w-full overflow-y-auto p-4 { (data.user?.houseId && !$page.url.pathname.startsWith('/houses')) ? 'pb-24' : '' }">
    {@render children()}
  </main>

  <!-- Barra de Navegación Inferior (solo si hay sesión y dentro de una casa) -->
  {#if data.user?.houseId && !$page.url.pathname.startsWith('/houses')}
    <BottomNav />
  {/if}
</div>
