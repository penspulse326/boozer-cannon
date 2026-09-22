<script setup lang="ts">
import { computed, ref } from 'vue';

import type { Recipe } from '~/types/cocktail';

import AppToast from '~/components/app-toast.vue';
import { useRecipeFilters } from '~/composables/useRecipeFilters';
import { useRecipeStore } from '~/composables/useRecipeStore';
import { useToast } from '~/composables/useToast';
import AddRecipeModal from '~/containers/add-recipe-modal.vue';
import AppFooter from '~/containers/app-footer.vue';
import FilterToolbar from '~/containers/filter-toolbar.vue';
import HeroSection from '~/containers/hero-section.vue';
import RecipeDetailModal from '~/containers/recipe-detail-modal.vue';
import RecipeGrid from '~/containers/recipe-grid.vue';
import TheHeader from '~/containers/the-header.vue';

const { showToast, toast } = useToast();
const { addRecipe, recipes, toggleFavorite, toggleLike } = useRecipeStore(showToast);

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
} = useRecipeFilters(recipes);

const activeDetailRecipeId = ref<null | string>(null);
const activeDetailRecipe = computed(() => {
  if (!activeDetailRecipeId.value) {
    return null;
  }
  return recipes.value.find((r) => r.id === activeDetailRecipeId.value) || null;
});

const isAddModalOpen = ref(false);

function closeDetailModal() {
  activeDetailRecipeId.value = null;
}

function handleAddRecipe(newRecipe: Recipe) {
  addRecipe(newRecipe);
  isAddModalOpen.value = false;
}

function openDetailModal(recipeId: string) {
  activeDetailRecipeId.value = recipeId;
}
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
      :recipe="activeDetailRecipe"
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
