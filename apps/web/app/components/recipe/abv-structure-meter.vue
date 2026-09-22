<script setup lang="ts">
withDefaults(
  defineProps<{
    alcoholPct: number;
    dilutedMl?: number;
    dilutionPct: number;
    dilutionWaterMl?: number;
    heightClass?: string;
    mixersMl?: number;
    mixersPct: number;
    pureAlcoholMl?: number;
    showLegend?: boolean;
    showStatsText?: boolean;
  }>(),
  {
    dilutedMl: 0,
    dilutionWaterMl: 0,
    heightClass: 'h-3',
    mixersMl: 0,
    pureAlcoholMl: 0,
    showLegend: true,
    showStatsText: true,
  },
);
</script>

<template>
  <div class="space-y-1.5 pt-1">
    <div v-if="showStatsText" class="flex items-center justify-between text-[11px] text-slate-400">
      <span class="font-medium text-slate-300"> 出杯液體結構比例 (Liquid Structure) </span>
      <span class="font-mono text-[10px]">
        純酒精 {{ pureAlcoholMl }}ml | 水份 {{ mixersMl }}ml | 融冰 {{ dilutionWaterMl }}ml
      </span>
    </div>

    <!-- Segmented Liquid Meter -->
    <div
      class="flex w-full overflow-hidden rounded-full border border-white/10 bg-speakeasy-950 p-0.5"
      :class="heightClass"
    >
      <div
        class="h-full rounded-l-full bg-rose-500 transition-all duration-500"
        :style="{ width: `${alcoholPct}%` }"
        title="純酒精"
      />
      <div
        class="h-full bg-emerald-500 transition-all duration-500"
        :style="{ width: `${mixersPct}%` }"
        title="果汁與副材料水份"
      />
      <div
        class="h-full rounded-r-full bg-sky-400 transition-all duration-500"
        :style="{ width: `${dilutionPct}%` }"
        title="冰塊融水"
      />
    </div>

    <!-- Legend -->
    <div
      v-if="showLegend"
      class="flex items-center justify-center gap-4 pt-0.5 text-[10px] text-slate-400"
    >
      <span class="flex items-center gap-1">
        <span class="inline-block size-2 rounded-full bg-rose-500" />
        純酒精
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block size-2 rounded-full bg-emerald-500" />
        果汁/副材料水份
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block size-2 rounded-full bg-sky-400" />
        冰塊融水
      </span>
    </div>
  </div>
</template>
