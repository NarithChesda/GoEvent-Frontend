<template>
  <div class="space-y-6">
    <!-- Media Uploads Section -->
    <MediaUploadsSection
      :event-data="eventData"
      :can-edit="canEdit"
      @updated="handleEventUpdated"
    />

    <!-- Dress Code Section -->
    <DressCodeSection
      v-if="eventData?.id"
      ref="dressCodeSectionRef"
      :event-id="eventData.id"
      :can-edit="canEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Event } from '@/services/api'
import MediaUploadsSection from './MediaUploadsSection.vue'
import DressCodeSection from './DressCodeSection.vue'

interface Props {
  eventData?: Event
  canEdit: boolean
}

interface Emits {
  (e: 'updated', event: Event): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// Template ref for DressCodeSection
const dressCodeSectionRef = ref<InstanceType<typeof DressCodeSection> | null>(null)

/**
 * Handle event updates from child components
 */
const handleEventUpdated = (updatedEvent: Event) => {
  emit('updated', updatedEvent)
}

// Expose method to open dress code modal
defineExpose({
  openDressCodeModal: () => {
    dressCodeSectionRef.value?.openAddModal()
  }
})
</script>
