<template>
  <div ref="root" class="app-dropdown" :class="{ 'is-open': open }">
    <button
      type="button"
      class="app-dropdown__trigger"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @keydown.esc.prevent="close"
      @click="open = !open"
    >
      {{ selectedLabel }}
    </button>

    <ul class="app-dropdown__content" role="listbox">
      <li v-for="option in options" :key="option.value" role="option">
        <a
          href="#"
          class="app-dropdown__option"
          :class="{ 'is-selected': option.value === modelValue }"
          :aria-selected="option.value === modelValue"
          @click.prevent="select(option.value)"
        >
          {{ option.label }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: "Pilih opsi" },
});

const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const open = ref(false);

const selectedLabel = computed(
  () => props.options.find((option) => option.value === props.modelValue)?.label || props.placeholder,
);

function select(value) {
  emit("update:modelValue", value);
  emit("change", value);
  close();
}

function close() {
  open.value = false;
}

function handleOutsideClick(event) {
  if (root.value && !root.value.contains(event.target)) close();
}

onMounted(() => document.addEventListener("click", handleOutsideClick));
onBeforeUnmount(() => document.removeEventListener("click", handleOutsideClick));
</script>

<style scoped>
.app-dropdown {
  position: relative;
  width: 100%;
}

.app-dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 42px;
  padding: 0.65rem 2.5rem 0.65rem 0.75rem;
  color: var(--text-body, #334155);
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
}

.app-dropdown__trigger::after {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  width: 16px;
  height: 16px;
  content: "";
  background: currentColor;
  transform: translateY(-50%);
  mask: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e") center / contain no-repeat;
}

.app-dropdown.is-open .app-dropdown__trigger::after {
  transform: translateY(-50%) rotate(180deg);
}

.app-dropdown__trigger:focus-visible,
.app-dropdown__option:focus-visible {
  outline: 2px solid var(--color-primary, #0e97d6);
  outline-offset: 2px;
}

.app-dropdown__content {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1000;
  overflow: hidden;
  margin: 0;
  padding: 4px 0;
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  list-style: none;
}

.app-dropdown:hover .app-dropdown__content,
.app-dropdown:focus-within .app-dropdown__content {
  display: block;
}

.app-dropdown__option {
  display: block;
  padding: 0.65rem 0.75rem;
  color: var(--text-body, #334155);
  text-decoration: none;
}

.app-dropdown__option:hover,
.app-dropdown__option.is-selected {
  background: var(--primary-light, #f1f5f9);
}
</style>