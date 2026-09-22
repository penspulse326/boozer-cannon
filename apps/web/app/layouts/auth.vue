<script setup lang="ts">
import AppToast from '~/components/common/app-toast.vue';
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-speakeasy-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-speakeasy-950"
  >
    <!-- Minimal Header -->
    <header class="border-b border-white/5 bg-speakeasy-950/60 p-4 backdrop-blur-md sm:px-8">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <NuxtLink class="flex items-center gap-3 transition-opacity hover:opacity-90" to="/">
          <div
            class="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-speakeasy-950 shadow-lg shadow-amber-500/20"
          >
            <i class="fa-solid fa-martini-glass-citrus text-lg" />
          </div>
          <div>
            <span class="block font-serif text-base font-bold tracking-wide text-white sm:text-lg">
              BarCraft
            </span>
            <span
              class="block text-[9px] font-medium tracking-wider text-amber-400 uppercase sm:text-[10px]"
            >
              Cocktail Archive
            </span>
          </div>
        </NuxtLink>

        <NuxtLink
          class="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-amber-400"
          to="/"
        >
          <i class="fa-solid fa-arrow-left text-[10px]" />
          <span>返回酒譜首頁</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Centered Content Area -->
    <main class="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </main>

    <!-- Minimal Footer -->
    <footer class="border-t border-white/5 py-6 text-center text-xs text-slate-500">
      理性飲酒 · 未滿 18 歲請勿飲酒 · 禁止酒駕
    </footer>

    <!-- Global Toast -->
    <AppToast />
  </div>
</template>
