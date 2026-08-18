<template>
  <!--
    The settings sections, as the second line of the page's own header.

    Deliberately not absorbed into the desktop nav the way the list pages hand
    their filters up: Settings runs without that bar entirely (see SettingsView),
    so this row and the heading above it *are* the page's chrome. Nothing
    teleports, nothing is observed, and there is one copy of it at every width.

    `-ml-3` pulls the first item's padding back off the column so its label
    starts on the same pixel the heading above it does.
  -->
  <div ref="scroller" role="tablist" class="-ml-3 flex items-center overflow-x-auto scrollbar-hide">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :ref="(el) => setTabRef(tab.id, el as HTMLElement | null)"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.id"
      @click="select(tab.id)"
      class="relative flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium whitespace-nowrap transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2ecc71]/30"
      :class="modelValue === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'"
    >
      <component :is="tab.icon" class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>{{ tab.label }}</span>
      <!-- Colour alone is how the top bar marks its current section, and this
           row wears the same palette; one line of gradient under it is what
           says these are a page's tabs rather than the app's own sections. -->
      <span
        v-if="modelValue === tab.id"
        class="absolute left-3 right-3 bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]"
        aria-hidden="true"
      ></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch, type Component } from 'vue'

export interface SettingsTabItem {
  id: string
  label: string
  icon: Component
}

const props = defineProps<{
  modelValue: string
  tabs: SettingsTabItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// The row scrolls on narrow screens, so the selected section has to be pulled
// into view — on arrival via a deep link as much as on selection.
const scroller = ref<HTMLElement | null>(null)
const tabRefs = ref<Record<string, HTMLElement | null>>({})

const setTabRef = (id: string, el: HTMLElement | null) => {
  tabRefs.value[id] = el
}

const scrollActiveTabIntoView = () => {
  const btn = tabRefs.value[props.modelValue]
  if (!scroller.value || !btn) return
  // `inline: 'center'` is what makes the last section reachable on a 360px
  // screen when it is the one selected.
  btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
}

const select = (id: string) => {
  emit('update:modelValue', id)
}

watch(
  () => props.modelValue,
  () => nextTick(scrollActiveTabIntoView),
)

onMounted(() => nextTick(scrollActiveTabIntoView))
</script>
