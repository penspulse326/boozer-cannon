<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string;
    message: string;
    show: boolean;
  }>(),
  {
    icon: 'fa-circle-check',
  },
);
</script>

<template>
  <div
    class="pointer-events-none fixed right-4 bottom-6 z-50 transition-all duration-300 sm:right-6"
    :class="show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-12 opacity-0'"
  >
    <div
      class="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-speakeasy-900/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-md"
    >
      <div
        class="flex size-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400"
      >
        <i :class="['fa-solid', icon]" />
      </div>
      <span class="font-medium">{{ message }}</span>
    </div>
  </div>
</template>
