<script setup lang="ts">
withDefaults(
  defineProps<{
    inputClass?: string;
    modelValue: string;
    placeholder?: string;
  }>(),
  {
    inputClass: 'rounded-xl py-2 pr-8 pl-8 text-xs',
    placeholder: '搜尋...',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
}>();

function clearSearch() {
  emit('update:modelValue', '');
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement | null;
  emit('update:modelValue', target?.value || '');
}
</script>

<template>
  <div class="relative w-full">
    <i
      class="fa-solid fa-magnifying-glass absolute top-1/2 left-3 -translate-y-1/2 text-xs text-slate-400"
    />
    <input
      :class="[
        'w-full border border-white/10 bg-speakeasy-900 text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none',
        inputClass,
      ]"
      :placeholder="placeholder"
      type="text"
      :value="modelValue"
      @input="onInput"
      @keydown.esc="clearSearch"
    />
    <button
      v-if="modelValue.trim()"
      class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
      type="button"
      @click="clearSearch"
    >
      <i class="fa-solid fa-xmark" />
    </button>
  </div>
</template>
