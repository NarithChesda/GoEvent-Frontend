<template>
  <!--
    The last rung of the banner ladder: what a vendor gets when they have
    neither an uploaded cover nor a single photo on a listing to borrow.
    Shared by the storefront banner and the featured-vendor spotlight so the
    two never disagree about what a photo-less vendor looks like.

    Built to read as a deliberate brand surface rather than a blank. A plain
    linear gradient looks like a placeholder because it is perfectly even and
    has nothing to look at, so this adds two things: a luminous mesh that keeps
    the top half bright — the spotlight lays heavy scrims over the bottom, and
    an evenly-lit gradient turns to flat navy underneath them — and the
    vendor's initial as an oversized watermark, which gives the eye a subject
    and makes every vendor's cover its own.

    Deliberately static. Drifting a blur this large is a real cost on a phone,
    and the services page can render six of these at once.
  -->
  <div class="vendor-cover absolute inset-0 overflow-hidden" aria-hidden="true">
    <!-- Base ramp -->
    <div class="absolute inset-0 bg-gradient-to-br from-[#2ecc71] to-[#1e90ff]"></div>

    <!-- Highlight high and right: survives the scrims stacked below it -->
    <div
      class="absolute -right-[15%] -top-[85%] w-[85%] aspect-square rounded-full bg-white/40 blur-3xl"
    ></div>
    <!-- Green pulled back over the left so the ramp does not read as one flat teal -->
    <div
      class="absolute -left-[20%] -top-[45%] w-[70%] aspect-square rounded-full bg-[#2ecc71]/70 blur-3xl"
    ></div>
    <!-- Depth in the low corner, where the vendor block sits on the spotlight -->
    <div
      class="absolute -right-[10%] -bottom-[75%] w-[75%] aspect-square rounded-full bg-[#1565c0]/45 blur-3xl"
    ></div>

    <!--
      The vendor's own colours, blurred to a wash — but only when they have a
      real logo. The stand-in logo is grey, and blooming grey over the gradient
      turns the whole cover to mud.
    -->
    <img
      v-if="logo"
      :src="logo"
      alt=""
      class="absolute -left-[6%] top-[10%] w-[45%] max-w-none opacity-25 blur-3xl"
      @error="hasLogoError = true"
    />

    <!-- Hairline weave: texture at a size that stays texture on any screen -->
    <div class="absolute inset-0 vendor-cover-weave"></div>

    <!-- Monogram, sized off the banner's own height. Right-aligned and
         vertically centred: that is the one region both surfaces leave clear —
         the storefront puts its avatar bottom-left, the spotlight fills its
         whole bottom edge with the vendor block. -->
    <div class="absolute inset-0 flex items-center justify-end pr-[7%]">
      <span v-if="monogram" class="vendor-cover-monogram">{{ monogram }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  /** The vendor's name — only its first letter is used, as a watermark */
  name?: string
  /**
   * The vendor's real logo, used purely as a colour cast. Pass nothing rather
   * than a stand-in: a placeholder logo is grey and washes the cover out.
   */
  logo?: string
}>()

const hasLogoError = ref(false)

watch(
  () => props.logo,
  () => {
    hasLogoError.value = false
  },
)

const logo = computed(() => (hasLogoError.value ? undefined : props.logo))

/** First letter of the business name, upper-cased where the script has cases */
const monogram = computed(() => {
  const first = props.name?.trim().match(/\p{L}|\p{N}/u)?.[0]
  return first ? first.toLocaleUpperCase() : ''
})
</script>

<style scoped>
.vendor-cover {
  /* Lets the monogram size itself off the banner rather than the viewport —
     the two surfaces sharing this art are very different heights. */
  container-type: size;
}

.vendor-cover-weave {
  background-image: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0px,
    rgba(255, 255, 255, 0.08) 1px,
    transparent 1px,
    transparent 18px
  );
}

.vendor-cover-monogram {
  /* line-height 1 keeps the glyph inside its own box, so flex centring lands
     it where it looks centred; a tightened line-height pushes the baseline
     down and crops the letter's foot off the bottom edge. */
  line-height: 1;
  font-size: 7rem; /* fallback where container units are unsupported */
  font-size: 78cqh;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.16);
  user-select: none;
}
</style>
