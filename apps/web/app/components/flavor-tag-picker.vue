<script setup lang="ts">
import { TAXONOMY } from '~/utils/taxonomy';

const modelValue = defineModel<string[]>({ default: () => [] });

function toggleFlavor(flavorId: string) {
  const set = new Set(modelValue.value);
  if (set.has(flavorId)) {
    set.delete(flavorId);
  } else {
    set.add(flavorId);
  }
  modelValue.value = Array.from(set);
}
</script>

<template>
  <div class="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-speakeasy-850 p-3">
    <button
      v-for="flavor in TAXONOMY.flavors"
      :key="flavor.id"
      class="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all"
      :class="
        modelValue.includes(flavor.id)
          ? 'bg-amber-500 font-bold text-speakeasy-950 shadow-md shadow-amber-500/20'
          : 'border border-white/10 bg-speakeasy-900 text-slate-300 hover:bg-speakeasy-800'
      "
      type="button"
      @click="toggleFlavor(flavor.id)"
    >
      <i :class="['fa-solid', flavor.icon, 'text-[10px]']" />
      <span>{{ flavor.primaryZh }}</span>
    </button>
  </div>
</template>
