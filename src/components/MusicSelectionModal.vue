<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[1000] overflow-hidden">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>

        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl transform transition-all max-h-[85vh] flex flex-col overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 class="text-lg font-bold text-slate-900">Select Background Music</h3>
                <p class="text-sm text-slate-500 mt-0.5">Choose from our music library</p>
              </div>
              <button
                @click="handleClose"
                class="p-2 hover:bg-slate-100 rounded-lg transition-colors -mr-2"
              >
                <X class="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <!-- Search Box -->
            <div class="px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search music by name..."
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
                  class="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X class="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            <!-- Category Filter -->
            <div class="px-5 py-3 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
              <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                <button
                  @click="selectedCategory = undefined"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                    !selectedCategory
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  ]"
                >
                  All
                </button>
                <button
                  v-for="category in categories"
                  :key="category.value"
                  @click="selectedCategory = category.value"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                    selectedCategory === category.value
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  ]"
                >
                  {{ category.label }}
                  <span class="ml-1 opacity-70">({{ category.count }})</span>
                </button>
              </div>
            </div>

            <!-- Music List -->
            <div class="flex-1 overflow-y-auto min-h-0 overscroll-contain">
              <!-- Loading State -->
              <div v-if="loading" class="flex flex-col items-center justify-center py-16">
                <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-sm text-slate-500 mt-3">Loading music...</p>
              </div>

              <!-- Empty State -->
              <div v-else-if="filteredMusicList.length === 0" class="flex flex-col items-center justify-center py-16 px-5">
                <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Music class="w-7 h-7 text-slate-400" />
                </div>
                <p class="text-slate-600 font-medium">No music found</p>
                <p class="text-sm text-slate-400 mt-1 text-center">
                  <template v-if="searchQuery">
                    No results for "{{ searchQuery }}"
                  </template>
                  <template v-else-if="selectedCategory">
                    No tracks in this category
                  </template>
                  <template v-else>
                    Music library is empty
                  </template>
                </p>
                <button
                  v-if="searchQuery || selectedCategory"
                  @click="clearFilters"
                  class="mt-4 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-colors"
                >
                  Clear filters
                </button>
              </div>

              <!-- Music List -->
              <div v-else class="divide-y divide-slate-100">
                <div
                  v-for="track in filteredMusicList"
                  :key="track.id"
                  @click="selectTrack(track)"
                  :class="[
                    'flex items-center gap-3 px-5 py-3 cursor-pointer transition-all',
                    selectedTrack?.id === track.id
                      ? 'bg-emerald-50'
                      : 'hover:bg-slate-50'
                  ]"
                >
                  <!-- Play Button -->
                  <button
                    @click.stop="togglePlay(track)"
                    :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                      currentlyPlaying?.id === track.id && isPlaying
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    ]"
                  >
                    <Pause v-if="currentlyPlaying?.id === track.id && isPlaying" class="w-4 h-4" />
                    <Play v-else class="w-4 h-4 ml-0.5" />
                  </button>

                  <!-- Track Info -->
                  <div class="flex-1 min-w-0">
                    <h4
                      :class="[
                        'font-medium truncate',
                        selectedTrack?.id === track.id ? 'text-emerald-700' : 'text-slate-900'
                      ]"
                    >
                      {{ track.name }}
                    </h4>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span
                        :class="[
                          'text-xs px-1.5 py-0.5 rounded',
                          selectedTrack?.id === track.id
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        ]"
                      >
                        {{ track.category_display }}
                      </span>
                      <span class="text-xs text-slate-400">{{ track.duration_display }}</span>
                    </div>
                  </div>

                  <!-- Selection Indicator -->
                  <div
                    :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      selectedTrack?.id === track.id
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300'
                    ]"
                  >
                    <Check v-if="selectedTrack?.id === track.id" class="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-white flex-shrink-0">
              <button
                v-if="currentMusicId"
                @click="handleClearMusic"
                :disabled="saving"
                class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Remove Current
              </button>
              <div v-else></div>

              <div class="flex gap-2">
                <button
                  @click="handleClose"
                  :disabled="saving"
                  class="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  @click="handleConfirm"
                  :disabled="!selectedTrack || saving"
                  class="px-5 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <div
                    v-if="saving"
                    class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  ></div>
                  <span>{{ saving ? 'Selecting...' : 'Select' }}</span>
                </button>
              </div>
            </div>

            <!-- Hidden Audio Element -->
            <audio ref="audioRef" @ended="handleAudioEnded" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from 'vue'
import { X, Music, Play, Pause, Check, Search } from 'lucide-vue-next'
import { backgroundMusicService } from '@/services/api'
import type { BackgroundMusic, BackgroundMusicCategory, BackgroundMusicCategoryInfo } from '@/services/api'
import { useMediaUrl } from '@/composables/useMediaUrl'

interface Props {
  show: boolean
  currentMusicId?: number | null
  saving?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'select', track: BackgroundMusic): void
  (e: 'clear'): void
}

const props = withDefaults(defineProps<Props>(), {
  saving: false,
})

const emit = defineEmits<Emits>()

const { getMediaUrl } = useMediaUrl()

// State
const loading = ref(false)
const categories = ref<BackgroundMusicCategoryInfo[]>([])
const musicList = ref<BackgroundMusic[]>([])
const selectedCategory = ref<BackgroundMusicCategory | undefined>(undefined)
const selectedTrack = ref<BackgroundMusic | null>(null)
const currentlyPlaying = ref<BackgroundMusic | null>(null)
const isPlaying = ref(false)
const audioRef = ref<HTMLAudioElement | null>(null)
const searchQuery = ref('')

// Computed - filtered music list based on search
const filteredMusicList = computed(() => {
  if (!searchQuery.value.trim()) {
    return musicList.value
  }
  const query = searchQuery.value.toLowerCase().trim()
  return musicList.value.filter(track =>
    track.name.toLowerCase().includes(query) ||
    track.category_display.toLowerCase().includes(query)
  )
})

// Load data when modal opens
watch(
  () => props.show,
  async (isShown) => {
    if (isShown) {
      searchQuery.value = ''
      await Promise.all([loadCategories(), loadMusic()])
      // Pre-select current track if exists
      if (props.currentMusicId) {
        const track = musicList.value.find((t) => t.id === props.currentMusicId)
        if (track) {
          selectedTrack.value = track
        }
      }
    } else {
      // Stop audio when closing
      stopAudio()
      selectedTrack.value = null
      selectedCategory.value = undefined
      searchQuery.value = ''
    }
  }
)

// Reload music when category changes
watch(selectedCategory, () => {
  loadMusic()
})

// Methods
async function loadCategories() {
  const response = await backgroundMusicService.getMusicCategories()
  if (response.success && response.data) {
    categories.value = response.data
  }
}

async function loadMusic() {
  loading.value = true
  try {
    const response = await backgroundMusicService.getBackgroundMusic({
      category: selectedCategory.value,
      ordering: 'order',
    })
    if (response.success && response.data) {
      musicList.value = response.data.results
    }
  } finally {
    loading.value = false
  }
}

function selectTrack(track: BackgroundMusic) {
  selectedTrack.value = track
}

function togglePlay(track: BackgroundMusic) {
  if (!audioRef.value) return

  if (currentlyPlaying.value?.id === track.id && isPlaying.value) {
    // Pause current track
    audioRef.value.pause()
    isPlaying.value = false
  } else {
    // Play new track or resume
    if (currentlyPlaying.value?.id !== track.id) {
      audioRef.value.src = getMediaUrl(track.audio_file) || ''
      currentlyPlaying.value = track
    }
    audioRef.value.play()
    isPlaying.value = true
  }
}

function stopAudio() {
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.src = ''
  }
  currentlyPlaying.value = null
  isPlaying.value = false
}

function handleAudioEnded() {
  isPlaying.value = false
}

function handleClose() {
  if (!props.saving) {
    stopAudio()
    emit('close')
  }
}

function handleConfirm() {
  if (selectedTrack.value && !props.saving) {
    stopAudio()
    emit('select', selectedTrack.value)
  }
}

function handleClearMusic() {
  if (!props.saving) {
    stopAudio()
    emit('clear')
  }
}

function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = undefined
}

// Cleanup on unmount
onUnmounted(() => {
  stopAudio()
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative {
  transform: scale(0.95) translateY(10px);
}

.modal-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}

/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
