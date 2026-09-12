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

      const themeColors: Record<string, string> = {
        'warm-peach': '#15100e',
        'cyber-cyan': '#0f172a',
        'forest-emerald': '#0b1510',
        'lavender-night': '#130f1c',
        'pure-black': '#000000'
      };
      const currentColor = themeColors[activeTheme] || '#15100e';

      // Asegurar fondo en html y body para la barra de estado y muesca
      document.documentElement.style.backgroundColor = currentColor;
      if (document.body) document.body.style.backgroundColor = currentColor;

      // Actualizar TODOS los tags meta[name="theme-color"] y forzar repintado en Chrome / WebAPK
      const metaThemeColors = document.querySelectorAll('meta[name="theme-color"]');
      if (metaThemeColors.length > 0) {
        metaThemeColors.forEach(m => {
          m.setAttribute('content', currentColor);
          if (m.parentNode) {
            m.parentNode.appendChild(m.parentNode.removeChild(m));
          }
        });
      } else {
        const meta = document.createElement('meta');
        meta.id = 'theme-color-meta';
        meta.name = 'theme-color';
        meta.content = currentColor;
        document.head.appendChild(meta);
      }
    }
  });
</script>

<div data-theme={activeTheme} class="min-h-screen max-w-md mx-auto relative bg-navy-bg shadow-2xl overflow-x-hidden pt-safe text-gray-100 font-sans transition-colors duration-200 flex flex-col">
  <!-- Contenido principal -->
  <main class="w-full flex-1 p-4 { (data.user?.houseId && !$page.url.pathname.startsWith('/houses')) ? 'pb-28' : 'pb-8' }">
    {@render children()}
  </main>

  <!-- Barra de Navegación Inferior (solo si hay sesión y dentro de una casa) -->
  {#if data.user?.houseId && !$page.url.pathname.startsWith('/houses')}
    <BottomNav />
  {/if}
</div>
