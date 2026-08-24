<template>
  <MainLayout>
    <div
      class="min-h-screen bg-gradient-to-r from-[#2ecc71]/[0.02] via-white/0 to-[#1e90ff]/[0.02]"
    >
      <section class="py-6 sm:py-8 lg:py-10">
        <div class="max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <CreditsTab />
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * Partner credits, on their own route.
 *
 * A thin wrapper, the way the retired CommissionView was: the page *is*
 * CreditsTab, and it lives outside Settings because Settings is one page every
 * account sees and this one is about the partner programme. Keeping the
 * component tab-shaped also means it could be dropped back into a tab row later
 * without a rewrite — e.g. if credits and a future referral page get folded into
 * one partner area.
 *
 * The page owns no gating beyond sign-in, and deliberately: every signed-in
 * account is linked here, because CreditsTab has two halves — the balance and
 * catalogue for partners, the application form for everyone else. Gating the
 * route on `is_partner` would put the application behind the flag it exists to
 * ask for. No wholesale pricing leaks by opening it up: the catalogue is behind
 * the API's own 403, not behind this route.
 */
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainLayout from '@/components/MainLayout.vue'
import CreditsTab from '@/components/settings/CreditsTab.vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  if (!authStore.isAuthenticated) router.push('/signin')
})
</script>
