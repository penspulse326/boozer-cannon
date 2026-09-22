import { BASE_SPIRITS, TAXONOMY } from '~/utils/taxonomy';

export function useTaxonomy() {
  function getFlavorInfo(flavorId: string) {
    return TAXONOMY.flavors.find((f) => f.id === flavorId);
  }

  function getGlassInfo(glassId: string) {
    return TAXONOMY.glasses.find((g) => g.id === glassId);
  }

  return {
    baseSpirits: BASE_SPIRITS,
    getFlavorInfo,
    getGlassInfo,
    taxonomy: TAXONOMY,
  };
}
