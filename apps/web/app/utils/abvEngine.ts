import type { ABVCalculationResult, Recipe } from '~/types/cocktail';

import { INGREDIENT_ABV_MAP, METHOD_DILUTION_RATES, TAXONOMY } from '~/utils/taxonomy';

export function calculateRecipeABV(recipe?: null | Partial<Recipe>): ABVCalculationResult {
  const emptyResult: ABVCalculationResult = {
    abv: 0,
    alcoholPct: 0,
    dilutedMl: 0,
    dilutionPct: 0,
    dilutionRate: 0,
    dilutionWaterMl: 0,
    mixersMl: 0,
    mixersPct: 0,
    pureAlcoholMl: 0,
    strengthColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    strengthLabel: '無酒精 (0%)',
    strengthLevel: 'mocktail',
    undilutedMl: 0,
  };

  if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    return emptyResult;
  }

  const dilutionRate = getDilutionRate(recipe.method);
  let totalPureAlcoholMl = 0;
  let totalLiquidVolumeMl = 0;

  for (const ing of recipe.ingredients) {
    const liquidMl = parseLiquidAmount(ing.amount, ing.unit);
    if (liquidMl <= 0) {
      continue;
    }

    const ingAbv = resolveIngredientAbv(ing.name, ing.brandText, ing.brandId, ing.abv);

    totalLiquidVolumeMl += liquidMl;
    totalPureAlcoholMl += liquidMl * (ingAbv / 100);
  }

  const dilutionWaterMl = totalLiquidVolumeMl * dilutionRate;
  const dilutedVolumeMl = totalLiquidVolumeMl + dilutionWaterMl;
  const finalAbv = dilutedVolumeMl > 0 ? (totalPureAlcoholMl / dilutedVolumeMl) * 100 : 0;
  const roundedAbv = Math.round(finalAbv * 10) / 10;
  const mixersWaterMl = Math.max(0, totalLiquidVolumeMl - totalPureAlcoholMl);

  const alcoholPct =
    dilutedVolumeMl > 0 ? Math.round((totalPureAlcoholMl / dilutedVolumeMl) * 100) : 0;
  const dilutionPct =
    dilutedVolumeMl > 0 ? Math.round((dilutionWaterMl / dilutedVolumeMl) * 100) : 0;
  const mixersPct = Math.max(0, 100 - alcoholPct - dilutionPct);

  const profile = resolveStrengthProfile(roundedAbv);

  return {
    abv: roundedAbv,
    alcoholPct,
    dilutedMl: Math.round(dilutedVolumeMl),
    dilutionPct,
    dilutionRate: Math.round(dilutionRate * 100),
    dilutionWaterMl: Math.round(dilutionWaterMl * 10) / 10,
    mixersMl: Math.round(mixersWaterMl * 10) / 10,
    mixersPct,
    pureAlcoholMl: Math.round(totalPureAlcoholMl * 10) / 10,
    strengthColor: profile.color,
    strengthLabel: profile.label,
    strengthLevel: profile.level,
    undilutedMl: Math.round(totalLiquidVolumeMl),
  };
}

export function detectDefaultIngredientAbv(name = '', brandText = ''): number {
  const combined = `${name} ${brandText}`.toLowerCase();
  const brandObj = TAXONOMY.brands.find(
    (b) =>
      combined.includes(b.primaryEn.toLowerCase()) ||
      combined.includes(b.primaryZh.toLowerCase()) ||
      b.aliases.some((alias) => combined.includes(alias.toLowerCase())),
  );
  if (brandObj && typeof brandObj.abv === 'number') {
    return brandObj.abv;
  }

  for (const rule of INGREDIENT_ABV_MAP) {
    if (rule.keys.some((k) => combined.includes(k.toLowerCase()))) {
      return rule.abv;
    }
  }

  const hasAlcoholKeyword =
    name.includes('酒') || name.includes('gin') || name.includes('rum') || name.includes('whisky');

  return hasAlcoholKeyword ? 40 : 0;
}

export function getDilutionRate(method?: string): number {
  const methodStr = (method || '').toLowerCase();
  if (methodStr.includes('shake') || methodStr.includes('搖')) {
    return METHOD_DILUTION_RATES.Shake;
  }
  if (methodStr.includes('stir') || methodStr.includes('攪')) {
    return METHOD_DILUTION_RATES.Stir;
  }
  if (methodStr.includes('blend') || methodStr.includes('霜')) {
    return METHOD_DILUTION_RATES.Blend;
  }
  if (methodStr.includes('layer') || methodStr.includes('分層')) {
    return METHOD_DILUTION_RATES.Layer;
  }
  if (methodStr.includes('build') || methodStr.includes('直調')) {
    return METHOD_DILUTION_RATES.Build;
  }
  return 0.2;
}

export function parseLiquidAmount(amount: string, unit = 'ml'): number {
  const amountStr = String(amount || '').trim();
  const numVal = parseFloat(amountStr.replace(/[^\d.]/g, '')) || 0;
  const unitLower = (unit || 'ml').toLowerCase();

  if (unitLower === 'ml') {
    return numVal;
  }
  if (unitLower === 'oz') {
    return numVal * 29.57;
  }
  if (unitLower === 'dashes' || unitLower.includes('滴')) {
    return numVal * 0.8;
  }
  if (unitLower === 'bar spoon' || unitLower.includes('匙')) {
    return numVal * 5.0;
  }
  if (unitLower.includes('補滿') || amountStr.includes('補滿')) {
    return 90;
  }
  return 0;
}

export function resolveIngredientAbv(
  name = '',
  brandText = '',
  brandId = '',
  explicitAbv?: null | number,
): number {
  if (typeof explicitAbv === 'number' && !isNaN(explicitAbv)) {
    return explicitAbv;
  }

  if (brandId) {
    const brandObj = TAXONOMY.brands.find((b) => b.id === brandId);
    if (brandObj && typeof brandObj.abv === 'number') {
      return brandObj.abv;
    }
  }

  return detectDefaultIngredientAbv(name, brandText);
}

function resolveStrengthProfile(roundedAbv: number): {
  color: string;
  label: string;
  level: 'classic' | 'light' | 'mocktail' | 'strong';
} {
  if (roundedAbv === 0) {
    return {
      color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      label: '無酒精 (0%)',
      level: 'mocktail',
    };
  }
  if (roundedAbv <= 12) {
    return {
      color: 'text-teal-300 bg-teal-500/15 border-teal-500/30',
      label: '輕盈爽口 (≤12%)',
      level: 'light',
    };
  }
  if (roundedAbv <= 22) {
    return {
      color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
      label: '經典微醺 (13-22%)',
      level: 'classic',
    };
  }
  return {
    color: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    label: '醇厚濃烈 (>22%)',
    level: 'strong',
  };
}
