<template>
  <!-- EditableRegion is a bare slot on the public showcase; in the manage-page
       preview a click anywhere on the item (except the reorder arrows) opens
       the full EditAgendaDrawer parent-side. -->
  <EditableRegion
    class="agd-item-region"
    :intent="{ kind: 'agendaItem', agendaId }"
  >
    <div
      ref="itemRef"
      class="agd-item"
      :style="{ '--agd-delay': `${entranceDelay}s` }"
    >
      <div class="agd-item__body">
        <slot />
      </div>

      <!-- Reorder arrows — only inside the editable manage-page preview
           (editIntentCtx is never provided on the public showcase). Clicks stop
           propagation so they don't also trigger the item's edit intent. -->
      <div v-if="editIntentCtx" class="agd-reorder">
        <button
          type="button"
          class="edit-region-control agd-reorder__btn"
          :disabled="isFirst"
          :title="tApp('management.showcasePreview.editors.moveUp')"
          :aria-label="tApp('management.showcasePreview.editors.moveUp')"
          @click.stop.prevent="requestReorder('up')"
        >
          <ChevronUp class="agd-reorder__icon" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="edit-region-control agd-reorder__btn"
          :disabled="isLast"
          :title="tApp('management.showcasePreview.editors.moveDown')"
          :aria-label="tApp('management.showcasePreview.editors.moveDown')"
          @click.stop.prevent="requestReorder('down')"
        >
          <ChevronDown class="agd-reorder__icon" aria-hidden="true" />
        </button>
      </div>
    </div>
  </EditableRegion>
</template>

<script setup lang="ts">
import { inject, onMounted, onUnmounted, ref } from 'vue'
import { ChevronUp, ChevronDown } from 'lucide-vue-next'
import EditableRegion from '@/components/showcase-preview/edit/EditableRegion.vue'
import { EditIntentKey } from '@/components/showcase-preview/edit/editContext'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useScrollProgress } from '@/composables/showcase/useScrollProgress'

/**
 * Everything an agenda item needs that is *not* its composition: the edit
 * intent that opens the drawer, the reorder arrows, and the shared scroll-driven
 * reveal. Every design wraps its own markup in this, so adding a sixth design
 * costs no edit-mode plumbing and the five can never disagree about how an item
 * enters the page.
 *
 * The arrows deliberately sit at the trailing edge on every design, alternating
 * compositions included: they are editor chrome, and chrome that moves with the
 * content is chrome you have to hunt for.
 */
interface Props {
  agendaId: number
  /** Seconds of stagger before this item's reveal. Published as `--agd-delay`. */
  entranceDelay?: number
  isFirst?: boolean
  isLast?: boolean
}

const props = withDefaults(defineProps<Props>(), { entranceDelay: 0 })

// Only provided by the editable manage-page preview frame — undefined on the
// public showcase, so the reorder arrows can never leak into production.
const editIntentCtx = inject(EditIntentKey, undefined)
const { t: tApp } = useAppLanguage()

const requestReorder = (direction: 'up' | 'down') => {
  editIntentCtx?.requestEdit({ kind: 'agendaReorder', agendaId: props.agendaId, direction })
}

// Measurement is delegated to the shared useScrollProgress registry: one
// listener and one rAF for every item and photo on the page, with reads batched
// ahead of writes. Registering per item meant N rAF callbacks per frame, each
// forcing its own layout.
const itemRef = ref<HTMLElement | null>(null)
const entranceDelayMs = props.entranceDelay * 1000

useScrollProgress(itemRef, { startDelayMs: entranceDelayMs })

let revealTimer: number | null = null

onMounted(() => {
  if (!itemRef.value) return
  itemRef.value.classList.add('is-revealing')
  // Drop the transition once the entrance has played, so live scrolling drives
  // --scroll-progress instantly instead of chasing it through a 500ms ease.
  revealTimer = window.setTimeout(() => {
    itemRef.value?.classList.remove('is-revealing')
    revealTimer = null
  }, entranceDelayMs + 600)
})

onUnmounted(() => {
  if (revealTimer !== null) {
    clearTimeout(revealTimer)
    revealTimer = null
  }
})
</script>

