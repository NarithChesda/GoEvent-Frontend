<template>
  <!-- The homepage. It used to be EventsView rendering its signed-out branch,
       which made `/` download the whole events list — the timeline, the event
       drawer, the create drawer — for a page that shows none of it. This view
       imports only what the landing draws.

       The chrome steps aside as it does on the signed-out /events: the hero
       owns the first screen, and the footer below the sections is the way on. -->
  <MainLayout hide-top-nav hide-mobile-tab-bar hide-contact-fab>
    <div class="flex flex-col">
      <EventsLandingHero @create="handleCreate" />
      <LandingSections />
      <AppFooter />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MainLayout from '@/components/MainLayout.vue'
import AppFooter from '@/components/AppFooter.vue'
// By file, not through '@/components/events': that barrel also exports the
// events list, which is exactly what this view exists to leave out.
import EventsLandingHero from '@/components/events/EventsLandingHero.vue'
import LandingSections from '@/components/landing/LandingSections.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

/** Where the create drawer lives. A signed-out visitor signs in on the way. */
const handleCreate = () => {
  const target = { path: '/events', query: { createEvent: 'true' } }
  if (authStore.isAuthenticated) {
    router.push(target)
  } else {
    router.push({ path: '/signin', query: { redirect: '/events?createEvent=true' } })
  }
}
</script>
