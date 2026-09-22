<script setup lang="ts">
import AppToast from '~/components/app-toast.vue';
import AddRecipeModal from '~/containers/add-recipe-modal.vue';
import AppFooter from '~/containers/app-footer.vue';
import TheHeader from '~/containers/the-header.vue';
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-speakeasy-950 font-sans text-slate-100 selection:bg-amber-500 selection:text-speakeasy-950"
  >
    <TheHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
    <AddRecipeModal />
    <AppToast />
  </div>
</template>
