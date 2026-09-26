import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Recipe } from '~/types/cocktail';

import { useRecipeStore } from '~/composables/useRecipeStore';

describe('useRecipeStore - toggleLike and toggleFavorite', () => {
  const mockRecipe: Recipe = {
    author: 'Chief Bartender',
    base: 'Gin',
    desc: 'Test Description',
    flavors: [],
    garnish: 'Orange peel',
    glass: 'Rocks',
    ice: 'Cube',
    id: '10000000-0000-0000-0000-000000000001',
    ingredients: [],
    isFav: false,
    isLiked: false,
    likes: 5,
    method: 'Stir',
    nameEn: 'Negroni',
    nameZh: '內格羅尼',
    steps: ['Step 1'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should optimistically like a recipe, call API, and sync server result', async () => {
    const notifyMock = vi.fn();
    const { recipes, toggleLike } = useRecipeStore(notifyMock);
    recipes.value = [{ ...mockRecipe, isLiked: false, likes: 5 }];

    const fetchMock = vi.fn().mockResolvedValue({
      isLiked: true,
      likesCount: 6,
      recipeId: mockRecipe.id,
    });
    vi.stubGlobal('$fetch', fetchMock);

    await toggleLike(mockRecipe.id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/recipes/${mockRecipe.id}/like`, {
      method: 'POST',
    });
    const currentRecipe = recipes.value.find((r) => r.id === mockRecipe.id);
    expect(currentRecipe?.isLiked).toBe(true);
    expect(currentRecipe?.likes).toBe(6);
  });

  it('should revert like state and notify when API call fails', async () => {
    const notifyMock = vi.fn();
    const { recipes, toggleLike } = useRecipeStore(notifyMock);
    recipes.value = [{ ...mockRecipe, isLiked: false, likes: 5 }];

    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('$fetch', fetchMock);

    await toggleLike(mockRecipe.id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/recipes/${mockRecipe.id}/like`, {
      method: 'POST',
    });
    const currentRecipe = recipes.value.find((r) => r.id === mockRecipe.id);
    expect(currentRecipe?.isLiked).toBe(false);
    expect(currentRecipe?.likes).toBe(5);
    expect(notifyMock).toHaveBeenCalledWith('按讚失敗，請稍後重試', 'fa-circle-exclamation');
  });

  it('should optimistically favorite a recipe, call API, and sync server result', async () => {
    const notifyMock = vi.fn();
    const { recipes, toggleFavorite } = useRecipeStore(notifyMock);
    recipes.value = [{ ...mockRecipe, isFav: false }];

    const fetchMock = vi.fn().mockResolvedValue({
      favoritesCount: 1,
      isFavorite: true,
      recipeId: mockRecipe.id,
    });
    vi.stubGlobal('$fetch', fetchMock);

    await toggleFavorite(mockRecipe.id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/recipes/${mockRecipe.id}/favorite`, {
      method: 'POST',
    });
    const currentRecipe = recipes.value.find((r) => r.id === mockRecipe.id);
    expect(currentRecipe?.isFav).toBe(true);
    expect(notifyMock).toHaveBeenCalledWith('已加入我的收藏', 'fa-bookmark');
  });

  it('should revert favorite state and notify when API call fails', async () => {
    const notifyMock = vi.fn();
    const { recipes, toggleFavorite } = useRecipeStore(notifyMock);
    recipes.value = [{ ...mockRecipe, isFav: false }];

    const fetchMock = vi.fn().mockRejectedValue(new Error('Server error'));
    vi.stubGlobal('$fetch', fetchMock);

    await toggleFavorite(mockRecipe.id);

    expect(fetchMock).toHaveBeenCalledWith(`/api/recipes/${mockRecipe.id}/favorite`, {
      method: 'POST',
    });
    const currentRecipe = recipes.value.find((r) => r.id === mockRecipe.id);
    expect(currentRecipe?.isFav).toBe(false);
    expect(notifyMock).toHaveBeenCalledWith(
      '收藏狀態更新失敗，請稍後重試',
      'fa-circle-exclamation',
    );
  });
});
