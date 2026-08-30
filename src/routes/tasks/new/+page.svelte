<script lang="ts">
  import { Search, Plus, CalendarPlus, AlertTriangle, Edit2, Trash2 } from '@lucide/svelte';
  
  let { data } = $props();

  let searchQuery = $state('');
  let editingTemplate = $state<string | null>(null);
  let editingFrequency = $state('none');
  let editingFrequencyValue = $state<number | null>(null);
  let showInfo = $state(false);
  let selectedFrequency = $state('none');

  function openEdit(template: any) {
    editingTemplate = template.id;
    editingFrequency = template.frequency;
    editingFrequencyValue = template.frequencyValue;
  }

  let filteredTemplates = $derived(
    searchQuery.trim() === '' 
      ? data.templates 
      : data.templates.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );
</script>

<div class="h-full w-full flex flex-col relative z-10 pt-4">
  <header class="mb-6 px-1">
    <h2 class="text-2xl font-bold flex items-center gap-2">
      <span class="text-3xl">🔍</span> Catálogo
    </h2>
  </header>

  <!-- Buscador -->
  <div class="relative mb-6">
    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
      <Search size={20} class="text-gray-500" />
    </div>
    <input 
      type="text" 
      bind:value={searchQuery}
      placeholder="Ej: Bajar la basura..." 
      class="bg-navy-surface w-full pl-12 pr-4 py-4 rounded-2xl border border-white/5 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-white placeholder-gray-600 outline-none transition-all font-medium shadow-glass"
    />
  </div>

  <div class="flex-1 flex flex-col gap-6 overflow-y-auto">
    {#if filteredTemplates.length > 0}
      <div>
        <h3 class="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">
          {searchQuery ? 'Resultados del catálogo' : 'Tareas frecuentes'}
        </h3>
        <div class="space-y-3">
          {#each filteredTemplates as template}
            {@const isVerified = new Date().getTime() - new Date(template.createdAt).getTime() > 24 * 60 * 60 * 1000}
            <div class="bg-navy-surface p-4 rounded-2xl border border-white/5 shadow-glass group">
              <!-- Modo Vista -->
              <div class="flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-gray-100">{template.title}</h4>
                    {#if !isVerified}
                      <span class="text-[10px] bg-accent-orange/20 text-accent-orange px-1.5 py-0.5 rounded flex items-center gap-0.5" title="En cuarentena (24h)">
                        <AlertTriangle size={10} /> Nuevo
                      </span>
                    {:else}
                      <span class="text-[10px] bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        ✅ Verificada
                      </span>
                    {/if}
                  </div>
                  <p class="text-xs text-accent-cyan font-bold mt-1">{template.basePoints} pts</p>
                </div>
                
                <div class="flex items-center gap-2">
                  <button type="button" onclick={() => openEdit(template)} class="p-2 text-gray-500 hover:text-white transition-colors" title="Editar">
                    <Edit2 size={16} />
                  </button>
                  <form method="POST" action="?/deleteTemplate" onsubmit={(e) => { if(!confirm('¿Borrar esta tarea del catálogo para siempre?')) e.preventDefault(); }}>
                    <input type="hidden" name="templateId" value={template.id} />
                    <button class="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Borrar">
                      <Trash2 size={16} />
                    </button>
                  </form>
                  
                  <form method="POST" action="?/planTask" class="ml-2">
                    <input type="hidden" name="templateId" value={template.id} />
                    <button class="w-10 h-10 rounded-xl bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan hover:text-navy-bg transition-colors flex items-center justify-center border border-accent-cyan/30" title="Añadir a Hoy">
                      <CalendarPlus size={20} />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if searchQuery}
      <div class="text-center py-6 text-gray-400">
        <p>No se ha encontrado en el catálogo.</p>
        <p class="text-sm mt-1">Si es una tarea nueva, puedes proponerla abajo.</p>
      </div>
    {/if}

    <!-- Formulario Nueva Tarea Genérica -->
    <div class="bg-navy-bg/50 border border-accent-orange/20 rounded-2xl p-4 mt-auto relative">
      <div class="flex items-center gap-2 mb-4">
        <h3 class="text-[10px] font-bold text-accent-orange uppercase tracking-wider">Proponer Nueva Tarea</h3>
        <button type="button" class="text-accent-orange/60 hover:text-accent-orange transition-colors relative" onclick={() => showInfo = !showInfo}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
        </button>
      </div>
      
      {#if showInfo}
        <div class="text-xs text-gray-400 mb-4 leading-relaxed bg-navy-surface p-3 rounded-lg border border-white/5 animate-in fade-in slide-in-from-top-2">
          Las tareas nuevas se podrán planificar hoy, pero los puntos ganados se quedarán <strong class="text-accent-orange">congelados 24h</strong> hasta que la familia confirme que no es trampa.
        </div>
      {/if}
      
      <form method="POST" action="?/createTemplate" class="flex flex-col gap-4">
        <input 
          type="text" 
          name="title"
          value={searchQuery}
          placeholder="Nombre de la tarea" 
          class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/5 text-white outline-none font-medium"
          required
        />
        
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-gray-400 ml-1">Puntos</label>
          <div class="flex items-center gap-4 bg-navy-surface px-4 py-2.5 rounded-xl border border-white/5">
            <input 
              type="range" 
              name="points"
              value="50"
              min="5" max="500" step="5"
              class="flex-1 accent-accent-orange"
              oninput={(e) => e.currentTarget.nextElementSibling!.textContent = e.currentTarget.value}
            />
            <span class="text-lg font-bold text-accent-cyan w-10 text-right">50</span>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-gray-400 ml-1">¿Se repite?</label>
          <select 
            name="frequency" 
            bind:value={selectedFrequency}
            class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/5 text-white outline-none"
          >
            <option value="none">Normal (Una sola vez)</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
          </select>
        </div>

        {#if selectedFrequency === 'weekly'}
          <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
            <label class="text-xs font-medium text-gray-400 ml-1">¿Qué día de la semana?</label>
            <select name="frequencyValue" class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/5 text-white outline-none">
              <option value="1">Lunes</option>
              <option value="2">Martes</option>
              <option value="3">Miércoles</option>
              <option value="4">Jueves</option>
              <option value="5">Viernes</option>
              <option value="6">Sábado</option>
              <option value="0">Domingo</option>
            </select>
          </div>
        {:else if selectedFrequency === 'monthly'}
          <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
            <label class="text-xs font-medium text-gray-400 ml-1">¿Qué día del mes?</label>
            <select name="frequencyValue" class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/5 text-white outline-none">
              {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                <option value={day}>Día {day}</option>
              {/each}
            </select>
          </div>
        {/if}

        <button 
          type="submit" 
          class="w-full bg-accent-orange hover:bg-orange-400 text-navy-bg font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] mt-2"
        >
          Proponer al Catálogo
        </button>
      </form>
    </div>
  </div>
</div>

<!-- Modal de Edición -->
{#if editingTemplate}
  {@const t = data.templates.find(t => t.id === editingTemplate)}
  {#if t}
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div class="bg-navy-bg w-full max-w-md rounded-3xl border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2"><Edit2 size={20} class="text-accent-cyan" /> Editar Tarea</h3>
        
        <form method="POST" action="?/updateTemplate" class="flex flex-col gap-5">
          <input type="hidden" name="templateId" value={t.id} />
          
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-400 ml-1">Nombre</label>
            <input type="text" name="title" value={t.title} class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/5 text-white outline-none font-medium" required />
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-400 ml-1">Puntos</label>
            <div class="flex items-center gap-4 bg-navy-surface px-4 py-2.5 rounded-xl border border-white/5">
              <input 
                type="range" 
                name="points"
                value={t.basePoints}
                min="5" max="500" step="5"
                class="flex-1 accent-accent-cyan"
                oninput={(e) => e.currentTarget.nextElementSibling!.textContent = e.currentTarget.value}
              />
              <span class="text-lg font-bold text-accent-cyan w-10 text-right">{t.basePoints}</span>
            </div>
          </div>
          
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-gray-400 ml-1">¿Se repite?</label>
            <select 
              name="frequency" 
              bind:value={editingFrequency}
              class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/5 text-white outline-none"
            >
              <option value="none">Normal (Una sola vez)</option>
              <option value="daily">Diaria</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </div>

          {#if editingFrequency === 'weekly'}
            <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label class="text-xs font-medium text-gray-400 ml-1">¿Qué día de la semana?</label>
              <select name="frequencyValue" bind:value={editingFrequencyValue} class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/5 text-white outline-none">
                <option value={1}>Lunes</option>
                <option value={2}>Martes</option>
                <option value={3}>Miércoles</option>
                <option value={4}>Jueves</option>
                <option value={5}>Viernes</option>
                <option value={6}>Sábado</option>
                <option value={0}>Domingo</option>
              </select>
            </div>
          {:else if editingFrequency === 'monthly'}
            <div class="space-y-1.5 animate-in fade-in slide-in-from-top-2">
              <label class="text-xs font-medium text-gray-400 ml-1">¿Qué día del mes?</label>
              <select name="frequencyValue" bind:value={editingFrequencyValue} class="bg-navy-surface w-full px-4 py-3 rounded-xl border border-white/5 text-white outline-none">
                {#each Array.from({ length: 31 }, (_, i) => i + 1) as day}
                  <option value={day}>Día {day}</option>
                {/each}
              </select>
            </div>
          {/if}
          
          <div class="flex gap-3 mt-4">
            <button type="button" onclick={() => editingTemplate = null} class="flex-1 py-3 font-bold text-gray-400 bg-navy-surface rounded-xl hover:text-white transition-colors">Cancelar</button>
            <button type="submit" class="flex-1 py-3 font-bold bg-accent-cyan text-navy-bg rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all hover:bg-cyan-300">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
{/if}
