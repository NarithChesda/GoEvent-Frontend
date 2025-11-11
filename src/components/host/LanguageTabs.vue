<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h4 class="font-semibold text-slate-900 flex items-center">
        <Languages class="w-4 h-4 mr-2" />
        Language
      </h4>
      <button
        type="button"
        @click="$emit('update:show-add-translation', true)"
        class="text-[#1e90ff] hover:text-[#1873cc] text-sm font-medium flex items-center space-x-1"
      >
        <Plus class="w-4 h-4" />
        <span>Add Language</span>
      </button>
    </div>

    <!-- Language Tab Headers -->
    <div role="tablist" aria-label="Host information languages" class="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
      <!-- English Tab (Always first) -->
      <button
        type="button"
        role="tab"
        id="tab-en"
        :aria-selected="activeTab === 'en'"
        aria-controls="tabpanel-en"
        :tabindex="activeTab === 'en' ? 0 : -1"
        @click="$emit('update:active-tab', 'en')"
        @keydown.right="$emit('focus-next-tab')"
        @keydown.left="$emit('focus-previous-tab')"
        :class="[
          'flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative',
          activeTab === 'en'
            ? 'text-sky-600 bg-white border-b-2 border-sky-600'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        ]"
      >
        <span class="flex items-center gap-2">
          <span>English</span>
          <span class="text-xs text-slate-500">(Default)</span>
        </span>
      </button>

      <!-- Other Language Tabs -->
      <button
        v-for="(translation, index) in translations"
        :key="translation.id || index"
        type="button"
        role="tab"
        :id="'tab-' + translation.language"
        :aria-selected="activeTab === translation.language"
        :aria-controls="'tabpanel-' + translation.language"
        :tabindex="activeTab === translation.language ? 0 : -1"
        @click="$emit('update:active-tab', translation.language)"
        @keydown.right="$emit('focus-next-tab')"
        @keydown.left="$emit('focus-previous-tab')"
        :class="[
          'flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative group',
          activeTab === translation.language
            ? 'text-sky-600 bg-white border-b-2 border-sky-600'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        ]"
      >
        <span class="flex items-center gap-2">
          <span>{{ getLanguageName(translation.language) }}</span>
          <button
            type="button"
            @click.stop="$emit('remove-translation', index)"
            :aria-label="'Remove translation'"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            :class="activeTab === translation.language ? 'opacity-100' : ''"
          >
            <X class="w-3.5 h-3.5 text-red-500 hover:text-red-700" />
          </button>
          <span
            v-if="translation.id"
            class="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full font-medium"
          >
            Saved
          </span>
        </span>
      </button>
    </div>

    <!-- Add Translation Modal -->
    <div
      v-if="showAddTranslation"
      class="bg-[#E6F4FF] border border-[#87CEEB] rounded-xl p-4"
    >
      <div class="flex items-center justify-between mb-3">
        <h5 class="font-medium text-slate-900">Add Language</h5>
        <button
          type="button"
          @click="$emit('update:show-add-translation', false)"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">
            Select Language
          </label>
          <select
            :value="newTranslation.language"
            @input="$emit('update:new-translation', { ...newTranslation, language: ($event.target as HTMLSelectElement).value })"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1e90ff] focus:border-transparent"
          >
            <option value="">Choose a language...</option>
            <option
              v-for="lang in availableLanguagesForAdd"
              :key="lang.code"
              :value="lang.code"
            >
              {{ lang.name }}
            </option>
          </select>
        </div>

        <div class="flex space-x-2">
          <button
            type="button"
            @click="$emit('add-translation')"
            :disabled="!newTranslation.language"
            class="px-4 py-2 bg-[#1e90ff] text-white rounded-lg hover:bg-[#1873cc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Add Language
          </button>
          <button
            type="button"
            @click="$emit('update:show-add-translation', false)"
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Languages, Plus, X } from 'lucide-vue-next'

interface Translation {
  id?: number
  language: string
  [key: string]: any
}

interface LanguageOption {
  code: string
  name: string
}

interface Props {
  activeTab: string
  translations: Translation[]
  showAddTranslation: boolean
  newTranslation: any
  availableLanguagesForAdd: LanguageOption[]
  getLanguageName: (code: string) => string
}

interface Emits {
  'update:active-tab': [tab: string]
  'update:show-add-translation': [show: boolean]
  'update:new-translation': [translation: any]
  'add-translation': []
  'remove-translation': [index: number]
  'focus-next-tab': []
  'focus-previous-tab': []
}

defineProps<Props>()
defineEmits<Emits>()
</script>
