<script setup lang="ts">
import type { Recipe } from '~/types/cocktail';

import EmptyState from '~/components/common/empty-state.vue';
import RecipeCard from '~/components/recipe/recipe-card.vue';

withDefaults(
  defineProps<{
    error?: null | string;
    isLoading?: boolean;
    recipes: Recipe[];
  }>(),
  {
    error: null,
    isLoading: false,
  },
);

defineEmits<{
  (e: 'filter-flavor', flavorId: string): void;
  (e: 'reset-filters'): void;
  (e: 'retry'): void;
  (e: 'select-recipe', recipeId: string): void;
  (e: 'toggle-fav', recipeId: string): void;
  (e: 'toggle-like', recipeId: string): void;
}>();
</script>

<template>
  <div>
    <!-- 1. Skeleton Loading State -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="recipe-skeleton-grid"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-900/60 shadow-lg"
      >
        <div class="aspect-4/3 w-full animate-pulse bg-neutral-800/80" />
        <div class="space-y-4 p-5">
          <div class="flex items-center justify-between">
            <div class="h-4 w-20 animate-pulse rounded bg-neutral-800" />
            <div class="h-4 w-12 animate-pulse rounded bg-neutral-800" />
          </div>
          <div class="h-6 w-3/4 animate-pulse rounded bg-neutral-800" />
          <div class="h-4 w-full animate-pulse rounded bg-neutral-800" />
          <div class="flex gap-2 pt-2">
            <div class="h-6 w-16 animate-pulse rounded-full bg-neutral-800/80" />
            <div class="h-6 w-16 animate-pulse rounded-full bg-neutral-800/80" />
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Error Retry State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center"
      data-testid="recipe-error-state"
    >
      <div
        class="mb-4 flex size-12 items-center justify-center rounded-full bg-red-500/10 text-red-400"
      >
        <i class="fa-solid fa-triangle-exclamation text-xl"></i>
      </div>
      <h3 class="text-base font-semibold text-neutral-200">無法載入酒譜資料</h3>
      <p class="mt-1 max-w-md text-sm text-neutral-400">
        {{ error }}
      </p>
      <button
        type="button"
        class="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        @click="$emit('retry')"
      >
        <i class="fa-solid fa-rotate-right"></i>
        重新嘗試
      </button>
    </div>

    <!-- 3. Recipes List State -->
    <div
      v-else-if="recipes.length > 0"
      class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="recipe-grid"
    >
      <RecipeCard
        v-for="recipe in recipes"
        :key="recipe.id"
        :recipe="recipe"
        @filter-flavor="$emit('filter-flavor', $event)"
        @select="$emit('select-recipe', $event)"
        @toggle-fav="$emit('toggle-fav', recipe.id)"
        @toggle-like="$emit('toggle-like', recipe.id)"
      />
    </div>

    <!-- 4. Empty State -->
    <EmptyState v-else @reset="$emit('reset-filters')" />
  </div>
</template>
