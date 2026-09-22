import { ref } from 'vue';

const toast = ref({
  icon: 'fa-circle-check',
  message: '',
  show: false,
});

let toastTimer: null | ReturnType<typeof setTimeout> = null;

export function useToast() {
  function showToast(message: string, icon = 'fa-circle-check') {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toast.value = { icon, message, show: true };
    toastTimer = setTimeout(() => {
      toast.value.show = false;
    }, 2500);
  }

  return {
    showToast,
    toast,
  };
}
