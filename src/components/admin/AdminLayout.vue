<template>
  <MainLayout>
    <div class="min-h-screen">
      <section class="py-4 sm:py-6 lg:py-8">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header class="mb-5 flex items-center justify-between gap-2 sm:mb-6">
            <div class="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20"
                aria-hidden="true"
              >
                <ShieldCheck class="h-5 w-5 text-[#2ecc71]" />
              </span>
              <h1 class="min-w-0 flex-1 truncate text-2xl font-bold text-slate-900 sm:text-3xl">
                {{ t('admin.title') }}
              </h1>
            </div>
            <p
              v-if="adminStore.totalPending > 0"
              class="flex-shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
            >
              {{ t('admin.pendingTotal', { count: adminStore.totalPending }) }}
            </p>
          </header>

          <div class="lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-8">
            <AdminNav class="mb-5 lg:mb-0" />
            <div class="min-w-0">
              <RouterView />
            </div>
          </div>
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * The staff dashboard's shell.
 *
 * It keeps `MainLayout`, unlike the public template gallery which drops it:
 * everyone who reaches this page has an account and is mid-session in the app,
 * so the top bar is the way back out — and the profile menu it carries is where
 * the link in was.
 *
 * `/summary/` is fetched here rather than per page, because the badges belong to
 * the nav and the nav belongs to this layout. Fetched **on navigation, not on a
 * timer**: the whole dashboard shares a 2000/hour budget, and a poll would spend
 * it on a number that only changes when someone presses a button.
 *
 * The container runs one step wider than the app's usual page (`lg:max-w-6xl`
 * against `lg:max-w-5xl`) because a 13.5rem sidebar is taken off the top of it
 * before any content is laid out.
 *
 * **The guard on this route is UX, not security.** Every `/api/admin/` endpoint
 * enforces `is_staff` itself. Nothing here may be relied on as a control.
 */
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterView } from 'vue-router'
import { ShieldCheck } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import AdminNav from './AdminNav.vue'
import { useAdminStore } from '@/stores/admin'

const { t } = useI18n()
const adminStore = useAdminStore()

onMounted(() => {
  void adminStore.loadSummary()
})
</script>
