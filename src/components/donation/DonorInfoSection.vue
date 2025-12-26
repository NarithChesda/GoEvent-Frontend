<template>
  <div class="space-y-3">
    <!-- Auto-filled from user profile -->
    <div v-if="user && !isEditing" class="bg-slate-50 rounded-xl p-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white text-sm font-medium">
            {{ userInitials }}
          </div>
          <div>
            <p class="text-sm font-medium text-slate-900">Donating as {{ displayName }}</p>
            <p v-if="user.email" class="text-xs text-slate-500">{{ user.email }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="isEditing = true"
          class="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Edit
        </button>
      </div>
    </div>

    <!-- Editable form -->
    <div v-else class="space-y-3">
      <!-- Donor Name -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1.5">
          Your Name <span class="text-red-500">*</span>
        </label>
        <input
          :value="name"
          @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Enter your name"
          class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          :class="{ 'border-red-300': nameError }"
        />
        <p v-if="nameError" class="mt-1 text-xs text-red-600">{{ nameError }}</p>
      </div>

      <!-- Contact Info (Collapsible) -->
      <div class="space-y-2">
        <button
          type="button"
          @click="showContactInfo = !showContactInfo"
          class="w-full flex items-center justify-between text-sm font-medium text-slate-600 hover:text-slate-900 p-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <span>Contact Information (Optional)</span>
          <ChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': showContactInfo }"
          />
        </button>

        <Transition name="collapse">
          <div v-show="showContactInfo" class="space-y-3 pl-2 border-l-2 border-slate-200">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                :value="email"
                @input="$emit('update:email', ($event.target as HTMLInputElement).value)"
                type="email"
                placeholder="your@email.com"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                :value="phone"
                @input="$emit('update:phone', ($event.target as HTMLInputElement).value)"
                type="tel"
                placeholder="+1234567890"
                class="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
        </Transition>
      </div>

      <!-- Back to auto-filled view -->
      <button
        v-if="user"
        type="button"
        @click="resetToUserProfile"
        class="text-xs text-slate-500 hover:text-slate-700"
      >
        Use profile information
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface User {
  first_name?: string
  last_name?: string
  username?: string
  email?: string
  phone_number?: string
}

interface Props {
  name: string
  email: string
  phone: string
  user?: User | null
  nameError?: string
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
  nameError: ''
})

const emit = defineEmits<{
  'update:name': [value: string]
  'update:email': [value: string]
  'update:phone': [value: string]
}>()

const isEditing = ref(false)
const showContactInfo = ref(false)

const displayName = computed(() => {
  if (!props.user) return ''
  const { first_name, last_name, username } = props.user
  if (first_name && last_name) return `${first_name} ${last_name}`
  return first_name || username || ''
})

const userInitials = computed(() => {
  if (!props.user) return '?'
  const name = displayName.value
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
})

// Auto-fill from user profile when user is set
watch(
  () => props.user,
  (user) => {
    if (user && !props.name) {
      // Auto-fill name
      const fullName = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || user.username || ''
      emit('update:name', fullName)

      // Auto-fill contact if available
      if (user.email) emit('update:email', user.email)
      if (user.phone_number) emit('update:phone', user.phone_number)
    }
  },
  { immediate: true }
)

const resetToUserProfile = () => {
  if (!props.user) return

  const fullName = props.user.first_name && props.user.last_name
    ? `${props.user.first_name} ${props.user.last_name}`
    : props.user.first_name || props.user.username || ''

  emit('update:name', fullName)
  if (props.user.email) emit('update:email', props.user.email)
  if (props.user.phone_number) emit('update:phone', props.user.phone_number)

  isEditing.value = false
}
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 200px;
}
</style>
