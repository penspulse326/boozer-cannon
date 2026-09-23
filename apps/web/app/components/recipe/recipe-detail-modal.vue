<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { Recipe } from '~/types/cocktail';

import AbvStructureMeter from '~/components/recipe/abv-structure-meter.vue';
import TechniqueButtons from '~/components/recipe/technique-buttons.vue';
import { useImageFallback } from '~/composables/useImageFallback';
import { useModalLock } from '~/composables/useModalLock';
import { useRecipeStore } from '~/composables/useRecipeStore';
import { useTaxonomy } from '~/composables/useTaxonomy';
import { calculateRecipeABV } from '~/utils/abvEngine';

const props = withDefaults(
  defineProps<{
    recipe?: null | Recipe;
    recipeId?: null | string;
  }>(),
  {
    recipe: null,
    recipeId: null,
  },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-fav', recipeId: string): void;
  (e: 'toggle-like', recipeId: string): void;
}>();

const { fetchRecipeById } = useRecipeStore();
const { getFlavorInfo } = useTaxonomy();
const { defaultImage, onImageError } = useImageFallback();

const fetchedRecipe = ref<null | Recipe>(null);
const simulatedMethod = ref<null | string>(null);

const currentRecipe = computed(() => props.recipe || fetchedRecipe.value);
const isModalOpen = computed(() => !!currentRecipe.value);

useModalLock(isModalOpen, () => emit('close'));

watch(
  () => props.recipeId,
  async (newId) => {
    if (newId) {
      fetchedRecipe.value = await fetchRecipeById(newId);
    } else {
      fetchedRecipe.value = null;
    }
  },
  { immediate: true },
);

watch(
  () => currentRecipe.value,
  () => {
    simulatedMethod.value = null;
  },
);

const effectiveRecipe = computed(() => {
  if (!currentRecipe.value) {
    return null;
  }
  if (!simulatedMethod.value) {
    return currentRecipe.value;
  }
  return {
    ...currentRecipe.value,
    method: simulatedMethod.value,
  };
});

const abvData = computed(() => {
  return calculateRecipeABV(effectiveRecipe.value);
});

const standardDrinkInfo = computed(() => {
  const pureGrams = abvData.value.pureAlcoholMl * 0.8;
  const standardDrinks = Math.round((pureGrams / 10) * 10) / 10;
  const beerCans = Math.round((abvData.value.pureAlcoholMl / 16.5) * 10) / 10;
  return {
    beerCans,
    pureGrams: Math.round(pureGrams * 10) / 10,
    standardDrinks,
  };
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="effectiveRecipe"
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      data-testid="recipe-detail-modal"
      @click.self="$emit('close')"
    >
      <div
        class="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-speakeasy-900 shadow-2xl transition-all"
      >
        <!-- Close Button -->
        <button
          class="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-slate-300 backdrop-blur transition-all hover:bg-black hover:text-white"
          type="button"
          @click="$emit('close')"
        >
          <i class="fa-solid fa-xmark" />
        </button>

        <!-- Modal Content Container -->
        <div class="max-h-[85vh] overflow-y-auto">
          <!-- Hero Header Image -->
          <div class="relative h-60 w-full bg-speakeasy-950 sm:h-72">
            <img
              :alt="effectiveRecipe.nameZh"
              class="size-full object-cover"
              :src="effectiveRecipe.image || defaultImage"
              @error="onImageError"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-speakeasy-900 via-speakeasy-900/40 to-transparent"
            />

            <div class="absolute right-6 bottom-4 left-6">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span
                  class="rounded-md bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-speakeasy-950"
                >
                  {{ effectiveRecipe.base }}
                </span>
                <span
                  class="rounded-md border border-white/10 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-200"
                >
                  {{ effectiveRecipe?.method || '調製法' }}
                </span>
                <span
                  class="rounded-md border px-2.5 py-0.5 font-mono text-xs font-bold"
                  :class="abvData.strengthColor"
                >
                  ~{{ abvData.abv }}% ABV
                </span>
              </div>
              <h2 class="font-serif text-2xl font-bold text-white sm:text-3xl">
                {{ effectiveRecipe.nameZh }}
              </h2>
              <p class="font-serif text-xs text-slate-300 italic sm:text-sm">
                {{ effectiveRecipe.nameEn || '' }}
              </p>
            </div>
          </div>

          <!-- Body Content -->
          <div class="space-y-6 p-6">
            <!-- Profile Badges -->
            <div
              class="grid grid-cols-3 gap-3 rounded-2xl border border-white/5 bg-speakeasy-850 p-3.5 text-center text-xs"
            >
              <div class="rounded-xl p-2">
                <span class="mb-1 block text-slate-400">推薦杯型</span>
                <span class="font-medium text-amber-300">
                  {{ effectiveRecipe.glass || '標準調酒杯' }}
                </span>
              </div>
              <div class="rounded-xl border-x border-white/10 p-2">
                <span class="mb-1 block text-slate-400">冰塊種類</span>
                <span class="font-medium text-amber-300">
                  {{ effectiveRecipe.ice || '方形冰塊' }}
                </span>
              </div>
              <div class="rounded-xl p-2">
                <span class="mb-1 block text-slate-400">風味裝飾</span>
                <span class="font-medium text-amber-300">
                  {{ effectiveRecipe.garnish || '適量裝飾' }}
                </span>
              </div>
            </div>

            <!-- ABV Science Breakdown Card -->
            <div class="space-y-3 rounded-2xl border border-white/10 bg-speakeasy-850/70 p-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-flask-vial text-sm text-amber-400" />
                  <span class="text-xs font-semibold text-slate-200">
                    酒精濃度推估與物理融水分析 (ABV Engine)
                  </span>
                </div>
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  :class="abvData.strengthColor"
                >
                  {{ abvData.strengthLabel }}
                </span>
              </div>

              <!-- Key Metrics Grid -->
              <div class="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <div class="rounded-xl border border-white/5 bg-speakeasy-900 p-2.5">
                  <span class="block text-[10px] text-slate-400">最終預估 ABV</span>
                  <span class="font-mono text-base font-bold text-amber-400">
                    {{ abvData.abv }}%
                  </span>
                </div>
                <div class="rounded-xl border border-white/5 bg-speakeasy-900 p-2.5">
                  <span class="block text-[10px] text-slate-400">技法融水稀釋</span>
                  <span class="font-mono text-base font-bold text-sky-400">
                    +{{ abvData.dilutionRate }}%
                  </span>
                </div>
                <div class="rounded-xl border border-white/5 bg-speakeasy-900 p-2.5">
                  <span class="block text-[10px] text-slate-400">純酒精淨重</span>
                  <span class="font-mono text-base font-bold text-rose-400">
                    {{ abvData.pureAlcoholMl }} ml
                  </span>
                </div>
                <div class="rounded-xl border border-white/5 bg-speakeasy-900 p-2.5">
                  <span class="block text-[10px] text-slate-400">出酒總量 (含融水)</span>
                  <span class="font-mono text-base font-bold text-emerald-400">
                    {{ abvData.dilutedMl }} ml
                  </span>
                </div>
              </div>

              <!-- Liquid Structure Stacked Bar Component -->
              <AbvStructureMeter
                :alcohol-pct="abvData.alcoholPct"
                :diluted-ml="abvData.dilutedMl"
                :dilution-pct="abvData.dilutionPct"
                :dilution-water-ml="abvData.dilutionWaterMl"
                :mixers-ml="abvData.mixersMl"
                :mixers-pct="abvData.mixersPct"
                :pure-alcohol-ml="abvData.pureAlcoholMl"
              />

              <!-- Standard Drink & Health Equivalent -->
              <div
                class="flex items-center justify-between rounded-xl border border-white/5 bg-speakeasy-900/80 p-2.5 text-xs"
              >
                <div class="flex items-center gap-2 text-slate-300">
                  <i class="fa-solid fa-beer-mug-empty text-amber-500" />
                  <span>標準酒精當量 (Standard Drinks)：</span>
                </div>
                <div class="text-right">
                  <span class="font-mono text-sm font-bold text-amber-400">
                    {{ standardDrinkInfo.standardDrinks }} 單位 ({{ standardDrinkInfo.pureGrams }}g)
                  </span>
                  <span class="ml-1 text-[10px] text-slate-400">
                    (約 {{ standardDrinkInfo.beerCans }} 罐啤酒)
                  </span>
                </div>
              </div>

              <!-- Technique Dilution Simulator -->
              <div class="border-t border-white/5 pt-1.5">
                <div class="mb-1.5 flex items-center justify-between text-[11px] text-slate-400">
                  <span class="flex items-center gap-1">
                    <i class="fa-solid fa-sliders text-amber-400" />
                    <span>技法融水模擬（測試不同調製法的濃度變化）：</span>
                  </span>
                  <button
                    class="text-[10px] text-amber-400/80 hover:text-amber-300"
                    type="button"
                    @click="simulatedMethod = null"
                  >
                    恢復預設
                  </button>
                </div>
                <TechniqueButtons
                  :active-method="effectiveRecipe?.method || ''"
                  @select="simulatedMethod = $event"
                />
              </div>
            </div>

            <!-- Flavor Profile Tags Section in Modal -->
            <div>
              <span
                class="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
              >
                風味調性 (Flavor Profile)
              </span>
              <div
                v-if="effectiveRecipe.flavors && effectiveRecipe.flavors.length > 0"
                class="flex flex-wrap gap-2"
              >
                <span
                  v-for="fId in effectiveRecipe.flavors"
                  :key="fId"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300"
                >
                  <i :class="['fa-solid', getFlavorInfo(fId)?.icon || 'fa-tag', 'text-xs']" />
                  <span>{{ getFlavorInfo(fId)?.primaryZh || fId }}</span>
                </span>
              </div>
              <span v-else class="text-xs text-slate-500">未特別指定風味</span>
            </div>

            <!-- Description -->
            <div>
              <span
                class="mb-1.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
              >
                酒譜介紹
              </span>
              <p class="text-xs leading-relaxed text-slate-300 sm:text-sm">
                {{ effectiveRecipe.desc || '暫無風味詳細描述。' }}
              </p>
            </div>

            <!-- Ingredients List with Brand Tags -->
            <div>
              <span
                class="mb-2.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
              >
                調配材料與指定品牌
              </span>
              <div class="space-y-2">
                <div
                  v-for="(ing, idx) in effectiveRecipe.ingredients"
                  :key="idx"
                  class="flex items-center justify-between rounded-xl border border-white/5 bg-speakeasy-850/60 p-2.5 text-xs sm:text-sm"
                >
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-circle-dot text-[8px] text-amber-500" />
                    <span class="font-medium text-white">{{ ing.name }}</span>
                    <span
                      v-if="ing.brandText"
                      class="flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300"
                    >
                      <i class="fa-solid fa-tag text-[8px]" />
                      <span>{{ ing.brandText }}</span>
                    </span>
                  </div>
                  <div class="font-mono text-slate-300">{{ ing.amount }} {{ ing.unit || '' }}</div>
                </div>
              </div>
            </div>

            <!-- Preparation Steps -->
            <div>
              <span
                class="mb-2.5 block text-xs font-semibold tracking-wider text-slate-400 uppercase"
              >
                調製步驟
              </span>
              <ol class="list-inside list-decimal space-y-2 text-xs text-slate-300 sm:text-sm">
                <li v-for="(step, sIdx) in effectiveRecipe.steps" :key="sIdx" class="pl-1">
                  {{ step }}
                </li>
              </ol>
            </div>

            <!-- Author Info & Footer Actions -->
            <div
              class="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400"
            >
              <span>
                <i class="fa-solid fa-user-pen mr-1" />
                配方提供：{{ effectiveRecipe.author || 'BarCraft 調酒師' }}
              </span>
              <div class="flex items-center gap-3">
                <button
                  class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-colors"
                  :class="
                    effectiveRecipe.isLiked
                      ? 'border border-rose-500/30 bg-rose-500/20 text-rose-400'
                      : 'bg-speakeasy-800 text-slate-300 hover:bg-speakeasy-750'
                  "
                  type="button"
                  @click="$emit('toggle-like', effectiveRecipe.id)"
                >
                  <i
                    :class="
                      effectiveRecipe.isLiked
                        ? 'fa-solid fa-heart text-rose-400'
                        : 'fa-regular fa-heart text-rose-400'
                    "
                  />
                  <span>{{ effectiveRecipe.likes || 0 }}</span>
                </button>
                <button
                  class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-colors"
                  :class="
                    effectiveRecipe.isFav
                      ? 'bg-amber-500 text-speakeasy-950'
                      : 'bg-speakeasy-800 text-slate-300 hover:bg-speakeasy-750'
                  "
                  type="button"
                  @click="$emit('toggle-fav', effectiveRecipe.id)"
                >
                  <i
                    :class="
                      effectiveRecipe.isFav
                        ? 'fa-solid fa-bookmark'
                        : 'fa-regular fa-bookmark text-amber-400'
                    "
                  />
                  <span>{{ effectiveRecipe.isFav ? '已收藏' : '收藏' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
