import type {
  CreateRecipeDto,
  GetRecipesQueryDto,
  PaginatedResult,
  RecipeDto,
  ToggleFavoriteResponseDto,
  ToggleLikeResponseDto,
} from '@boozer/shared/dto';

import { getCurrentInstance, onMounted, ref } from 'vue';

import type { Recipe } from '~/types/cocktail';

import { useToast } from '~/composables/useToast';
import { STORAGE_KEY } from '~/utils/constants';
import { mapRecipeDtoToRecipe } from '~/utils/recipeAdapter';
import { DEFAULT_RECIPES } from '~/utils/seedData';

const recipes = ref<Recipe[]>([]);
const isLoading = ref(false);
const error = ref<null | string>(null);
let isInitialized = false;

const getFetch = () => (globalThis.$fetch || $fetch) as typeof $fetch;

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
      const res = await getFetch()<PaginatedResult<RecipeDto>>('/api/recipes', {
        query,
      });

      const { favorites, likes } = getLocalInteractions();

      recipes.value = (res.data || []).map((item) => {
        const mapped = mapRecipeDtoToRecipe(item);
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
      const item = await getFetch()<RecipeDto>(`/api/recipes/${id}`);
      const { favorites, likes } = getLocalInteractions();
      const mapped = mapRecipeDtoToRecipe(item);
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

  async function addRecipe(newRecipe: CreateRecipeDto | Recipe): Promise<null | Recipe> {
    try {
      const payload: CreateRecipeDto = {
        baseSpirit:
          ('base' in newRecipe && newRecipe.base) ||
          ('baseSpirit' in newRecipe && newRecipe.baseSpirit) ||
          '',
        calculatedAbv: newRecipe.calculatedAbv ? Number(newRecipe.calculatedAbv) : null,
        desc:
          ('desc' in newRecipe ? newRecipe.desc : 'story' in newRecipe ? newRecipe.story : '') ||
          null,
        flavors: newRecipe.flavors || [],
        garnish: ('garnish' in newRecipe ? newRecipe.garnish : '') || null,
        glassCustom:
          ('glass' in newRecipe
            ? newRecipe.glass
            : 'glassCustom' in newRecipe
              ? newRecipe.glassCustom
              : '') || null,
        iceCustom:
          ('ice' in newRecipe
            ? newRecipe.ice
            : 'iceCustom' in newRecipe
              ? newRecipe.iceCustom
              : '') || null,
        imageUrl:
          ('image' in newRecipe
            ? newRecipe.image
            : 'imageUrl' in newRecipe
              ? newRecipe.imageUrl
              : '') || null,
        ingredients: (newRecipe.ingredients || []).map((ing, idx) => ({
          abv: ing.abv ? Number(ing.abv) : 0,
          amount: Number(ing.amount),
          brandCustom:
            ('brandText' in ing ? ing.brandText : 'brandCustom' in ing ? ing.brandCustom : '') ||
            null,
          brandEntityId:
            ('brandId' in ing ? ing.brandId : 'brandEntityId' in ing ? ing.brandEntityId : '') ||
            null,
          name: ing.name,
          sortOrder: idx + 1,
          unit: ing.unit || 'ml',
        })),
        instructions:
          'steps' in newRecipe && newRecipe.steps
            ? newRecipe.steps
            : 'instructions' in newRecipe && newRecipe.instructions
              ? newRecipe.instructions
              : [],
        method: newRecipe.method,
        nameEn: newRecipe.nameEn || null,
        nameZh: newRecipe.nameZh || null,
      };

      const res = await getFetch()<RecipeDto>('/api/recipes', {
        body: payload,
        method: 'POST',
      });

      const mapped = mapRecipeDtoToRecipe(res);
      recipes.value.unshift(mapped);
      saveRecipesToStorage();
      notify('成功發布新酒譜！', 'fa-circle-check');
      return mapped;
    } catch {
      if ('id' in newRecipe && typeof newRecipe.id === 'string') {
        recipes.value.unshift(newRecipe as Recipe);
        saveRecipesToStorage();
        notify('伺服器連線異常，酒譜已暫存於本機！', 'fa-triangle-exclamation');
        return newRecipe as Recipe;
      }
      notify('發布酒譜失敗，請重試！', 'fa-circle-exclamation');
      return null;
    }
  }

  async function toggleFavorite(id: string) {
    const recipe = recipes.value.find((r) => r.id === id);
    if (!recipe) {
      return;
    }

    const previousFav = recipe.isFav;
    recipe.isFav = !previousFav;
    saveRecipesToStorage();
    notify(recipe.isFav ? '已加入我的收藏' : '已從收藏中移除', 'fa-bookmark');

    try {
      const res = await getFetch()<ToggleFavoriteResponseDto>(`/api/recipes/${id}/favorite`, {
        method: 'POST',
      });
      recipe.isFav = res.isFavorite;
      saveRecipesToStorage();
    } catch {
      recipe.isFav = previousFav;
      saveRecipesToStorage();
      notify('收藏狀態更新失敗，請稍後重試', 'fa-circle-exclamation');
    }
  }

  async function toggleLike(id: string) {
    const recipe = recipes.value.find((r) => r.id === id);
    if (!recipe) {
      return;
    }

    const previousLiked = recipe.isLiked;
    const previousLikes = recipe.likes || 0;

    recipe.isLiked = !previousLiked;
    recipe.likes = Math.max(0, previousLikes + (recipe.isLiked ? 1 : -1));
    saveRecipesToStorage();

    try {
      const res = await getFetch()<ToggleLikeResponseDto>(`/api/recipes/${id}/like`, {
        method: 'POST',
      });
      recipe.isLiked = res.isLiked;
      recipe.likes = res.likesCount;
      saveRecipesToStorage();
    } catch {
      recipe.isLiked = previousLiked;
      recipe.likes = previousLikes;
      saveRecipesToStorage();
      notify('按讚失敗，請稍後重試', 'fa-circle-exclamation');
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      if (!isInitialized) {
        fetchRecipes();
        isInitialized = true;
      }
    });
  }

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
