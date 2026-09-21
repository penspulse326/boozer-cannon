<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { BrandTaxonomy, Recipe } from '~/types/cocktail';

import { calculateRecipeABV, detectDefaultIngredientAbv } from '~/utils/abvEngine';
import { DEFAULT_RECIPES } from '~/utils/seedData';
import { TAXONOMY } from '~/utils/taxonomy';

interface FormIngredient {
  abv: null | number;
  amount: string;
  brandId: string;
  brandText: string;
  id: string;
  name: string;
  showBrandDropdown: boolean;
  unit: string;
  userModifiedAbv: boolean;
}

interface FormStep {
  id: string;
  text: string;
}

const STORAGE_KEY = 'barcraft_recipes_v2';

const recipes = ref<Recipe[]>([]);
const currentCategory = ref('all');
const currentFlavor = ref('all');
const currentAbvFilter = ref('all');
const searchQuery = ref('');
const currentSort = ref('likes');
const onlyFavorites = ref(false);

const activeDetailRecipeId = ref<null | string>(null);
const simulatedMethod = ref<null | string>(null);
const isAddModalOpen = ref(false);

const toast = ref({
  icon: 'fa-circle-check',
  message: '',
  show: false,
});
let toastTimer: null | ReturnType<typeof setTimeout> = null;

const addForm = ref({
  author: '',
  base: 'Gin',
  desc: '',
  flavors: [] as string[],
  garnish: '',
  glass: '',
  ice: '',
  image: '',
  ingredients: [] as FormIngredient[],
  method: 'Stir (攪拌法)',
  nameEn: '',
  nameZh: '',
  steps: [] as FormStep[],
});

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

const simulationTechniques = [
  { id: 'Stir', label: 'Stir 攪拌' },
  { id: 'Shake', label: 'Shake 搖盪' },
  { id: 'Build', label: 'Build 直調' },
  { id: 'Blend', label: 'Blend 霜凍' },
  { id: 'Layer', label: 'Layer 分層' },
];

onMounted(() => {
  loadRecipes();
});

function addIngredientRow() {
  addForm.value.ingredients.push(createEmptyIngredient());
}

function addStepRow() {
  addForm.value.steps.push(createEmptyStep());
}

function clearSearch() {
  searchQuery.value = '';
}

function closeAddModal() {
  isAddModalOpen.value = false;
}

function createEmptyIngredient(
  name = '',
  amount = '',
  unit = 'ml',
  brandText = '',
  brandId = '',
  abv: null | number = null,
): FormIngredient {
  const resolvedAbv = abv !== null ? abv : detectDefaultIngredientAbv(name, brandText);
  return {
    abv: resolvedAbv,
    amount,
    brandId,
    brandText,
    id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    showBrandDropdown: false,
    unit,
    userModifiedAbv: abv !== null,
  };
}

function createEmptyStep(text = ''): FormStep {
  return {
    id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text,
  };
}

function getBrandSuggestions(query: string) {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return [];
  }
  return TAXONOMY.brands.filter(
    (b) =>
      b.primaryEn.toLowerCase().includes(q) ||
      b.primaryZh.toLowerCase().includes(q) ||
      b.aliases.some((a) => a.toLowerCase().includes(q)),
  );
}

function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    addForm.value.image = (e.target?.result as string) || '';
  };
  reader.readAsDataURL(file);
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

function onIngredientNameChange(index: number) {
  const row = addForm.value.ingredients[index];
  if (!row) {
    return;
  }
  if (!row.userModifiedAbv) {
    row.abv = detectDefaultIngredientAbv(row.name, row.brandText);
  }
}

function openAddModal() {
  addForm.value = {
    author: '',
    base: 'Gin',
    desc: '',
    flavors: ['flavor_sour'],
    garnish: '',
    glass: '',
    ice: '',
    image: '',
    ingredients: [
      createEmptyIngredient('琴酒 (Gin)', '45', 'ml', 'Tanqueray No. 10', 'brand_tanqueray', 47.3),
      createEmptyIngredient('通寧水', '120', 'ml', '', '', 0),
    ],
    method: 'Stir (攪拌法)',
    nameEn: '',
    nameZh: '',
    steps: [createEmptyStep('杯中放入純淨冰塊。'), createEmptyStep('依序倒入材料並輕柔攪拌混合。')],
  };
  isAddModalOpen.value = true;
}

function removeIngredientRow(index: number) {
  addForm.value.ingredients.splice(index, 1);
}

function removeStepRow(index: number) {
  addForm.value.steps.splice(index, 1);
}

function saveRecipesToStorage() {
  if (import.meta.client && typeof globalThis.localStorage !== 'undefined') {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes.value));
  }
}

function selectBrand(index: number, brand: BrandTaxonomy) {
  const row = addForm.value.ingredients[index];
  if (!row) {
    return;
  }
  row.brandId = brand.id;
  row.brandText = brand.primaryEn;
  row.abv = brand.abv;
  row.userModifiedAbv = true;
  row.showBrandDropdown = false;
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

function toggleFavoritesOnly() {
  onlyFavorites.value = !onlyFavorites.value;
}

function toggleFormFlavor(flavorId: string) {
  const set = new Set(addForm.value.flavors);
  if (set.has(flavorId)) {
    set.delete(flavorId);
  } else {
    set.add(flavorId);
  }
  addForm.value.flavors = Array.from(set);
}

const liveAbvData = computed(() => {
  const tempIngredients = addForm.value.ingredients
    .filter((i) => i.amount.trim() !== '')
    .map((i) => ({
      abv: i.abv,
      amount: i.amount,
      brandId: i.brandId,
      brandText: i.brandText,
      name: i.name,
      unit: i.unit,
    }));

  return calculateRecipeABV({
    base: addForm.value.base,
    ingredients: tempIngredients,
    method: addForm.value.method,
  });
});

function closeDetailModal() {
  activeDetailRecipeId.value = null;
  simulatedMethod.value = null;
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

function onImageError(e: Event) {
  const target = e.target as HTMLImageElement | null;
  if (target) {
    target.src = 'https://placehold.co/600x400/181b24/f59e0b?text=Cocktail';
  }
}

function openDetailModal(recipeId: string) {
  activeDetailRecipeId.value = recipeId;
  simulatedMethod.value = null;
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

function resetDetailMethodSimulator() {
  simulatedMethod.value = null;
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

function simulateDetailTechnique(technique: string) {
  simulatedMethod.value = technique;
}

function submitAddRecipe() {
  const validIngredients = addForm.value.ingredients
    .filter((i) => i.name.trim() !== '' && i.amount.trim() !== '')
    .map((i) => ({
      abv: i.abv,
      amount: i.amount,
      brandId: i.brandId,
      brandText: i.brandText,
      name: i.name,
      unit: i.unit,
    }));

  if (validIngredients.length === 0) {
    showToast('請至少填寫一項調酒材料！', 'fa-triangle-exclamation');
    return;
  }

  const validSteps = addForm.value.steps.map((s) => s.text.trim()).filter(Boolean);

  const newRecipe: Recipe = {
    author: addForm.value.author.trim() || 'BarCraft 調酒師',
    base: addForm.value.base,
    calculatedAbv: liveAbvData.value.abv,
    createdAt: Date.now(),
    desc: addForm.value.desc.trim(),
    flavors: addForm.value.flavors,
    garnish: addForm.value.garnish.trim() || '適量裝飾',
    glass: addForm.value.glass.trim() || '標準調酒杯',
    ice: addForm.value.ice.trim() || '方形冰塊',
    id: `recipe_${Date.now()}`,
    image:
      addForm.value.image ||
      `https://placehold.co/600x400/181b24/f59e0b?text=${encodeURIComponent(addForm.value.nameZh.trim())}`,
    ingredients: validIngredients,
    isFav: false,
    isLiked: false,
    likes: 0,
    method: addForm.value.method,
    nameEn: addForm.value.nameEn.trim(),
    nameZh: addForm.value.nameZh.trim(),
    steps: validSteps.length > 0 ? validSteps : ['將所有材料依照技法調製後倒入杯中即完成。'],
    strengthLevel: liveAbvData.value.strengthLevel,
  };

  recipes.value.unshift(newRecipe);
  saveRecipesToStorage();
  closeAddModal();
  showToast('成功發布新酒譜！', 'fa-circle-check');
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

const detailRecipe = computed(() => {
  if (!activeDetailRecipeId.value) {
    return null;
  }
  return recipes.value.find((r) => r.id === activeDetailRecipeId.value) || null;
});

const effectiveDetailRecipe = computed(() => {
  if (!detailRecipe.value) {
    return null;
  }
  if (!simulatedMethod.value) {
    return detailRecipe.value;
  }
  return {
    ...detailRecipe.value,
    method: simulatedMethod.value,
  };
});

const detailAbvData = computed(() => {
  return calculateRecipeABV(effectiveDetailRecipe.value);
});

const standardDrinkInfo = computed(() => {
  const pureGrams = detailAbvData.value.pureAlcoholMl * 0.8;
  const standardDrinks = Math.round((pureGrams / 10) * 10) / 10;
  const beerCans = Math.round((detailAbvData.value.pureAlcoholMl / 16.5) * 10) / 10;
  return {
    beerCans,
    pureGrams: Math.round(pureGrams * 10) / 10,
    standardDrinks,
  };
});

function isTechniqueActive(techId: string): boolean {
  const method = (effectiveDetailRecipe.value?.method || '').toLowerCase();
  return method.includes(techId.toLowerCase());
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

    <!-- Detail Modal -->
    <Teleport to="body">
      <div
        v-if="detailRecipe"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
        @click.self="closeDetailModal"
      >
        <div
          class="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-speakeasy-900 shadow-2xl transition-all"
        >
          <!-- Close Button -->
          <button
            class="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-slate-300 backdrop-blur transition-all hover:bg-black hover:text-white"
            type="button"
            @click="closeDetailModal"
          >
            <i class="fa-solid fa-xmark" />
          </button>

          <!-- Modal Scrollable Content -->
          <div class="max-h-[85vh] overflow-y-auto">
            <!-- Hero Header Image -->
            <div class="relative h-60 w-full bg-speakeasy-950 sm:h-72">
              <img
                :alt="detailRecipe.nameZh"
                class="size-full object-cover"
                :src="
                  detailRecipe.image || 'https://placehold.co/600x400/181b24/f59e0b?text=Cocktail'
                "
                @error="onImageError"
              />
              <div
                class="absolute inset-0 bg-gradient-to-t from-speakeasy-900 via-speakeasy-900/40 to-transparent"
              />

              <div class="absolute right-6 bottom-4 left-6">
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    class="rounded-md bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-speakeasy-950"
                  >
                    {{ detailRecipe.base }}
                  </span>
                  <span
                    class="rounded-md border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-200"
                  >
                    {{ effectiveDetailRecipe?.method || '調製法' }}
                  </span>
                  <span
                    class="rounded-md border px-2.5 py-0.5 font-mono text-xs font-bold"
                    :class="detailAbvData.strengthColor"
                  >
                    ~{{ detailAbvData.abv }}% ABV
                  </span>
                </div>
                <h2 class="font-serif text-2xl font-bold text-white sm:text-3xl">
                  {{ detailRecipe.nameZh }}
                </h2>
                <p class="font-serif text-xs text-slate-300 italic sm:text-sm">
                  {{ detailRecipe.nameEn || '' }}
                </p>
              </div>
            </div>

            <!-- Body Content -->
            <div class="space-y-6 p-6">
              <!-- Profile Badges (Glass, Ice, Garnish) -->
              <div
                class="grid grid-cols-3 gap-3 rounded-2xl border border-white/5 bg-speakeasy-850 p-3.5 text-center text-xs"
              >
                <div class="rounded-xl p-2">
                  <span class="mb-1 block text-slate-400">推薦杯型</span>
                  <span class="font-medium text-amber-300">{{
                    detailRecipe.glass || '標準調酒杯'
                  }}</span>
                </div>
                <div class="rounded-xl border-x border-white/10 p-2">
                  <span class="mb-1 block text-slate-400">冰塊種類</span>
                  <span class="font-medium text-amber-300">{{
                    detailRecipe.ice || '方形冰塊'
                  }}</span>
                </div>
                <div class="rounded-xl p-2">
                  <span class="mb-1 block text-slate-400">風味裝飾</span>
                  <span class="font-medium text-amber-300">{{
                    detailRecipe.garnish || '適量裝飾'
                  }}</span>
                </div>
              </div>

              <!-- ABV Science Breakdown Card -->
              <div class="space-y-3 rounded-2xl border border-white/10 bg-speakeasy-850/70 p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-flask-vial text-sm text-amber-400" />
                    <span class="text-xs font-semibold text-slate-200">
                      酒精濃度推估與物理融水分析 (ABV Engine)
                    </span>
                  </div>
                  <span
                    class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    :class="detailAbvData.strengthColor"
                  >
                    {{ detailAbvData.strengthLabel }}
                  </span>
                </div>

                <!-- Key Metrics Grid -->
                <div class="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                  <div class="rounded-xl border border-white/5 bg-speakeasy-900 p-2.5">
                    <span class="block text-[10px] text-slate-400">最終預估 ABV</span>
                    <span class="font-mono text-base font-bold text-amber-400"
                      >{{ detailAbvData.abv }}%</span
                    >
                  </div>
                  <div class="rounded-xl border border-white/5 bg-speakeasy-900 p-2.5">
                    <span class="block text-[10px] text-slate-400">技法融水稀釋</span>
                    <span class="font-mono text-base font-bold text-sky-400"
                      >+{{ detailAbvData.dilutionRate }}%</span
                    >
                  </div>
                  <div class="rounded-xl border border-white/5 bg-speakeasy-900 p-2.5">
                    <span class="block text-[10px] text-slate-400">純酒精淨重</span>
                    <span class="font-mono text-base font-bold text-rose-400"
                      >{{ detailAbvData.pureAlcoholMl }} ml</span
                    >
                  </div>
                  <div class="rounded-xl border border-white/5 bg-speakeasy-900 p-2.5">
                    <span class="block text-[10px] text-slate-400">出酒總量 (含融水)</span>
                    <span class="font-mono text-base font-bold text-emerald-400"
                      >{{ detailAbvData.dilutedMl }} ml</span
                    >
                  </div>
                </div>

                <!-- Liquid Structure Stacked Bar -->
                <div class="space-y-1.5 pt-1">
                  <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span class="font-medium text-slate-300"
                      >出杯液體結構比例 (Liquid Structure)</span
                    >
                    <span class="font-mono text-[10px]">
                      純酒精 {{ detailAbvData.pureAlcoholMl }}ml | 水份
                      {{ detailAbvData.mixersMl }}ml | 融冰 {{ detailAbvData.dilutionWaterMl }}ml
                    </span>
                  </div>
                  <div
                    class="flex h-3 w-full overflow-hidden rounded-full border border-white/10 bg-speakeasy-950 p-0.5"
                  >
                    <div
                      class="h-full rounded-l-full bg-rose-500 transition-all duration-500"
                      :style="{ width: `${detailAbvData.alcoholPct}%` }"
                      title="純酒精"
                    />
                    <div
                      class="h-full bg-emerald-500 transition-all duration-500"
                      :style="{ width: `${detailAbvData.mixersPct}%` }"
                      title="果汁與無酒精材料水份"
                    />
                    <div
                      class="h-full rounded-r-full bg-sky-400 transition-all duration-500"
                      :style="{ width: `${detailAbvData.dilutionPct}%` }"
                      title="技法融水"
                    />
                  </div>
                  <div
                    class="flex items-center justify-center gap-4 pt-0.5 text-[10px] text-slate-400"
                  >
                    <span class="flex items-center gap-1">
                      <span class="inline-block size-2 rounded-full bg-rose-500" />
                      純酒精
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="inline-block size-2 rounded-full bg-emerald-500" />
                      果汁/副材料水份
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="inline-block size-2 rounded-full bg-sky-400" />
                      冰塊融水
                    </span>
                  </div>
                </div>

                <!-- Standard Drink & Health Equivalent -->
                <div
                  class="flex items-center justify-between rounded-xl border border-white/5 bg-speakeasy-900/80 p-2.5 text-xs"
                >
                  <div class="flex items-center gap-2 text-slate-300">
                    <i class="fa-solid fa-beer-mug-empty text-amber-500" />
                    <span>標準酒精當量 (Standard Drinks)：</span>
                  </div>
                  <div class="text-right">
                    <span class="font-mono text-sm font-bold text-amber-400">
                      {{ standardDrinkInfo.standardDrinks }} 單位 ({{
                        standardDrinkInfo.pureGrams
                      }}g)
                    </span>
                    <span class="ml-1 text-[10px] text-slate-400">
                      (約 {{ standardDrinkInfo.beerCans }} 罐啤酒)
                    </span>
                  </div>
                </div>

                <!-- Technique Dilution Simulator -->
                <div class="border-t border-white/5 pt-1.5">
                  <div class="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span class="flex items-center gap-1">
                      <i class="fa-solid fa-sliders text-amber-400" />
                      <span>技法融水模擬（測試不同調製法的濃度變化）：</span>
                    </span>
                    <button
                      class="text-[10px] text-amber-400/80 hover:text-amber-300"
                      type="button"
                      @click="resetDetailMethodSimulator"
                    >
                      恢復預設
                    </button>
                  </div>
                  <div class="grid grid-cols-5 gap-1 text-center">
                    <button
                      v-for="tech in simulationTechniques"
                      :key="tech.id"
                      class="rounded-lg px-2 py-1 text-[10px] transition-all"
                      :class="
                        isTechniqueActive(tech.id)
                          ? 'border border-amber-500 bg-amber-500/20 font-bold text-amber-300'
                          : 'border border-white/10 bg-speakeasy-900 text-slate-300 hover:border-amber-500/50'
                      "
                      type="button"
                      @click="simulateDetailTechnique(tech.id)"
                    >
                      {{ tech.label }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Flavor Profile Tags Section in Modal -->
              <div>
                <span
                  class="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
                  >風味調性 (Flavor Profile)</span
                >
                <div
                  v-if="detailRecipe.flavors && detailRecipe.flavors.length > 0"
                  class="flex flex-wrap gap-2"
                >
                  <span
                    v-for="fId in detailRecipe.flavors"
                    :key="fId"
                    class="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300"
                  >
                    <i :class="['fa-solid', getFlavorInfo(fId)?.icon || 'fa-tag', 'text-xs']" />
                    <span>{{ getFlavorInfo(fId)?.primaryZh || fId }}</span>
                  </span>
                </div>
                <span v-else class="text-xs text-slate-500">未特別指定風味</span>
              </div>

              <!-- Description -->
              <div>
                <span
                  class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
                  >酒譜介紹</span
                >
                <p class="text-xs leading-relaxed text-slate-300 sm:text-sm">
                  {{ detailRecipe.desc || '暫無風味詳細描述。' }}
                </p>
              </div>

              <!-- Ingredients List with Brand Tags -->
              <div>
                <span
                  class="mb-2.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
                  >調配材料與指定品牌</span
                >
                <div class="space-y-2">
                  <div
                    v-for="(ing, idx) in detailRecipe.ingredients"
                    :key="idx"
                    class="flex items-center justify-between rounded-xl border border-white/5 bg-speakeasy-850/60 p-2.5 text-xs sm:text-sm"
                  >
                    <div class="flex items-center gap-2">
                      <i class="fa-solid fa-circle-dot text-[8px] text-amber-500" />
                      <span class="font-medium text-white">{{ ing.name }}</span>
                      <span
                        v-if="ing.brandText"
                        class="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300"
                      >
                        <i class="fa-solid fa-tag text-[8px]" />
                        <span>{{ ing.brandText }}</span>
                      </span>
                    </div>
                    <div class="font-mono text-slate-300">
                      {{ ing.amount }} {{ ing.unit || '' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Preparation Steps -->
              <div>
                <span
                  class="mb-2.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
                  >調製步驟</span
                >
                <ol class="list-inside list-decimal space-y-2 text-xs text-slate-300 sm:text-sm">
                  <li v-for="(step, sIdx) in detailRecipe.steps" :key="sIdx" class="pl-1">
                    {{ step }}
                  </li>
                </ol>
              </div>

              <!-- Author Info & Interaction Footer -->
              <div
                class="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400"
              >
                <span>
                  <i class="fa-solid fa-user-pen mr-1" />
                  配方提供：{{ detailRecipe.author || 'BarCraft 調酒師' }}
                </span>
                <div class="flex items-center gap-3">
                  <button
                    class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors"
                    :class="
                      detailRecipe.isLiked
                        ? 'border border-rose-500/30 bg-rose-500/20 text-rose-400'
                        : 'bg-speakeasy-800 text-slate-300 hover:bg-speakeasy-750'
                    "
                    type="button"
                    @click="toggleLike(detailRecipe.id)"
                  >
                    <i
                      :class="
                        detailRecipe.isLiked
                          ? 'fa-solid fa-heart text-rose-400'
                          : 'fa-regular fa-heart text-rose-400'
                      "
                    />
                    <span>{{ detailRecipe.likes || 0 }}</span>
                  </button>
                  <button
                    class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-colors"
                    :class="
                      detailRecipe.isFav
                        ? 'bg-amber-500 text-speakeasy-950'
                        : 'bg-speakeasy-800 text-slate-300 hover:bg-speakeasy-750'
                    "
                    type="button"
                    @click="toggleFavorite(detailRecipe.id)"
                  >
                    <i
                      :class="
                        detailRecipe.isFav
                          ? 'fa-solid fa-bookmark'
                          : 'fa-regular fa-bookmark text-amber-400'
                      "
                    />
                    <span>{{ detailRecipe.isFav ? '已收藏' : '收藏' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Add Recipe Modal -->
    <Teleport to="body">
      <div
        v-if="isAddModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
        @click.self="closeAddModal"
      >
        <div
          class="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-speakeasy-900 shadow-2xl transition-all"
        >
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between border-b border-white/10 bg-speakeasy-850/50 p-6"
          >
            <div>
              <h2 class="font-serif text-xl font-bold text-white">新增自訂調酒酒譜</h2>
              <p class="mt-0.5 text-xs text-slate-400">
                標註配方品牌、多選風味，並透過融水模型即時預估出杯酒精度
              </p>
            </div>
            <button
              class="flex size-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              type="button"
              @click="closeAddModal"
            >
              <i class="fa-solid fa-xmark" />
            </button>
          </div>

          <!-- Form Content -->
          <form
            class="max-h-[80vh] space-y-6 overflow-y-auto p-6"
            @submit.prevent="submitAddRecipe"
          >
            <!-- Cocktail Basic Info -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                  中文名稱 <span class="text-rose-400">*</span>
                </label>
                <input
                  v-model="addForm.nameZh"
                  class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  placeholder="例如：內格羅尼"
                  required
                  type="text"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                  英文 / 原文品名
                </label>
                <input
                  v-model="addForm.nameEn"
                  class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  placeholder="例如：Negroni"
                  type="text"
                />
              </div>
            </div>

            <!-- Spirit Base, Technique & Bartender Author -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                  主要基酒 <span class="text-rose-400">*</span>
                </label>
                <select
                  v-model="addForm.base"
                  class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                  required
                >
                  <option value="Gin">琴酒 (Gin)</option>
                  <option value="Whiskey">威士忌 (Whisky)</option>
                  <option value="Rum">蘭姆酒 (Rum)</option>
                  <option value="Tequila">龍舌蘭 (Tequila)</option>
                  <option value="Vodka">伏特加 (Vodka)</option>
                  <option value="Brandy">白蘭地 (Brandy)</option>
                  <option value="Other">其他 / 無酒精 (Mocktail)</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                  調製技法
                </label>
                <select
                  v-model="addForm.method"
                  class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Stir (攪拌法)">Stir (攪拌法 / 稀釋率約 22%)</option>
                  <option value="Shake (搖盪法)">Shake (搖盪法 / 稀釋率約 33%)</option>
                  <option value="Build (直調法)">Build (直調法 / 稀釋率約 18%)</option>
                  <option value="Blend (霜凍法)">Blend (霜凍法 / 稀釋率約 45%)</option>
                  <option value="Layer (分層法)">Layer (分層法 / 無稀釋 0%)</option>
                </select>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                  調酒師署名
                </label>
                <input
                  v-model="addForm.author"
                  class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  placeholder="例如：BarCraft Master"
                  type="text"
                />
              </div>
            </div>

            <!-- Glass, Ice & Garnish with Datalist Suggestions -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                  建議杯型
                </label>
                <input
                  v-model="addForm.glass"
                  class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  list="glassPresets"
                  placeholder="例如：古典杯"
                  type="text"
                />
                <datalist id="glassPresets">
                  <option value="古典杯 (Rocks / Old Fashioned Glass)" />
                  <option value="馬丁尼杯 (Martini / Cocktail Glass)" />
                  <option value="高球杯 (Highball / Collins Glass)" />
                  <option value="碟型香檳杯 (Coupe Glass)" />
                  <option value="尼克與諾拉杯 (Nick & Nora Glass)" />
                </datalist>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                  冰塊類型
                </label>
                <input
                  v-model="addForm.ice"
                  class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  list="icePresets"
                  placeholder="例如：手鑿大方冰"
                  type="text"
                />
                <datalist id="icePresets">
                  <option value="手鑿大方老冰 (Clear Ice Cube)" />
                  <option value="方形實心冰塊 (Cubed Ice)" />
                  <option value="純淨冰球 (Ice Sphere)" />
                  <option value="碎冰 (Crushed Ice)" />
                  <option value="純飲無冰 (Straight Up / Neat)" />
                </datalist>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                  裝飾物 (Garnish)
                </label>
                <input
                  v-model="addForm.garnish"
                  class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  list="garnishPresets"
                  placeholder="例如：橙皮捲"
                  type="text"
                />
                <datalist id="garnishPresets">
                  <option value="橙皮捲 (Orange Twist)" />
                  <option value="檸檬皮油 (Lemon Peel)" />
                  <option value="油漬橄欖 (Green Olive)" />
                  <option value="酒漬櫻桃 (Maraschino Cherry)" />
                  <option value="新鮮薄荷葉 (Fresh Mint)" />
                </datalist>
              </div>
            </div>

            <!-- Flavor Multi-Select Picker -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                風味標籤 (可複選)
              </label>
              <div
                class="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-speakeasy-850 p-3"
              >
                <button
                  v-for="flavor in TAXONOMY.flavors"
                  :key="flavor.id"
                  class="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all"
                  :class="
                    addForm.flavors.includes(flavor.id)
                      ? 'bg-amber-500 font-bold text-speakeasy-950 shadow-md shadow-amber-500/20'
                      : 'border border-white/10 bg-speakeasy-900 text-slate-300 hover:bg-speakeasy-800'
                  "
                  type="button"
                  @click="toggleFormFlavor(flavor.id)"
                >
                  <i :class="['fa-solid', flavor.icon, 'text-[10px]']" />
                  <span>{{ flavor.primaryZh }}</span>
                </button>
              </div>
            </div>

            <!-- Ingredients Section with Brand Tags -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <label
                  class="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase"
                >
                  <span>調配材料、指定品牌與酒精濃度</span>
                  <span class="text-rose-400">*</span>
                </label>
                <button
                  class="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                  type="button"
                  @click="addIngredientRow"
                >
                  <i class="fa-solid fa-plus-circle" /> 新增一列材料
                </button>
              </div>

              <div class="space-y-2.5">
                <div
                  v-for="(row, rIdx) in addForm.ingredients"
                  :key="row.id"
                  class="relative grid grid-cols-1 items-center gap-2 rounded-2xl border border-white/5 bg-speakeasy-950/80 p-2.5 sm:grid-cols-12"
                >
                  <!-- Material Name Input -->
                  <div class="relative sm:col-span-4">
                    <input
                      v-model="row.name"
                      class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      placeholder="材料名稱 (如: 琴酒)"
                      required
                      type="text"
                      @input="onIngredientNameChange(rIdx)"
                    />
                  </div>

                  <!-- Brand Autocomplete Input -->
                  <div class="relative sm:col-span-3">
                    <input
                      v-model="row.brandText"
                      autocomplete="off"
                      class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-3 py-1.5 text-xs text-amber-300 focus:border-amber-500 focus:outline-none"
                      placeholder="指定品牌 (選填)"
                      type="text"
                      @focus="row.showBrandDropdown = true"
                      @input="
                        row.showBrandDropdown = true;
                        onIngredientNameChange(rIdx);
                      "
                    />
                    <div
                      v-if="row.showBrandDropdown && getBrandSuggestions(row.brandText).length > 0"
                      class="absolute top-full left-0 z-30 mt-1 max-h-48 w-64 overflow-y-auto rounded-xl border border-white/15 bg-speakeasy-900 shadow-2xl"
                    >
                      <div
                        v-for="brand in getBrandSuggestions(row.brandText)"
                        :key="brand.id"
                        class="cursor-pointer border-b border-white/5 p-2.5 transition-colors last:border-0 hover:bg-amber-500/20"
                        @click="selectBrand(rIdx, brand)"
                      >
                        <div class="flex items-center justify-between">
                          <span class="text-xs font-semibold text-amber-300">
                            {{ brand.primaryEn }}
                          </span>
                          <span
                            class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"
                          >
                            {{ brand.abv }}% ABV
                          </span>
                        </div>
                        <div class="mt-0.5 text-[10px] text-slate-400">
                          {{ brand.primaryZh }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Dosage Amount -->
                  <div class="sm:col-span-2">
                    <input
                      v-model="row.amount"
                      class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-3 py-1.5 text-center text-xs text-white focus:border-amber-500 focus:outline-none"
                      placeholder="份量"
                      required
                      type="text"
                    />
                  </div>

                  <!-- Unit Selector -->
                  <div class="sm:col-span-1">
                    <select
                      v-model="row.unit"
                      class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-1 py-1.5 text-[11px] text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="ml">ml</option>
                      <option value="oz">oz</option>
                      <option value="dashes">滴</option>
                      <option value="bar spoon">匙</option>
                      <option value="補滿">補滿</option>
                    </select>
                  </div>

                  <!-- ABV Input -->
                  <div class="sm:col-span-1">
                    <input
                      v-model.number="row.abv"
                      class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-1.5 py-1.5 text-center font-mono text-[11px] text-amber-400 focus:border-amber-500 focus:outline-none"
                      max="100"
                      min="0"
                      placeholder="%"
                      step="0.1"
                      title="材料酒精濃度 (%)"
                      type="number"
                      @input="row.userModifiedAbv = true"
                    />
                  </div>

                  <!-- Delete Row -->
                  <div class="text-center sm:col-span-1">
                    <button
                      class="p-1 text-xs text-slate-500 transition-colors hover:text-rose-400"
                      type="button"
                      @click="removeIngredientRow(rIdx)"
                    >
                      <i class="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Live ABV Estimation Box -->
              <div
                class="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-speakeasy-950 p-4 shadow-inner"
              >
                <div
                  class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-xl text-amber-400"
                    >
                      <i class="fa-solid fa-gauge-high" />
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-200">
                          出酒酒精濃度即時預估 (Live ABV)
                        </span>
                        <span
                          class="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                          :class="liveAbvData.strengthColor"
                        >
                          {{ liveAbvData.strengthLabel }}
                        </span>
                      </div>
                      <div class="mt-0.5 text-[11px] text-slate-400">
                        純酒精 {{ liveAbvData.pureAlcoholMl }} ml · 融水 +{{
                          liveAbvData.dilutionRate
                        }}% ({{ liveAbvData.dilutionWaterMl }}ml) · 預估出酒量 ~{{
                          liveAbvData.dilutedMl
                        }}
                        ml
                      </div>
                    </div>
                  </div>
                  <div class="flex items-baseline gap-1 self-end text-right sm:self-auto">
                    <span class="font-mono text-xs text-slate-400">預估</span>
                    <span class="font-mono text-2xl font-extrabold text-amber-400">
                      {{ liveAbvData.abv }}%
                    </span>
                    <span class="font-mono text-xs text-slate-400">ABV</span>
                  </div>
                </div>

                <!-- Mini composition meter -->
                <div
                  class="flex h-2 w-full overflow-hidden rounded-full border border-white/5 bg-speakeasy-900"
                >
                  <div
                    class="h-full bg-rose-500 transition-all duration-300"
                    :style="{ width: `${liveAbvData.alcoholPct}%` }"
                    title="純酒精"
                  />
                  <div
                    class="h-full bg-emerald-500 transition-all duration-300"
                    :style="{ width: `${liveAbvData.mixersPct}%` }"
                    title="副材料水份"
                  />
                  <div
                    class="h-full bg-sky-400 transition-all duration-300"
                    :style="{ width: `${liveAbvData.dilutionPct}%` }"
                    title="融水"
                  />
                </div>
              </div>
            </div>

            <!-- Steps Section -->
            <div>
              <div class="mb-2 flex items-center justify-between">
                <label class="text-xs font-semibold text-slate-300 uppercase"
                  >調製步驟 (Steps)</label
                >
                <button
                  class="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                  type="button"
                  @click="addStepRow"
                >
                  <i class="fa-solid fa-plus-circle" /> 新增步驟
                </button>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(step, sIdx) in addForm.steps"
                  :key="step.id"
                  class="flex items-start gap-2"
                >
                  <span class="mt-2.5 w-5 text-right font-mono text-xs font-bold text-amber-500">
                    {{ sIdx + 1 }}.
                  </span>
                  <textarea
                    v-model="step.text"
                    class="flex-1 rounded-xl border border-white/10 bg-speakeasy-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                    placeholder="填寫調製步驟..."
                    rows="1"
                  />
                  <button
                    class="p-2 text-xs text-slate-500 transition-colors hover:text-rose-400"
                    type="button"
                    @click="removeStepRow(sIdx)"
                  >
                    <i class="fa-solid fa-trash-can" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                風味描述與故事靈感
              </label>
              <textarea
                v-model="addForm.desc"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                placeholder="分享這杯酒的風味輪廓、口感平衡或創作故事..."
                rows="2"
              />
            </div>

            <!-- Image Upload Section -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                上傳照片
              </label>
              <div class="flex items-center gap-4">
                <div
                  class="relative flex size-24 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-speakeasy-850 text-slate-400"
                >
                  <img
                    v-if="addForm.image"
                    :alt="addForm.nameZh || '預覽照片'"
                    class="size-full object-cover"
                    :src="addForm.image"
                  />
                  <template v-else>
                    <i class="fa-solid fa-image mb-1 text-2xl text-slate-500" />
                    <span class="text-[10px]">預覽照片</span>
                  </template>
                </div>
                <div class="flex-1">
                  <input
                    accept="image/*"
                    class="cursor-pointer text-xs text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-speakeasy-950 hover:file:bg-amber-400"
                    type="file"
                    @change="handleImageUpload"
                  />
                  <p class="mt-1 text-[11px] text-slate-400">
                    支援 JPG、PNG，若無上傳將自動套用預設高質感圖片。
                  </p>
                </div>
              </div>
            </div>

            <!-- Form Action Buttons -->
            <div class="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                class="rounded-xl px-5 py-2.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white sm:text-sm"
                type="button"
                @click="closeAddModal"
              >
                取消
              </button>
              <button
                class="rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2.5 text-xs font-semibold text-speakeasy-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 active:scale-95 sm:text-sm"
                type="submit"
              >
                發布酒譜
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

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
