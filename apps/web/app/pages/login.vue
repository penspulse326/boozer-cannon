<script setup lang="ts">
import { ref } from 'vue';

import { useToast } from '~/composables/useToast';

definePageMeta({
  layout: 'auth',
});

const email = ref('');
const password = ref('');
const { showToast } = useToast();

function handleLogin() {
  showToast('歡迎回來！登入功能即將推出。', 'fa-circle-check');
}
</script>

<template>
  <div
    class="rounded-3xl border border-white/10 bg-speakeasy-900/90 p-6 shadow-2xl backdrop-blur-md sm:p-8"
  >
    <div class="mb-6 text-center">
      <h1 class="font-serif text-2xl font-bold text-white">調酒師登入</h1>
      <p class="mt-1 text-xs text-slate-400">登入以收藏喜愛的酒譜與建立自訂特調</p>
    </div>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase">
          電子郵件
        </label>
        <input
          v-model="email"
          class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          placeholder="bartender@barcraft.app"
          required
          type="email"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-semibold text-slate-300 uppercase"> 密碼 </label>
        <input
          v-model="password"
          class="w-full rounded-xl border border-white/10 bg-speakeasy-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          placeholder="••••••••"
          required
          type="password"
        />
      </div>

      <button
        class="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 text-sm font-semibold text-speakeasy-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 active:scale-95"
        type="submit"
      >
        登入
      </button>
    </form>

    <div class="mt-6 text-center text-xs text-slate-400">
      還沒有帳號？
      <NuxtLink class="font-medium text-amber-400 hover:underline" to="/">
        先以訪客身分探索
      </NuxtLink>
    </div>
  </div>
</template>
