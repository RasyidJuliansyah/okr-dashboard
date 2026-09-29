import { useState } from "#app";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

let resolvePromise: ((val: boolean) => void) | null = null;

export function useConfirm() {
  const isVisible = useState<boolean>("confirm-modal-visible", () => false);
  const modalOptions = useState<ConfirmOptions>("confirm-modal-options", () => ({
    title: "Konfirmasi Hapus",
    message: "",
    confirmText: "Hapus",
    cancelText: "Batal",
    danger: true,
  }));

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

