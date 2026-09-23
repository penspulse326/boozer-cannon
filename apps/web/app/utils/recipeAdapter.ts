import type { ApiRecipeItem } from '@boozer/shared/dto';

import type { Recipe } from '~/types/cocktail';

export function mapApiRecipeToRecipe(item: ApiRecipeItem): Recipe {
  const garnish =
    item.garnishes?.[0]?.garnishCustom ||
    item.garnishes?.[0]?.garnishEntity?.nameZh ||
    item.garnishes?.[0]?.garnishEntity?.nameEn ||
    '';

  const glass =
    item.glassCustom || item.glassEntity?.nameZh || item.glassEntity?.nameEn || undefined;

  const ice = item.iceCustom || item.iceEntity?.nameZh || item.iceEntity?.nameEn || undefined;

  return {
    author: item.author?.name || '匿名調酒師',
    base: item.baseSpirit,
    calculatedAbv: item.calculatedAbv ? Number(item.calculatedAbv) : undefined,
    createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
    desc: item.story || '',
    flavors: item.recipeFlavors?.map((rf) => rf.flavorId || rf.flavor?.id || '') || [],
    garnish,
    glass,
    ice,
    id: item.id,
    image: item.imageUrl || undefined,
    ingredients: (item.ingredients || []).map((ing) => ({
      abv: ing.abv ? Number(ing.abv) : 0,
      amount: String(ing.amount),
      brandId: ing.brandEntityId || undefined,
      brandText: ing.brandCustom || ing.brandEntity?.nameZh || ing.brandEntity?.nameEn || undefined,
      name: ing.name,
      unit: ing.unit,
    })),
    isFav: false,
    isLiked: false,
    likes: item.likesCount || 0,
    method: item.method,
    nameEn: item.nameEn || undefined,
    nameZh: item.nameZh || item.nameEn || '無名調酒',
    steps: Array.isArray(item.instructions) ? item.instructions : [],
  };
}
