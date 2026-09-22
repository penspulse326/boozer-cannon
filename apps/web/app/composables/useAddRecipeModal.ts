import { ref } from 'vue';

const isAddModalOpen = ref(false);

export function useAddRecipeModal() {
  function openAddModal() {
    isAddModalOpen.value = true;
  }

  function closeAddModal() {
    isAddModalOpen.value = false;
  }

  return {
    closeAddModal,
    isAddModalOpen,
    openAddModal,
  };
}
