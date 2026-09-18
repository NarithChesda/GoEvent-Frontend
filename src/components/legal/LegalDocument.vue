<template>
  <div class="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 xl:gap-16">
    <!-- Contents. A sticky rail beside the text on desktop; a closed
         disclosure above it on phones, where fourteen links in a column would
         push the first sentence a screen down. -->
    <nav :aria-label="labels.contents" class="hidden lg:block">
      <div class="sticky top-24">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {{ labels.contents }}
        </p>
        <ol class="mt-3 space-y-1 border-l border-slate-200">
          <li v-for="(section, index) in content.sections" :key="section.id">
            <a
              :href="`#${section.id}`"
              class="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-slate-500 transition-colors duration-200 hover:border-slate-400 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 rounded-r"
              @click.prevent="jumpTo(section.id)"
            >
              <span class="tabular-nums text-slate-400">{{ index + 1 }}.</span>
              {{ section.title }}
            </a>
          </li>
        </ol>
      </div>
    </nav>

    <article class="min-w-0 max-w-[42rem]" :lang="lang">
      <details class="group mb-8 rounded-2xl border border-slate-200 bg-white lg:hidden">
        <summary
          class="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium text-slate-900 [&::-webkit-details-marker]:hidden"
        >
          {{ labels.contents }}
          <ChevronDown
            class="h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <ol class="space-y-0.5 border-t border-slate-100 px-2 py-2">
          <li v-for="(section, index) in content.sections" :key="section.id">
            <a
              :href="`#${section.id}`"
              class="flex min-h-[40px] items-center gap-2 rounded-lg px-2 text-sm text-slate-600 active:bg-slate-100"
              @click.prevent="jumpTo(section.id)"
            >
              <span class="w-5 flex-shrink-0 tabular-nums text-slate-400">{{ index + 1 }}.</span>
              {{ section.title }}
            </a>
          </li>
        </ol>
      </details>

      <p
        v-for="(paragraph, index) in content.intro"
        :key="`intro-${index}`"
        class="text-base leading-relaxed text-slate-700"
        :class="index > 0 && 'mt-4'"
      >
        {{ paragraph }}
      </p>

      <section
        class="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6"
        aria-labelledby="legal-summary"
      >
        <h2 id="legal-summary" class="text-sm font-semibold text-slate-900">
          {{ labels.summary }}
        </h2>
        <ul class="mt-3 space-y-2.5">
          <li
            v-for="(point, index) in content.summary"
            :key="`summary-${index}`"
            class="flex gap-3 text-sm leading-relaxed text-slate-600"
          >
            <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
            <span>{{ point }}</span>
          </li>
        </ul>
      </section>

      <section
        v-for="(section, index) in content.sections"
        :key="section.id"
        class="mt-10 sm:mt-12"
        :aria-labelledby="section.id"
      >
        <h2
          :id="section.id"
          class="scroll-mt-24 text-lg font-semibold text-slate-900 sm:text-xl"
          tabindex="-1"
        >
          <span class="tabular-nums text-slate-400">{{ index + 1 }}.</span>
          {{ section.title }}
        </h2>

        <template v-for="(block, blockIndex) in section.blocks" :key="blockIndex">
          <h3
            v-if="block.kind === 'subheading'"
            class="mt-6 text-sm font-semibold text-slate-900 sm:text-base"
          >
            {{ block.text }}
          </h3>

          <p
            v-else-if="block.kind === 'paragraph'"
            class="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base"
          >
            {{ block.text }}
          </p>

          <ul
            v-else
            class="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-600 marker:text-slate-300 sm:text-base"
          >
            <li v-for="(item, itemIndex) in block.items" :key="itemIndex" class="pl-1">
              <template v-if="typeof item === 'string'">{{ item }}</template>
              <template v-else>
                <strong class="font-semibold text-slate-800">{{ item.term }}</strong>
                {{ item.text }}
              </template>
            </li>
          </ul>
        </template>

        <slot :name="`after-${section.id}`" />
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
/**
 * A legal document — contents, summary, numbered sections — from plain data.
 *
 * Written for the Privacy Policy and shaped for the Terms of Service that has
 * to follow it: the text lives in a content module (privacyPolicyContent.ts),
 * so a policy change is a text edit, and a translation is a second module rather
 * than a second template.
 *
 * Headings sit under a fixed top bar, so every jump goes through `jumpTo`,
 * whose `scrollIntoView` honours the headings' `scroll-mt-24`. The router's
 * own hash scrolling does not — it computes a position and calls
 * `window.scrollTo`, which ignores scroll margins and parks the heading under
 * the bar.
 */
import { nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Check, ChevronDown } from 'lucide-vue-next'
import type { LegalDocumentContent } from './privacyPolicyContent'

defineProps<{
  content: LegalDocumentContent
  /** The document's own language, for `lang` — not the UI's. */
  lang: string
  /** Chrome inside the document, in the UI's language. */
  labels: { contents: string; summary: string }
}>()

const route = useRoute()

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function jumpTo(id: string, behavior: ScrollBehavior = 'smooth'): void {
  const heading = document.getElementById(id)
  if (!heading) return

  heading.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : behavior, block: 'start' })
  // Focus follows the jump for keyboard and screen-reader users; the heading
  // is focusable only programmatically (tabindex -1), so tab order is unchanged.
  heading.focus({ preventScroll: true })
  // The address bar names the section, so it can be copied and shared — without
  // a router navigation, which would scroll again, to the wrong offset.
  history.replaceState(history.state, '', `#${id}`)
}

/**
 * Arriving with a fragment (`/privacy#cookies`, from the footer). On a fresh
 * load the router deliberately scrolls to the top, and on an in-app arrival it
 * scrolls without the offset; both land before the next frame, so this runs
 * after them and has the last word.
 */
onMounted(async () => {
  const id = route.hash.slice(1)
  if (!id) return
  await nextTick()
  requestAnimationFrame(() => jumpTo(decodeURIComponent(id), 'auto'))
})
</script>
