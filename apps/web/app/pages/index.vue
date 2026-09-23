<script setup lang="ts">
import { computed, ref } from 'vue';

import HeroSection from '~/components/layout/hero-section.vue';
import FilterToolbar from '~/components/recipe/filter-toolbar.vue';
import RecipeDetailModal from '~/components/recipe/recipe-detail-modal.vue';
import RecipeGrid from '~/components/recipe/recipe-grid.vue';
import { useRecipeFilters } from '~/composables/useRecipeFilters';
import { useRecipeStore } from '~/composables/useRecipeStore';

const { error, isLoading, recipes, retry, toggleFavorite, toggleLike } = useRecipeStore();

const {
  currentAbvFilter,
  currentCategory,
  currentFlavor,
  currentSort,
  filteredRecipes,
  onlyFavorites,
  resetAllFilters,
  searchQuery,
  setFlavorFilter,
} = useRecipeFilters();

const activeDetailRecipeId = ref<null | string>(null);
const activeDetailRecipe = computed(() => {
  if (!activeDetailRecipeId.value) {
    return null;
  }
  return recipes.value.find((r) => r.id === activeDetailRecipeId.value) || null;
});

function closeDetailModal() {
  activeDetailRecipeId.value = null;
}

function openDetailModal(recipeId: string) {
  activeDetailRecipeId.value = recipeId;
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
      :error="error"
      :is-loading="isLoading"
      :recipes="filteredRecipes"
      @filter-flavor="setFlavorFilter"
      @reset-filters="resetAllFilters"
      @retry="retry"
      @select-recipe="openDetailModal"
      @toggle-fav="toggleFavorite"
      @toggle-like="toggleLike"
    />

    <RecipeDetailModal
      :recipe="activeDetailRecipe"
      @close="closeDetailModal"
      @toggle-fav="toggleFavorite"
      @toggle-like="toggleLike"
    />
  </div>
</template>
