<script lang="ts">
  import '../app.css';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { page } from '$app/stores';
  
  let { children, data } = $props();
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
