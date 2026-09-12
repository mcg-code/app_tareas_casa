<script lang="ts">
  import { Camera, Smile, Trash2 } from '@lucide/svelte';

  let {
    emoji = $bindable('👤'),
    avatarUrl = $bindable(''),
    inputNameEmoji = 'emoji',
    inputNameAvatar = 'avatarUrl',
    label = 'Tu foto o icono en esta casa'
  }: {
    emoji?: string;
    avatarUrl?: string;
    inputNameEmoji?: string;
    inputNameAvatar?: string;
    label?: string;
  } = $props();

  let mode = $state<'photo' | 'emoji'>(avatarUrl ? 'photo' : 'emoji');
  let fileInput = $state<HTMLInputElement>();

  const popularEmojis = ['👤', '🐱', '🐶', '🦊', '🦁', '🐼', '🐨', '🚀', '⚡', '⭐', '🎨', '🎮', '🍕', '🍩', '🥑', '🌸'];

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar y recortar a cuadrado 256x256
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Centrado y crop (object-fit: cover)
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        // Exportar a WebP o JPEG con compresión ligera (~15-25 KB)
        avatarUrl = canvas.toDataURL('image/webp', 0.82);
        mode = 'photo';
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    avatarUrl = '';
    mode = 'emoji';
    if (fileInput) fileInput.value = '';
  }
</script>

<div class="space-y-2">
  <span class="text-xs font-medium text-gray-400 block">{label}</span>

  <!-- Selector de modo (Pestañas Emoji / Foto) -->
  <div class="flex gap-1.5 p-1 bg-navy-bg rounded-xl border border-white/5 max-w-xs">
    <button
      type="button"
      onclick={() => { mode = 'emoji'; }}
      class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 {mode === 'emoji' ? 'bg-navy-surface text-accent-cyan shadow' : 'text-gray-400 hover:text-white'}"
    >
      <Smile size={14} /> Icono
    </button>
    <button
      type="button"
      onclick={() => { mode = 'photo'; if (!avatarUrl && fileInput) fileInput.click(); }}
      class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 {mode === 'photo' ? 'bg-navy-surface text-accent-orange shadow' : 'text-gray-400 hover:text-white'}"
    >
      <Camera size={14} /> Foto
    </button>
  </div>

  <input type="hidden" name={inputNameEmoji} value={emoji} />
  <input type="hidden" name={inputNameAvatar} value={mode === 'photo' ? avatarUrl : ''} />

  {#if mode === 'photo'}
    <!-- Selector de Foto -->
    <div class="flex items-center gap-4 p-3 bg-navy-bg/70 rounded-2xl border border-white/5">
      <div class="relative w-16 h-16 rounded-full bg-navy-surface border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden shrink-0 group">
        {#if avatarUrl}
          <img src={avatarUrl} alt="Foto de perfil" class="w-full h-full object-cover rounded-full" />
        {:else}
          <Camera size={24} class="text-gray-500" />
        {/if}
      </div>

      <div class="flex-1 space-y-1.5">
        <input
          type="file"
          accept="image/*"
          bind:this={fileInput}
          onchange={handleFileSelect}
          class="hidden"
        />
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => fileInput?.click()}
            class="px-3 py-1.5 bg-navy-surface hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Camera size={13} /> {avatarUrl ? 'Cambiar Foto' : 'Subir Foto'}
          </button>
          {#if avatarUrl}
            <button
              type="button"
              onclick={removePhoto}
              class="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg"
              title="Quitar foto"
            >
              <Trash2 size={15} />
            </button>
          {/if}
        </div>
        <p class="text-[10px] text-gray-500">Puedes elegir de tu galería o hacerte una foto.</p>
      </div>
    </div>
  {:else}
    <!-- Selector de Emoji -->
    <div class="p-3 bg-navy-bg/70 rounded-2xl border border-white/5 space-y-2.5">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-navy-surface flex items-center justify-center text-2xl border border-white/10 shrink-0 shadow-inner">
          {emoji || '👤'}
        </div>
        <div class="flex-1">
          <input
            type="text"
            bind:value={emoji}
            maxlength="4"
            placeholder="O escribe un emoji..."
            class="w-full bg-navy-surface px-3 py-2 rounded-xl border border-white/10 text-white text-sm outline-none focus:border-accent-cyan"
          />
        </div>
      </div>

      <!-- Emojis rápidos -->
      <div class="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
        {#each popularEmojis as e}
          <button
            type="button"
            onclick={() => emoji = e}
            class="w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all {emoji === e ? 'bg-accent-cyan/20 border border-accent-cyan/50 scale-110' : 'hover:bg-white/5 border border-transparent'}"
          >
            {e}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
