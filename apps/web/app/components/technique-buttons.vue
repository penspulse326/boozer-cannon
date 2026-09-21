<script setup lang="ts">
const props = defineProps<{
  activeMethod: string;
}>();

defineEmits<{
  (e: 'select', techniqueId: string): void;
}>();

const techniques = [
  { id: 'Stir', label: 'Stir 攪拌' },
  { id: 'Shake', label: 'Shake 搖盪' },
  { id: 'Build', label: 'Build 直調' },
  { id: 'Blend', label: 'Blend 霜凍' },
  { id: 'Layer', label: 'Layer 分層' },
];

function isActive(techId: string): boolean {
  return (props.activeMethod || '').toLowerCase().includes(techId.toLowerCase());
}
</script>

<template>
  <div class="grid grid-cols-5 gap-1 text-center">
    <button
      v-for="tech in techniques"
      :key="tech.id"
      class="rounded-lg px-2 py-1 text-[10px] transition-all"
      :class="
        isActive(tech.id)
          ? 'border border-amber-500 bg-amber-500/20 font-bold text-amber-300'
          : 'border border-white/10 bg-speakeasy-900 text-slate-300 hover:border-amber-500/50'
      "
      type="button"
      @click="$emit('select', tech.id)"
    >
      {{ tech.label }}
    </button>
  </div>
</template>
