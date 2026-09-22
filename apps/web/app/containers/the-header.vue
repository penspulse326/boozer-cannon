<script setup lang="ts">
import SearchInput from '~/components/search-input.vue';

defineProps<{
  onlyFavorites: boolean;
  searchQuery: string;
}>();

defineEmits<{
  (e: 'open-add-modal'): void;
  (e: 'reset-all'): void;
  (e: 'toggle-favorites'): void;
  (e: 'update:searchQuery', val: string): void;
}>();
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-white/10 bg-speakeasy-950/80 backdrop-blur-md">
    <div
      class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8"
    >
      <!-- Brand Logo -->
      <div class="flex cursor-pointer items-center gap-3" @click="$emit('reset-all')">
        <div
          class="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-speakeasy-950 shadow-lg shadow-amber-500/20"
        >
          <i class="fa-solid fa-martini-glass-citrus text-xl" />
        </div>
        <div>
          <span class="block font-serif text-lg font-bold tracking-wide text-white sm:text-xl">
            BarCraft
          </span>
          <span
            class="block text-[10px] font-medium tracking-wider text-amber-400 uppercase sm:text-xs"
          >
            Cocktail Archive & ABV Engine
          </span>
        </div>
      </div>

      <!-- Desktop Search Bar -->
      <div class="relative mx-6 hidden max-w-md flex-1 md:flex">
        <SearchInput
          input-class="rounded-2xl py-2 pr-10 pl-10 text-xs shadow-inner focus:ring-1 focus:ring-amber-500 sm:text-sm"
          :model-value="searchQuery"
          placeholder="搜尋調酒名、基酒、材料、指定品牌或同義詞..."
          @update:model-value="$emit('update:searchQuery', $event)"
        />
      </div>

      <!-- Top Action Buttons -->
      <div class="flex items-center gap-2.5">
        <button
          class="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium shadow-sm transition-all sm:text-sm"
          :class="
            onlyFavorites
              ? 'border-amber-500 bg-amber-500 font-bold text-speakeasy-950'
              : 'border-white/10 bg-speakeasy-850 text-slate-300 hover:bg-speakeasy-800'
          "
          title="切換僅查看已收藏的酒譜"
          type="button"
          @click="$emit('toggle-favorites')"
        >
          <i
            class="fa-solid fa-bookmark"
            :class="onlyFavorites ? 'text-speakeasy-950' : 'text-amber-400'"
          />
          <span class="hidden sm:inline">我的收藏</span>
        </button>

        <button
          class="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 text-xs font-semibold text-speakeasy-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 active:scale-95 sm:text-sm"
          type="button"
          @click="$emit('open-add-modal')"
        >
          <i class="fa-solid fa-plus text-sm" />
          <span>新增酒譜</span>
        </button>
      </div>
    </div>

    <!-- Mobile Search Bar -->
    <div class="px-4 pb-3 md:hidden">
      <SearchInput
        input-class="rounded-xl py-2 pr-8 pl-8 text-xs"
        :model-value="searchQuery"
        placeholder="搜尋酒名、風味、材料品牌 (如: 坦奎利)..."
        @update:model-value="$emit('update:searchQuery', $event)"
      />
    </div>
  </header>
</template>
