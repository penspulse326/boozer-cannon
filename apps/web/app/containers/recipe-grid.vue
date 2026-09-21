<script setup lang="ts">
import type { Recipe } from '~/types/cocktail';

import EmptyState from '~/components/empty-state.vue';
import RecipeCard from '~/components/recipe-card.vue';

defineProps<{
  recipes: Recipe[];
}>();

defineEmits<{
  (e: 'filter-flavor', flavorId: string): void;
  (e: 'reset-filters'): void;
  (e: 'select-recipe', recipeId: string): void;
  (e: 'toggle-fav', recipeId: string): void;
  (e: 'toggle-like', recipeId: string): void;
}>();
</script>

<template>
  <div v-if="recipes.length > 0" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    <RecipeCard
      v-for="recipe in recipes"
      :key="recipe.id"
      :recipe="recipe"
      @click="$emit('select-recipe', recipe.id)"
      @filter-flavor="$emit('filter-flavor', $event)"
      @toggle-fav="$emit('toggle-fav', recipe.id)"
      @toggle-like="$emit('toggle-like', recipe.id)"
    />
  </div>
  <EmptyState v-else @reset="$emit('reset-filters')" />
</template>
