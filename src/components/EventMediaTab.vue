<template>
  <div class="space-y-6">
    <!-- Header -->
    <div v-if="!props.hideHeader" class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-tight">{{ t('management.media.title') }}</h2>
        <p class="text-xs sm:text-sm text-slate-600 mt-1">{{ t('management.media.subtitle') }}</p>
      </div>
    </div>

    <!-- All Sections Stacked -->
    <div class="space-y-6">
      <!-- Auto-fill from the category template — sits above the very sections
           it creates (Texts, Hosts, Agenda). Suppressed where a host renders the
           trigger itself (the Design Studio's mobile toolbar), which then calls
           `refreshContent` in this component's place. -->
      <PopulateFromTemplateCard
        v-if="!props.hidePopulate"
        :event="localEventData"
        :can-edit="canEdit"
        @populated="handlePopulated"
      />

      <!-- Brand Assets Section: Logo & Music (Category-specific: wedding, birthday, housewarming) -->
      <div v-if="props.showCategorySpecificSections">
        <div v-if="!localEventData && props.eventId" class="bg-white/80 backdrop-blur-sm border border-white/20 rounded-3xl shadow-xl p-6 sm:p-8">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-[#1e90ff]"></div>
            <span class="ml-2 sm:ml-3 text-xs sm:text-sm text-slate-600">{{ t('management.media.loading') }}</span>
          </div>
        </div>
        <MediaUploadsSection
          v-else
          :event-data="localEventData"
          :can-edit="canEdit"
          @updated="handleEventUpdated"
        />
      </div>

      <!-- Event Banner (all categories) — the sole editor for banner_image,
           shown as the link-preview card guests actually receive. -->
      <div v-if="localEventData?.id">
        <EventBannerSection
          :event="localEventData"
          :can-edit="canEdit"
          @updated="handleEventUpdated"
        />
      </div>

      <!-- Event Texts Section (Category-specific: wedding, birthday, housewarming) -->
      <div v-if="props.showCategorySpecificSections && localEventData?.id">
        <EventTextTab
          ref="eventTextTabRef"
          :key="`texts-${contentVersion}`"
          :event-id="localEventData.id"
        />
      </div>

      <!-- Hosts Section (merged from the standalone tab, all categories) -->
      <div v-if="localEventData?.id">
        <EventHostsTab
          :key="`hosts-${contentVersion}`"
          :event-id="localEventData.id"
          :can-edit="canEdit"
          :event-category="localEventData.category_details?.name || localEventData.category_name || ''"
          embedded
        />
      </div>

      <!-- Agenda Section (merged from the standalone tab, all categories) -->
      <div v-if="localEventData?.id">
        <EventAgendaTab
          :key="`agenda-${contentVersion}`"
          :event-id="localEventData.id"
          :can-edit="canEdit"
          embedded
        />
      </div>

      <!-- Dress Code Section (all categories) -->
      <div v-if="localEventData?.id">
        <DressCodeSection
          ref="dressCodeSectionRef"
          :event-id="localEventData.id"
          :can-edit="canEdit"
        />
      </div>

      <!-- Photo Gallery Section -->
      <div>
        <div class="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-4 sm:p-6 border border-white/20">
          <!-- Header (click to expand/collapse) -->
          <div class="flex items-start justify-between gap-4">
            <button
              type="button"
              class="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-lg"
              :aria-expanded="isPhotosExpanded"
              :aria-label="t('management.media.sectionToggle')"
              @click="togglePhotosExpanded"
            >
              <h5 class="font-semibold text-slate-900">{{ t('management.media.photos.title') }}</h5>
              <p class="text-sm text-slate-600">{{ t('management.media.photos.description') }}</p>
            </button>
            <div class="flex items-center gap-1 flex-shrink-0">
              <!-- Action pills only exist while the section is open — a
                   collapsed card shows nothing but its chevron. -->
              <button
                v-if="isPhotosExpanded && canUpload"
                type="button"
                @click="openUploadModal"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 border border-dashed border-slate-300 rounded-full hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-50 transition-all"
                :title="t('management.media.photos.addPhotos')"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('management.media.photos.addPhotos') }}</span>
              </button>
              <button
                type="button"
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :aria-expanded="isPhotosExpanded"
                :aria-label="t('management.media.sectionToggle')"
                :title="t('management.media.sectionToggle')"
                @click="togglePhotosExpanded"
              >
                <ChevronDown class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': isPhotosExpanded }" aria-hidden="true" />
              </button>
            </div>
          </div>

          <Transition name="collapse">
          <div v-if="isPhotosExpanded" class="grid grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
          <div class="pt-6">
          <!-- Loading State -->
          <div
            v-if="loading"
            class="grid grid-cols-2 gap-4 sm:gap-6"
          >
            <div v-for="i in 8" :key="i" class="animate-pulse">
              <div class="bg-slate-200 aspect-square rounded-xl sm:rounded-2xl"></div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-8 sm:py-12">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <AlertCircle class="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
            </div>
            <p class="text-sm sm:text-base text-slate-600 max-w-md mx-auto">{{ error }}</p>
            <button
              @click="fetchMedia"
              class="mt-4 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
            >
              {{ t('management.media.photos.tryAgain') }}
            </button>
          </div>

          <!-- Gallery Content -->
          <div v-else>
            <!-- Empty State -->
            <div v-if="media.length === 0">
              <button
                type="button"
                :disabled="!canUpload"
                @click="openUploadModal"
                :class="[
                  'w-full border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center',
                  canUpload
                    ? 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200'
                    : 'border-slate-300 bg-slate-50 cursor-default'
                ]"
              >
                <div class="flex flex-col items-center justify-center min-h-[7.5rem]">
                  <div :class="[
                    'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
                    canUpload ? 'bg-slate-200 group-hover:bg-emerald-100' : 'bg-slate-200'
                  ]">
                    <Upload v-if="canUpload" class="w-8 h-8 transition-colors text-slate-400 group-hover:text-emerald-600" />
                    <ImageIcon v-else class="w-8 h-8 text-slate-400" />
                  </div>
                  <p :class="[
                    'font-semibold transition-colors',
                    canUpload ? 'text-slate-600 group-hover:text-slate-900' : 'text-slate-600'
                  ]">{{ t('management.media.photos.empty.title') }}</p>
                  <p class="text-sm text-slate-500 mt-1">{{ t('management.media.photos.empty.description') }}</p>
                  <p v-if="canUpload" class="text-xs text-slate-400 mt-1">{{ t('management.media.photos.empty.hint') }}</p>
                </div>
              </button>
            </div>

            <!-- Media Grid with Upload Card -->
            <div v-else class="grid grid-cols-2 gap-4 sm:gap-6">
              <MediaCard
                v-for="(mediaItem, index) in media"
                :key="mediaItem.id"
                :media="mediaItem"
                :can-edit="canEdit"
                :draggable="canEdit"
                :is-first="index === 0"
                :is-last="index === media.length - 1"
                @delete="deleteMedia"
                @set-featured="toggleFeatured"
                @drag-start="handleDragStart"
                @drag-end="handleDragEnd"
                @move-up="handleMoveUp(mediaItem)"
                @move-down="handleMoveDown(mediaItem)"
                class="media-item"
                :data-id="mediaItem.id"
              />

              <!-- Upload Card at the end -->
              <button
                v-if="canUpload"
                type="button"
                @click="openUploadModal"
                class="border-2 border-dashed rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer group border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-emerald-400 aspect-square flex flex-col items-center justify-center p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              >
                <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 transition-all duration-300 bg-slate-200 group-hover:bg-emerald-100">
                  <Upload class="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <p class="font-semibold transition-colors text-slate-600 group-hover:text-slate-900 text-sm sm:text-base">{{ t('management.media.photos.addPhotos') }}</p>
                <p class="text-xs text-slate-400 mt-1">{{ t('management.media.photos.count', { count: media.length }) }}</p>
              </button>
            </div>
          </div>
          </div>
          </div>
          </div>
          </Transition>
        </div>
      </div>

      <!-- Videos & Maps Section (YouTube) -->
      <div>
        <EmbedsSection
          :event-data="localEventData"
          :can-edit="canEdit"
          @updated="handleEventUpdated"
        />
      </div>

      <!-- Event Payment Section -->
      <div v-if="localEventData?.id">
        <PaymentMethodsSection
          ref="paymentMethodsSectionRef"
          :event-id="localEventData.id"
          :event="localEventData"
          :can-edit="canEdit"
          @event-updated="handleEventUpdated"
        />
      </div>

      <!-- Display Settings Section (all categories). Duplicates the live
           preview's per-section on/off chips on purpose — see the component
           header for why the preview alone isn't enough. -->
      <div v-if="localEventData?.id">
        <DisplaySettingsSection
          :event-data="localEventData"
          :can-edit="canEdit"
          @updated="handleEventUpdated"
        />
      </div>

    </div>

    <!-- Upload Drawer -->
    <UploadMediaDrawer
      v-if="showUploadModal && props.eventId"
      :event-id="props.eventId"
      @close="showUploadModal = false"
      @uploaded="handleMediaUploaded"
    />

    <!-- Delete Confirmation Modal. `v-if` as well as its own `show` prop, so
         the chunk is only fetched once a delete is actually attempted — the
         component's own root is already gated on `show`, so this changes
         nothing visually. -->
    <DeleteConfirmModal
      v-if="showDeleteModal || deleting"
      :show="showDeleteModal"
      :loading="deleting"
      :title="t('management.media.deleteModal.title')"
      :item-name="mediaToDelete?.caption || t('management.media.photos.untitled')"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Upload, ImageIcon, AlertCircle, ChevronDown, Plus } from 'lucide-vue-next'
import { mediaService, type EventPhoto, type Event } from '../services/api'
import { useToast } from '../composables/useToast'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useCollapsibleSection } from '@/composables/useCollapsibleSection'
import { provideAccordionGroup } from '@/composables/useAccordionGroup'
import { defineResilientAsyncComponent } from '@/utils/asyncComponent'
import MediaCard from './MediaCard.vue'

// ---------------------------------------------------------------------------
// Section cards and overlays, code-split.
//
// This component is the whole content surface — ~10 section cards, several of
// which (hosts, agenda, texts) are full tabs in their own right. Importing them
// statically made one ~224kB chunk that had to arrive before ANY of it could
// render, and in the Design Studio that chunk is requested at the same moment
// the preview frames are booting. Split, each card streams in on its own and
// the first ones paint without waiting for the heaviest.
//
// The two overlays are the clearest win of all: both are `v-if`-gated on user
// intent, so their code is now genuinely never fetched unless someone uploads
// or deletes something.
// ---------------------------------------------------------------------------
const UploadMediaDrawer = defineResilientAsyncComponent(() => import('./UploadMediaDrawer.vue'))
const DeleteConfirmModal = defineResilientAsyncComponent(() => import('./DeleteConfirmModal.vue'))
const MediaUploadsSection = defineResilientAsyncComponent(() => import('./MediaUploadsSection.vue'))
const EventBannerSection = defineResilientAsyncComponent(() => import('./EventBannerSection.vue'))
const DressCodeSection = defineResilientAsyncComponent(() => import('./DressCodeSection.vue'))
const EventAgendaTab = defineResilientAsyncComponent(() => import('./EventAgendaTab.vue'))
const EventHostsTab = defineResilientAsyncComponent(() => import('./EventHostsTab.vue'))
const EmbedsSection = defineResilientAsyncComponent(() => import('./EmbedsSection.vue'))
const PaymentMethodsSection = defineResilientAsyncComponent(() => import('./PaymentMethodsSection.vue'))
const DisplaySettingsSection = defineResilientAsyncComponent(() => import('./DisplaySettingsSection.vue'))
const EventTextTab = defineResilientAsyncComponent(() => import('./EventTextTab.vue'))
const PopulateFromTemplateCard = defineResilientAsyncComponent(
  () => import('./PopulateFromTemplateCard.vue'),
)

interface Props {
  eventId?: string
  canEdit: boolean
  initialMedia?: EventPhoto[]
  eventData?: Event
  showCategorySpecificSections?: boolean // Controls visibility of category-specific sections
  /** Hides the title/subtitle header — set when embedded in Design Studio's
   *  Content panel, which has its own chrome and no room for it. Left showing
   *  when this is the full-width Showcase tab body for other categories. */
  hideHeader?: boolean
  /** Hides the auto-fill card because the host puts that trigger in its own
   *  chrome instead — see `refreshContent` in defineExpose. */
  hidePopulate?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'media-updated', media: EventPhoto[]): void
  (e: 'event-updated', event: Event): void
  /** Content was created/changed outside the normal per-section save path
   *  (template auto-fill) — lets the live preview refresh its frames without
   *  a fresh Event payload to hand up. */
  (e: 'content-refreshed'): void
}>()

const { t } = useAppLanguage()
// Mounted either inside Design Studio's narrow Content panel (showcase
// categories) or directly as the full-width Showcase tab body (business,
// music, other) — either way its sections are coordinated into a
// single-open accordion so only one card (Brand Assets, Music, Texts,
// Hosts, Agenda, Dress Code, Photos, Map, YouTube, Payment, Display
// Settings) is expanded at a time. See useAccordionGroup.ts.
provideAccordionGroup()
const { isExpanded: isPhotosExpanded, toggle: togglePhotosExpanded } = useCollapsibleSection('photos')

// Toast notifications with automatic cleanup
const { showSuccess, showError } = useToast()

// State
const media = ref<EventPhoto[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const showUploadModal = ref(false)
const showDeleteModal = ref(false)
const mediaToDelete = ref<EventPhoto | null>(null)
const deleting = ref(false)

// Local event data - synced with props
const localEventData = ref<Event | undefined>(props.eventData ? { ...props.eventData } : undefined)

const canUpload = computed(() => props.canEdit && !!props.eventData && !!props.eventId)

// Bumped after a template auto-fill: the Texts/Hosts/Agenda sections each load
// their own data on mount and have no idea rows appeared underneath them, so
// remounting them via :key is what makes the new content actually show up.
const contentVersion = ref(0)

const handlePopulated = () => {
  contentVersion.value++
  emit('content-refreshed')
}

// Drag and drop state
const draggedMedia = ref<EventPhoto | null>(null)
const isReordering = ref(false)

// Template refs for sections
const paymentMethodsSectionRef = ref<InstanceType<typeof PaymentMethodsSection> | null>(null)
const dressCodeSectionRef = ref<InstanceType<typeof DressCodeSection> | null>(null)
const eventTextTabRef = ref<InstanceType<typeof EventTextTab> | null>(null)

// Watch for prop changes to sync localEventData
watch(
  () => props.eventData,
  (newEventData) => {
    localEventData.value = newEventData ? { ...newEventData } : undefined
  },
  { deep: true },
)

// Methods
const fetchMedia = async () => {
  // If we have initial media from props, use that instead of making an API call
  if (props.initialMedia) {
    media.value = [...props.initialMedia].sort((a, b) => a.order - b.order)
    return
  }

  // Guard against undefined eventId
  if (!props.eventId) {
    media.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await mediaService.getEventMedia(props.eventId)
    if (response.success && response.data) {
      // Normalize API response - ensure it's always an array
      media.value = Array.isArray(response.data)
        ? response.data.sort((a, b) => a.order - b.order)
        : []
    } else {
      showError(response.message || t('management.media.toast.loadError'))
      media.value = []
    }
  } catch (err) {
    console.error('Failed to fetch media:', err)
    showError(t('management.media.toast.loadNetworkError'))
    media.value = []
  } finally {
    loading.value = false
  }
}

const openUploadModal = () => {
  showUploadModal.value = true
}

const deleteMedia = (mediaItem: EventPhoto) => {
  mediaToDelete.value = mediaItem
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!mediaToDelete.value || !props.eventId) return

  deleting.value = true
  try {
    const response = await mediaService.deleteEventMedia(props.eventId, mediaToDelete.value.id)
    if (response.success) {
      // Remove from array
      media.value = media.value.filter((item) => item.id !== mediaToDelete.value!.id)
      showDeleteModal.value = false
      mediaToDelete.value = null
      // Emit updated media to parent
      emit('media-updated', media.value)
      showSuccess(t('management.media.toast.deleteSuccess'))
    } else {
      showError(response.message || t('management.media.toast.deleteError'))
    }
  } catch (err) {
    console.error('Failed to delete media:', err)
    showError(t('management.media.toast.deleteNetworkError'))
  } finally {
    deleting.value = false
  }
}

const toggleFeatured = async (mediaItem: EventPhoto) => {
  if (!props.eventId) return

  try {
    const response = await mediaService.updateEventMedia(props.eventId, mediaItem.id, {
      is_featured: !mediaItem.is_featured,
    })
    if (response.success && response.data) {
      // Update the item in the array
      const index = media.value.findIndex((item) => item.id === mediaItem.id)
      if (index !== -1) {
        media.value[index] = response.data
        // Emit updated media to parent
        emit('media-updated', media.value)
        showSuccess(t('management.media.toast.featuredUpdated'))
      }
    } else {
      showError(response.message || t('management.media.toast.featuredError'))
    }
  } catch (err) {
    console.error('Failed to update featured status:', err)
    showError(t('management.media.toast.featuredNetworkError'))
  }
}

const uploadBatchStart = ref(0)

const handleMediaUploaded = (newMedia: EventPhoto) => {
  // Track the starting count before upload
  if (uploadBatchStart.value === 0) {
    uploadBatchStart.value = media.value.length
  }

  media.value.push(newMedia)
  media.value.sort((a, b) => a.order - b.order)

  // Emit updated media to parent
  emit('media-updated', media.value)
}

// Watch for modal closing to show success message
watch(showUploadModal, (newValue, oldValue) => {
  if (oldValue === true && newValue === false && uploadBatchStart.value > 0) {
    // Modal just closed, calculate how many photos were uploaded
    const uploadedCount = media.value.length - uploadBatchStart.value

    if (uploadedCount > 0) {
      showSuccess(
        uploadedCount === 1
          ? t('management.media.toast.uploadSuccessOne')
          : t('management.media.toast.uploadSuccessMany', { count: uploadedCount }),
      )
    }

    // Reset the batch counter
    uploadBatchStart.value = 0
  }
})

const handleEventUpdated = (updatedEvent: Event) => {
  // Force reactivity by creating a new object reference
  localEventData.value = { ...updatedEvent }
  // Then emit to parent
  emit('event-updated', updatedEvent)
}

// Drag and drop handlers
const handleDragStart = (mediaItem: EventPhoto) => {
  draggedMedia.value = mediaItem
}

const handleDragEnd = async (targetMedia: EventPhoto | null) => {
  if (
    !draggedMedia.value ||
    !targetMedia ||
    draggedMedia.value.id === targetMedia.id ||
    !props.eventId
  ) {
    draggedMedia.value = null
    return
  }

  // Find both items in the current array
  const draggedIndex = media.value.findIndex((item) => item.id === draggedMedia.value!.id)
  const targetIndex = media.value.findIndex((item) => item.id === targetMedia.id)

  if (draggedIndex === -1 || targetIndex === -1) {
    draggedMedia.value = null
    return
  }

  // Create new array with reordered items
  const newMedia = [...media.value]
  const [draggedMediaData] = newMedia.splice(draggedIndex, 1)
  newMedia.splice(targetIndex, 0, draggedMediaData)

  // Update the order values for all media items
  newMedia.forEach((item, index) => {
    item.order = index
  })

  const updates = newMedia.map((item, index) => ({
    id: item.id,
    order: index,
  }))

  // Optimistic update - force reactivity by creating new array reference
  media.value = [...newMedia]

  // Emit updated media to parent
  emit('media-updated', media.value)

  try {
    const response = await mediaService.bulkReorderEventMedia(props.eventId, { updates })
    if (!response.success) {
      // Rollback on failure - refetch media
      await fetchMedia()
      showError(response.message || t('management.media.toast.reorderError'))
    }
  } catch (err) {
    console.error('Failed to reorder media:', err)
    // Rollback on failure - refetch media
    await fetchMedia()
    showError(t('management.media.toast.reorderNetworkError'))
  } finally {
    draggedMedia.value = null
  }
}

// Mobile move handlers
const handleMoveUp = async (mediaItem: EventPhoto) => {
  if (isReordering.value || !props.eventId) return

  const currentIndex = media.value.findIndex((item) => item.id === mediaItem.id)
  if (currentIndex <= 0) return

  isReordering.value = true

  const newMedia = [...media.value]
  const targetIndex = currentIndex - 1

  // Swap items
  ;[newMedia[currentIndex], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[currentIndex]]

  // Update order values on swapped items
  newMedia[currentIndex].order = currentIndex
  newMedia[targetIndex].order = targetIndex

  // Optimistic UI update
  media.value = [...newMedia]
  emit('media-updated', media.value)

  try {
    const updates = [
      { id: newMedia[currentIndex].id, order: currentIndex },
      { id: newMedia[targetIndex].id, order: targetIndex },
    ]
    const response = await mediaService.bulkReorderEventMedia(props.eventId, { updates })
    if (!response.success) {
      await fetchMedia()
      showError(response.message || t('management.media.toast.reorderError'))
    }
  } catch (err) {
    console.error('Failed to reorder media:', err)
    await fetchMedia()
    showError(t('management.media.toast.reorderNetworkError'))
  } finally {
    isReordering.value = false
  }
}

const handleMoveDown = async (mediaItem: EventPhoto) => {
  if (isReordering.value || !props.eventId) return

  const currentIndex = media.value.findIndex((item) => item.id === mediaItem.id)
  if (currentIndex === -1 || currentIndex >= media.value.length - 1) return

  isReordering.value = true

  const newMedia = [...media.value]
  const targetIndex = currentIndex + 1

  // Swap items
  ;[newMedia[currentIndex], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[currentIndex]]

  // Update order values on swapped items
  newMedia[currentIndex].order = currentIndex
  newMedia[targetIndex].order = targetIndex

  // Optimistic UI update
  media.value = [...newMedia]
  emit('media-updated', media.value)

  try {
    const updates = [
      { id: newMedia[currentIndex].id, order: currentIndex },
      { id: newMedia[targetIndex].id, order: targetIndex },
    ]
    const response = await mediaService.bulkReorderEventMedia(props.eventId, { updates })
    if (!response.success) {
      await fetchMedia()
      showError(response.message || t('management.media.toast.reorderError'))
    }
  } catch (err) {
    console.error('Failed to reorder media:', err)
    await fetchMedia()
    showError(t('management.media.toast.reorderNetworkError'))
  } finally {
    isReordering.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchMedia()
})

// Expose methods for parent component (Smart FAB)
defineExpose({
  openAddModal: () => {
    // Open upload modal for photo gallery
    showUploadModal.value = true
  },
  openPhotoGalleryModal: () => {
    // Open upload modal for photo gallery
    showUploadModal.value = true
  },
  // Method to trigger payment method addition
  openPaymentMethodModal: () => {
    paymentMethodsSectionRef.value?.openAddModal()
  },
  // Method to trigger dress code addition
  openDressCodeModal: () => {
    dressCodeSectionRef.value?.openAddModal()
  },
  // Method to trigger event text editing
  openEventTextModal: () => {
    eventTextTabRef.value?.openAddModal()
  },
  /** Refetch every section — for a host that owns the auto-fill trigger itself
   *  (see `hidePopulate`) and so has to report the write back in. */
  refreshContent: () => {
    handlePopulated()
  }
})
</script>

<style scoped>
.media-item {
  transition: transform 0.2s ease;
}

.media-item:hover {
  transform: translateY(-2px);
}

.media-item.dragging {
  transform: rotate(2deg) scale(1.05);
  z-index: 10;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Collapse/expand via grid-template-rows 0fr↔1fr — tracks real content
   height so both directions ease evenly (no max-height dead time) */
.collapse-enter-active,
.collapse-leave-active {
  transition:
    grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .collapse-enter-active,
  .collapse-leave-active {
    transition: none !important;
  }
}
</style>
