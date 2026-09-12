<script lang="ts">
  let {
    src = null,
    emoji = '👤',
    size = 'md',
    alt = 'Avatar',
    class: customClass = ''
  }: {
    src?: string | null;
    emoji?: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    alt?: string;
    class?: string;
  } = $props();

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-xl',
    xl: 'w-16 h-16 text-3xl'
  };
</script>

<div
  class="relative inline-flex items-center justify-center rounded-full bg-navy-surface border border-white/10 overflow-hidden shrink-0 shadow-sm {sizeClasses[size] || sizeClasses.md} {customClass}"
>
  {#if src}
    <img {src} {alt} class="w-full h-full object-cover rounded-full" />
  {:else}
    <span class="flex items-center justify-center leading-none select-none">
      {emoji || '👤'}
    </span>
  {/if}
</div>
