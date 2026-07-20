<template>
  <V2ChapterShell
    section-id="agenda-section"
    :chapter-number="chapterNumber"
    :title="title"
    :current-language="currentLanguage"
    :self-revealing-body="true"
  >
    <div ref="rootEl" class="v2-timeline">
      <template v-for="group in groupedItems" :key="group.key">
        <p v-if="group.dateLabel" class="v2-tl-date">{{ group.dateLabel }}</p>

        <div v-for="item in group.items" :key="item.id" class="v2-tl-item">
          <button
            type="button"
            class="v2-tl-summary"
            :aria-expanded="expandedId === item.id"
            @click="toggle(item.id)"
          >
            <span class="v2-tl-time">{{ timeLabel(item) }}</span>
            <span class="v2-tl-name">{{ item.title }}</span>
            <ChevronDown
              v-if="item.description"
              class="v2-tl-chevron h-4 w-4"
              :class="{ 'rotate-180': expandedId === item.id }"
              aria-hidden="true"
            />
          </button>
          <Transition name="collapse">
            <div v-if="item.description && expandedId === item.id" class="grid grid-rows-[1fr]">
              <div class="min-h-0 overflow-hidden">
                <p class="v2-tl-detail">{{ item.description }}</p>
              </div>
            </div>
          </Transition>
        </div>
      </template>
    </div>
  </V2ChapterShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import V2ChapterShell from './V2ChapterShell.vue'
import { useScrollStory } from '../../../composables/showcase-v2/useScrollStory'
import { formatDateLocalized, type SupportedLanguage } from '../../../utils/translations'
import type { AgendaItem } from '../../../composables/useEventShowcase'

interface Props {
  chapterNumber: number
  title: string
  agendaItems: AgendaItem[]
  currentLanguage?: string
}

const props = defineProps<Props>()

const rootEl = ref<HTMLElement | null>(null)
const { createStory } = useScrollStory(rootEl)

const expandedId = ref<number | null>(null)
const toggle = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id
}

const lang = computed(() => (props.currentLanguage as SupportedLanguage) || 'en')

const timeLabel = (item: AgendaItem) => {
  const parts = [item.start_time_text, item.end_time_text].filter(Boolean)
  return parts.join(' – ') || '·'
}

// Group chronologically by date (date headers only when the event spans days)
const groupedItems = computed(() => {
  const sorted = [...props.agendaItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const groups: Array<{ key: string; dateLabel?: string; items: AgendaItem[] }> = []
  for (const item of sorted) {
    const key = item.date || 'no-date'
    const last = groups[groups.length - 1]
    if (last && last.key === key) {
      last.items.push(item)
    } else {
      groups.push({ key, items: [item] })
    }
  }
  if (groups.length > 1) {
    for (const group of groups) {
      if (group.key !== 'no-date') {
        group.dateLabel = formatDateLocalized(group.key, 'long', lang.value)
      }
    }
  }
  return groups
})

onMounted(() => {
  createStory(({ gsap, ScrollTrigger, rich }) => {
    if (!rootEl.value) return
    const items = gsap.utils.toArray<HTMLElement>('.v2-tl-item, .v2-tl-date', rootEl.value)
    // Batched stagger keeps long agendas cheap (one tween per viewport batch)
    ScrollTrigger.batch(items, {
      start: 'top 85%',
      once: true,
      onEnter: (batch) =>
        gsap.from(batch, {
          opacity: 0,
          x: rich ? -26 : 0,
          y: rich ? 0 : 18,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out',
        }),
    })
  })
})
</script>

<style scoped>
.v2-timeline {
  position: relative;
  padding-left: 26px;
}

.v2-timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 6px;
  bottom: 6px;
  width: 1px;
  background: linear-gradient(var(--v2-blush), var(--v2-sage));
}

.v2-tl-date {
  font-family: var(--v2-display);
  font-style: italic;
  font-size: 17px;
  color: var(--v2-sage-deep);
  margin: 22px 0 10px;
}

/* no overflow:hidden here — the timeline dot (::before) sits outside the box */
.v2-tl-item {
  position: relative;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(168, 181, 160, 0.35);
  border-radius: 12px;
}

.v2-tl-item::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 20px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--v2-ivory);
  border: 2px solid var(--v2-blush-deep);
}

.v2-tl-summary {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  min-height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--v2-body);
  color: var(--v2-charcoal);
}

.v2-tl-time {
  font-family: var(--v2-display);
  font-weight: 600;
  font-size: 17px;
  color: var(--v2-blush-deep);
  min-width: 74px;
  flex-shrink: 0;
}

.v2-tl-name {
  font-weight: 600;
  font-size: 15px;
  flex: 1;
  min-width: 0;
}

.v2-tl-chevron {
  color: var(--v2-sage-deep);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.v2-tl-detail {
  padding: 0 16px 14px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--v2-ink-soft);
}

/* collapse transition (grid-rows pattern) */
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
  .collapse-leave-active,
  .v2-tl-chevron {
    transition: none;
  }
}

@media (max-width: 380px) {
  .v2-tl-time {
    min-width: 60px;
    font-size: 15px;
  }
}
</style>
