<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show && confirmationCode"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]"
        @click="emit('close')"
      >
        <div class="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-xs w-full" @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900">Check-in QR Code</h3>
            <button
              @click="emit('close')"
              class="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X class="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div class="flex flex-col items-center">
            <div class="bg-white p-3 rounded-xl border border-slate-200 mb-4">
              <img :src="qrCodeUrl" :alt="confirmationCode" class="w-48 h-48" />
            </div>
            <p class="text-xs text-slate-500 mb-1">Confirmation Code</p>
            <p class="font-mono font-bold text-lg text-slate-900">{{ confirmationCode }}</p>
            <p class="text-xs text-slate-500 mt-3 text-center">
              Show this QR code at the event for quick check-in
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  show: boolean
  confirmationCode: string | null | undefined
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const qrCodeUrl = computed(() => {
  if (!props.confirmationCode) return ''
  const code = encodeURIComponent(props.confirmationCode)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${code}`
})
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
</style>
