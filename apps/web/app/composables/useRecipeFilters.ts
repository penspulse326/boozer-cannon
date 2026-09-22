import { computed, type Ref, ref } from 'vue';

import type { Recipe } from '~/types/cocktail';

import { useRecipeStore } from '~/composables/useRecipeStore';
import { calculateRecipeABV } from '~/utils/abvEngine';
import { TAXONOMY } from '~/utils/taxonomy';

const currentCategory = ref('all');
const currentFlavor = ref('all');
const currentAbvFilter = ref('all');
const searchQuery = ref('');
const currentSort = ref('likes');
const onlyFavorites = ref(false);

export function useRecipeFilters(customRecipes?: Ref<Recipe[]>) {
  const store = useRecipeStore();
  const recipes = customRecipes || store.recipes;

  function resetAllFilters() {
    searchQuery.value = '';
    currentCategory.value = 'all';
    currentFlavor.value = 'all';
    currentAbvFilter.value = 'all';
    onlyFavorites.value = false;
  }

  function setFlavorFilter(flavorId: string) {
    currentFlavor.value = flavorId;
  }

  function toggleFavorites() {
    onlyFavorites.value = !onlyFavorites.value;
  }

  function expandSearchKeywords(query: string): string[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    const keywords = new Set<string>([q]);

    TAXONOMY.flavors.forEach((f) => {
      if (f.aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
        keywords.add(f.id);
        keywords.add(f.primaryEn.toLowerCase());
        f.aliases.forEach((a) => keywords.add(a.toLowerCase()));
      }
    });

    TAXONOMY.brands.forEach((b) => {
      if (b.aliases.some((a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()))) {
        keywords.add(b.id);
        keywords.add(b.primaryEn.toLowerCase());
        keywords.add(b.primaryZh.toLowerCase());
        b.aliases.forEach((a) => keywords.add(a.toLowerCase()));
      }
    });

    return Array.from(keywords);
  }

  function recipeMatchesQuery(recipe: Recipe, expandedTerms: string[]): boolean {
    const fullText = [
      recipe.nameZh,
      recipe.nameEn,
      recipe.base,
      recipe.method,
      recipe.glass,
      recipe.ice,
      recipe.garnish,
      recipe.desc,
      recipe.author,
      ...(recipe.flavors || []),
      ...(recipe.ingredients || []).map((i) => `${i.name} ${i.brandText || ''} ${i.brandId || ''}`),
    ]
      .join(' ')
      .toLowerCase();

    return expandedTerms.some((term) => fullText.includes(term));
  }

  const filteredRecipes = computed(() => {
    const list = recipes.value.filter((item) => {
      if (currentCategory.value !== 'all' && item.base !== currentCategory.value) {
        return false;
      }
      if (currentFlavor.value !== 'all') {
        const itemFlavors = item.flavors || [];
        if (!itemFlavors.includes(currentFlavor.value)) {
          return false;
        }
      }
      if (currentAbvFilter.value !== 'all') {
        const abvData = calculateRecipeABV(item);
        if (abvData.strengthLevel !== currentAbvFilter.value) {
          return false;
        }
      }
      if (onlyFavorites.value && !item.isFav) {
        return false;
      }
      if (searchQuery.value.trim() !== '') {
        const expanded = expandSearchKeywords(searchQuery.value);
        if (!recipeMatchesQuery(item, expanded)) {
          return false;
        }
      }
      return true;
    });

    if (currentSort.value === 'abv_desc' || currentSort.value === 'abv_asc') {
      const listWithAbv = list.map((item) => ({
        abv: calculateRecipeABV(item).abv,
        item,
      }));
      listWithAbv.sort((a, b) =>
        currentSort.value === 'abv_desc' ? b.abv - a.abv : a.abv - b.abv,
      );
      return listWithAbv.map((entry) => entry.item);
    }

    return list.sort((a, b) => {
      if (currentSort.value === 'likes') {
        return (b.likes || 0) - (a.likes || 0);
      }
      if (currentSort.value === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (currentSort.value === 'name') {
        return (a.nameZh || '').localeCompare(b.nameZh || '', 'zh-TW');
      }
      return 0;
    });
  });

  return {
    currentAbvFilter,
    currentCategory,
    currentFlavor,
    currentSort,
    expandSearchKeywords,
    filteredRecipes,
    onlyFavorites,
    recipeMatchesQuery,
    resetAllFilters,
    searchQuery,
    setFlavorFilter,
    toggleFavorites,
  };
}
