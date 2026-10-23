import { defineNuxtPlugin, useRuntimeConfig, useRouter } from '#app'
import { nextTick } from 'vue'
import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiKey = config.public.posthogPublicKey as string
  const apiHost = (config.public.posthogHost as string) || 'https://us.i.posthog.com'

  if (!apiKey) {
    if (import.meta.dev) {
      console.warn('[PostHog] NUXT_PUBLIC_POSTHOG_KEY belum diisi di .env. Tracking nonaktif.')
    }
    return
  }

  // ponytail: basic client analytics ceiling; add session recording / feature flags when requested
  const client = posthog.init(apiKey, {
    api_host: apiHost,
    person_profiles: 'identified_only',
    capture_pageview: false,
    loaded: (ph) => {
      if (import.meta.dev) ph.debug()
    },
  })

  const router = useRouter()
  router.afterEach((to) => {
    nextTick(() => {
      posthog.capture('$pageview', {
        $current_url: to.fullPath,
      })
    })
  })

  return {
    provide: {
      posthog: () => client,
    },
  }
})
