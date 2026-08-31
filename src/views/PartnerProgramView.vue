<template>
  <!--
    No top bar and no tab bar. Everything the app's chrome carries — the nav,
    the search, the account menu — belongs to a product the reader of this page
    does not have an account for yet, and what it costs is the first screen,
    which is the only one a sales page is guaranteed to get. MainLayout stays
    for the ground it paints and for the bottom-chrome vars the contact button
    positions against.
  -->
  <MainLayout hide-top-nav hide-mobile-tab-bar>
    <div ref="pageRef" class="partner-page min-h-screen">
      <!--
        The language toggle, in the FAB lane above the contact button.

        It exists here and on no other page because this page hides both the top
        bar and the tab pill, and the app's only language controls live in them —
        so a Khmer-reading shop owner who lands on /partners has, without this,
        no way to read it in Khmer at all. Every other page still carries its
        chrome, where a second control would be a duplicate.

        `--fab-stack-2` is the shared slot above the contact FAB, defined in
        MainLayout against the tab pill's real footprint; the offset is never
        restated here. Everything else is ContactUsFAB's — the circle's two
        sizes, the shadow, the hover lift, the desktop-only tooltip — so the two
        read as one stack rather than as a button and a stray control beside it.
        The brand gradient rather than that one's Telegram blue: the blue is the
        destination's own colour and means "this opens Telegram".

        The face carries the language code, not an icon, because the code is the
        one thing a glance needs — which language you are reading now — and the
        tooltip names the one the press switches *to*.

        First in the DOM, not last: language is the choice that precedes reading
        the page, so it should be the first thing a keyboard reaches. Being
        `fixed`, its position in the flow costs the layout nothing.
      -->
      <button
        type="button"
        class="group fixed bottom-[var(--fab-stack-2)] right-4 z-[55] flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-110 hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-emerald-600/40 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 lg:right-6 lg:h-14 lg:w-14"
        :aria-label="switchLanguageLabel"
        @click="toggleLanguage"
      >
        <span class="text-xs font-semibold tracking-wide lg:text-base">
          {{ locale.toUpperCase() }}
        </span>
        <span
          class="pointer-events-none absolute right-full mr-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:block"
        >
          {{ switchLanguageLabel }}
        </span>
      </button>

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

        The headline is a ladder rather than a price: free to start, better
        the more you commit. It opens on the free events because cost is the
        first objection a shop raises, and lands on the pack because that is
        the upside — which is also the order the pricing rail is built in.
        Everything else the old headline carried (your own price, your logo,
        no account for the customer) is one step down, in the subtitle and in
        "What you get".

        Each of the two spans has to fit on ONE line, or the hero reads as a
        paragraph in display type. The budget is ~18 characters, not ~22: the
        narrowest the headline column ever gets is `lg`, where it is 6/12 of
        max-w-6xl (~456px) — narrower than the whole of a 375px phone — which
        is why the 5xl step waits for `xl` and its 7/12 of a wider container.
      -->
      <section class="relative overflow-hidden pt-8 sm:pt-12 lg:pt-16">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <div class="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div class="lg:col-span-6 xl:col-span-7">
              <!--
                The way off the page and the badge that names it share one row.
                The link takes the corner the app's logo held before the bar came
                off, and the eyebrow — already the hero's first line — keeps its
                place beside it, so losing the bar costs the hero no height.

                The link alone has no `data-reveal`: everything else here is
                content and may arrive, but the one way out is chrome and is
                never worth waiting for. It wraps only below ~320px, where a
                second line beats a row that overflows.
              -->
              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <RouterLink
                  to="/events"
                  class="group inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3.5 py-2 text-[0.8125rem] font-medium text-slate-700 backdrop-blur transition-[color,border-color,background-color,transform] duration-200 ease-out hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:text-sm"
                >
                  <ArrowLeft
                    class="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                  {{ t('partners.backToEvents') }}
                </RouterLink>

                <p
                  data-reveal
                  class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 ring-1 ring-slate-900/5 sm:text-[0.8125rem]"
                >
                  <Store class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ t('partners.hero.eyebrow') }}
                </p>
              </div>

              <!-- Two blocks, not two inline spans: an inline space between
                   them is collapsed away by Vue's whitespace handling, and the
                   accent reads stronger on its own line anyway. -->
              <h1
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 1)"
                class="type-display mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl xl:text-5xl 2xl:text-6xl"
              >
                <span class="block text-slate-500">{{ t('partners.hero.titleLead') }}</span>
                <span class="block text-slate-900">{{ t('partners.hero.titleAccent') }}</span>
              </h1>

              <p
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 2)"
                class="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
              >
                {{ t('partners.hero.subtitle') }}
              </p>

              <div
                data-reveal
                style="--reveal-delay: calc(var(--stagger) * 3)"
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
                style="--reveal-delay: calc(var(--stagger) * 4)"
                class="mt-8 max-w-xl space-y-2.5 border-t border-slate-200 pt-6"
              >
                <li
                  v-for="key in HERO_PROOF"
                  :key="key"
                  class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
                >
                  <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
                  {{ t(`partners.hero.proof.${key}`) }}
                </li>
              </ul>
            </div>

            <!-- The one element that travels further than the rest: 24px against
                 the copy’s 14, because it is the near thing in the frame and near
                 things move more. It is also last in the ladder, so the hero
                 assembles as a sentence and then the picture lands under it. -->
            <div
              data-reveal
              style="--reveal-delay: calc(var(--stagger) * 5); --reveal-lift: 24px"
              class="lg:col-span-6 xl:col-span-5"
            >
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
              class="type-display-sm text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
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
                :style="{ '--reveal-delay': `calc(var(--stagger) * ${i})` }"
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
              class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
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
                :style="{ '--reveal-delay': `calc(var(--stagger) * ${Math.min(i, 4)})` }"
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
                  <!--
                    Which packages the credits unlock. Two packs can be the same
                    size at the same price and still be different products — "25
                    Basic" and "25 Basic Plus" are — so without this line those
                    two cards differ by one word in the title and read as a bug.

                    A step smaller than the count above it and allowed to wrap:
                    a pack spanning several plans has a genuinely long label, and
                    truncating it would hide the very thing the line is here to
                    show.
                  -->
                  <p
                    v-if="tier.plans"
                    class="mt-1.5 text-xs leading-relaxed"
                    :class="tier.featured ? 'text-slate-500' : 'text-slate-400'"
                  >
                    {{ t('partners.pricing.forPlan', { plan: tier.plans }) }}
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
              class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
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
              :style="{ '--reveal-delay': `calc(var(--stagger) * ${i % 3})` }"
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

          <!--
            The way to see it rather than read about it. A link, not a section:
            the live preview is a catalogue column plus three phone frames, which
            is a screen's worth of furniture and three boots of the whole app —
            too much to put in the middle of a page whose job is to make an
            argument, and it earns its own page instead (/partners/templates).

            Slate, not the brand gradient: the page's gradient objects are its
            three "Request partner access" CTAs, and a fourth here would compete
            with the one directly below it in the next section.
          -->
          <div data-reveal class="mt-10 sm:mt-12">
            <RouterLink
              to="/partners/templates"
              class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-[transform,background-color] duration-200 ease-out hover:bg-slate-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 sm:text-base"
            >
              <Eye class="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {{ t('partners.product.previewCta') }}
              <ArrowRight
                class="h-4 w-4 flex-shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </RouterLink>
            <p class="mt-2.5 text-sm text-slate-500">{{ t('partners.product.previewHint') }}</p>
          </div>
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
                class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
              >
                {{ t('partners.partner.title') }}
              </h2>
            </header>

            <ul class="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
              <li
                v-for="(item, i) in PARTNER_BENEFITS"
                :key="item.key"
                data-reveal
                :style="{ '--reveal-delay': `calc(var(--stagger) * ${i % 2})` }"
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

      <!--
        6. FAQ — the last informative section and the only interactive one, so
        it earns a shape of its own: a single panel lifted off the page's tinted
        ground, with full-bleed rows inside it.

        One card, not seven. The set is one object — a reader opens it, works
        down it and leaves — so the panel is the card and the questions are its
        contents. Seven bordered boxes would be seven objects to separate from
        each other before reading any of them, which is chrome charged for
        nothing. The panel clips its own corners (`overflow-hidden`) so a row's
        hover ground and focus ring can run edge to edge without any row having
        to know whether it is the first or the last.

        Rows open independently, and the first is open on arrival.

        Independently, because single-open moved the row out from under the
        reader's own cursor: opening the fifth question while the first was open
        collapses ~90px above it, so the row they just pressed slid upward as
        its answer arrived. With every row its own toggle the pressed row never
        moves — only what is below it does, which is what a reader expects. The
        wall of text single-open was guarding against is now the reader's own
        choice, which on a page whose job is to inform is the right place for it.

        Open on arrival, because seven headings over an empty section reads as a
        section with nothing in it. One open row gives the section its body and
        teaches that the rows open, without spending a line of copy saying so.
      -->
      <section class="border-t border-slate-200 py-16 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header data-reveal class="text-center">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.faq.eyebrow') }}
            </p>
            <h2
              class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.faq.title') }}
            </h2>
          </header>

          <div
            class="mt-10 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5 sm:mt-12"
          >
            <div
              v-for="(key, i) in FAQ_KEYS"
              :key="key"
              data-reveal
              :style="{ '--reveal-delay': `calc(var(--stagger) * ${Math.min(i, 5)})` }"
            >
              <h3>
                <!--
                  The row's hover had nothing to land on before: the button set
                  `hover:text-slate-600`, and both of its children — the question
                  at `text-slate-900`, the chevron at `text-slate-400` — set
                  their own colour, so the hover inherited onto nothing and the
                  only interactive section on the page answered the pointer with
                  silence. The ground moves now, and the marker with it.
                -->
                <button
                  type="button"
                  class="group flex min-h-[64px] w-full items-center justify-between gap-5 px-5 py-4 text-left transition-colors duration-200 ease-out hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 sm:px-6"
                  :aria-expanded="isFaqOpen(key)"
                  :aria-controls="`faq-panel-${key}`"
                  @click="toggleFaq(key)"
                >
                  <span
                    class="text-base font-semibold text-slate-900 transition-colors duration-200 ease-out sm:text-lg"
                  >
                    {{ t(`partners.faq.${key}.q`) }}
                  </span>

                  <!--
                    The marker is a disc rather than a bare chevron so the open
                    state can be read from across the panel — an inverted circle
                    is visible in peripheral vision, a rotated 16px glyph is
                    not. It is also the row's only moving part on press: scaling
                    a full-bleed row would deform the panel, scaling the disc
                    says the same thing inside 32px.
                  -->
                  <span
                    class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,color,transform] duration-200 ease-out group-active:scale-90"
                    :class="
                      isFaqOpen(key)
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600'
                    "
                  >
                    <ChevronDown
                      class="h-4 w-4 transition-transform duration-200 ease-out"
                      :class="{ 'rotate-180': isFaqOpen(key) }"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </h3>

              <Transition name="collapse">
                <div v-if="isFaqOpen(key)" :id="`faq-panel-${key}`" class="grid grid-rows-[1fr]">
                  <div class="min-h-0 overflow-hidden">
                    <!-- The right inset only clears the disc column from `sm` up.
                         On a phone the answer takes the full measure instead: the
                         disc column is 56px of a 390px screen, and paying that for
                         symmetry with the question above cuts the answer to about
                         thirty characters a line. Nothing sits to the right of the
                         answer to align with anyway. -->
                    <p
                      class="pb-5 pl-5 pr-6 text-sm leading-relaxed text-slate-600 sm:pb-6 sm:pl-6 sm:pr-20 sm:text-base"
                    >
                      {{ t(`partners.faq.${key}.a`) }}
                    </p>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </section>

      <!--
        7. CLOSING — the page's third and last gradient object, and now also its
        end. `AppFooter` is gone from here for the reason the top bar is: its
        nav, its social row and its "explore the app" link all belong to a
        product this reader has no account for, and on a page that is a pitch
        they are five ways to leave before the ask. So everything the reader
        still needs lands in this section or nowhere — the ask, a person to talk
        to, and the way back.
      -->
      <section class="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div class="mx-auto max-w-4xl lg:max-w-6xl 2xl:max-w-7xl">
          <div
            data-reveal
            class="relative isolate overflow-hidden rounded-3xl bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-14 text-center shadow-xl shadow-slate-900/10 sm:px-10 sm:py-16 lg:py-20"
          >
            <!-- Light inside the one gradient object rather than a second one:
                 two soft radial washes give the band a lit corner and a shaded
                 one, so at this size it reads as a surface and not a swatch. -->
            <div class="cta-sheen pointer-events-none absolute inset-0" aria-hidden="true"></div>

            <div class="relative">
              <h2
                class="type-display-sm mx-auto max-w-2xl text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl"
              >
                {{ t('partners.closing.title') }}
              </h2>
              <p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                {{ t('partners.closing.subtitle') }}
              </p>

              <div class="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <RouterLink
                  to="/credits"
                  class="group inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/10 transition-[transform,background-color] duration-200 ease-out hover:bg-slate-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:text-base"
                >
                  {{ t('partners.closing.cta') }}
                  <ArrowRight
                    class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </RouterLink>

                <!--
                  Given a shape, because it was a ghost: white-on-gradient text
                  with no edge is the weakest thing in the panel, and this is
                  the one control for a shop owner who would rather ask a person
                  than fill in a form. It stays quieter than the primary by fill
                  — a translucent wash against solid white — rather than by
                  having no outline at all.
                -->
                <a
                  :href="TELEGRAM_URL"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 ease-out hover:border-white/60 hover:bg-white/20 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent sm:w-auto sm:text-base"
                >
                  <MessageCircle class="h-4 w-4" aria-hidden="true" />
                  {{ t('partners.closing.telegram') }}
                </a>
              </div>
            </div>
          </div>

          <!--
            The way back, at the end of the page rather than in a footer. The
            hero's copy of this link is the escape a reader takes on arrival;
            this one is for the reader who has finished and now has to decide.
            One link on the page's own ground, deliberately not a bar with a
            rule over it — that would be the footer again, rebuilt by hand.
          -->
          <div data-reveal class="mt-8 flex justify-center sm:mt-10">
            <RouterLink
              to="/events"
              class="group inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-500 transition-colors duration-200 ease-out hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
            >
              <ArrowLeft
                class="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              {{ t('partners.backToEvents') }}
            </RouterLink>
          </div>
        </div>
      </section>
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
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
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
import { useAppLanguage } from '@/composables/useAppLanguage'
import {
  usePartnerPricingTiers,
  type PartnerPricingTier,
} from '@/composables/usePartnerPricingTiers'
import HeroDevicesImg from '@/assets/hero-devices.webp'

const { t, locale, setLocale, availableLocales } = useAppLanguage()

/**
 * Two locales today, so pressing the button is a swap — but written as a cycle
 * so a third one added to `availableLocales` needs nothing here. The label
 * names the language being switched *to*, which is the only unambiguous way to
 * read a control whose face shows the current one.
 */
const nextLocale = computed(() => {
  const options = availableLocales.value
  const i = options.findIndex((option) => option.code === locale.value)
  return options[(i + 1) % options.length]
})

const switchLanguageLabel = computed(() =>
  t('partners.switchLanguage', { lang: nextLocale.value.name }),
)

const toggleLanguage = () => setLocale(nextLocale.value.code)

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
  { key: 'listing', icon: Store },
  { key: 'ownership', icon: ShieldCheck },
  { key: 'instant', icon: Zap },
  { key: 'locked', icon: KeyRound },
  { key: 'studio', icon: Palette },
  { key: 'topup', icon: PlusCircle },
] as const

/**
 * Which answers are open. A set rather than one key, and seeded with the first
 * question rather than empty — see the section's own comment for both reasons;
 * the short version is that single-open slid the pressed row out from under the
 * pointer, and an all-closed accordion opens on a section with no body in it.
 *
 * Replaced rather than mutated on toggle: a `ref` holding a Set does track its
 * own mutations through Vue's collection handlers, but every read here is a
 * `.has()` inside a `v-for`, and a fresh Set makes the dependency unambiguous
 * at the cost of seven pointer copies.
 */
const openFaqs = ref<ReadonlySet<string>>(new Set([FAQ_KEYS[0]]))
const isFaqOpen = (key: string) => openFaqs.value.has(key)
const toggleFaq = (key: string) => {
  const next = new Set(openFaqs.value)
  if (!next.delete(key)) next.add(key)
  openFaqs.value = next
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

/**
 * Two lines, not one.
 *
 * `REVEAL_LINE` is where an element animates — the old observer's `-10%`
 * bottom margin, so it starts just before its top edge lands.
 *
 * `ARM_LINE` is where it is *told* it is about to, one viewport earlier, and
 * exists only to place `will-change` (see the CSS for why that must not sit in
 * the base state). One sweep resolves both, so the second line costs a
 * comparison rather than a second listener — and an element scrolled past in a
 * single jump skips the arming and reveals anyway, because the promotion is an
 * optimisation and never a step the reveal depends on.
 */
const REVEAL_LINE = 0.9
const ARM_LINE = 1.9

function sweep() {
  frame = 0
  const viewport = window.innerHeight
  const revealAt = viewport * REVEAL_LINE
  const armAt = viewport * ARM_LINE
  pending = pending.filter((el) => {
    const { top } = el.getBoundingClientRect()
    if (top > armAt) return true
    if (top > revealAt) {
      el.classList.add('reveal-arm')
      return true
    }
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
  ---------------------------------------------------------------------------
  The page's motion vocabulary, in four numbers
  ---------------------------------------------------------------------------
  Declared once and read by everything below, because a landing page is one
  performance and eight sections each cascading at their own rate read as eight
  pages stapled together. That was literally true here: 80ms between two steps,
  70ms between two pricing cards, 60ms between two feature tiles, 45ms between
  two questions, and no reader could have recovered a reason for any of it. One
  constant now, so the page keeps one pulse and changing that pulse is one edit.

  `--stagger` is 60ms. A cascade reads as a cascade between roughly 30ms and
  80ms and as a queue outside that; 60 puts a three-item row 120ms end to end,
  which is a sequence nobody has to wait for.

  `--reveal-duration` is 600ms against the 300ms ceiling that governs every
  other transition on this page, and the gap between them is the point: 300ms is
  the budget for *interface*, where someone is waiting on the result of their
  own press. Nothing waits on a reveal. Under `--ease-reveal` the element is
  90% of the way home inside 180ms anyway — the remaining 420ms is settle, and
  settle is what keeps eight sections in a row from reading as a slideshow.

  `--reveal-lift` is a variable rather than a fixed 14px so one element can
  travel further than its neighbours. The hero image does, at 24px: near things
  move more, and that is the whole of the parallax on this page.
*/
.partner-page {
  --ease-reveal: cubic-bezier(0.23, 1, 0.32, 1);
  --reveal-duration: 600ms;
  --reveal-lift: 14px;
  --stagger: 60ms;
}

/*
  Reveal. Enters from a small offset rather than from nothing, because an
  element that appears out of nothing has no real-world equivalent. Ease-out, so
  the movement is over before the reader has decided to look at it.
*/
[data-reveal] {
  opacity: 0;
  transform: translateY(var(--reveal-lift));
  transition:
    opacity var(--reveal-duration) var(--ease-reveal),
    transform var(--reveal-duration) var(--ease-reveal);
  transition-delay: var(--reveal-delay, 0ms);
}

/*
  `will-change` is a promise the browser keeps by handing the element its own
  compositor layer, and it holds that layer for exactly as long as the
  declaration stands. In the base state that meant all forty `[data-reveal]`
  elements on this page were promoted at first paint — most of them screens
  below the fold, several of them never reached at all. That is the case
  DESIGN.md §7 is naming when it says to add `will-change` only to elements that
  actually animate. Armed one viewport out instead, and released in the very
  rule that hands the transition over.
*/
[data-reveal].reveal-arm {
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

  The fade appears and disappears without a transition, and should stay that
  way: `mask-image` does not interpolate on the compositor, and the one frame
  where a transition would show is the frame in which the reader has just
  started dragging a rail of cards across — the edge is the least moving thing
  on screen. An earlier version of this comment claimed a transition that was
  never actually declared.
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

/*
  The closing panel's inner light. Two radial washes over the brand gradient,
  not a second gradient object: white at low alpha, so whatever the band's own
  colour is underneath, this only lifts it. Authored here rather than as two
  arbitrary `bg-[radial-gradient(...)]` values because the commas and spaces a
  two-stop radial needs are exactly what Tailwind's arbitrary-value parser
  makes unreadable.

  Painted, not blurred: a `blur-3xl` disc would be the same picture at the cost
  of a 64px filter pass over a full-width panel on every paint.
*/
.cta-sheen {
  background:
    radial-gradient(58% 78% at 12% 0%, rgb(255 255 255 / 0.22), transparent 68%),
    radial-gradient(52% 72% at 92% 100%, rgb(255 255 255 / 0.14), transparent 70%);
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
