<script setup lang="ts">
import type { BrandTaxonomy, FormIngredient } from '~/types/cocktail';

import { detectDefaultIngredientAbv } from '~/utils/abvEngine';
import { TAXONOMY } from '~/utils/taxonomy';

const ingredient = defineModel<FormIngredient>({ required: true });

defineEmits<{
  (e: 'remove'): void;
}>();

function getBrandSuggestions(query: string) {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return [];
  }
  return TAXONOMY.brands.filter(
    (b) =>
      b.primaryEn.toLowerCase().includes(q) ||
      b.primaryZh.toLowerCase().includes(q) ||
      b.aliases.some((a) => a.toLowerCase().includes(q)),
  );
}

function onBrandBlur() {
  setTimeout(() => {
    ingredient.value.showBrandDropdown = false;
  }, 200);
}

function onNameChange() {
  if (!ingredient.value.userModifiedAbv) {
    ingredient.value.abv = detectDefaultIngredientAbv(
      ingredient.value.name,
      ingredient.value.brandText,
    );
  }
}

function selectBrand(brand: BrandTaxonomy) {
  ingredient.value.brandId = brand.id;
  ingredient.value.brandText = brand.primaryEn;
  ingredient.value.abv = brand.abv;
  ingredient.value.userModifiedAbv = true;
  ingredient.value.showBrandDropdown = false;
}
</script>

<template>
  <div
    class="relative grid grid-cols-1 items-center gap-2 rounded-2xl border border-white/5 bg-speakeasy-950/80 p-2.5 sm:grid-cols-12"
  >
    <!-- Material Name Input -->
    <div class="relative sm:col-span-4">
      <input
        v-model="ingredient.name"
        class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
        placeholder="材料名稱 (如: 琴酒)"
        required
        type="text"
        @input="onNameChange"
      />
    </div>

    <!-- Brand Autocomplete Input -->
    <div class="relative sm:col-span-3">
      <input
        v-model="ingredient.brandText"
        autocomplete="off"
        class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-3 py-1.5 text-xs text-amber-300 focus:border-amber-500 focus:outline-none"
        placeholder="指定品牌 (選填)"
        type="text"
        @blur="onBrandBlur"
        @focus="ingredient.showBrandDropdown = true"
        @input="
          ingredient.showBrandDropdown = true;
          onNameChange();
        "
      />
      <div
        v-if="ingredient.showBrandDropdown && getBrandSuggestions(ingredient.brandText).length > 0"
        class="absolute top-full left-0 z-30 mt-1 max-h-48 w-64 overflow-y-auto rounded-xl border border-white/15 bg-speakeasy-900 shadow-2xl"
      >
        <div
          v-for="brand in getBrandSuggestions(ingredient.brandText)"
          :key="brand.id"
          class="cursor-pointer border-b border-white/5 p-2.5 transition-colors last:border-0 hover:bg-amber-500/20"
          @click="selectBrand(brand)"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-amber-300">
              {{ brand.primaryEn }}
            </span>
            <span class="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              {{ brand.abv }}% ABV
            </span>
          </div>
          <div class="mt-0.5 text-[10px] text-slate-400">
            {{ brand.primaryZh }}
          </div>
        </div>
      </div>
    </div>

    <!-- Dosage Amount -->
    <div class="sm:col-span-2">
      <input
        v-model="ingredient.amount"
        class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-3 py-1.5 text-center text-xs text-white focus:border-amber-500 focus:outline-none"
        placeholder="份量"
        required
        type="text"
      />
    </div>

    <!-- Unit Selector -->
    <div class="sm:col-span-1">
      <select
        v-model="ingredient.unit"
        class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-1 py-1.5 text-[11px] text-white focus:border-amber-500 focus:outline-none"
      >
        <option value="ml">ml</option>
        <option value="oz">oz</option>
        <option value="dashes">滴</option>
        <option value="bar spoon">匙</option>
        <option value="補滿">補滿</option>
      </select>
    </div>

    <!-- ABV Input -->
    <div class="sm:col-span-1">
      <input
        v-model.number="ingredient.abv"
        class="w-full rounded-xl border border-white/10 bg-speakeasy-900 px-1.5 py-1.5 text-center font-mono text-[11px] text-amber-400 focus:border-amber-500 focus:outline-none"
        max="100"
        min="0"
        placeholder="%"
        step="0.1"
        title="材料酒精濃度 (%)"
        type="number"
        @input="ingredient.userModifiedAbv = true"
      />
    </div>

    <!-- Delete Row -->
    <div class="text-center sm:col-span-1">
      <button
        class="p-1 text-xs text-slate-500 transition-colors hover:text-rose-400"
        type="button"
        @click="$emit('remove')"
      >
        <i class="fa-solid fa-trash-can" />
      </button>
    </div>
  </div>
</template>
