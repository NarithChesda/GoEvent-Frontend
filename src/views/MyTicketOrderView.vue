<template>
  <MainLayout :hide-mobile-tab-bar="true">
    <div class="min-h-screen bg-slate-50/50">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 pt-6 [padding-bottom:calc(env(safe-area-inset-bottom)+10rem)] lg:[padding-bottom:calc(env(safe-area-inset-bottom)+2rem)]">
        <!-- Back link -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4 px-2 py-1.5 -mx-2 rounded-lg hover:bg-slate-100/60 transition-colors"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          {{ t('events.tickets.order.back') }}
        </button>

        <TicketOrderDetailPanel :code="code" />
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import TicketOrderDetailPanel from '@/components/tickets/public/TicketOrderDetailPanel.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()
const route = useRoute()
const router = useRouter()

const code = String(route.params.code)

const goBack = () => {
  router.push({ name: 'my-tickets' })
}
</script>
