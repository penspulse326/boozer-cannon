import { onMounted, onUnmounted, type Ref, watch } from 'vue';

let activeModalCount = 0;

export function useModalLock(isOpen: Ref<boolean>, onEscape?: () => void) {
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen.value && onEscape) {
      onEscape();
    }
  }

  watch(
    isOpen,
    (open, prev) => {
      if (open && !prev) {
        lockBody();
      } else if (!open && prev) {
        unlockBody();
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    if (import.meta.client && onEscape) {
      window.addEventListener('keydown', handleKeydown);
    }
  });

  onUnmounted(() => {
    if (isOpen.value) {
      unlockBody();
    }
    if (import.meta.client && onEscape) {
      window.removeEventListener('keydown', handleKeydown);
    }
  });
}

function lockBody() {
  if (import.meta.client) {
    if (activeModalCount === 0) {
      document.body.style.overflow = 'hidden';
    }
    activeModalCount++;
  }
}

function unlockBody() {
  if (import.meta.client) {
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (activeModalCount === 0) {
      document.body.style.overflow = '';
    }
  }
}
