export interface ABVCalculationResult {
  abv: number;
  alcoholPct: number;
  dilutedMl: number;
  dilutionPct: number;
  dilutionRate: number;
  dilutionWaterMl: number;
  mixersMl: number;
  mixersPct: number;
  pureAlcoholMl: number;
  strengthColor: string;
  strengthLabel: string;
  strengthLevel: StrengthLevel;
  undilutedMl: number;
}

export interface BaseSpiritOption {
  id: string;
  label: string;
  nameEn: string;
  nameZh: string;
}

export interface BrandTaxonomy {
  abv: number;
  aliases: string[];
  category: string;
  id: string;
  primaryEn: string;
  primaryZh: string;
}

export interface FlavorTaxonomy {
  aliases: string[];
  icon: string;
  id: string;
  primaryEn: string;
  primaryZh: string;
}

export interface GlassTaxonomy {
  aliases: string[];
  id: string;
  primaryEn: string;
  primaryZh: string;
}

export interface Ingredient {
  abv?: null | number;
  amount: string;
  brandId?: string;
  brandText?: string;
  name: string;
  unit?: string;
}

export interface IngredientRule {
  abv: number;
  keys: string[];
}

export interface Recipe {
  author?: string;
  base: string;
  calculatedAbv?: number;
  createdAt?: number;
  desc?: string;
  flavors?: string[];
  garnish?: string;
  glass?: string;
  ice?: string;
  id: string;
  image?: string;
  ingredients: Ingredient[];
  isFav?: boolean;
  isLiked?: boolean;
  likes?: number;
  method: string;
  nameEn?: string;
  nameZh: string;
  steps?: string[];
  strengthLevel?: StrengthLevel;
}

export type StrengthLevel = 'classic' | 'light' | 'mocktail' | 'strong';

export interface Taxonomy {
  brands: BrandTaxonomy[];
  flavors: FlavorTaxonomy[];
  glasses: GlassTaxonomy[];
}
