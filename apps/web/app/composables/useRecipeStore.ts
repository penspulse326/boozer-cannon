import type { ApiRecipeItem, GetRecipesQueryDto, PaginatedResult } from '@boozer/shared/dto';

import { onMounted, ref } from 'vue';

import type { Recipe } from '~/types/cocktail';

import { useToast } from '~/composables/useToast';
import { STORAGE_KEY } from '~/utils/constants';
import { mapApiRecipeToRecipe } from '~/utils/recipeAdapter';
import { DEFAULT_RECIPES } from '~/utils/seedData';

const recipes = ref<Recipe[]>([]);
const isLoading = ref(false);
const error = ref<null | string>(null);
let isInitialized = false;

export function useRecipeStore(onNotify?: (message: string, icon?: string) => void) {
  const { showToast } = useToast();

  function notify(message: string, icon = 'fa-circle-check') {
    if (onNotify) {
      onNotify(message, icon);
    } else {
      showToast(message, icon);
    }
  }

  function getLocalInteractions(): {
    favorites: Set<string>;
    likes: Set<string>;
  } {
    if (!import.meta.client || typeof globalThis.localStorage === 'undefined') {
      return { favorites: new Set(), likes: new Set() };
    }
    try {
      const stored = globalThis.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { favorites: new Set(), likes: new Set() };
      }
      const parsed: Recipe[] = JSON.parse(stored);
      const favorites = new Set(parsed.filter((r) => r.isFav).map((r) => r.id));
      const likes = new Set(parsed.filter((r) => r.isLiked).map((r) => r.id));
      return { favorites, likes };
    } catch {
      return { favorites: new Set(), likes: new Set() };
    }
  }

  function saveRecipesToStorage() {
    if (import.meta.client && typeof globalThis.localStorage !== 'undefined') {
      globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes.value));
    }
  }

  async function fetchRecipes(query?: GetRecipesQueryDto) {
    isLoading.value = true;
    error.value = null;

    try {
      const res = await $fetch<PaginatedResult<ApiRecipeItem>>('/api/recipes', {
        query,
      });

      const { favorites, likes } = getLocalInteractions();

      recipes.value = (res.data || []).map((item) => {
        const mapped = mapApiRecipeToRecipe(item);
        if (favorites.has(mapped.id)) {
          mapped.isFav = true;
        }
        if (likes.has(mapped.id)) {
          mapped.isLiked = true;
        }
        return mapped;
      });
    } catch (err: unknown) {
      const fetchError = err as { data?: { message?: string }; message?: string };
      error.value =
        fetchError.data?.message ||
        fetchError.message ||
        '無法連線至伺服器讀取酒譜，請檢查網路狀態或重試。';
      if (recipes.value.length === 0) {
        recipes.value = [...DEFAULT_RECIPES];
      }
    } finally {
      isLoading.value = false;
    }
  }

  function retry() {
    return fetchRecipes();
  }

  async function fetchRecipeById(id: string): Promise<null | Recipe> {
    try {
      const item = await $fetch<ApiRecipeItem>(`/api/recipes/${id}`);
      const { favorites, likes } = getLocalInteractions();
      const mapped = mapApiRecipeToRecipe(item);
      if (favorites.has(mapped.id)) {
        mapped.isFav = true;
      }
      if (likes.has(mapped.id)) {
        mapped.isLiked = true;
      }

      const index = recipes.value.findIndex((r) => r.id === id);
      if (index !== -1) {
        recipes.value[index] = mapped;
      } else {
        recipes.value.push(mapped);
      }
      return mapped;
    } catch {
      return recipes.value.find((r) => r.id === id) || null;
    }
  }

  function addRecipe(newRecipe: Recipe) {
    recipes.value.unshift(newRecipe);
    saveRecipesToStorage();
    notify('成功發布新酒譜！', 'fa-circle-check');
  }

  function toggleFavorite(id: string) {
    const recipe = recipes.value.find((r) => r.id === id);
    if (!recipe) {
      return;
    }
    recipe.isFav = !recipe.isFav;
    saveRecipesToStorage();
    notify(recipe.isFav ? '已加入我的收藏' : '已從收藏中移除', 'fa-bookmark');
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
    if (!isInitialized) {
      fetchRecipes();
      isInitialized = true;
    }
  });

  return {
    addRecipe,
    error,
    fetchRecipeById,
    fetchRecipes,
    isLoading,
    recipes,
    retry,
    saveRecipesToStorage,
    toggleFavorite,
    toggleLike,
  };
}
