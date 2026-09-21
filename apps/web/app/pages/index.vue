<script setup lang="ts">
import { ref } from 'vue';

const searchQuery = ref('');
const onlyFavorites = ref(false);

function clearSearch() {
  searchQuery.value = '';
}

function openAddModal() {
  // To be connected in subsequent phases
}

function resetAllFilters() {
  searchQuery.value = '';
  onlyFavorites.value = false;
}

function toggleFavoritesOnly() {
  onlyFavorites.value = !onlyFavorites.value;
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Sticky Header Navigation -->
    <header class="sticky top-0 z-40 border-b border-white/10 bg-speakeasy-950/80 backdrop-blur-md">
      <div
        class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8"
      >
        <!-- Brand Logo -->
        <div class="flex cursor-pointer items-center gap-3" @click="resetAllFilters">
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
          <div class="relative w-full">
            <i
              class="fa-solid fa-magnifying-glass absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-slate-400"
            />
            <input
              v-model="searchQuery"
              class="w-full rounded-2xl border border-white/10 bg-speakeasy-900 py-2 pr-10 pl-10 text-xs text-white shadow-inner placeholder:text-slate-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none sm:text-sm"
              placeholder="搜尋調酒名、基酒、材料、指定品牌或同義詞..."
              type="text"
            />
            <button
              v-if="searchQuery.trim()"
              class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              type="button"
              @click="clearSearch"
            >
              <i class="fa-solid fa-xmark" />
            </button>
          </div>
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
            @click="toggleFavoritesOnly"
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
            @click="openAddModal"
          >
            <i class="fa-solid fa-plus text-sm" />
            <span>新增酒譜</span>
          </button>
        </div>
      </div>

      <!-- Mobile Search Bar -->
      <div class="px-4 pb-3 md:hidden">
        <div class="relative w-full">
          <i
            class="fa-solid fa-magnifying-glass absolute top-1/2 left-3 -translate-y-1/2 text-xs text-slate-400"
          />
          <input
            v-model="searchQuery"
            class="w-full rounded-xl border border-white/10 bg-speakeasy-900 py-2 pr-8 pl-8 text-xs text-white placeholder:text-slate-400 focus:border-amber-500 focus:outline-none"
            placeholder="搜尋酒名、風味、材料品牌 (如: 坦奎利)..."
            type="text"
          />
          <button
            v-if="searchQuery.trim()"
            class="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            type="button"
            @click="clearSearch"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
      <!-- Hero Announcement & Stats -->
      <div
        class="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-speakeasy-900 via-speakeasy-850 to-speakeasy-900 p-6 shadow-2xl sm:p-8"
      >
        <div
          class="pointer-events-none absolute -right-10 -bottom-10 text-9xl text-amber-500 opacity-10"
        >
          <i class="fa-solid fa-champagne-glasses" />
        </div>
        <div class="relative z-10 max-w-2xl">
          <span
            class="mb-3 inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-400 uppercase"
          >
            Craft Cocktails & Science
          </span>
          <h1 class="mb-2 font-serif text-2xl font-bold leading-tight text-white sm:text-4xl">
            探索調酒藝術，<span
              class="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent"
              >精準掌控風味與酒度</span
            >
          </h1>
          <p class="text-xs leading-relaxed text-slate-400 sm:text-sm">
            支援指定材料品牌標準化比對、多維風味標籤快選，並內建依經典技法融水比率換算的即時 ABV
            酒精濃度推估引擎。
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
