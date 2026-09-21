import { describe, expect, it } from 'vitest';

import type { Recipe } from '~/types/cocktail';

import {
  calculateRecipeABV,
  detectDefaultIngredientAbv,
  getDilutionRate,
  parseLiquidAmount,
} from '~/utils/abvEngine';

describe('ABV Engine - getDilutionRate', () => {
  it('returns appropriate dilution rates for various techniques', () => {
    // Arrange & Act & Assert
    expect(getDilutionRate('Shake (搖盪法)')).toBe(0.33);
    expect(getDilutionRate('Stir (攪拌法)')).toBe(0.22);
    expect(getDilutionRate('Build (直調法)')).toBe(0.18);
    expect(getDilutionRate('Blend (霜凍法)')).toBe(0.45);
    expect(getDilutionRate('Layer (分層法)')).toBe(0.0);
    expect(getDilutionRate('Unknown')).toBe(0.2);
  });
});

describe('ABV Engine - parseLiquidAmount', () => {
  it('correctly converts volume strings with different units', () => {
    // Arrange & Act & Assert
    expect(parseLiquidAmount('45', 'ml')).toBe(45);
    expect(parseLiquidAmount('1.5', 'oz')).toBeCloseTo(44.355, 2);
    expect(parseLiquidAmount('3', 'dashes')).toBeCloseTo(2.4, 2);
    expect(parseLiquidAmount('2', 'bar spoon')).toBe(10);
    expect(parseLiquidAmount('至九分滿', '補滿')).toBe(90);
    expect(parseLiquidAmount('', 'ml')).toBe(0);
  });
});

describe('ABV Engine - detectDefaultIngredientAbv', () => {
  it('recognizes brands and default spirit keywords', () => {
    // Arrange & Act
    const tanquerayAbv = detectDefaultIngredientAbv('琴酒', 'Tanqueray No. 10');
    const campariAbv = detectDefaultIngredientAbv('苦酒', 'Campari Bitter');
    const juiceAbv = detectDefaultIngredientAbv('青檸汁', '');
    const genericGinAbv = detectDefaultIngredientAbv('倫敦乾琴酒', '');

    // Assert
    expect(tanquerayAbv).toBe(47.3);
    expect(campariAbv).toBe(25.0);
    expect(juiceAbv).toBe(0);
    expect(genericGinAbv).toBe(40);
  });
});

describe('ABV Engine - calculateRecipeABV', () => {
  it('returns empty/safe structure when recipe has no ingredients', () => {
    // Arrange
    const emptyRecipe: Partial<Recipe> = { ingredients: [] };

    // Act
    const result = calculateRecipeABV(emptyRecipe);

    // Assert
    expect(result.abv).toBe(0);
    expect(result.strengthLevel).toBe('mocktail');
    expect(result.pureAlcoholMl).toBe(0);
    expect(result.dilutedMl).toBe(0);
  });

  it('calculates accurate metrics for Classic Negroni recipe', () => {
    // Arrange
    const negroniRecipe: Partial<Recipe> = {
      base: 'Gin',
      ingredients: [
        {
          abv: 47.3,
          amount: '30',
          brandId: 'brand_tanqueray',
          name: '琴酒',
          unit: 'ml',
        },
        {
          abv: 25.0,
          amount: '30',
          brandId: 'brand_campari',
          name: '金巴利苦酒',
          unit: 'ml',
        },
        {
          abv: 16.5,
          amount: '30',
          brandId: 'brand_carpano',
          name: '甜苦艾酒',
          unit: 'ml',
        },
      ],
      method: 'Stir (攪拌法)',
    };

    // Act
    const result = calculateRecipeABV(negroniRecipe);

    // Assert
    // Total undiluted = 90ml
    // Dilution rate = 22% -> Dilution water = 19.8ml -> Diluted total = 109.8ml ~ 110ml
    // Pure alcohol = 30*0.473 + 30*0.25 + 30*0.165 = 14.19 + 7.5 + 4.95 = 26.64ml
    // ABV = 26.64 / 109.8 * 100 = 24.26% ~ 24.3%
    expect(result.undilutedMl).toBe(90);
    expect(result.dilutionRate).toBe(22);
    expect(result.pureAlcoholMl).toBeCloseTo(26.6, 1);
    expect(result.abv).toBeCloseTo(24.3, 1);
    expect(result.strengthLevel).toBe('strong');
  });

  it('classifies mocktails with 0% ABV and light cocktails correctly', () => {
    // Arrange
    const mocktail: Partial<Recipe> = {
      ingredients: [
        { abv: 0, amount: '60', name: '柳橙汁', unit: 'ml' },
        { abv: 0, amount: '120', name: '氣泡水', unit: 'ml' },
      ],
      method: 'Build',
    };

    // Act
    const mocktailResult = calculateRecipeABV(mocktail);

    // Assert
    expect(mocktailResult.abv).toBe(0);
    expect(mocktailResult.strengthLevel).toBe('mocktail');
    expect(mocktailResult.strengthLabel).toContain('無酒精');
  });
});
