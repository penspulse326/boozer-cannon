<script setup lang="ts">
defineEmits<{
  (e: 'reset'): void;
}>();
</script>

<template>
  <div class="py-16 text-center">
    <div
      class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-white/10 bg-speakeasy-850 text-2xl text-slate-500"
    >
      <i class="fa-solid fa-wine-bottle" />
    </div>
    <h3 class="mb-1 text-lg font-medium text-white">找不到相符的酒譜</h3>
    <p class="mx-auto mb-4 max-w-sm text-xs text-slate-400">
      請嘗試調整搜尋關鍵字、風味輪廓、或重設篩選條件。
    </p>
    <button
      class="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-speakeasy-950 transition-colors hover:bg-amber-400"
      type="button"
      @click="$emit('reset')"
    >
      重設所有篩選條件
    </button>
  </div>
</template>
