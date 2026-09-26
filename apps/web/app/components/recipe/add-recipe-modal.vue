<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { FormIngredient, FormStep, Recipe } from '~/types/cocktail';

import AbvStructureMeter from '~/components/recipe/abv-structure-meter.vue';
import FlavorTagPicker from '~/components/recipe/flavor-tag-picker.vue';
import IngredientRowInput from '~/components/recipe/ingredient-row-input.vue';
import { useAddRecipeModal } from '~/composables/useAddRecipeModal';
import { useModalLock } from '~/composables/useModalLock';
import { useRecipeStore } from '~/composables/useRecipeStore';
import { useToast } from '~/composables/useToast';
import { calculateRecipeABV, detectDefaultIngredientAbv } from '~/utils/abvEngine';
import { BASE_SPIRITS } from '~/utils/taxonomy';

const props = defineProps<{
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'error', message: string, icon?: string): void;
  (e: 'submit', recipe: Recipe): void;
}>();

const { closeAddModal: globalCloseAddModal, isAddModalOpen: globalIsAddModalOpen } =
  useAddRecipeModal();
const { addRecipe: globalAddRecipe } = useRecipeStore();
const { showToast } = useToast();

const isModalActive = computed(() => props.isOpen ?? globalIsAddModalOpen.value);

function handleClose() {
  globalCloseAddModal();
  emit('close');
}

useModalLock(isModalActive, handleClose);

const isSubmitting = ref(false);

const addForm = ref({
  author: '',
  base: 'Gin',
  desc: '',
  flavors: [] as string[],
  garnish: '',
  glass: '',
  ice: '',
  image: '',
  ingredients: [] as FormIngredient[],
  method: 'Stir (攪拌法)',
  nameEn: '',
  nameZh: '',
  steps: [] as FormStep[],
});

watch(isModalActive, (val) => {
  if (val) {
    initForm();
  }
});

function addIngredientRow() {
  addForm.value.ingredients.push(createEmptyIngredient());
}

function addStepRow() {
  addForm.value.steps.push(createEmptyStep());
}

function createEmptyIngredient(
  name = '',
  amount = '',
  unit = 'ml',
  brandText = '',
  brandId = '',
  abv: null | number = null,
): FormIngredient {
  const resolvedAbv = abv !== null ? abv : detectDefaultIngredientAbv(name, brandText);
  return {
    abv: resolvedAbv,
    amount,
    brandId,
    brandText,
    id: `ing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    showBrandDropdown: false,
    unit,
    userModifiedAbv: abv !== null,
  };
}

function createEmptyStep(text = ''): FormStep {
  return {
    id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text,
  };
}

function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement | null;
  const file = target?.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    addForm.value.image = (e.target?.result as string) || '';
  };
  reader.readAsDataURL(file);
}

function initForm() {
  addForm.value = {
    author: '',
    base: 'Gin',
    desc: '',
    flavors: ['flavor_sour'],
    garnish: '',
    glass: '',
    ice: '',
    image: '',
    ingredients: [
      createEmptyIngredient('琴酒 (Gin)', '45', 'ml', 'Tanqueray No. 10', 'brand_tanqueray', 47.3),
      createEmptyIngredient('通寧水', '120', 'ml', '', '', 0),
    ],
    method: 'Stir (攪拌法)',
    nameEn: '',
    nameZh: '',
    steps: [createEmptyStep('杯中放入純淨冰塊。'), createEmptyStep('依序倒入材料並輕柔攪拌混合。')],
  };
}

function removeIngredientRow(index: number) {
  addForm.value.ingredients.splice(index, 1);
}

function removeStepRow(index: number) {
  addForm.value.steps.splice(index, 1);
}

const liveAbvData = computed(() => {
  const tempIngredients = addForm.value.ingredients
    .filter((i) => i.amount.trim() !== '')
    .map((i) => ({
      abv: i.abv,
      amount: i.amount,
      brandId: i.brandId,
      brandText: i.brandText,
      name: i.name,
      unit: i.unit,
    }));

  return calculateRecipeABV({
    base: addForm.value.base,
    ingredients: tempIngredients,
    method: addForm.value.method,
  });
});

async function submitAddRecipe() {
  if (isSubmitting.value) {
    return;
  }

  const validIngredients = addForm.value.ingredients
    .filter((i) => i.name.trim() !== '' && i.amount.trim() !== '')
    .map((i) => ({
      abv: i.abv,
      amount: i.amount,
      brandId: i.brandId,
      brandText: i.brandText,
      name: i.name,
      unit: i.unit,
    }));

  if (validIngredients.length === 0) {
    showToast('請至少填寫一項調酒材料！', 'fa-triangle-exclamation');
    emit('error', '請至少填寫一項調酒材料！', 'fa-triangle-exclamation');
    return;
  }

  const validSteps = addForm.value.steps.map((s) => s.text.trim()).filter(Boolean);

  const newRecipe: Recipe = {
    author: addForm.value.author.trim() || 'BarCraft 調酒師',
    base: addForm.value.base,
    calculatedAbv: liveAbvData.value.abv,
    createdAt: Date.now(),
    desc: addForm.value.desc.trim(),
    flavors: addForm.value.flavors,
    garnish: addForm.value.garnish.trim() || '適量裝飾',
    glass: addForm.value.glass.trim() || '標準調酒杯',
    ice: addForm.value.ice.trim() || '方形冰塊',
    id: `recipe_${Date.now()}`,
    image:
      addForm.value.image ||
      `https://placehold.co/600x400/181b24/f59e0b?text=${encodeURIComponent(addForm.value.nameZh.trim())}`,
    ingredients: validIngredients,
    isFav: false,
    isLiked: false,
    likes: 0,
    method: addForm.value.method,
    nameEn: addForm.value.nameEn.trim(),
    nameZh: addForm.value.nameZh.trim(),
    steps: validSteps.length > 0 ? validSteps : ['將所有材料依照技法調製後倒入杯中即完成。'],
    strengthLevel: liveAbvData.value.strengthLevel,
  };

  isSubmitting.value = true;
  try {
    const created = await globalAddRecipe(newRecipe);
    if (created) {
      emit('submit', created);
      handleClose();
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isModalActive"
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      @click.self="handleClose"
    >
      <div
        class="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-speakeasy-900 shadow-2xl transition-all"
      >
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between border-b border-white/10 bg-speakeasy-850/50 p-6"
        >
          <div>
            <h2 class="font-serif text-xl font-bold text-white">新增自訂調酒酒譜</h2>
            <p class="mt-0.5 text-xs text-slate-400">
              標註配方品牌、多選風味，並透過融水模型即時預估出杯酒精度
            </p>
          </div>
          <button
            class="flex size-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            type="button"
            @click="handleClose"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Form Content -->
        <form class="max-h-[80vh] space-y-6 overflow-y-auto p-6" @submit.prevent="submitAddRecipe">
          <!-- Cocktail Basic Info -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                中文名稱 <span class="text-rose-400">*</span>
              </label>
              <input
                v-model="addForm.nameZh"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                placeholder="例如：內格羅尼"
                required
                type="text"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                英文 / 原文品名
              </label>
              <input
                v-model="addForm.nameEn"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                placeholder="例如：Negroni"
                type="text"
              />
            </div>
          </div>

          <!-- Spirit Base, Technique & Bartender Author -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                主要基酒 <span class="text-rose-400">*</span>
              </label>
              <select
                v-model="addForm.base"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                required
              >
                <option v-for="spirit in BASE_SPIRITS" :key="spirit.id" :value="spirit.id">
                  {{ spirit.nameZh }} ({{ spirit.nameEn }})
                </option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                調製技法
              </label>
              <select
                v-model="addForm.method"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Stir (攪拌法)">Stir (攪拌法 / 稀釋率約 22%)</option>
                <option value="Shake (搖盪法)">Shake (搖盪法 / 稀釋率約 33%)</option>
                <option value="Build (直調法)">Build (直調法 / 稀釋率約 18%)</option>
                <option value="Blend (霜凍法)">Blend (霜凍法 / 稀釋率約 45%)</option>
                <option value="Layer (分層法)">Layer (分層法 / 無稀釋 0%)</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                調酒師署名
              </label>
              <input
                v-model="addForm.author"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                placeholder="例如：BarCraft Master"
                type="text"
              />
            </div>
          </div>

          <!-- Glass, Ice & Garnish with Datalist Suggestions -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                建議杯型
              </label>
              <input
                v-model="addForm.glass"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                list="glassPresets"
                placeholder="例如：古典杯"
                type="text"
              />
              <datalist id="glassPresets">
                <option value="古典杯 (Rocks / Old Fashioned Glass)" />
                <option value="馬丁尼杯 (Martini / Cocktail Glass)" />
                <option value="高球杯 (Highball / Collins Glass)" />
                <option value="碟型香檳杯 (Coupe Glass)" />
                <option value="尼克與諾拉杯 (Nick & Nora Glass)" />
              </datalist>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                冰塊類型
              </label>
              <input
                v-model="addForm.ice"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                list="icePresets"
                placeholder="例如：手鑿大方冰"
                type="text"
              />
              <datalist id="icePresets">
                <option value="手鑿大方老冰 (Clear Ice Cube)" />
                <option value="方形實心冰塊 (Cubed Ice)" />
                <option value="純淨冰球 (Ice Sphere)" />
                <option value="碎冰 (Crushed Ice)" />
                <option value="純飲無冰 (Straight Up / Neat)" />
              </datalist>
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
                裝飾物 (Garnish)
              </label>
              <input
                v-model="addForm.garnish"
                class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                list="garnishPresets"
                placeholder="例如：橙皮捲"
                type="text"
              />
              <datalist id="garnishPresets">
                <option value="橙皮捲 (Orange Twist)" />
                <option value="檸檬皮油 (Lemon Peel)" />
                <option value="油漬橄欖 (Green Olive)" />
                <option value="酒漬櫻桃 (Maraschino Cherry)" />
                <option value="新鮮薄荷葉 (Fresh Mint)" />
              </datalist>
            </div>
          </div>

          <!-- Flavor Multi-Select Picker -->
          <!-- Flavor Multi-Select Picker -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
              風味標籤 (可複選)
            </label>
            <FlavorTagPicker v-model="addForm.flavors" />
          </div>

          <!-- Ingredients Section with Brand Tags -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label
                class="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase"
              >
                <span>調配材料、指定品牌與酒精濃度</span>
                <span class="text-rose-400">*</span>
              </label>
              <button
                class="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                type="button"
                @click="addIngredientRow"
              >
                <i class="fa-solid fa-plus-circle" /> 新增一列材料
              </button>
            </div>

            <div class="space-y-2.5">
              <IngredientRowInput
                v-for="(row, rIdx) in addForm.ingredients"
                :key="row.id"
                v-model="addForm.ingredients[rIdx]"
                @remove="removeIngredientRow(rIdx)"
              />
            </div>

            <!-- Live ABV Estimation Box -->
            <div
              class="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-speakeasy-950 p-4 shadow-inner"
            >
              <div
                class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-xl text-amber-400"
                  >
                    <i class="fa-solid fa-gauge-high" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-200">
                        出酒酒精濃度即時預估 (Live ABV)
                      </span>
                      <span
                        class="rounded-full border px-2 py-0.5 text-[10px] font-bold"
                        :class="liveAbvData.strengthColor"
                      >
                        {{ liveAbvData.strengthLabel }}
                      </span>
                    </div>
                    <div class="mt-0.5 text-[11px] text-slate-400">
                      純酒精 {{ liveAbvData.pureAlcoholMl }} ml · 融水 +{{
                        liveAbvData.dilutionRate
                      }}% ({{ liveAbvData.dilutionWaterMl }}ml) · 預估出酒量 ~{{
                        liveAbvData.dilutedMl
                      }}
                      ml
                    </div>
                  </div>
                </div>
                <div class="flex items-baseline gap-1 self-end text-right sm:self-auto">
                  <span class="font-mono text-xs text-slate-400">預估</span>
                  <span class="font-mono text-2xl font-extrabold text-amber-400">
                    {{ liveAbvData.abv }}%
                  </span>
                  <span class="font-mono text-xs text-slate-400">ABV</span>
                </div>
              </div>

              <!-- Composition meter using AbvStructureMeter -->
              <AbvStructureMeter
                :alcohol-pct="liveAbvData.alcoholPct"
                :diluted-ml="liveAbvData.dilutedMl"
                :dilution-pct="liveAbvData.dilutionPct"
                :dilution-water-ml="liveAbvData.dilutionWaterMl"
                height-class="h-2"
                :mixers-ml="liveAbvData.mixersMl"
                :mixers-pct="liveAbvData.mixersPct"
                :pure-alcohol-ml="liveAbvData.pureAlcoholMl"
                :show-legend="false"
                :show-stats-text="false"
              />
            </div>
          </div>

          <!-- Steps Section -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-300 uppercase">
                調製步驟 (Steps)
              </label>
              <button
                class="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                type="button"
                @click="addStepRow"
              >
                <i class="fa-solid fa-plus-circle" /> 新增步驟
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(step, sIdx) in addForm.steps"
                :key="step.id"
                class="flex items-start gap-2"
              >
                <span class="mt-2.5 w-5 text-right font-mono text-xs font-bold text-amber-500">
                  {{ sIdx + 1 }}.
                </span>
                <textarea
                  v-model="step.text"
                  class="flex-1 rounded-xl border border-white/10 bg-speakeasy-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  placeholder="填寫調製步驟..."
                  rows="1"
                />
                <button
                  class="p-2 text-xs text-slate-500 transition-colors hover:text-rose-400"
                  type="button"
                  @click="removeStepRow(sIdx)"
                >
                  <i class="fa-solid fa-trash-can" />
                </button>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
              風味描述與故事靈感
            </label>
            <textarea
              v-model="addForm.desc"
              class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              placeholder="分享這杯酒的風味輪廓、口感平衡或創作故事..."
              rows="2"
            />
          </div>

          <!-- Image Upload Section -->
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
              上傳照片
            </label>
            <div class="flex items-center gap-4">
              <div
                class="relative flex size-24 flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-speakeasy-850 text-slate-400"
              >
                <img
                  v-if="addForm.image"
                  :alt="addForm.nameZh || '預覽照片'"
                  class="size-full object-cover"
                  :src="addForm.image"
                />
                <template v-else>
                  <i class="fa-solid fa-image mb-1 text-2xl text-slate-500" />
                  <span class="text-[10px]">預覽照片</span>
                </template>
              </div>
              <div class="flex-1">
                <input
                  accept="image/*"
                  class="cursor-pointer text-xs text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-speakeasy-950 hover:file:bg-amber-400"
                  type="file"
                  @change="handleImageUpload"
                />
                <p class="mt-1 text-[11px] text-slate-400">
                  支援 JPG、PNG，若無上傳將自動套用預設高質感圖片。
                </p>
              </div>
            </div>
          </div>

          <!-- Form Action Buttons -->
          <div class="flex items-center justify-end gap-3 border-t border-white/10 pt-4">
            <button
              class="rounded-xl px-5 py-2.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white sm:text-sm"
              type="button"
              @click="handleClose"
            >
              取消
            </button>
            <button
              :disabled="isSubmitting"
              class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2.5 text-xs font-semibold text-speakeasy-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              type="submit"
            >
              <i v-if="isSubmitting" class="fa-solid fa-spinner animate-spin" />
              <span>{{ isSubmitting ? '發布中...' : '發布酒譜' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
