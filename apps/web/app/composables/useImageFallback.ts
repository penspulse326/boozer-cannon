import { DEFAULT_COCKTAIL_IMAGE } from '~/utils/constants';

export function useImageFallback(fallbackUrl = DEFAULT_COCKTAIL_IMAGE) {
  function onImageError(e: Event) {
    const target = e.target as HTMLImageElement | null;
    if (target) {
      target.onerror = null;
      target.src = fallbackUrl;
    }
  }

  return {
    defaultImage: fallbackUrl,
    onImageError,
  };
}
