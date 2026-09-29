import { ref } from "vue";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

const isVisible = ref(false);
const modalOptions = ref<ConfirmOptions>({
  title: "Konfirmasi Hapus",
  message: "",
  confirmText: "Hapus",
  cancelText: "Batal",
  danger: true,
});

let resolvePromise: ((val: boolean) => void) | null = null;

export function useConfirm() {
  function confirm(input: string | ConfirmOptions): Promise<boolean> {
    if (typeof input === "string") {
      const isDelete =
        input.toLowerCase().includes("hapus") ||
        input.toLowerCase().includes("delete");
      modalOptions.value = {
        title: isDelete ? "Konfirmasi Hapus" : "Konfirmasi",
        message: input,
        confirmText: isDelete ? "Hapus" : "Ya, Lanjutkan",
        cancelText: "Batal",
        danger: isDelete,
      };
    } else {
      modalOptions.value = {
        title: input.title || (input.danger ? "Konfirmasi Hapus" : "Konfirmasi"),
        message: input.message,
        confirmText: input.confirmText || (input.danger ? "Hapus" : "Ya, Lanjutkan"),
        cancelText: input.cancelText || "Batal",
        danger: input.danger !== undefined ? input.danger : true,
      };
    }

    isVisible.value = true;
    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
  }

  function onConfirm() {
    isVisible.value = false;
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
  }

  function onCancel() {
    isVisible.value = false;
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
  }

  return {
    isVisible,
    modalOptions,
    confirm,
    onConfirm,
    onCancel,
  };
}
