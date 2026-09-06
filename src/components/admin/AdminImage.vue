<template>
  <img
    v-if="resolved && !failed"
    :src="resolved"
    :alt="alt"
    :class="imgClass"
    :loading="eager ? 'eager' : 'lazy'"
    @error="failed = true"
  />
  <slot v-else name="fallback" />
</template>

<script setup lang="ts">
/**
 * An image the reviewer is deciding from — a design preview, a payment proof.
 *
 * It exists for the `@error` branch. A record can carry a `preview_image` or a
 * `payment_proof` path whose file is gone, and a plain `<img>` then paints the
 * browser's own broken-image glyph: a grey box with a torn-page icon that reads
 * as *this design is bad* rather than as *this file is missing*. Falling back to
 * the same block used when the field is null tells the truth, and tells it in
 * the queue's own vocabulary.
 *
 * The URL is resolved here too, so no caller has to remember that these paths
 * arrive relative to the API host.
 */
import { computed, ref, watch } from 'vue'
import { resolveMediaUrl } from '@/utils/mediaUrl'

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    imgClass?: string
    /** The drawer's own large image, which is the point of the screen. */
    eager?: boolean
  }>(),
  { src: null, imgClass: '', eager: false },
)

const resolved = computed(() => resolveMediaUrl(props.src))
const failed = ref(false)

// A new row in the same drawer is a new image: a previous failure must not
// suppress one that would load perfectly well.
watch(resolved, () => {
  failed.value = false
})
</script>
