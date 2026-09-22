<script setup lang="ts">
import { computed } from 'vue';

import { BASE_SPIRITS, TAXONOMY } from '~/utils/taxonomy';

const props = defineProps<{
  abvFilter: string;
  category: string;
  flavor: string;
  onlyFavorites: boolean;
  recipeCount: number;
  searchQuery: string;
  sort: string;
}>();

const emit = defineEmits<{
  (e: 'reset-all'): void;
  (e: 'update:abvFilter', val: string): void;
  (e: 'update:category', val: string): void;
  (e: 'update:flavor', val: string): void;
  (e: 'update:sort', val: string): void;
}>();

const baseCategories = [
  { id: 'all', label: '全部基酒' },
  ...BASE_SPIRITS.map((spirit) => ({ id: spirit.id, label: spirit.label })),
];

const abvFilterOptions = [
  { id: 'all', label: '全部濃度' },
  { id: 'mocktail', label: '🌱 無酒精 (0%)' },
  { id: 'light', label: '🍹 輕盈 (≤12%)' },
  { id: 'classic', label: '🍸 經典微醺 (13-22%)' },
  { id: 'strong', label: '🥃 濃烈 (>22%)' },
];

const hasActiveFilters = computed(() => {
  return (
    props.searchQuery.trim() !== '' ||
    props.category !== 'all' ||
    props.flavor !== 'all' ||
    props.abvFilter !== 'all' ||
    props.onlyFavorites
  );
});

const activeFilterSummary = computed(() => {
  const tags: string[] = [];
  if (props.searchQuery.trim()) {
    tags.push(`關鍵字: "${props.searchQuery}"`);
  }
  if (props.category !== 'all') {
    tags.push(`基酒: ${props.category}`);
  }
  if (props.flavor !== 'all') {
    const found = TAXONOMY.flavors.find((f) => f.id === props.flavor);
    tags.push(`風味: ${found ? found.primaryZh : props.flavor}`);
  }
  if (props.abvFilter !== 'all') {
    const option = abvFilterOptions.find((o) => o.id === props.abvFilter);
    tags.push(`濃度: ${option ? option.label : props.abvFilter}`);
  }
  if (props.onlyFavorites) {
    tags.push('僅顯示已收藏');
  }
  return tags;
});

function onSortChange(event: Event) {
  const target = event.target as HTMLSelectElement | null;
  emit('update:sort', target?.value || 'likes');
}
</script>

<template>
  <div>
    <!-- Flavor Profile Filter Bar -->
    <div class="mb-5 rounded-2xl border border-white/10 bg-speakeasy-900/90 p-4 shadow-lg">
      <div class="mb-2.5 flex items-center justify-between gap-2">
        <div
          class="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase"
        >
          <i class="fa-solid fa-wand-magic-sparkles" />
          <span>風味輪廓快速篩選 (Flavor Profile)</span>
        </div>
        <button
          class="text-[11px] text-slate-400 transition-colors hover:text-amber-400"
          type="button"
          @click="$emit('update:flavor', 'all')"
        >
          重設風味
        </button>
      </div>
      <div class="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          class="rounded-xl px-3 py-1.5 text-xs whitespace-nowrap transition-all"
          :class="
            flavor === 'all'
              ? 'bg-amber-500 font-semibold text-speakeasy-950 shadow-md'
              : 'border border-white/5 bg-speakeasy-850 text-slate-300 hover:bg-speakeasy-800'
          "
          type="button"
          @click="$emit('update:flavor', 'all')"
        >
          全部風味
        </button>
        <button
          v-for="flv in TAXONOMY.flavors"
          :key="flv.id"
          class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs whitespace-nowrap transition-all"
          :class="
            flavor === flv.id
              ? 'bg-amber-500 font-bold text-speakeasy-950 shadow-md'
              : 'border border-white/5 bg-speakeasy-850 text-slate-300 hover:bg-speakeasy-800'
          "
          type="button"
          @click="$emit('update:flavor', flavor === flv.id ? 'all' : flv.id)"
        >
          <i class="fa-solid text-[10px]" :class="flv.icon" />
          <span>{{ flv.primaryZh.slice(0, 2) }}</span>
        </button>
      </div>
    </div>

    <!-- Alcohol Strength (ABV) Filter Bar -->
    <div
      class="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-white/5 bg-speakeasy-900/70 px-4 py-3 text-xs sm:flex-row sm:items-center"
    >
      <div class="flex items-center gap-2 font-medium text-slate-300 whitespace-nowrap">
        <i class="fa-solid fa-gauge-high text-amber-500" />
        <span>酒精濃度分級 (ABV Filter)：</span>
      </div>
      <div class="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          v-for="option in abvFilterOptions"
          :key="option.id"
          class="rounded-xl px-3 py-1.5 whitespace-nowrap transition-all"
          :class="
            abvFilter === option.id
              ? 'bg-amber-500 font-bold text-speakeasy-950'
              : 'border border-white/5 bg-speakeasy-850 text-slate-300 hover:bg-speakeasy-800'
          "
          type="button"
          @click="$emit('update:abvFilter', option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Base Spirits & Sorting Bar -->
    <div
      class="mb-6 flex flex-col justify-between gap-4 border-b border-white/5 pb-4 md:flex-row md:items-center"
    >
      <!-- Base Spirits Filter -->
      <div class="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
        <button
          v-for="cat in baseCategories"
          :key="cat.id"
          class="rounded-xl px-4 py-2 text-xs whitespace-nowrap transition-all sm:text-sm"
          :class="
            category === cat.id
              ? 'bg-amber-500 font-semibold text-speakeasy-950 shadow-md shadow-amber-500/20'
              : 'border border-white/5 bg-speakeasy-850 font-medium text-slate-300 hover:bg-speakeasy-800 hover:text-white'
          "
          type="button"
          @click="$emit('update:category', cat.id)"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Sorting & Active Counter -->
      <div class="flex items-center justify-between gap-3 text-xs text-slate-400 md:justify-end">
        <span class="font-medium text-slate-300 whitespace-nowrap">
          共 {{ recipeCount }} 款酒譜
        </span>
        <div
          class="flex items-center gap-1.5 rounded-xl border border-white/5 bg-speakeasy-850 px-3 py-1.5"
        >
          <i class="fa-solid fa-arrow-down-wide-short text-amber-500" />
          <select
            class="cursor-pointer bg-transparent text-xs text-slate-200 focus:outline-none"
            :value="sort"
            @change="onSortChange"
          >
            <option class="bg-speakeasy-900 text-white" value="likes">熱門讚數 (由多至少)</option>
            <option class="bg-speakeasy-900 text-white" value="newest">最新建立</option>
            <option class="bg-speakeasy-900 text-white" value="name">酒譜名稱 (A-Z)</option>
            <option class="bg-speakeasy-900 text-white" value="abv_desc">
              酒精濃度 (由高至低)
            </option>
            <option class="bg-speakeasy-900 text-white" value="abv_asc">酒精濃度 (由低至高)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Active Filter Tags Display -->
    <div v-if="hasActiveFilters" class="mb-6 flex flex-wrap items-center gap-2">
      <span class="text-xs text-slate-400">篩選條件：</span>
      <div class="flex flex-wrap items-center gap-1.5">
        <span
          v-for="(tag, idx) in activeFilterSummary"
          :key="idx"
          class="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-300"
        >
          {{ tag }}
        </span>
      </div>
      <button
        class="ml-2 text-xs text-amber-400 hover:underline"
        type="button"
        @click="$emit('reset-all')"
      >
        清除全部條件
      </button>
    </div>
  </div>
</template>
