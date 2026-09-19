<template>
  <MainLayout>
    <section
      class="flex min-h-[calc(100vh_-_var(--nav-inset))] items-center justify-center px-4 py-12 lg:min-h-[calc(100vh-4rem)] lg:py-16"
    >
      <div class="text-center">
        <div
          class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 lg:h-32 lg:w-32"
          aria-hidden="true"
        >
          <Compass class="h-1/2 w-1/2 text-[#2ecc71]" />
        </div>
        <h1 class="mb-2 text-xl font-bold text-slate-900 lg:mb-3 lg:text-2xl">
          {{ t('common.notFoundPage.title') }}
        </h1>
        <p class="mx-auto mb-6 max-w-md text-sm text-slate-600 lg:text-base">
          {{ t('common.notFoundPage.description') }}
        </p>
        <RouterLink
          to="/"
          class="inline-flex min-h-[40px] items-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 lg:px-6 lg:py-3 lg:text-base"
        >
          {{ t('common.notFoundPage.action') }}
        </RouterLink>
      </div>
    </section>
  </MainLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Compass } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

/*
 * An unknown path the server doesn't recognise arrives from dist/404.html,
 * whose static head already says noindex. One under a `_redirects` splat
 * (`/events/x/y/z`) arrives with the regular shell and a 200, so the page says
 * it itself; Google reads a robots tag the app adds. Taken down on the way
 * out, and only if this view added it.
 */
let addedRobots: HTMLMetaElement | null = null

onMounted(() => {
  if (document.head.querySelector('meta[name="robots"]')) return
  addedRobots = document.createElement('meta')
  addedRobots.name = 'robots'
  addedRobots.content = 'noindex'
  document.head.appendChild(addedRobots)
})

onUnmounted(() => {
  addedRobots?.remove()
  addedRobots = null
})
</script>
