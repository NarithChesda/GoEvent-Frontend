<template>
  <!-- The homepage. It used to be EventsView rendering its signed-out branch,
       which made `/` download the whole events list — the timeline, the event
       drawer, the create drawer — for a page that shows none of it. This view
       imports only what the landing draws; the create wizard is the one extra,
       and it arrives as its own chunk (see below).

       The chrome steps aside as it does on the signed-out /events: the hero
       owns the first screen, and the footer below the sections is the way on. -->
  <MainLayout hide-top-nav hide-mobile-tab-bar hide-contact-fab>
    <div class="flex flex-col">
      <EventsLandingHero @create="showCreate = true" />
      <LandingSections />
      <AppFooter />
    </div>

    <!-- Opened right here, over the page that offered it — no sign-in first and
         no trip to /events. Mounted on first open and kept, so closing it plays
         its slide out. -->
    <EventCreateDrawer
      v-if="createMounted"
      :is-visible="showCreate"
      @close="showCreate = false"
    />
  </MainLayout>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref, watch } from 'vue'
import MainLayout from '@/components/MainLayout.vue'
import AppFooter from '@/components/AppFooter.vue'
// By file, not through '@/components/events': that barrel also exports the
// events list, which is exactly what this view exists to leave out.
import EventsLandingHero from '@/components/events/EventsLandingHero.vue'
import LandingSections from '@/components/landing/LandingSections.vue'

/**
 * The wizard is this page's one call to action, but not part of its first
 * paint, so it is a chunk of its own — fetched while the browser is idle after
 * the landing has drawn. By the time anyone presses the button it is already
 * here, and the drawer answers on the press rather than a network round trip
 * later.
 */
const loadCreateDrawer = () => import('@/components/EventCreateDrawer.vue')
const EventCreateDrawer = defineAsyncComponent(loadCreateDrawer)

const showCreate = ref(false)
const createMounted = ref(false)

watch(showCreate, (open) => {
  if (open) createMounted.value = true
})

onMounted(() => {
  const whenIdle: (callback: () => void) => void =
    'requestIdleCallback' in window
      ? (callback) => window.requestIdleCallback(callback, { timeout: 3000 })
      : (callback) => window.setTimeout(callback, 1500)
  whenIdle(() => {
    loadCreateDrawer().catch(() => {
      // Fetched again, with a visible wait, when the button is pressed.
    })
  })
})
</script>
