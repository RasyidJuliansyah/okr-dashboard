<template>
  <div id="app" :class="{ 'css-loaded': cssLoaded }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
const cssLoaded = ref(false)

onMounted(() => {
  // Tunggu sampai semua stylesheet ter-load
  const checkCSS = () => {
    const stylesheets = Array.from(document.styleSheets)
    const allLoaded = stylesheets.every(sheet => {
      try {
        return sheet.cssRules.length > 0
      } catch (e) {
        return true
      }
    })
    return allLoaded
  }

  // Force show setelah 100ms atau CSS loaded
  setTimeout(() => {
    cssLoaded.value = true
  }, 100)

  if (checkCSS()) {
    cssLoaded.value = true
  } else {
    window.addEventListener('load', () => {
      cssLoaded.value = true
    })
  }
})
</script>

<style>
#app {
  min-height: 100vh;
}

.css-not-loaded {
  visibility: hidden;
}

.css-loaded {
  visibility: visible;
  transition: visibility 0.1s ease-in;
}
</style>
