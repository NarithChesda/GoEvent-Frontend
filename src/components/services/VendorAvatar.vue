<template>
  <!--
    A vendor's mark. Shows their real logo when they have one, and otherwise a
    monogram disc rather than the shared stand-in image.

    The stand-in is a grey geometric shape, and at storefront size — 96–112px,
    ringed in white, overlapping the banner — it does not read as "this vendor
    has not uploaded a logo yet". It reads as a broken image, on the single
    element a visitor uses to identify who they are dealing with. The monogram
    is the same device VendorCoverArt already uses for photo-less banners, so a
    vendor with nothing uploaded still gets a coherent brand surface instead of
    two different flavours of placeholder.
  -->
  <div
    class="relative overflow-hidden rounded-full bg-white"
    :class="sizeClass"
  >
    <img
      v-if="resolvedLogo"
      :src="resolvedLogo"
      :alt="name"
      class="absolute inset-0 h-full w-full rounded-full object-cover"
      @error="hasLogoError = true"
    />

    <div
      v-else
      class="vendor-avatar-fallback absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71] to-[#1e90ff]"
      role="img"
      :aria-label="name"
    >
      <span class="vendor-avatar-monogram">{{ monogram }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getVendorLogoFallback } from '@/utils/serviceFallbackImages'

const props = withDefaults(
  defineProps<{
    /** The vendor's business name — supplies the monogram and the alt text */
    name: string
    /** The vendor's logo. The shared stand-in is treated as "no logo". */
    logo?: string
    /** Tailwind sizing classes for the disc */
    sizeClass?: string
  }>(),
  { sizeClass: 'w-24 h-24' },
)

const hasLogoError = ref(false)

watch(
  () => props.logo,
  () => {
    hasLogoError.value = false
  },
)

/**
 * The logo only when it is genuinely theirs. The shared fallback is filtered
 * out here rather than at every call site, so the monogram is what a
 * logo-less vendor gets everywhere this component is used.
 */
const resolvedLogo = computed(() => {
  if (hasLogoError.value) return undefined
  const logo = props.logo?.trim()
  if (!logo || logo === getVendorLogoFallback()) return undefined
  return logo
})

/** First letter of the business name, upper-cased where the script has cases */
const monogram = computed(() => {
  const first = props.name?.trim().match(/\p{L}|\p{N}/u)?.[0]
  return first ? first.toLocaleUpperCase() : ''
})
</script>

<style scoped>
.vendor-avatar-fallback {
  /* Sizes the monogram off the disc rather than the viewport, so one component
     serves the 40px spotlight mark and the 112px storefront avatar. */
  container-type: size;
}

.vendor-avatar-monogram {
  line-height: 1;
  font-size: 1.5rem; /* fallback where container units are unsupported */
  font-size: 44cqh;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
  user-select: none;
}
</style>
