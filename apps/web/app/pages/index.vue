<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { Recipe } from '~/types/cocktail';

import { calculateRecipeABV } from '~/utils/abvEngine';
import { DEFAULT_RECIPES } from '~/utils/seedData';
import { TAXONOMY } from '~/utils/taxonomy';

const STORAGE_KEY = 'barcraft_recipes_v2';

const recipes = ref<Recipe[]>([]);
const currentCategory = ref('all');
const currentFlavor = ref('all');
const currentAbvFilter = ref('all');
const searchQuery = ref('');
const currentSort = ref('likes');
const onlyFavorites = ref(false);

const toast = ref({
  icon: 'fa-circle-check',
  message: '',
  show: false,
});
let toastTimer: null | ReturnType<typeof setTimeout> = null;

const baseCategories = [
  { id: 'all', label: '全部基酒' },
  { id: 'Gin', label: '琴酒 Gin' },
  { id: 'Whiskey', label: '威士忌 Whisky' },
  { id: 'Rum', label: '蘭姆酒 Rum' },
  { id: 'Tequila', label: '龍舌蘭 Tequila' },
  { id: 'Vodka', label: '伏特加 Vodka' },
  { id: 'Brandy', label: '白蘭地 Brandy' },
  { id: 'Other', label: '其他/無酒精' },
];

const abvFilterOptions = [
  { id: 'all', label: '全部濃度' },
  { id: 'mocktail', label: '🌱 無酒精 (0%)' },
  { id: 'light', label: '🍹 輕盈 (≤12%)' },
  { id: 'classic', label: '🍸 經典微醺 (13-22%)' },
  { id: 'strong', label: '🥃 濃烈 (>22%)' },
];

onMounted(() => {
  loadRecipes();
});

function clearSearch() {
  searchQuery.value = '';
}

function expandSearchKeywords(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  const keywords = new Set<string>([q]);

  TAXONOMY.flavors.forEach((f) => {
    if (f.aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
      keywords.add(f.id);
      keywords.add(f.primaryEn.toLowerCase());
      f.aliases.forEach((a) => keywords.add(a.toLowerCase()));
    }
  });

  TAXONOMY.brands.forEach((b) => {
    if (b.aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
      keywords.add(b.id);
      keywords.add(b.primaryEn.toLowerCase());
      keywords.add(b.primaryZh.toLowerCase());
      b.aliases.forEach((a) => keywords.add(a.toLowerCase()));
    }
  });

  return Array.from(keywords);
}

function getBrandedIngredients(recipe: Recipe) {
  return (recipe.ingredients || []).filter((i) => i.brandText && i.brandText.trim());
}

function getFlavorInfo(flavorId: string) {
  return TAXONOMY.flavors.find((f) => f.id === flavorId);
}

function loadRecipes() {
  if (import.meta.client && typeof globalThis.localStorage !== 'undefined') {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        recipes.value = JSON.parse(stored);
        return;
      } catch {
        recipes.value = [...DEFAULT_RECIPES];
      }
    } else {
      recipes.value = [...DEFAULT_RECIPES];
    }
  } else {
    recipes.value = [...DEFAULT_RECIPES];
  }
}

function onImageError(e: Event) {
  const target = e.target as HTMLImageElement | null;
  if (target) {
    target.src = 'https://placehold.co/600x400/181b24/f59e0b?text=Cocktail';
  }
}

function openAddModal() {
  // To be implemented in Phase 7
}

function openDetailModal(recipeId: string) {
  // To be connected in Phase 6
  void recipeId;
}

function recipeMatchesQuery(recipe: Recipe, expandedTerms: string[]): boolean {
  const fullText = [
    recipe.nameZh,
    recipe.nameEn,
    recipe.base,
    recipe.method,
    recipe.glass,
    recipe.ice,
    recipe.garnish,
    recipe.desc,
    recipe.author,
    ...(recipe.flavors || []),
    ...(recipe.ingredients || []).map((i) => `${i.name} ${i.brandText || ''} ${i.brandId || ''}`),
  ]
    .join(' ')
    .toLowerCase();

  return expandedTerms.some((term) => fullText.includes(term));
}

function resetAllFilters() {
  searchQuery.value = '';
  currentCategory.value = 'all';
  currentFlavor.value = 'all';
  currentAbvFilter.value = 'all';
  onlyFavorites.value = false;
}

function saveRecipesToStorage() {
  if (import.meta.client && typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes.value));
  }
}

function setAbvFilter(level: string) {
  currentAbvFilter.value = level;
}

function setCategory(category: string) {
  currentCategory.value = category;
}

function setFlavorFilter(flavorId: string) {
  currentFlavor.value = flavorId;
}

function showToast(message: string, icon = 'fa-circle-check') {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toast.value = { icon, message, show: true };
  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 2500);
}

function toggleFavorite(id: string) {
  const recipe = recipes.value.find((r) => r.id === id);
  if (!recipe) {
    return;
  }
  recipe.isFav = !recipe.isFav;
  saveRecipesToStorage();
  showToast(recipe.isFav ? '已加入我的收藏' : '已從收藏中移除', 'fa-bookmark');
}

function toggleFavoritesOnly() {
  onlyFavorites.value = !onlyFavorites.value;
}

function toggleLike(id: string) {
  const recipe = recipes.value.find((r) => r.id === id);
  if (!recipe) {
    return;
  }
  recipe.isLiked = !recipe.isLiked;
  recipe.likes = (recipe.likes || 0) + (recipe.isLiked ? 1 : -1);
  saveRecipesToStorage();
}

const filteredRecipes = computed(() => {
  const list = recipes.value.filter((item) => {
    if (currentCategory.value !== 'all' && item.base !== currentCategory.value) {
      return false;
    }
    if (currentFlavor.value !== 'all') {
      const itemFlavors = item.flavors || [];
      if (!itemFlavors.includes(currentFlavor.value)) {
        return false;
      }
    }
    if (currentAbvFilter.value !== 'all') {
      const abvData = calculateRecipeABV(item);
      if (abvData.strengthLevel !== currentAbvFilter.value) {
        return false;
      }
    }
    if (onlyFavorites.value && !item.isFav) {
      return false;
    }
    if (searchQuery.value.trim() !== '') {
      const expanded = expandSearchKeywords(searchQuery.value);
      if (!recipeMatchesQuery(item, expanded)) {
        return false;
      }
    }
    return true;
  });

  return list.sort((a, b) => {
    if (currentSort.value === 'likes') {
      return (b.likes || 0) - (a.likes || 0);
    }
    if (currentSort.value === 'newest') {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
    if (currentSort.value === 'name') {
      return (a.nameZh || '').localeCompare(b.nameZh || '', 'zh-TW');
    }
    if (currentSort.value === 'abv_desc') {
      return calculateRecipeABV(b).abv - calculateRecipeABV(a).abv;
    }
    if (currentSort.value === 'abv_asc') {
      return calculateRecipeABV(a).abv - calculateRecipeABV(b).abv;
    }
    return 0;
  });
});

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    currentCategory.value !== 'all' ||
    currentFlavor.value !== 'all' ||
    currentAbvFilter.value !== 'all' ||
    onlyFavorites.value
  );
});

const activeFilterSummary = computed(() => {
  const tags: string[] = [];
  if (searchQuery.value.trim()) {
    const expanded = expandSearchKeywords(searchQuery.value);
    tags.push(`關鍵字: "${searchQuery.value}" (${Math.min(expanded.length, 4)}組關聯)`);
  }
  if (currentCategory.value !== 'all') {
    tags.push(`基酒: ${currentCategory.value}`);
  }
  if (currentFlavor.value !== 'all') {
    const found = TAXONOMY.flavors.find((f) => f.id === currentFlavor.value);
    tags.push(`風味: ${found ? found.primaryZh : currentFlavor.value}`);
  }
  if (currentAbvFilter.value !== 'all') {
    const option = abvFilterOptions.find((o) => o.id === currentAbvFilter.value);
    tags.push(`濃度: ${option ? option.label : currentAbvFilter.value}`);
  }
  if (onlyFavorites.value) {
    tags.push('僅顯示已收藏');
  }
  return tags;
});
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
            @click="setFlavorFilter('all')"
          >
            重設風味
          </button>
        </div>
        <div class="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            class="rounded-xl px-3 py-1.5 text-xs whitespace-nowrap transition-all"
            :class="
              currentFlavor === 'all'
                ? 'bg-amber-500 font-semibold text-speakeasy-950 shadow-md'
                : 'border border-white/5 bg-speakeasy-850 text-slate-300 hover:bg-speakeasy-800'
            "
            type="button"
            @click="setFlavorFilter('all')"
          >
            全部風味
          </button>
          <button
            v-for="flavor in TAXONOMY.flavors"
            :key="flavor.id"
            class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs whitespace-nowrap transition-all"
            :class="
              currentFlavor === flavor.id
                ? 'bg-amber-500 font-bold text-speakeasy-950 shadow-md'
                : 'border border-white/5 bg-speakeasy-850 text-slate-300 hover:bg-speakeasy-800'
            "
            type="button"
            @click="setFlavorFilter(flavor.id)"
          >
            <i class="fa-solid text-[10px]" :class="flavor.icon" />
            <span>{{ flavor.primaryZh.slice(0, 2) }}</span>
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
              currentAbvFilter === option.id
                ? 'bg-amber-500 font-bold text-speakeasy-950'
                : 'border border-white/5 bg-speakeasy-850 text-slate-300 hover:bg-speakeasy-800'
            "
            type="button"
            @click="setAbvFilter(option.id)"
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
              currentCategory === cat.id
                ? 'bg-amber-500 font-semibold text-speakeasy-950 shadow-md shadow-amber-500/20'
                : 'border border-white/5 bg-speakeasy-850 font-medium text-slate-300 hover:bg-speakeasy-800 hover:text-white'
            "
            type="button"
            @click="setCategory(cat.id)"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- Sorting & Active Counter -->
        <div class="flex items-center justify-between gap-3 text-xs text-slate-400 md:justify-end">
          <span class="font-medium text-slate-300 whitespace-nowrap">
            共 {{ filteredRecipes.length }} 款酒譜
          </span>
          <div
            class="flex items-center gap-1.5 rounded-xl border border-white/5 bg-speakeasy-850 px-3 py-1.5"
          >
            <i class="fa-solid fa-arrow-down-wide-short text-amber-500" />
            <select
              v-model="currentSort"
              class="cursor-pointer bg-transparent text-xs text-slate-200 focus:outline-none"
            >
              <option class="bg-speakeasy-900 text-white" value="likes">熱門讚數 (由多至少)</option>
              <option class="bg-speakeasy-900 text-white" value="newest">最新建立</option>
              <option class="bg-speakeasy-900 text-white" value="name">酒譜名稱 (A-Z)</option>
              <option class="bg-speakeasy-900 text-white" value="abv_desc">
                酒精濃度 (由高至低)
              </option>
              <option class="bg-speakeasy-900 text-white" value="abv_asc">
                酒精濃度 (由低至高)
              </option>
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
          @click="resetAllFilters"
        >
          清除全部條件
        </button>
      </div>

      <!-- Recipes Grid -->
      <div
        v-if="filteredRecipes.length > 0"
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          class="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-speakeasy-900 shadow-xl transition-all duration-300 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10"
          @click="openDetailModal(recipe.id)"
        >
          <!-- Card Top Image -->
          <div class="relative h-52 w-full overflow-hidden bg-speakeasy-950 sm:h-56">
            <img
              :alt="recipe.nameZh"
              class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              :src="recipe.image || 'https://placehold.co/600x400/181b24/f59e0b?text=Cocktail'"
              @error="onImageError"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-speakeasy-900 via-transparent to-black/30"
            />

            <!-- Top Badges: Base & Calculated ABV -->
            <div class="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5">
              <span
                class="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-speakeasy-950 shadow-md"
              >
                {{ recipe.base }}
              </span>
              <span
                class="rounded-lg border px-2 py-1 font-mono text-[11px] font-bold shadow-md backdrop-blur"
                :class="calculateRecipeABV(recipe).strengthColor"
                title="融水稀釋模型預估酒精濃度"
              >
                ~{{ calculateRecipeABV(recipe).abv }}% ABV
              </span>
            </div>

            <!-- Favorite Button -->
            <button
              class="absolute top-3.5 right-3.5 flex size-9 items-center justify-center rounded-full border border-white/15 backdrop-blur transition-all"
              :class="
                recipe.isFav
                  ? 'bg-amber-500 text-speakeasy-950'
                  : 'bg-speakeasy-950/70 text-slate-300 hover:text-white'
              "
              :title="recipe.isFav ? '已收藏' : '加入收藏'"
              type="button"
              @click.stop="toggleFavorite(recipe.id)"
            >
              <i
                class="text-sm"
                :class="recipe.isFav ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"
              />
            </button>
          </div>

          <!-- Card Content Body -->
          <div class="flex flex-1 flex-col justify-between space-y-4 p-5">
            <div>
              <div class="mb-1 flex items-baseline justify-between gap-2">
                <h3
                  class="font-serif text-lg font-bold text-white transition-colors line-clamp-1 group-hover:text-amber-400"
                >
                  {{ recipe.nameZh }}
                </h3>
                <span class="font-serif text-[11px] text-slate-400 italic line-clamp-1">
                  {{ recipe.nameEn || '' }}
                </span>
              </div>

              <!-- Flavor Pills -->
              <div
                v-if="recipe.flavors && recipe.flavors.length > 0"
                class="mb-2.5 flex flex-wrap gap-1.5"
              >
                <span
                  v-for="fId in recipe.flavors"
                  :key="fId"
                  class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 transition-colors hover:bg-amber-500/25"
                  title="點擊依此風味篩選"
                  @click.stop="setFlavorFilter(fId)"
                >
                  <i
                    class="text-[8px]"
                    :class="['fa-solid', getFlavorInfo(fId)?.icon || 'fa-tag']"
                  />
                  <span>{{ getFlavorInfo(fId)?.primaryZh.slice(0, 4) || fId }}</span>
                </span>
              </div>

              <p class="mb-3 text-xs leading-relaxed text-slate-400 line-clamp-2">
                {{ recipe.desc || '經典優雅的調酒配方，風味層次分明。' }}
              </p>

              <!-- Branded Ingredients Preview Badges -->
              <div
                v-if="getBrandedIngredients(recipe).length > 0"
                class="border-t border-white/5 pt-2"
              >
                <div class="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
                  <i class="fa-solid fa-award text-amber-500" />
                  <span>指定品牌材料：</span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="(b, bIdx) in getBrandedIngredients(recipe)"
                    :key="bIdx"
                    class="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-amber-300/90"
                  >
                    {{ b.brandText }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card Bottom Bar -->
            <div
              class="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400"
            >
              <span class="flex items-center gap-1 text-[11px] text-slate-400">
                <i class="fa-solid fa-martini-glass text-[10px] text-slate-400" />
                <span>{{ recipe.method ? recipe.method.split(' ')[0] : '調製法' }}</span>
              </span>

              <button
                class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all"
                :class="
                  recipe.isLiked
                    ? 'bg-rose-500/10 text-rose-400'
                    : 'text-slate-400 hover:bg-white/5 hover:text-rose-400'
                "
                type="button"
                @click.stop="toggleLike(recipe.id)"
              >
                <i
                  class="text-xs"
                  :class="recipe.isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"
                />
                <span class="font-mono text-xs">{{ recipe.likes || 0 }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="py-16 text-center">
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
          @click="resetAllFilters"
        >
          重設所有篩選條件
        </button>
      </div>
    </main>

    <!-- Toast Notification -->
    <div
      class="pointer-events-none fixed right-4 bottom-6 z-50 transition-all duration-300 sm:right-6"
      :class="
        toast.show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-12 opacity-0'
      "
    >
      <div
        class="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-speakeasy-900/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-md"
      >
        <div
          class="flex size-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400"
        >
          <i :class="['fa-solid', toast.icon]" />
        </div>
        <span class="font-medium">{{ toast.message }}</span>
      </div>
    </div>

    <!-- Footer -->
    <footer
      class="border-t border-white/5 bg-speakeasy-950 py-8 text-center text-xs text-slate-500"
    >
      <div
        class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row"
      >
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-martini-glass-citrus text-amber-500" />
          <span class="font-serif font-semibold text-slate-400"> BarCraft Archive </span>
          <span>— 調酒文化、風味同義詞庫與工藝演算</span>
        </div>
        <div class="text-[11px] text-slate-500">理性飲酒 · 未滿 18 歲請勿飲酒 · 禁止酒駕</div>
      </div>
    </footer>
  </div>
</template>
