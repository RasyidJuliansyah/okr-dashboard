import { ref } from "vue";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  danger?: boolean;
  type?: "info" | "danger" | "success";
}

const isVisible = ref(false);
const modalOptions = ref<ConfirmOptions>({
  title: "Konfirmasi Hapus",
  message: "",
  confirmText: "Hapus",
  cancelText: "Batal",
  danger: true,
  type: "danger",
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
        type: isDelete ? "danger" : "info",
      };
    } else {
      const isDelete =
        input.danger !== undefined
          ? input.danger
          : (input.title || "").toLowerCase().includes("hapus");
      modalOptions.value = {
        title: input.title || (isDelete ? "Konfirmasi Hapus" : "Konfirmasi"),
        message: input.message,
        confirmText: input.confirmText || (isDelete ? "Hapus" : "Ya, Lanjutkan"),
        cancelText: input.cancelText !== undefined ? input.cancelText : "Batal",
        danger: isDelete,
        type: input.type || (isDelete ? "danger" : "info"),
      };
    }

    isVisible.value = true;
    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
  }

  function alert(input: string | ConfirmOptions): Promise<boolean> {
    if (typeof input === "string") {
      modalOptions.value = {
        title: "Informasi",
        message: input,
        confirmText: "OK",
        cancelText: null,
        danger: false,
        type: "info",
      };
    } else {
      modalOptions.value = {
        title: input.title || "Informasi",
        message: input.message,
        confirmText: input.confirmText || "OK",
        cancelText: null,
        danger: input.danger || false,
        type: input.type || (input.danger ? "danger" : "info"),
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
    alert,
    onConfirm,
    onCancel,
  };
}

