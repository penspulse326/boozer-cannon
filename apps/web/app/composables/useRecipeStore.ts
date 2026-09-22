import { onMounted, ref } from 'vue';

import type { Recipe } from '~/types/cocktail';

import { STORAGE_KEY } from '~/utils/constants';
import { DEFAULT_RECIPES } from '~/utils/seedData';

export function useRecipeStore(onNotify?: (message: string, icon?: string) => void) {
  const recipes = ref<Recipe[]>([]);

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

  function saveRecipesToStorage() {
    if (import.meta.client && typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes.value));
    }
  }

  function addRecipe(newRecipe: Recipe) {
    recipes.value.unshift(newRecipe);
    saveRecipesToStorage();
    if (onNotify) {
      onNotify('成功發布新酒譜！', 'fa-circle-check');
    }
  }

  function toggleFavorite(id: string) {
    const recipe = recipes.value.find((r) => r.id === id);
    if (!recipe) {
      return;
    }
    recipe.isFav = !recipe.isFav;
    saveRecipesToStorage();
    if (onNotify) {
      onNotify(recipe.isFav ? '已加入我的收藏' : '已從收藏中移除', 'fa-bookmark');
    }
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

  onMounted(() => {
    loadRecipes();
  });

  return {
    addRecipe,
    loadRecipes,
    recipes,
    saveRecipesToStorage,
    toggleFavorite,
    toggleLike,
  };
}
