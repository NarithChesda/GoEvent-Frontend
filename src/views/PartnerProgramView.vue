<template>
  <MainLayout>
    <div ref="pageRef" class="min-h-screen">
      <!--
        1. HERO — split. The one gradient object here is the primary CTA, so the
        headline gets its emphasis from the slate ladder instead (500 → 900)
        rather than from gradient text, which would put a second gradient object
        in the same viewport.

        Note what the headline does NOT claim: the invitation is hosted on
        goevent.online and always will be. What the partner gets is their logo
        beside ours in the footer (MainContentStage renders `referrer_details`
        that way) and a price they set themselves — so the promise here is
        wholesale and margin, never white-label.
      -->
      <section class="relative overflow-hidden pt-10 sm:pt-14 lg:pt-20">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div class="lg:col-span-6 xl:col-span-7">
              <p
                data-reveal
                class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 ring-1 ring-slate-900/5 sm:text-[0.8125rem]"
              >
                <Store class="h-3.5 w-3.5" aria-hidden="true" />
                {{ t('partners.hero.eyebrow') }}
              </p>

              <!-- Two blocks, not two inline spans: an inline space between
                   them is collapsed away by Vue's whitespace handling, and the
                   accent reads stronger on its own line anyway. -->
              <h1
                data-reveal
                style="--reveal-delay: 60ms"
                class="mt-5 text-balance text-3xl font-bold leading-[1.2] tracking-tight sm:text-4xl lg:text-5xl 2xl:text-6xl"
              >
                <span class="block text-slate-500">{{ t('partners.hero.titleLead') }}</span>
                <span class="block text-slate-900">{{ t('partners.hero.titleAccent') }}</span>
              </h1>

              <p
                data-reveal
                style="--reveal-delay: 120ms"
                class="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
              >
                {{ t('partners.hero.subtitle') }}
              </p>

              <div
                data-reveal
                style="--reveal-delay: 180ms"
                class="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <RouterLink
                  to="/credits"
                  class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-[transform,box-shadow,background-image] duration-200 ease-out hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 sm:text-base"
                >
                  {{ t('partners.hero.ctaPrimary') }}
                  <ArrowRight
                    class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </RouterLink>

                <button
                  type="button"
                  class="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-3.5 text-sm font-medium text-slate-700 transition-[transform,background-color] duration-200 ease-out hover:bg-slate-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:text-base"
                  @click="scrollToPricing"
                >
                  {{ t('partners.hero.ctaSecondary') }}
                  <ArrowDown class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <!-- The three objections a shop owner raises before reading on,
                   answered in one line each. A list, not chips: chips would be
                   a fourth shape in a viewport that already has two buttons. -->
              <ul
                data-reveal
                style="--reveal-delay: 240ms"
                class="mt-8 max-w-xl space-y-2.5 border-t border-slate-200 pt-6"
              >
                <li
                  v-for="key in HERO_PROOF"
                  :key="key"
                  class="flex items-start gap-2.5 text-sm text-slate-600"
                >
                  <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
                  {{ t(`partners.hero.proof.${key}`) }}
                </li>
              </ul>
            </div>

            <div data-reveal style="--reveal-delay: 300ms" class="lg:col-span-6 xl:col-span-5">
              <img
                :src="HeroDevicesImg"
                :alt="t('partners.hero.imageAlt')"
                class="mx-auto w-full max-w-lg drop-shadow-2xl lg:max-w-none lg:origin-center lg:scale-110"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      <!--
        2. STEPS — three columns, no cards. Nothing here is a separable object,
        so a card would be chrome; the oversized slate-200 numerals and a single
        hairline carry the sequence instead.
      -->
      <section id="how-it-works" class="scroll-mt-20 py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <h2
              class="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.steps.title') }}
            </h2>
            <p class="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.steps.subtitle') }}
            </p>
          </header>

          <div class="relative mt-12 sm:mt-14">
            <!-- The thread the three steps hang from — a sibling of the list, not
               a member of it: an empty <li> here is announced as a fourth step.
               Faded at both ends rather than inset by a computed percentage, so
               it needs no arithmetic against the column and gap widths and
               still never hard-stops in mid-air. It passes *behind* the
               markers, which are opaque. Desktop only; stacked, the steps
               already read as a sequence. -->
            <div
              class="pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent md:block"
              aria-hidden="true"
            ></div>

            <ol class="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
              <li
                v-for="(key, i) in STEPS"
                :key="key"
                data-reveal
                :style="{ '--reveal-delay': `${i * 80}ms` }"
                class="relative"
              >
                <!-- The numeral is the step label. A "Step one" eyebrow beside a
                   "1" restates it, and it collided with the thread. -->
                <span
                  class="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold tabular-nums text-slate-300 ring-1 ring-slate-200"
                >
                  {{ i + 1 }}
                </span>

                <h3 class="mt-5 text-lg font-semibold text-slate-900 sm:text-xl">
                  {{ t(`partners.steps.${key}.title`) }}
                </h3>
                <p class="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {{ t(`partners.steps.${key}.body`) }}
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <!--
        3. PRICING — the centrepiece, and the only section built from cards,
        because a pack genuinely is a separable, buyable object.

        The featured tier inverts to `bg-slate-900` rather than taking the brand
        gradient: the section's one gradient object is the CTA below the grid,
        and a dark card is a stronger, quieter way to say "this one" than a
        fourth gradient on the page.
      -->
      <section
        id="pricing"
        ref="pricingRef"
        class="scroll-mt-20 border-y border-slate-200 bg-white/60 py-16 sm:py-20 lg:py-28"
      >
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.pricing.eyebrow') }}
            </p>
            <h2
              class="mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.pricing.title') }}
            </h2>
            <p class="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.pricing.subtitle') }}
            </p>
          </header>

          <!--
            The rail. Always a horizontal scroller, never a grid: the catalogue
            decides how many packs there are, and a grid that has to re-guess its
            track count for every possible N ends up with an orphan on a second
            row the moment the backend adds a pack. A rail has one behaviour for
            two cards and for ten.

            It bleeds to the viewport edge with a negative margin and pays the
            padding back inside, so the first card lines up with the heading
            while the last one can scroll past the container's right edge —
            without that, cards stop short of the edge and the row reads as
            clipped rather than continuing.

            `scroll-pl-*` matches that padding so a snapped card lands on the
            heading's left edge rather than under the fade.
          -->
          <div data-reveal class="relative mt-10 sm:mt-12">
            <div
              ref="railRef"
              class="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 pb-2 sm:-mx-6 sm:gap-5 sm:scroll-pl-6 sm:px-6 lg:-mx-8 lg:scroll-pl-8 lg:px-8"
              :class="{ 'rail-fade-start': canScrollBack, 'rail-fade-end': canScrollOn }"
              tabindex="0"
              role="region"
              :aria-label="t('partners.pricing.scrollLabel')"
              @scroll.passive="updateRailEdges"
            >
              <article
                v-for="(tier, i) in tiers"
                :key="tier.key"
                data-reveal
                :style="{ '--reveal-delay': `${Math.min(i, 4) * 70}ms` }"
                class="flex w-[17.5rem] flex-none snap-start flex-col rounded-2xl p-6 sm:w-[19.5rem] sm:p-7"
                :class="
                  tier.featured
                    ? 'bg-slate-900 shadow-xl shadow-slate-900/10'
                    : 'border border-slate-200/60 bg-white shadow-sm'
                "
              >
                <!--
                  Why this card is worth a second look, said once per card in
                  one slot. The wrapper is always rendered and holds the line's
                  height, so a tier with nothing to claim — the middle of a long
                  wholesale ladder — leaves a gap rather than pulling its figure
                  a line above its neighbours'.

                  Only the recommendation is emerald. A green label on every
                  card would read as a row of "success" markers and spend the
                  one saturated colour the system has on a qualifier; slate
                  everywhere else is what makes the featured one look chosen.
                -->
                <div class="mb-4 min-h-4">
                  <p
                    v-if="tier.badge"
                    class="text-xs font-semibold uppercase tracking-wider"
                    :class="tier.featured ? 'text-emerald-300' : 'text-slate-500'"
                  >
                    {{ tier.badge }}
                  </p>
                </div>

                <div class="min-w-0">
                  <h3
                    class="text-sm font-semibold"
                    :class="tier.featured ? 'text-white' : 'text-slate-900'"
                  >
                    {{ tier.name }}
                  </h3>
                  <p
                    class="mt-1 text-sm"
                    :class="tier.featured ? 'text-slate-400' : 'text-slate-500'"
                  >
                    {{ tier.credits }}
                  </p>
                </div>

                <!--
                  The figure the page exists to show: what the whole pack is
                  worth once it is sold through. It used to be the per-invitation
                  cost, which is the honest unit but the wrong headline — "$27"
                  is a price, and a shop owner is deciding whether this is a
                  business. "$825–1,450" answers that. The unit economics keep
                  their place in the rows below, one type step down.

                  `whitespace-nowrap` because these are ranges, and a break after
                  the dash reads as two unrelated numbers.
                -->
                <div class="mt-6">
                  <p
                    class="text-xs font-medium uppercase tracking-wider"
                    :class="tier.featured ? 'text-emerald-300' : 'text-slate-500'"
                  >
                    {{ t('partners.pricing.profitLabel') }}
                  </p>
                  <p
                    class="mt-1.5 whitespace-nowrap text-3xl font-bold leading-none tabular-nums sm:text-4xl"
                    :class="tier.featured ? 'text-white' : 'text-slate-900'"
                  >
                    {{ tier.profit }}
                  </p>
                  <p
                    class="mt-2 text-xs leading-relaxed"
                    :class="tier.featured ? 'text-slate-400' : 'text-slate-500'"
                  >
                    {{ tier.profitCaption }}
                  </p>
                </div>

                <!-- The unit economics behind the figure, as rows. Rows rather
                     than a nested card: nothing here is separable from the pack
                     it describes. "Pay up front" leads because it is the one
                     axis on which the trial and pay-as-you-go beat every pack,
                     and the reason they exist. -->
                <dl
                  class="mt-6 divide-y border-t text-sm"
                  :class="
                    tier.featured
                      ? 'divide-white/10 border-white/10'
                      : 'divide-slate-100 border-slate-100'
                  "
                >
                  <div
                    v-for="row in tierRows(tier)"
                    :key="row.label"
                    class="flex items-baseline justify-between gap-3 py-2.5"
                  >
                    <dt
                      class="min-w-0 truncate"
                      :class="tier.featured ? 'text-slate-400' : 'text-slate-500'"
                    >
                      {{ row.label }}
                    </dt>
                    <dd
                      class="whitespace-nowrap font-medium tabular-nums"
                      :class="tier.featured ? 'text-slate-200' : 'text-slate-700'"
                    >
                      {{ row.value }}
                    </dd>
                  </div>
                </dl>

                <!-- `mt-auto` on the wrapper, not on the note, so a live pack
                     with an empty `description` still pushes nothing around: the
                     spacer holds the card's bottom alignment whether or not
                     there is a sentence to print. -->
                <div class="mt-auto">
                  <p
                    v-if="tier.note"
                    class="pt-5 text-xs leading-relaxed"
                    :class="tier.featured ? 'text-slate-400' : 'text-slate-500'"
                  >
                    {{ tier.note }}
                  </p>
                </div>
              </article>
            </div>

            <!--
              Arrows are a pointer affordance only: a touch device already has
              the gesture, and a control floating over a card the thumb is about
              to swipe is in the way. They sit outside the scroller so they never
              scroll away from the reader, and the whole layer is dropped when
              everything already fits — an arrow that cannot move anything is
              worse than no arrow.

              `tabindex="-1"` and `aria-hidden` because the scroll container
              itself is focusable and arrow-key scrollable: a keyboard user
              already has a better path than tabbing through two buttons, and
              announcing them would only add noise.
            -->
            <div
              v-if="railOverflows"
              class="rail-arrows pointer-events-none absolute inset-y-0 left-0 right-0 items-center justify-between"
              aria-hidden="true"
            >
              <button
                v-for="dir in RAIL_DIRECTIONS"
                :key="dir"
                type="button"
                tabindex="-1"
                :disabled="dir < 0 ? !canScrollBack : !canScrollOn"
                class="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-600 shadow-lg backdrop-blur-sm transition-[transform,opacity,background-color] duration-200 ease-out hover:bg-white hover:text-slate-900 active:scale-95 disabled:pointer-events-none disabled:opacity-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                :class="dir < 0 ? '-ml-5' : '-mr-5'"
                @click="scrollRail(dir)"
              >
                <ChevronLeft v-if="dir < 0" class="h-5 w-5" />
                <ChevronRight v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div data-reveal class="mt-10 flex flex-col items-start gap-6 sm:mt-12">
            <RouterLink
              to="/credits"
              class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-[transform,box-shadow,background-image] duration-200 ease-out hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 sm:text-base"
            >
              {{ t('partners.pricing.cta') }}
              <ArrowRight
                class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </RouterLink>

            <p class="max-w-3xl text-xs leading-relaxed text-slate-500">
              {{ t('partners.pricing.footnote') }}
            </p>
          </div>
        </div>
      </section>

      <!--
        4. PRODUCT — what the partner is actually reselling, and therefore the
        justification for the retail column above. A tinted band with a plain
        icon grid: no cards, because the previous section just spent them.
      -->
      <section class="bg-slate-50 py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.product.eyebrow') }}
            </p>
            <h2
              class="mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.product.title') }}
            </h2>
            <p class="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.product.subtitle') }}
            </p>
          </header>

          <ul class="mt-10 grid gap-x-8 gap-y-9 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="(item, i) in PRODUCT_FEATURES"
              :key="item.key"
              data-reveal
              :style="{ '--reveal-delay': `${(i % 3) * 60}ms` }"
            >
              <span
                class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2ecc71]/20 to-[#1e90ff]/20 text-slate-700"
              >
                <component :is="item.icon" class="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 class="mt-4 text-base font-semibold text-slate-900">
                {{ t(`partners.product.${item.key}.title`) }}
              </h3>
              <p class="mt-1.5 text-sm leading-relaxed text-slate-600">
                {{ t(`partners.product.${item.key}.body`) }}
              </p>
            </li>
          </ul>
        </div>
      </section>

      <!--
        5. PARTNER BENEFITS — a spec sheet, not a feature grid: each item is
        ruled off at the top and carries no icon disc, so it reads as terms
        rather than as marketing, which is the register a business audience
        trusts at this point in the page.
      -->
      <section class="py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <header data-reveal class="lg:col-span-4">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {{ t('partners.partner.eyebrow') }}
              </p>
              <h2
                class="mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
              >
                {{ t('partners.partner.title') }}
              </h2>
            </header>

            <ul class="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              <li
                v-for="(item, i) in PARTNER_BENEFITS"
                :key="item.key"
                data-reveal
                :style="{ '--reveal-delay': `${(i % 2) * 60}ms` }"
                class="border-t border-slate-200 pt-5"
              >
                <div class="flex items-center gap-2.5">
                  <component
                    :is="item.icon"
                    class="h-4 w-4 flex-shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <h3 class="text-base font-semibold text-slate-900">
                    {{ t(`partners.partner.${item.key}.title`) }}
                  </h3>
                </div>
                <p class="mt-2 text-sm leading-relaxed text-slate-600">
                  {{ t(`partners.partner.${item.key}.body`) }}
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 6. FAQ — the only interactive section, so it earns a shape of its own. -->
      <section class="border-t border-slate-200 py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header data-reveal class="text-center">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.faq.eyebrow') }}
            </p>
            <h2
              class="mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.faq.title') }}
            </h2>
          </header>

          <div data-reveal class="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            <div v-for="key in FAQ_KEYS" :key="key">
              <h3>
                <button
                  type="button"
                  class="flex w-full min-h-[56px] items-center justify-between gap-4 py-4 text-left transition-colors duration-200 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                  :aria-expanded="openFaq === key"
                  :aria-controls="`faq-panel-${key}`"
                  @click="toggleFaq(key)"
                >
                  <span class="text-base font-semibold text-slate-900 sm:text-lg">
                    {{ t(`partners.faq.${key}.q`) }}
                  </span>
                  <ChevronDown
                    class="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-300 ease-out"
                    :class="{ 'rotate-180': openFaq === key }"
                    aria-hidden="true"
                  />
                </button>
              </h3>

              <Transition name="collapse">
                <div v-if="openFaq === key" :id="`faq-panel-${key}`" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <p class="pb-5 pr-10 text-sm leading-relaxed text-slate-600 sm:text-base">
                      {{ t(`partners.faq.${key}.a`) }}
                    </p>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. CLOSING — the page's third and last gradient object, alone in its
           viewport, carrying the same CTA label as the other two. -->
      <section class="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-28">
        <div class="mx-auto max-w-4xl lg:max-w-6xl 2xl:max-w-7xl">
          <div
            data-reveal
            class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-12 text-center sm:px-10 sm:py-16 lg:py-20"
          >
            <h2
              class="mx-auto max-w-2xl text-balance text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.closing.title') }}
            </h2>
            <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
              {{ t('partners.closing.subtitle') }}
            </p>

            <div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <RouterLink
                to="/credits"
                class="group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 transition-[transform,background-color] duration-200 ease-out hover:bg-slate-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e90ff] sm:w-auto sm:text-base"
              >
                {{ t('partners.closing.cta') }}
                <ArrowRight
                  class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </RouterLink>

              <a
                :href="TELEGRAM_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white/90 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-base"
              >
                <MessageCircle class="h-4 w-4" aria-hidden="true" />
                {{ t('partners.closing.telegram') }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * The partner offer, as a page a salesperson can send or present.
 *
 * Why this is authored content and not the live catalogue: every endpoint under
 * `/api/payment/` answers 403 without `is_partner`, deliberately — wholesale
 * pricing is confidential — so a page whose whole job is to be opened by
 * someone who is *not* a partner yet cannot fetch a single figure. The numbers
 * therefore live in `partners.json`, in one `pricing.tiers` block, so changing
 * the offer is an edit to two locale files and nothing else.
 *
 * Every CTA points at `/credits`. The router already bounces an unauthenticated
 * visitor to `/signin?redirect=/credits`, and `CreditsTab` already renders the
 * partner application for a signed-in non-partner — so one link serves the
 * signed-out prospect, the applicant and the approved partner without this page
 * knowing which it is talking to.
 */
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Film,
  Images,
  KeyRound,
  Languages,
  MessageCircle,
  Palette,
  PlusCircle,
  QrCode,
  ShieldCheck,
  Store,
  Users,
  Zap,
} from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  usePartnerPricingTiers,
  type PartnerPricingTier,
} from '@/composables/usePartnerPricingTiers'
import HeroDevicesImg from '@/assets/hero-devices.webp'

const { t } = useAppLanguage()

const TELEGRAM_URL = 'https://t.me/goeventkh'

const HERO_PROOF = ['payg', 'fee', 'review'] as const
const STEPS = ['open', 'build', 'sell'] as const
const FAQ_KEYS = ['unsold', 'price', 'domain', 'plans', 'payment', 'customer', 'apply'] as const

/**
 * The pricing row: the live credit-pack catalogue where it can be read, the
 * authored copy where it cannot. Pay-as-you-go always leads — it is the entry
 * with nothing to commit, and answers the objection the packs beside it would
 * otherwise raise. See the composable for why the live path is gated.
 */
const { tiers } = usePartnerPricingTiers()

/** The three unit-economics rows under each card's headline figure. */
const tierRows = (tier: PartnerPricingTier) => [
  { label: t('partners.pricing.payUpfront'), value: tier.upfront },
  { label: t('partners.pricing.costEach'), value: tier.costEach },
  { label: t('partners.pricing.keepEach'), value: tier.keepEach },
]

/**
 * The pricing rail's own state.
 *
 * `canScrollBack` / `canScrollOn` drive both the arrows' disabled state and the
 * edge fades, so a fade never sits over an edge there is nothing beyond — the
 * detail that separates a rail that looks scrollable from one that looks
 * clipped. `railOverflows` drops the arrow layer entirely when every card fits.
 *
 * The 1px tolerance is not superstition: a scroller at its end reports
 * `scrollLeft` as a fractional value on fractional device pixel ratios, so an
 * exact comparison leaves the "next" arrow enabled forever at the right edge.
 */
const RAIL_DIRECTIONS = [-1, 1] as const
const railRef = ref<HTMLElement | null>(null)
const canScrollBack = ref(false)
const canScrollOn = ref(false)
const railOverflows = ref(false)

function updateRailEdges() {
  const el = railRef.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  railOverflows.value = max > 1
  canScrollBack.value = el.scrollLeft > 1
  canScrollOn.value = el.scrollLeft < max - 1
}

/**
 * One card plus its gap per press, so a click always lands the next card on the
 * snap line rather than half of it. Measured from the DOM instead of the class,
 * because the card's width is in `rem` and the app rescales its root font on
 * laptop viewports — a hardcoded pixel step would be 25% out there.
 */
function scrollRail(direction: -1 | 1) {
  const el = railRef.value
  const card = el?.querySelector('article')
  if (!el || !card) return

  const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0
  el.scrollBy({
    left: direction * (card.getBoundingClientRect().width + gap),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

// The rail's extent changes when the live catalogue swaps the cards in and when
// the viewport resizes; neither fires a scroll event, so neither would update
// the fades on its own.
watch(tiers, () => nextTick(updateRailEdges))
onMounted(() => {
  updateRailEdges()
  window.addEventListener('resize', updateRailEdges, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('resize', updateRailEdges))

const PRODUCT_FEATURES = [
  { key: 'cinematic', icon: Film },
  { key: 'bilingual', icon: Languages },
  { key: 'rsvp', icon: ClipboardCheck },
  { key: 'wishes', icon: MessageCircle },
  { key: 'notify', icon: BellRing },
  { key: 'guests', icon: Users },
  { key: 'checkin', icon: QrCode },
  { key: 'media', icon: Images },
] as const

const PARTNER_BENEFITS = [
  { key: 'branding', icon: BadgeCheck },
  { key: 'ownership', icon: ShieldCheck },
  { key: 'instant', icon: Zap },
  { key: 'locked', icon: KeyRound },
  { key: 'studio', icon: Palette },
  { key: 'topup', icon: PlusCircle },
] as const

/** Single-open, so the page never grows a wall of text mid-scroll. */
const openFaq = ref<string | null>(null)
const toggleFaq = (key: string) => {
  openFaq.value = openFaq.value === key ? null : key
}

const pricingRef = ref<HTMLElement | null>(null)
const scrollToPricing = () => {
  pricingRef.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

/**
 * Scroll reveal: the transition is CSS, the trigger is one rAF-throttled sweep.
 *
 * The repo's `useRevealAnimations` was not reused: it writes `opacity: 0` from
 * JS *after* the element has already intersected, which flashes the content in
 * before hiding it again, and it animates `transition: all` off a `setTimeout`
 * chain. Here the initial state is CSS, so it is correct on the first paint,
 * the transition names its two properties, and the stagger is a per-element
 * custom property rather than a timer.
 *
 * ---------------------------------------------------------------------------
 * Why not IntersectionObserver
 * ---------------------------------------------------------------------------
 * It was one, and it left content permanently invisible. An observer only
 * delivers an entry when an element's intersection state *changes between two
 * samples*. A single-frame jump — the "See the numbers" button, an anchor
 * landing, a scrollbar drag — moves a whole section from "below the viewport,
 * not intersecting" to "above the viewport, not intersecting". `isIntersecting`
 * was false before and false after, so no entry is ever delivered, and since
 * `[data-reveal]` starts at `opacity: 0` in CSS the section stays blank until
 * the reader happens to scroll back over it. Pressing the hero's own CTA left
 * eighteen elements hidden.
 *
 * A position check has no such blind spot: whatever the scroll did, anything at
 * or above the fold line is revealed on the next frame. `pending` shrinks as
 * the page is read and the listeners detach when it empties, so the cost falls
 * to nothing by the time the reader reaches the bottom.
 *
 * `scanReveals()` is also re-runnable rather than a one-shot pass on mount,
 * because not every `[data-reveal]` exists at mount: the pricing cards are
 * replaced when the live catalogue arrives, and a mount-time snapshot missed
 * the replacements entirely — a partner saw one card and two holes.
 */
const pageRef = ref<HTMLElement | null>(null)
const seen = new WeakSet<Element>()
let pending: Element[] = []
let frame = 0

/** Matches the old observer's `-10%` bottom margin: reveal just before the top edge lands. */
const REVEAL_LINE = 0.9

function sweep() {
  frame = 0
  const line = window.innerHeight * REVEAL_LINE
  pending = pending.filter((el) => {
    if (el.getBoundingClientRect().top > line) return true
    // Once only — a section that re-animates on every pass is ambient motion,
    // which spends attention and returns nothing.
    el.classList.add('reveal-in')
    return false
  })
  if (!pending.length) stopSweeping()
}

function schedule() {
  frame ||= requestAnimationFrame(sweep)
}

function stopSweeping() {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

function scanReveals() {
  const root = pageRef.value
  if (!root) return

  const fresh = Array.from(root.querySelectorAll('[data-reveal]')).filter((el) => !seen.has(el))
  if (!fresh.length) return
  fresh.forEach((el) => seen.add(el))

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fresh.forEach((el) => el.classList.add('reveal-in'))
    return
  }

  const wasIdle = pending.length === 0
  pending.push(...fresh)
  if (wasIdle) {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
  }
  schedule()
}

onMounted(scanReveals)

// The live catalogue lands after mount and swaps the cards out, so the new ones
// have to be picked up once Vue has patched the DOM.
watch(tiers, () => nextTick(scanReveals))

onBeforeUnmount(stopSweeping)
</script>

<style scoped>
/*
  Reveal. Enters from a small offset rather than from nothing: 14px and a 0.94
  floor on nothing else, because an element that appears from zero has no
  real-world equivalent. `ease-out` so the movement is over before the reader
  has decided to look at it.
*/
[data-reveal] {
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity 600ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 600ms cubic-bezier(0.23, 1, 0.32, 1);
  transition-delay: var(--reveal-delay, 0ms);
  will-change: opacity, transform;
}

[data-reveal].reveal-in {
  opacity: 1;
  transform: none;
  will-change: auto;
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/*
  The rail's edge fades.

  `mask-image`, not a gradient overlay: the section sits on a tinted ground
  (`bg-white/60` over the page's own gradient), so an opaque white fade would be
  a pale bar over a coloured background rather than a fade. A mask dissolves the
  content itself and is correct on any ground.

  Applied per edge and only when there is something beyond it — a fade over an
  edge with nothing past it reads as clipping rather than as more to come. The
  32px band is deliberately short: enough to say "continues", not enough to make
  a card's price unreadable.

  The transition is on `mask-image`, which is not compositor-friendly, but it
  runs once per edge crossing on a user-driven scroll rather than every frame.
*/
/*
  Pointer-only, written as a media query rather than a Tailwind arbitrary
  variant: `[@media(hover:hover)and(pointer:fine)]:flex` compiles the condition
  verbatim, without the space `and (pointer:fine)` requires, so the rule was
  invalid CSS and the arrows never appeared at all.
*/
.rail-arrows {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .rail-arrows {
    display: flex;
  }
}

.rail-fade-start {
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 3rem);
  mask-image: linear-gradient(to right, transparent 0, #000 3rem);
}

.rail-fade-end {
  -webkit-mask-image: linear-gradient(to left, transparent 0, #000 3rem);
  mask-image: linear-gradient(to left, transparent 0, #000 3rem);
}

.rail-fade-start.rail-fade-end {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 32px,
    #000 calc(100% - 3rem),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 32px,
    #000 calc(100% - 3rem),
    transparent 100%
  );
}

/* The sanctioned collapse: grid-template-rows 0fr↔1fr, never max-height. */
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
  .collapse-leave-active {
    transition: none;
  }
}
</style>
