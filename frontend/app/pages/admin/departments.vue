<template>
  <div></div>
</template>

<script setup>
definePageMeta({
  middleware: [
    () => {
      return navigateTo("/departments", { replace: true });
    },
  ],
});
await navigateTo("/departments", { replace: true });
</script>
