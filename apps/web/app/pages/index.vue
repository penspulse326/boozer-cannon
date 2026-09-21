<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { Recipe } from '~/types/cocktail';

import AppToast from '~/components/app-toast.vue';
import AddRecipeModal from '~/containers/add-recipe-modal.vue';
import AppFooter from '~/containers/app-footer.vue';
import FilterToolbar from '~/containers/filter-toolbar.vue';
import HeroSection from '~/containers/hero-section.vue';
import RecipeDetailModal from '~/containers/recipe-detail-modal.vue';
import RecipeGrid from '~/containers/recipe-grid.vue';
import TheHeader from '~/containers/the-header.vue';
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

const activeDetailRecipeId = ref<null | string>(null);
const isAddModalOpen = ref(false);

const toast = ref({
  icon: 'fa-circle-check',
  message: '',
  show: false,
});
let toastTimer: null | ReturnType<typeof setTimeout> = null;

onMounted(() => {
  loadRecipes();
});

function closeDetailModal() {
  activeDetailRecipeId.value = null;
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

function handleAddRecipe(newRecipe: Recipe) {
  recipes.value.unshift(newRecipe);
  saveRecipesToStorage();
  isAddModalOpen.value = false;
  showToast('成功發布新酒譜！', 'fa-circle-check');
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

function openDetailModal(recipeId: string) {
  activeDetailRecipeId.value = recipeId;
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
</script>

<template>
  <div
    class="min-h-screen bg-speakeasy-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-speakeasy-950"
  >
    <TheHeader
      v-model:search-query="searchQuery"
      :only-favorites="onlyFavorites"
      @open-add-modal="isAddModalOpen = true"
      @reset-all="resetAllFilters"
      @toggle-favorites="onlyFavorites = !onlyFavorites"
    />

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <HeroSection />

      <FilterToolbar
        v-model:abv-filter="currentAbvFilter"
        v-model:category="currentCategory"
        v-model:flavor="currentFlavor"
        v-model:sort="currentSort"
        :only-favorites="onlyFavorites"
        :recipe-count="filteredRecipes.length"
        :search-query="searchQuery"
        @reset-all="resetAllFilters"
      />

      <RecipeGrid
        :recipes="filteredRecipes"
        @filter-flavor="setFlavorFilter"
        @reset-filters="resetAllFilters"
        @select-recipe="openDetailModal"
        @toggle-fav="toggleFavorite"
        @toggle-like="toggleLike"
      />
    </main>

    <RecipeDetailModal
      :recipe-id="activeDetailRecipeId"
      :recipes="recipes"
      @close="closeDetailModal"
      @toggle-fav="toggleFavorite"
      @toggle-like="toggleLike"
    />

    <AddRecipeModal
      :is-open="isAddModalOpen"
      @close="isAddModalOpen = false"
      @error="(msg, icon) => showToast(msg, icon)"
      @submit="handleAddRecipe"
    />

    <AppToast :icon="toast.icon" :message="toast.message" :show="toast.show" />

    <AppFooter />
  </div>
</template>
