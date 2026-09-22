<script setup lang="ts">
import { computed } from 'vue';

import type { Recipe } from '~/types/cocktail';

import { useImageFallback } from '~/composables/useImageFallback';
import { useTaxonomy } from '~/composables/useTaxonomy';
import { calculateRecipeABV } from '~/utils/abvEngine';

const props = defineProps<{
  recipe: Recipe;
}>();

defineEmits<{
  (e: 'filter-flavor', flavorId: string): void;
  (e: 'select', recipeId: string): void;
  (e: 'toggle-fav', recipeId: string): void;
  (e: 'toggle-like', recipeId: string): void;
}>();

const { getFlavorInfo } = useTaxonomy();
const { defaultImage, onImageError } = useImageFallback();

const abvData = computed(() => {
  return calculateRecipeABV(props.recipe);
});

const brandedIngredients = computed(() => {
  return (props.recipe.ingredients || []).filter((i) => i.brandText && i.brandText.trim());
});
</script>

<template>
  <div
    class="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/10 bg-speakeasy-900 shadow-xl transition-all duration-300 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10"
    @click="$emit('select', recipe.id)"
  >
    <!-- Card Top Image -->
    <div class="relative h-52 w-full overflow-hidden bg-speakeasy-950 sm:h-56">
      <img
        :alt="recipe.nameZh"
        class="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        :src="recipe.image || defaultImage"
        @error="onImageError"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-speakeasy-900 via-transparent to-black/30"
      />

      <!-- Top Badges: Base & Calculated ABV -->
      <div class="absolute top-3.5 left-3.5 flex flex-wrap items-center gap-1.5">
        <span
          class="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-speakeasy-950 shadow-md"
        >
          {{ recipe.base }}
        </span>
        <span
          class="rounded-lg border px-2 py-1 font-mono text-[11px] font-bold shadow-md backdrop-blur"
          :class="abvData.strengthColor"
          title="融水稀釋模型預估酒精濃度"
        >
          ~{{ abvData.abv }}% ABV
        </span>
      </div>

      <!-- Favorite Button -->
      <button
        class="absolute top-3.5 right-3.5 flex size-9 items-center justify-center rounded-full border border-white/15 backdrop-blur transition-all"
        :class="
          recipe.isFav
            ? 'bg-amber-500 text-speakeasy-950'
            : 'bg-speakeasy-950/70 text-slate-300 hover:text-white'
        "
        :title="recipe.isFav ? '已收藏' : '加入收藏'"
        type="button"
        @click.stop="$emit('toggle-fav', recipe.id)"
      >
        <i
          class="text-sm"
          :class="recipe.isFav ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark'"
        />
      </button>
    </div>

    <!-- Card Content Body -->
    <div class="flex flex-1 flex-col justify-between space-y-4 p-5">
      <div>
        <div class="mb-1 flex items-baseline justify-between gap-2">
          <h3
            class="font-serif text-lg font-bold text-white transition-colors line-clamp-1 group-hover:text-amber-400"
          >
            {{ recipe.nameZh }}
          </h3>
          <span class="font-serif text-[11px] text-slate-400 italic line-clamp-1">
            {{ recipe.nameEn || '' }}
          </span>
        </div>

        <!-- Flavor Pills -->
        <div
          v-if="recipe.flavors && recipe.flavors.length > 0"
          class="mb-2.5 flex flex-wrap gap-1.5"
        >
          <span
            v-for="fId in recipe.flavors"
            :key="fId"
            class="inline-flex cursor-pointer items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 transition-colors hover:bg-amber-500/25"
            title="點擊依此風味篩選"
            @click.stop="$emit('filter-flavor', fId)"
          >
            <i class="text-[8px]" :class="['fa-solid', getFlavorInfo(fId)?.icon || 'fa-tag']" />
            <span>{{ getFlavorInfo(fId)?.primaryZh.slice(0, 4) || fId }}</span>
          </span>
        </div>

        <p class="mb-3 text-xs leading-relaxed text-slate-400 line-clamp-2">
          {{ recipe.desc || '經典優雅的調酒配方，風味層次分明。' }}
        </p>

        <!-- Branded Ingredients Preview Badges -->
        <div v-if="brandedIngredients.length > 0" class="border-t border-white/5 pt-2">
          <div class="mb-1 flex items-center gap-1 text-[10px] text-slate-400">
            <i class="fa-solid fa-award text-amber-500" />
            <span>指定品牌材料：</span>
          </div>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="(b, bIdx) in brandedIngredients"
              :key="bIdx"
              class="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-amber-300/90"
            >
              {{ b.brandText }}
            </span>
          </div>
        </div>
      </div>

      <!-- Card Bottom Bar -->
      <div
        class="flex items-center justify-between border-t border-white/5 pt-3 text-xs text-slate-400"
      >
        <span class="flex items-center gap-1 text-[11px] text-slate-400">
          <i class="fa-solid fa-martini-glass text-[10px] text-slate-400" />
          <span>{{ recipe.method ? recipe.method.split(' ')[0] : '調製法' }}</span>
        </span>

        <button
          class="flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all"
          :class="
            recipe.isLiked
              ? 'bg-rose-500/10 text-rose-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-rose-400'
          "
          type="button"
          @click.stop="$emit('toggle-like', recipe.id)"
        >
          <i
            class="text-xs"
            :class="recipe.isLiked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"
          />
          <span class="font-mono text-xs">{{ recipe.likes || 0 }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
