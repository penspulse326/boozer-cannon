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

  it('should call POST /api/recipes, prepend created recipe, and notify on success', async () => {
    const notifyMock = vi.fn();
    const { addRecipe, recipes } = useRecipeStore(notifyMock);
    recipes.value = [];

    const mockCreatedDto = {
      author: {
        avatarUrl: null,
        id: '00000000-0000-0000-0000-000000000001',
        name: 'BarCraft 調酒師',
      },
      authorId: '00000000-0000-0000-0000-000000000001',
      baseSpirit: 'Gin',
      calculatedAbv: 25,
      createdAt: new Date().toISOString(),
      dilutionRatio: 1.2,
      favoritesCount: 0,
      garnishes: [
        {
          garnishCustom: '檸檬皮',
          garnishEntity: null,
          garnishEntityId: null,
          id: 'g1',
        },
      ],
      glassCustom: '馬丁尼杯',
      glassEntity: null,
      glassEntityId: null,
      iceCustom: null,
      iceEntity: null,
      iceEntityId: null,
      id: '20000000-0000-0000-0000-000000000001',
      imageUrl: 'https://img.test/photo.jpg',
      ingredients: [
        {
          abv: 40,
          amount: '50',
          brandCustom: null,
          brandEntity: null,
          brandEntityId: null,
          id: 'i1',
          ingredientEntity: null,
          ingredientEntityId: null,
          name: '琴酒',
          unit: 'ml',
        },
      ],
      instructions: ['Step 1'],
      likesCount: 0,
      method: 'Stir',
      nameEn: 'Custom Gin',
      nameZh: '自訂琴酒',
      recipeFlavors: [{ flavor: null, flavorId: 'flavor_sour' }],
      story: '測試自訂酒譜',
      updatedAt: new Date().toISOString(),
    };

    const fetchMock = vi.fn().mockResolvedValue(mockCreatedDto);
    vi.stubGlobal('$fetch', fetchMock);

    const result = await addRecipe(mockRecipe);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/recipes',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result).toBeDefined();
    expect(recipes.value[0]?.id).toBe('20000000-0000-0000-0000-000000000001');
    expect(recipes.value[0]?.nameZh).toBe('自訂琴酒');
    expect(notifyMock).toHaveBeenCalledWith('成功發布新酒譜！', 'fa-circle-check');
  });

  it('should fallback to local storage and warn when API call fails', async () => {
    const notifyMock = vi.fn();
    const { addRecipe, recipes } = useRecipeStore(notifyMock);
    recipes.value = [];

    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('$fetch', fetchMock);

    const result = await addRecipe(mockRecipe);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/recipes',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result).toBeDefined();
    expect(recipes.value[0]?.id).toBe(mockRecipe.id);
    expect(notifyMock).toHaveBeenCalledWith(
      '伺服器連線異常，酒譜已暫存於本機！',
      'fa-triangle-exclamation',
    );
  });
});
