<script lang="ts">
  import { Home, ListTodo, Trophy, Store, Users } from '@lucide/svelte';
  
  // Asumimos que podemos recibir la ruta actual para resaltar el icono activo
  import { page } from '$app/stores';
  
  let currentPath = $derived($page.url.pathname);
</script>

<nav class="fixed bottom-0 w-full max-w-md mx-auto bg-navy-surface/90 backdrop-blur-md border-t border-white/5 rounded-t-3xl pb-safe pt-2 px-6 z-50">
  <ul class="flex justify-between items-center h-16">
    <li>
      <a href="/tasks" class="flex flex-col items-center gap-1 transition-all duration-300 {currentPath.includes('/tasks') ? 'text-accent-cyan scale-110 drop-shadow-glow' : 'text-gray-400 hover:text-gray-200'}">
        <ListTodo size={24} strokeWidth={currentPath.includes('/tasks') ? 2.5 : 2} />
        <span class="text-[10px] font-medium tracking-wide">Tareas</span>
      </a>
    </li>
    <li>
      <a href="/store" class="flex flex-col items-center gap-1 transition-all duration-300 {currentPath.includes('/store') ? 'text-accent-orange scale-110' : 'text-gray-400 hover:text-gray-200'}">
        <div class="relative">
          <Store size={24} strokeWidth={currentPath.includes('/store') ? 2.5 : 2} />
          <!-- Indicador de que puedes comprar algo (opcional en el futuro) -->
          <!-- <span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-orange rounded-full shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span> -->
        </div>
        <span class="text-[10px] font-medium tracking-wide">Tienda</span>
      </a>
    </li>
    <li>
      <a href="/feed" class="flex flex-col items-center gap-1 transition-all duration-300 {currentPath.includes('/feed') ? 'text-accent-cyan scale-110 drop-shadow-glow' : 'text-gray-400 hover:text-gray-200'}">
        <Trophy size={24} strokeWidth={currentPath.includes('/feed') ? 2.5 : 2} />
        <span class="text-[10px] font-medium tracking-wide">Actividad</span>
      </a>
    </li>
    <li>
      <a href="/family" class="flex flex-col items-center gap-1 transition-all duration-300 {currentPath.includes('/family') ? 'text-accent-cyan scale-110 drop-shadow-glow' : 'text-gray-400 hover:text-gray-200'}">
        <Users size={24} strokeWidth={currentPath.includes('/family') ? 2.5 : 2} />
        <span class="text-[10px] font-medium tracking-wide">Familia</span>
      </a>
    </li>
  </ul>
</nav>

<style>
  /* Margen seguro para iPhone (FaceID area en la parte inferior) */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
</style>
