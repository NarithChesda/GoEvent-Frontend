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
 * account sees and this one is for partners. Keeping the component tab-shaped
 * also means it could be dropped back into a tab row later without a rewrite —
 * e.g. if credits and a future referral page get folded into one partner area.
 *
 * The page owns no gating of its own: the nav links to it only for accounts
 * flagged `is_partner`, and CreditsTab renders its own "not a partner" state for
 * anyone who arrives by URL.
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
