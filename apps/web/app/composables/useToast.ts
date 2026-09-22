import { onUnmounted, ref } from 'vue';

export function useToast() {
  const toast = ref({
    icon: 'fa-circle-check',
    message: '',
    show: false,
  });

  let toastTimer: null | ReturnType<typeof setTimeout> = null;

  function showToast(message: string, icon = 'fa-circle-check') {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toast.value = { icon, message, show: true };
    toastTimer = setTimeout(() => {
      toast.value.show = false;
    }, 2500);
  }

  onUnmounted(() => {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
  });

  return {
    showToast,
    toast,
  };
}
