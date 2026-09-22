<script setup lang="ts">
import AppToast from '~/components/common/app-toast.vue';
import AppFooter from '~/components/layout/app-footer.vue';
import AppHeader from '~/components/layout/app-header.vue';
import AddRecipeModal from '~/components/recipe/add-recipe-modal.vue';
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-speakeasy-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-speakeasy-950"
  >
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <AddRecipeModal />
    <AppToast />
  </div>
</template>
