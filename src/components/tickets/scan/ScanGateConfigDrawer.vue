<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998]"
        @click="onClose"
      />
    </Transition>

    <Transition name="slide-right">
      <div
        v-if="open"
        class="fixed bottom-0 right-0 md:top-4 md:bottom-4 md:right-4 w-full md:w-[440px] md:max-w-[calc(100vw-32px)] max-h-[85vh] md:max-h-none bg-white rounded-t-3xl md:rounded-2xl shadow-2xl z-[999] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        @click.stop
      >
        <!-- Header -->
        <div class="flex-shrink-0 sticky top-0 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] z-10">
          <div class="flex items-center justify-between gap-3 px-4 py-3">
            <div class="min-w-0">
              <p class="text-[10px] uppercase tracking-wide text-white/80 leading-tight">
                {{ t('management.tickets.scan.actions.configureGates') }}
              </p>
              <p class="text-sm font-semibold text-white leading-tight">
                {{ t('management.tickets.scan.gateConfig.title') }}
              </p>
            </div>
            <button
              type="button"
              class="w-8 h-8 rounded-full hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
              :aria-label="t('management.tickets.scan.actions.exit')"
              @click="onClose"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          <label
            class="flex items-center gap-3 py-2.5 px-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <input
              type="radio"
              :checked="!hasSelection"
              class="w-4 h-4 text-emerald-500 border-slate-300 focus:ring-emerald-500"
              @change="draft = []"
            />
            <span class="text-sm font-medium text-slate-900">
              {{ t('management.tickets.scan.gateConfig.allTiers') }}
            </span>
          </label>

          <hr class="my-2 border-slate-200" />

          <label
            v-for="tier in tiers"
            :key="tier.id"
            class="flex items-center gap-3 py-2.5 px-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <input
              type="checkbox"
              :checked="draft.includes(tier.id)"
              class="w-4 h-4 rounded text-emerald-500 border-slate-300 focus:ring-emerald-500"
              @change="toggle(tier.id)"
            />
            <span class="flex-1 text-sm text-slate-900 truncate">{{ tier.name }}</span>
            <span class="text-xs text-slate-500 tabular-nums flex-shrink-0">
              {{ tier.currency }} {{ tier.price }}
            </span>
          </label>

          <p
            v-if="tiers.length === 0"
            class="text-sm text-slate-500 py-6 text-center"
          >
            —
          </p>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
          <span class="text-xs text-slate-500">
            {{ t('management.tickets.scan.gateConfig.selectedCount', { count: draft.length }) }}
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all shadow-md"
            @click="save"
          >
            {{ t('management.tickets.scan.gateConfig.save') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'
import type { TicketType } from '@/services/api/types/ticket.types'

const props = defineProps<{
  open: boolean
  tiers: TicketType[]
  /** Current persisted selection. Empty / null = "all tiers". */
  allowedTierIds: number[] | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  /** Empty array means "no scoping — all tiers allowed". */
  save: [next: number[]]
}>()

const { t } = useAppLanguage()

const draft = ref<number[]>([])
const hasSelection = computed(() => draft.value.length > 0)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      draft.value = props.allowedTierIds ? [...props.allowedTierIds] : []
    }
  },
)

function toggle(id: number) {
  const idx = draft.value.indexOf(id)
  if (idx === -1) draft.value.push(id)
  else draft.value.splice(idx, 1)
}

function save() {
  emit('save', [...draft.value])
}

function onClose() {
  emit('update:open', false)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active {
  transition: transform 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.slide-right-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .slide-right-enter-from,
  .slide-right-leave-to {
    transform: translateX(100%);
  }
}
</style>
