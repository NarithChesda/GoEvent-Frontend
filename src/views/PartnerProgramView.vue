<template>
  <!--
    No top bar and no tab bar. Everything the app's chrome carries — the nav,
    the search, the account menu — belongs to a product the reader of this page
    does not have an account for yet, and what it costs is the first screen,
    which is the only one a sales page is guaranteed to get. MainLayout stays
    for the ground it paints and for the bottom-chrome vars the contact button
    positions against.
  -->
  <MainLayout hide-top-nav hide-mobile-tab-bar has-custom-bottom-bar>
    <div ref="pageRef" class="partner-page min-h-screen">
      <!--
        The language toggle — ON DESKTOP ONLY. Its phone half lives in the
        action pill below, and the two are one control in two places rather
        than two controls.

        It exists on this page and on no other because this page hides both the
        top bar and the tab pill, and the app's only language controls live in
        them — so a Khmer-reading shop owner who lands on /partners has, without
        this, no way to read it in Khmer at all. Every other page still carries
        its chrome, where a second control would be a duplicate.

        Why it is not simply left floating on phones too: below `lg` the page
        now renders its own bottom bar, and a third fixed circle above a bar and
        a contact FAB is three floating objects competing for the same corner of
        a 375px screen. The bar is page chrome and so is the language, so the
        language goes in the bar and the corner keeps one FAB.

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
        class="fab-lang group fixed bottom-[var(--fab-stack-2)] right-4 z-[55] hidden h-10 w-10 items-center justify-center rounded-full lg:flex bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white shadow-lg shadow-emerald-500/25 hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-emerald-600/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 lg:right-6 lg:h-14 lg:w-14"
        :aria-label="switchLanguageLabel"
        @click="toggleLanguage"
      >
        <span class="text-xs font-semibold tracking-wide lg:text-base">
          {{ locale.toUpperCase() }}
        </span>
        <span
          class="pointer-events-none absolute right-full mr-4 hidden whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 lg:block"
        >
          {{ switchLanguageLabel }}
        </span>
      </button>

      <!--
        THE ACTION PILL — the phone's bottom chrome, and the reason the mobile
        page can afford to be long.

        On a desktop the whole offer is three or four screens and the CTA is
        never more than a scroll away. On a 375px phone this page is nine, and
        the ask appeared at screen one, screen four and screen nine — with five
        screens of evidence in between during which a reader who had just been
        convinced had nothing to press. That is the actual mobile failure of a
        sales page: not that it looks wrong, but that it argues you into a
        decision and then makes you hunt for the button.

        Built as the mobile tab pill this page hides, not as a flat bar over it.
        `.glass-pill` plus `rounded-full border border-white/50 p-1.5` around an
        `h-10` row is the shared recipe (main.css) — the same material and the
        same footprint, so `--nav-inset` and the FAB slots above it are correct
        by construction and the contact FAB lands exactly one gap above this,
        never on top of it. `has-custom-bottom-bar` on MainLayout is what keeps
        those vars at full height now that the tab bar is gone.

        It carries the two things a reader wants at any point on this page and
        nothing else: the language, because the page hides the chrome that would
        otherwise offer it, and the ask. No "see the prices" third button — a
        pill with three controls is a tab bar, and the reader is not navigating,
        they are deciding.

        IT IS NOT ON SCREEN FOR THE WHOLE PAGE. It arrives once the hero's own
        CTA has scrolled away and leaves again when the closing panel — which is
        nothing but this same button at full size — comes into view. Two copies
        of one control on screen at once is the reader being shouted at, and a
        bar that is simply always there stops being noticed by the time it is
        needed. Held out of the DOM entirely until first shown, so it costs a
        reader who never scrolls nothing at all.

        TWO BOUNDARIES IS THE WHOLE RULE, and there is now nothing between them
        to argue about: the page's only mid-page CTA lived in the old pricing
        section and went with it, so the hero's row and the closing panel are the
        page's only asks as well as its bookends. If one is ever added back
        mid-page, it should NOT become a third boundary — an inline control the
        reader scrolls past in a second or two would make the bar withdraw and
        return, flickering in the corner of the eye, which costs more attention
        than the brief duplicate does.
      -->
      <div
        v-if="actionBarMounted"
        class="fixed inset-x-0 bottom-0 z-[70] pointer-events-none lg:hidden"
        role="region"
        :aria-label="t('partners.hero.ctaPrimary')"
      >
        <div class="pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div
            class="action-pill glass-pill pointer-events-auto mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-1.5 rounded-full border border-white/50 p-1.5"
            :class="{ 'is-in': showActionBar }"
          >
            <button
              type="button"
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide text-slate-600 transition-colors duration-200 ease-out active:scale-95 hover:bg-white/70 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              :aria-label="switchLanguageLabel"
              @click="toggleLanguage"
            >
              {{ locale.toUpperCase() }}
            </button>

            <RouterLink
              to="/partners/apply"
              class="group flex h-10 min-w-0 flex-shrink items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-4 text-sm font-semibold text-white transition-[transform,background-image] duration-200 ease-out hover:from-[#27ae60] hover:to-[#1873cc] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <span class="truncate">{{ t('partners.hero.ctaPrimary') }}</span>
              <ArrowRight
                class="h-4 w-4 flex-shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </RouterLink>
          </div>
        </div>
      </div>

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

        The headline is the offer in the order a partner meets it: two events
        free, then 50% off every event after. It opens on the gift because cost
        is the first objection a shop raises, and lands on the discount because
        that is what keeps paying. Packs are not in it — they are the third
        rung, and the page names them without a rate (see `PARTNER_OFFER`).

        Each of the two spans has to fit on ONE line, or the hero reads as a
        paragraph in display type. The budget is ~18 characters, not ~22: the
        narrowest the headline column ever gets is `lg`, where it is 6/12 of
        max-w-6xl (~456px) — narrower than the whole of a 375px phone — which
        is why the 5xl step waits for `xl` and its 7/12 of a wider container.
      -->
      <section class="relative overflow-clip pt-8 sm:pt-12 lg:pt-16">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <div class="grid items-center gap-7 sm:gap-9 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-0">
            <div class="lg:col-span-6 lg:col-start-1 lg:row-start-1 xl:col-span-7">
              <!--
                The way off the page, the badge that names it, and — on phones —
                the language share one row. The link takes the corner the app's
                logo held before the bar came off, and the eyebrow — already the
                hero's first line — keeps its place beside it, so losing the bar
                costs the hero no height.

                The link alone has no `data-reveal`: everything else here is
                content and may arrive, but the one way out is chrome and is
                never worth waiting for. It wraps only below ~320px, where a
                second line beats a row that overflows — which is why the back
                link and the badge are an inner wrapping group and the language
                chip sits outside it, held to the trailing edge whether that
                group is one line or two.

                WHY THE LANGUAGE IS HERE AND NOT ONLY IN THE ACTION PILL. The
                pill is the page's phone chrome, but it is deliberately not on
                screen until the hero's own CTA has scrolled away — so the first
                screen, the one screen a sales page is guaranteed, had no
                language control on a phone at all. A Khmer-reading shop owner
                had to scroll past the entire argument in English before being
                offered the language to read it in, which is the wrong way round.

                Still not a third floating circle: the objection in the desktop
                FAB's note stands, and this is a chip in a row that already
                exists, costing the hero no height. The three copies are never
                two-on-screen either — this one scrolls away above the hero CTA,
                which is the very boundary the pill waits for.
              -->
              <div class="flex items-center gap-2 sm:gap-3">
                <div class="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
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

                <!--
                  Desktop keeps the FAB and hides this, so there is exactly one
                  language control per breakpoint. The face is the code you are
                  reading now and the label names the one you would switch to —
                  same contract as the other two copies.
                -->
                <button
                  type="button"
                  class="ml-auto inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-xs font-semibold tracking-wide text-slate-700 backdrop-blur transition-[color,border-color,background-color,transform] duration-200 ease-out hover:border-slate-300 hover:bg-white hover:text-slate-900 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 lg:hidden"
                  :aria-label="switchLanguageLabel"
                  @click="toggleLanguage"
                >
                  {{ locale.toUpperCase() }}
                </button>
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
            </div>

            <!--
              Three real invitations, not a stock device render.

              The page's whole claim is that a shop can charge $60–85 for this,
              and a shop owner settles that by looking. The mockup that stood
              here showed the frame the product arrives in and none of the
              product; three covers show what it is *and* that it comes in more
              than one look, which is the second thing every shop asks.

              The lead card is in normal flow and therefore sets the block's
              height; the two behind it are absolute, so swapping a design in or
              out never moves the hero's baseline.

              It is also the one element that travels further than the rest on
              reveal — 24px against the copy's 14 — because it is the near thing
              in the frame.

              WHERE IT SITS IS THE HERO'S ONE REAL DIFFERENCE BETWEEN THE TWO
              LAYOUTS. Beside the copy on a desktop it is last in the ladder, so
              the hero assembles as a sentence and then the picture lands under
              it. Stacked on a phone it goes between the subtitle and the
              buttons — because there it is not beside the argument, it is *in*
              it, and left at the end of the column the one thing this page is
              selling started 700px below the fold, behind two buttons and three
              lines of small print. First screen on a phone is now headline,
              product, ask. That is the whole reason the copy column is split in
              two: `order` can only move the fan around the whole column, and
              what it needs is to land in the middle of it.

              The cascade follows the eye and therefore changes with the order —
              see `.hero-fan-slot` / `.hero-cta-slot` in the styles, which is
              where the two ladders live. A fixed delay here would have played
              the phone's hero bottom-to-top.
            -->
            <div
              data-reveal
              class="hero-fan-slot lg:col-span-6 lg:col-start-7 lg:row-span-2 lg:row-start-1 xl:col-span-5 xl:col-start-8"
            >
              <div class="hero-fan">
                <img
                  :src="HeroFanLeftImg"
                  alt=""
                  aria-hidden="true"
                  class="hero-fan__card hero-fan__card--left"
                  loading="eager"
                  decoding="async"
                />
                <img
                  :src="HeroFanRightImg"
                  alt=""
                  aria-hidden="true"
                  class="hero-fan__card hero-fan__card--right"
                  loading="eager"
                  decoding="async"
                />
                <!-- One alt for the set. Three alts describing three covers of
                     the same invitation is three ways of saying the same thing
                     to anyone listening rather than looking. -->
                <img
                  :src="HeroFanLeadImg"
                  :alt="t('partners.hero.imageAlt')"
                  class="hero-fan__card hero-fan__card--lead"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>

            <div
              ref="heroCtaRef"
              class="hero-cta-slot lg:col-span-6 lg:col-start-1 lg:row-start-2 xl:col-span-7"
            >
              <div
                data-reveal
                class="hero-cta-slot__row flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <RouterLink
                  to="/partners/apply"
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
                  @click="scrollToOffer"
                >
                  {{ t('partners.hero.ctaSecondary') }}
                  <ArrowDown class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <!--
                The offer, as three figures — the page's whole argument about
                money, stated once at the size a glance reads, then shown in full
                by the two sections under the hero (the gift, then pay as you
                go). It replaced a tick list of the same facts in sentences, and
                the change is the point: "2", "50%" and "$0" are what a shop
                owner repeats to whoever they ask about this, so they are set as
                figures rather than buried in a line each.

                A ledger, not three stat cards: hairlines and type do the
                grouping, so the hero still has exactly two objects in it — the
                fan and the gradient button. The figures stay slate-900; colour
                here would be a second gradient object in the first viewport.

                Three columns at every width. The figures are one to three
                characters, so they fit a 320px phone; only the labels wrap, and
                they are allowed to.
              -->
              <ul
                data-reveal
                class="hero-ledger mt-7 grid max-w-xl grid-cols-3 border-t border-slate-200 pt-5 sm:mt-8 sm:pt-6"
                :aria-label="t('partners.hero.ledgerLabel')"
              >
                <li
                  v-for="key in HERO_LEDGER"
                  :key="key"
                  class="min-w-0 border-l border-slate-200 px-3 first:border-l-0 first:pl-0 sm:px-5"
                >
                  <span
                    class="block text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-3xl"
                  >
                    {{ t(`partners.hero.ledger.${key}.figure`) }}
                  </span>
                  <span class="mt-1 block text-xs leading-snug text-slate-600 sm:text-sm">
                    {{ t(`partners.hero.ledger.${key}.label`, offer) }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!--
        2. THE GIFT — the two free events, presented as what they are.

        A voucher, because that is the object a shop owner already knows a gift
        by: a face value, a stub, a perforation. "Two free events" in a sentence
        reads as a trial; the same offer printed on a gift card reads as
        something handed over. It is also a genuinely separable object, which is
        what earns it a shape of its own on a page that otherwise avoids cards.

        It is this viewport's gradient object, so nothing else in the section is
        coloured. The face value is the voucher's biggest type because a gift
        card's denomination always is, and it says "up to" because $170 is two
        events at the dearest plan a free event covers — `PARTNER_OFFER`, never
        typed into the copy.

        Centred, between the split hero above and the split price slip below: a
        third split row in a row is how this page lost its joints before, and a
        centred object between two of them reads as the pause it is.
      -->
      <section id="offer" ref="offerRef" class="scroll-mt-6 bg-slate-50 py-14 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="mx-auto max-w-2xl text-center">
            <h2
              class="type-display-sm text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.gift.title') }}
            </h2>
            <p class="mt-3 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.gift.subtitle') }}
            </p>
          </header>

          <!--
            The voucher. Landscape at every width, because a gift card is — and
            because that keeps the perforation vertical, where its position is
            the stub's fixed width rather than a height the copy decides. The
            notches are cut with a mask (see `.voucher`), so the shadow on the
            wrapper follows them instead of drawing a rectangle behind two holes.
          -->
          <div
            data-reveal
            style="--reveal-delay: calc(var(--stagger) * 1); --reveal-lift: 24px"
            class="voucher-lift mx-auto mt-10 max-w-xl sm:mt-12 lg:max-w-2xl"
          >
            <div
              class="voucher relative isolate grid overflow-hidden bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] text-white"
            >
              <div
                class="cta-sheen pointer-events-none absolute inset-0 -z-10"
                aria-hidden="true"
              ></div>
              <div
                class="voucher__shine pointer-events-none absolute inset-y-0 left-0 -z-10"
                aria-hidden="true"
              ></div>

              <div class="min-w-0 px-5 py-6 sm:px-8 sm:py-8">
                <p class="flex items-center gap-2 text-sm font-semibold">
                  <span
                    class="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/20"
                  >
                    <Gift class="h-4 w-4" aria-hidden="true" />
                  </span>
                  {{ t('partners.gift.voucher.label') }}
                </p>
                <p class="mt-6 sm:mt-8">
                  <span class="block text-sm font-medium">
                    {{ t('partners.gift.voucher.worth') }}
                  </span>
                  <span
                    class="mt-1 block text-5xl font-bold leading-none tracking-tight tabular-nums sm:text-7xl lg:text-8xl"
                  >
                    {{ offer.worth }}
                  </span>
                </p>
                <p class="mt-5 text-balance text-base font-semibold sm:text-lg">
                  {{ t('partners.gift.voucher.title') }}
                </p>
                <p class="mt-1 text-sm font-medium leading-relaxed text-white/90">
                  {{ t('partners.gift.voucher.note') }}
                </p>
              </div>

              <div
                class="voucher__stub relative flex flex-col items-center justify-center gap-1 px-3 text-center"
              >
                <span class="text-base font-bold sm:text-2xl">
                  {{ t('partners.gift.voucher.count') }}
                </span>
                <span class="text-sm font-medium leading-snug">
                  {{ t('partners.gift.voucher.each', offer) }}
                </span>
              </div>
            </div>
          </div>

          <!--
            What the reader asks the moment they see a free offer — what is the
            catch — answered in three facts. Ruled columns, not cards, so the
            voucher stays the only object in the section. A row with its icon on
            the leading edge on a phone, where three centred paragraphs stacked
            would each start at a different x.
          -->
          <ul class="mx-auto mt-10 grid max-w-4xl gap-6 sm:mt-14 sm:grid-cols-3 sm:gap-0">
            <li
              v-for="(fact, i) in GIFT_FACTS"
              :key="fact.key"
              data-reveal
              :style="{ '--reveal-delay': `calc(var(--stagger) * ${i})` }"
              class="flex gap-3 sm:block sm:border-l sm:border-slate-200 sm:px-6 sm:text-center sm:first:border-l-0"
            >
              <component
                :is="fact.icon"
                class="mt-0.5 h-5 w-5 flex-none text-slate-400 sm:mx-auto sm:mt-0"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <h3 class="text-base font-semibold text-slate-900 sm:mt-3">
                  {{ t(`partners.gift.facts.${fact.key}.title`) }}
                </h3>
                <p class="mt-1 text-sm leading-relaxed text-slate-600">
                  {{ t(`partners.gift.facts.${fact.key}.body`) }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!--
        3. PAY AS YOU GO — the rung after the gift, and the reason a partner
        never has to stock up before they have a customer.

        The heading is the promise ("start without spending") and the slip is
        the proof, drawn as the arithmetic a shop owner would otherwise do on
        their phone's calculator: what the customer pays at our retail price,
        and the two halves it splits into once a partner activates it at 50%.
        The halving is the one animation in the section and it is not
        decoration — the bar arrives at full price and visibly drops to half,
        which IS the claim.

        A worked example rather than a rate card: one plan, named, at its real
        retail price (`PARTNER_OFFER`). Packs get a sentence and no figure — their
        rates are bespoke and stay behind `is_partner` on /credits, which this
        page must not link to (the e2e suite pins that).

        No gradient object here: the voucher above is one, and on a tall screen
        the two can share a viewport. The sticker is slate-900, the page's
        quiet "look here", and the "you keep" half is a brand tint, which reads
        as texture rather than as a second object.

        DOM order is the phone's — heading, slip, packs — and explicit grid
        placement at `lg` puts the slip in the right column across both rows,
        the same technique the product section uses.
      -->
      <section class="py-14 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <div class="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-8 xl:gap-x-16">
            <header data-reveal class="max-w-xl lg:col-span-5 lg:row-start-1 lg:self-end">
              <h2
                class="type-display-sm text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
              >
                {{ t('partners.payg.title') }}
              </h2>
              <p class="mt-4 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
                {{ t('partners.payg.body') }}
              </p>
            </header>

            <div
              data-reveal
              style="--reveal-delay: calc(var(--stagger) * 1); --reveal-lift: 20px"
              class="slip-slot lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:self-center"
            >
              <figure
                class="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-8"
              >
                <!-- The figure says 50% in words beside it; this is its stamp. -->
                <span class="slip__sticker" aria-hidden="true">
                  <span class="text-2xl font-bold leading-none tabular-nums sm:text-3xl">
                    {{ t('partners.hero.ledger.payg.figure') }}
                  </span>
                  <span class="mt-1 text-xs font-semibold leading-none">
                    {{ t('partners.payg.slip.sticker') }}
                  </span>
                </span>

                <figcaption class="pr-20 sm:pr-28">
                  <span class="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {{ t('partners.payg.slip.label') }}
                  </span>
                  <span class="mt-1 block text-sm leading-snug text-slate-600">
                    {{ t('partners.payg.slip.example') }}
                  </span>
                </figcaption>

                <dl class="mt-8 flex items-end justify-between gap-4">
                  <dt class="min-w-0">
                    <span class="block text-sm font-medium text-slate-700">
                      {{ t('partners.payg.slip.customerPays') }}
                    </span>
                    <span class="block text-xs leading-snug text-slate-500">
                      {{ t('partners.payg.slip.atRetail') }}
                    </span>
                  </dt>
                  <dd class="text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">
                    {{ offer.retail }}
                  </dd>
                </dl>
                <div class="mt-3 h-3 rounded-full bg-slate-200" aria-hidden="true"></div>

                <!-- Two halves of one price, so two equal columns: the dashed
                     rule between them lands exactly on the bar's split below. -->
                <dl class="mt-8 grid grid-cols-2">
                  <div class="min-w-0 pr-3">
                    <dt class="text-sm font-medium text-slate-700">
                      {{ t('partners.payg.slip.youPay') }}
                    </dt>
                    <dd
                      class="mt-1 text-3xl font-bold tracking-tight tabular-nums text-slate-900 sm:text-4xl"
                    >
                      {{ offer.partnerPrice }}
                    </dd>
                  </div>
                  <div
                    class="slip__keep min-w-0 border-l border-dashed border-slate-300 pl-3 sm:pl-5"
                  >
                    <dt class="text-sm font-medium text-slate-700">
                      {{ t('partners.payg.slip.youKeep') }}
                    </dt>
                    <dd
                      class="mt-1 text-3xl font-bold tracking-tight tabular-nums text-slate-900 sm:text-4xl"
                    >
                      {{ offer.partnerPrice }}
                    </dd>
                  </div>
                </dl>
                <div
                  class="relative mt-3 h-3 overflow-hidden rounded-full bg-gradient-to-r from-[#2ecc71]/25 to-[#1e90ff]/25"
                  aria-hidden="true"
                >
                  <div class="slip__pay absolute inset-0 rounded-full bg-slate-900"></div>
                </div>
                <p class="mt-3 text-xs leading-relaxed text-slate-500 sm:text-sm">
                  {{ t('partners.payg.margin') }}
                </p>

                <dl class="mt-7 grid grid-cols-2 border-t border-slate-200 pt-5">
                  <div class="min-w-0 pr-3">
                    <dt class="text-xs text-slate-500 sm:text-sm">
                      {{ t('partners.payg.slip.upfront') }}
                    </dt>
                    <dd class="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                      {{ t('partners.payg.slip.zero') }}
                    </dd>
                  </div>
                  <div class="min-w-0 border-l border-slate-200 pl-3 sm:pl-5">
                    <dt class="text-xs text-slate-500 sm:text-sm">
                      {{ t('partners.payg.slip.monthly') }}
                    </dt>
                    <dd class="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                      {{ t('partners.payg.slip.zero') }}
                    </dd>
                  </div>
                </dl>
              </figure>
            </div>

            <div
              data-reveal
              class="max-w-xl border-t border-slate-200 pt-6 lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:self-start"
            >
              <h3 class="text-base font-semibold text-slate-900 sm:text-lg">
                {{ t('partners.payg.packs.title') }}
              </h3>
              <p class="mt-1.5 text-sm leading-relaxed text-slate-600 sm:text-base">
                {{ t('partners.payg.packs.body') }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!--
        4. STEPS — three columns, no cards. Nothing here is a separable object,
        so a card would be chrome; the oversized slate-200 numerals and a single
        hairline carry the sequence instead.
      -->
      <section id="how-it-works" class="scroll-mt-20 py-12 sm:py-20 lg:py-28">
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

          <div class="steps-track relative mt-12 sm:mt-14">
            <!-- The thread the three steps hang from — a sibling of the list, not
               a member of it: an empty <li> here is announced as a fourth step.
               Faded at both ends rather than inset by a computed percentage, so
               it needs no arithmetic against the column and gap widths and
               still never hard-stops in mid-air. It passes *behind* the
               markers, which are opaque.

               This one is the ROW's thread and is drawn from `md` up, where the
               three steps sit side by side. Stacked, the sequence runs downward
               instead, so each step draws its own segment down to the next (see
               the `li`) — one thread turned through ninety degrees, not a
               second idea. Stacked steps used to have no thread at all on the
               grounds that the stack already reads as a sequence; on a phone
               that left three pale slate-300 numerals floating in a column with
               nothing joining them, which reads as three unrelated cards. -->
            <div
              class="steps-thread pointer-events-none absolute inset-x-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent md:block"
              aria-hidden="true"
            ></div>

            <ol class="grid gap-7 md:grid-cols-3 md:gap-8 lg:gap-10">
              <li
                v-for="(key, i) in STEPS"
                :key="key"
                data-reveal
                :style="{ '--reveal-delay': `calc(var(--stagger) * ${i})`, '--step': i }"
                class="relative flex gap-4 md:block"
              >
                <!-- The stacked thread's own segment: numeral to numeral, drawn
                     by every step but the last. `bottom` is the negative of the
                     list's row gap, so the line crosses the gap and lands on the
                     next marker rather than stopping in the white. -->
                <span
                  v-if="i < STEPS.length - 1"
                  class="steps-seg absolute left-[1.375rem] top-11 bottom-[-1.75rem] w-px bg-slate-200 md:hidden"
                  aria-hidden="true"
                ></span>

                <!-- The numeral is the step label. A "Step one" eyebrow beside a
                   "1" restates it, and it collided with the thread.

                   `flex-none` matters: in the stacked row it is a flex child
                   beside text that wants every pixel, and without it a Khmer
                   heading squeezes the circle into an ellipse. -->
                <span
                  class="steps-num relative z-10 flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-xl font-bold tabular-nums text-slate-300 ring-1 ring-slate-200 md:h-14 md:w-14 md:text-2xl"
                >
                  {{ i + 1 }}
                </span>

                <div class="min-w-0 flex-1 md:contents">
                  <!-- Heading, then what the step costs the partner: money for
                   the two that cost money, minutes for the one that costs time.
                   It used to be a dark pill on the build step alone — the
                   page's best fact about the work. Now that the offer has a
                   figure for every step it is one quiet line on each, because
                   three dark pills in a row would be a label pattern and stop
                   meaning "look here". -->
                  <h3 class="pt-2 text-lg font-semibold text-slate-900 sm:text-xl md:mt-5 md:pt-0">
                    {{ t(`partners.steps.${key}.title`) }}
                  </h3>
                  <p
                    class="mt-1.5 flex items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-700"
                  >
                    <component
                      :is="STEP_META[key].icon"
                      class="h-4 w-4 flex-none text-slate-400"
                      aria-hidden="true"
                    />
                    {{ t(STEP_META[key].label) }}
                  </p>

                  <p class="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                    {{ t(`partners.steps.${key}.body`) }}
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <!--
        5. PRODUCT — what the partner is actually reselling, and therefore the
        justification for the retail price the slip above is worked out from.

        A SPEC PLATE: the invitation in the middle, what it does on either side.
        The features are set around it as what they are — properties of that
        object, in two groups the reader tells apart at a glance: what every
        guest sees ON the invitation, and what the customer gets BEHIND it. The
        hairline leaders pointing in at the centre are what make two lists read
        as one diagram.

        The centre is three floating pieces of the interface — the link, the
        reply, the wish (PartnerInvitationMoments) — where it was a phone with
        three screenshots behind a segmented control. The screenshots were the
        real thing, but at phone scale the reply form and the wishes were 11px
        gold type on ivory, and two of the three sat behind a press most readers
        never made. As cards they are all in view at once, legible, and in both
        languages; the link carries the one real photograph, because the
        photograph is what a guest actually sees first in the chat.

        DOM order is the phone's — the cards, then the two groups — and the
        plate's grid areas move the groups out to the flanks from `lg`.
      -->
      <section class="bg-slate-50 py-14 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="mx-auto max-w-2xl text-center">
            <h2
              class="type-display-sm text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.product.title') }}
            </h2>
            <p class="mt-3 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.product.subtitle') }}
            </p>
          </header>

          <div class="plate mt-12 sm:mt-14 lg:mt-16">
            <div data-reveal style="--reveal-lift: 24px" class="plate__moments min-w-0">
              <PartnerInvitationMoments />
            </div>

            <div
              v-for="(group, g) in FEATURE_GROUPS"
              :key="group.key"
              data-reveal
              :style="{ '--reveal-delay': `calc(var(--stagger) * ${g + 1})` }"
              class="plate__group min-w-0"
              :class="`plate__group--${group.key}`"
            >
              <h3 class="plate__heading text-sm font-semibold text-slate-900">
                {{ t(`partners.product.groups.${group.key}`) }}
              </h3>
              <ul class="mt-4 space-y-3 lg:space-y-4">
                <li
                  v-for="(item, i) in group.items"
                  :key="item.key"
                  class="plate__item"
                  :style="{ '--i': i }"
                >
                  <span class="plate__disc" aria-hidden="true">
                    <component :is="item.icon" class="h-4 w-4" />
                  </span>
                  <span class="plate__label">
                    {{ t(`partners.product.${item.key}.title`) }}
                  </span>
                  <span class="plate__leader" aria-hidden="true"></span>
                </li>
              </ul>
            </div>
          </div>

          <!--
            THE CODA — the way to see all of them rather than these three.

            A link, not a section: the live preview is a catalogue column plus
            three phone frames, which is a screen's worth of furniture and three
            boots of the whole app — too much to put in the middle of a page
            whose job is to make an argument, and it earns its own page instead
            (/partners/templates).

            IT HAS NO RULE ACROSS THE CONTAINER. It had one, and that was the
            whole problem: a full-bleed hairline is the strongest "new topic"
            signal a page owns, so the rule said "this is a section" while the
            shared slate ground said "this is the same one" — and a reader
            resolves that contradiction as one badly-centred section. It is not
            a section, so it does not get a section's furniture: space separates
            it, and it shares the plate's centre line, so the section reads top
            to bottom as one column — heading, the invitation, every design.

            Nor does it get an eyebrow or a heading of its own. One band, one
            heading; a second one here would be the same claim to sectionhood in
            words rather than in a line.

            EVIDENCE → LINE → ACTION, which is the order the whole band already
            reads in (show, then say, then do). Four covers, because "browse
            every design" is a claim and four visibly different designs are the
            evidence; then what pressing does; then the press. Ending the band
            on the button rather than on its caption leaves the last thing in
            the section as the thing to do.

            Slate on the button, not the brand gradient: this is a way to look,
            not the page's ask, and on a phone the ask is already on screen in
            the action pill. Centring gives it prominence by position, which is
            the cheaper way to promote a control and does not spend the brand
            colour.
          -->
          <div
            data-reveal
            class="catalogue mt-14 flex flex-col items-center gap-5 text-center sm:mt-16 lg:mt-20"
          >
            <ul class="flex items-center justify-center gap-2 sm:gap-2.5" aria-hidden="true">
              <li v-for="cover in COVER_STRIP" :key="cover.src">
                <img :src="cover.src" alt="" class="cover-chip" loading="lazy" decoding="async" />
              </li>
            </ul>

            <p class="max-w-md text-balance text-sm leading-relaxed text-slate-600 sm:text-base">
              {{ t('partners.product.previewHint') }}
            </p>

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
          </div>
        </div>
      </section>

      <!--
        6. THE DAY ITSELF — the other half of what a credit buys, and the half
        no screenshot of an invitation can carry.

        Pictures, not sentences. A shop owner selling a wedding does not want to
        read that there is guest management; they want to see whether it looks
        like something they could hand to a customer's family, and a real screen
        answers that faster than the seven sentences that used to be scattered
        through "What you get".

        Cards, not screenshots. Every capture here is one panel of the app —
        `#guests-panel`, the RSVP card, the cash gift card — lifted out of its
        page with the sidebar, the tab bar and the page heading left behind. A
        full-window screenshot spends most of its pixels on furniture the reader
        is not buying, and next to a cropped card it reads as the untidy one. It
        also retires the drawn browser frame: that chrome existed to say "this
        one is a desk thing" around a full window, and there is no longer a
        window to frame.

        TWO BEATS, NOT THREE PICTURES. The heading promises two things — the
        whole list, and what it adds up to — so the section delivers them in
        that order, each with its own claim beside its own evidence. Stacked
        full-bleed instead, the guest panel arrived at almost native size and
        took a whole screen before the reader had been told what they were
        looking at, and the two analytics cards under it read as two more
        pictures rather than as the answer to the first one. Four ticks in a row
        underneath were then the only words in the section, arriving after all
        the evidence they were meant to introduce.

        The text column stays on the LEFT in both beats rather than alternating.
        Zig-zag rows are the reflex here and they are wrong for two beats: with
        no third row there is no rhythm to establish, only a crossing the eye has
        to make. A fixed left rail lets someone read claim, then claim, straight
        down while the evidence changes beside them — one argument in two steps,
        which is what this is.

        THE DETAIL THAT MAKES IT LOOK DESIGNED: every capture is taken at a
        width proportional to the width it is displayed at, so the app's own
        14px type renders at the same physical size in all three cards. The
        guest panel is shot at 960px CSS and shown across `col-span-8`; the
        analytics are shot at 488 and shown two-up inside that same span. From
        `lg` up those land within ~4% of each other (0.74 against 0.71), and
        below `lg` the panel goes full width at 0.75 — so moving it out of
        full bleed and into a column costs it almost nothing. Capture them all
        at one width instead and the wide card's text comes out half the size of
        its neighbours', which is the thing that makes a set of screenshots look
        thrown together even when the grid is perfect.
      -->
      <section class="py-12 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {{ t('partners.runday.eyebrow') }}
            </p>
            <h2
              class="type-display-sm mt-2 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.runday.title') }}
            </h2>
            <p class="mt-4 text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.runday.subtitle') }}
            </p>
          </header>

          <!--
            BEAT ONE — the list. EVIDENCE LEFT, WORDS RIGHT.

            This is the beat that turns, and which one turns is decided by the
            section above it, not inside this one. "What you are selling" ends
            with its phone on the right; a guest panel on the right immediately
            after would be the third picture in a row on the same side. So the
            list goes left, the totals return to the right, and the page
            alternates on every row from the product section through to the
            full-width band in "What you get" — where the two-column machine
            stops entirely.

            Leading with the picture also suits this beat specifically: the
            guest panel is the widest, most legible screenshot on the page, and
            in a left-to-right read it now arrives before its caption rather
            than after it.

            Done with `lg:col-start` + `lg:row-start`, NOT by reordering the
            markup — the same technique the product section uses. DOM order
            stays words-then-picture because that is the order below `lg`, where
            the grid collapses to one column and the claim has to arrive before
            the evidence it introduces. Both children need an explicit
            `lg:row-start-1`: grid auto-placement never backtracks, so the
            second child asking for column 1 would otherwise be pushed to a
            second row instead of sliding in beside the first.

            The copy stays LEFT-aligned in a right-hand column. Ragged-right is
            for the margin, not the reading edge — right-aligning a paragraph
            plus a tick list would hang every tick off a different x and cost
            more than the symmetry is worth.

            `data-reveal` on the column, not on each claim: three rows stacked
            10px apart cascading one after another is motion nobody can read as
            a sequence.

            THE CASCADE FOLLOWS THE EYE, WHICH MEANS IT MIRRORS WITH THE SIDES.
            The rule for both beats is "leading column at 0, trailing column one
            `--stagger` behind" — so here, with the picture on the left, the
            picture leads and the words follow; in beat two, with the words on
            the left, the words lead. Keeping a fixed words-then-evidence order
            through the flip would have played this row right-to-left, which is
            a ripple against the reading direction and the one thing a 60ms
            stagger is guaranteed to make visible.

            Below `lg` the two stack and the delay stops mattering rather than
            becoming wrong: a stagger only reads as a cascade when both elements
            cross the reveal line in the same frame, and stacked they are ~250px
            of scroll apart on a phone. The value is therefore tuned for the
            two-column case and is inert in the one-column one — which is why it
            needs no media query.

            `lg:gap-10 xl:gap-14`: the tighter gutter exists for the one
            breakpoint that needs it. At `lg` exactly, the container is 960px
            and every pixel of gutter is a pixel the guest panel does not have;
            the page's usual 56px rhythm returns at `xl`, where there is room to
            pay for it.

            `lg:items-start`, not centred. Centring a 260px column against a
            620px picture floats the words in the middle of nowhere and opens a
            second, larger gap under the section heading than the one the
            heading's own margin set. Top-aligned, each beat's words start on
            the same line as its evidence — which is what holds the two beats
            together once they no longer share a side.

            `max-w-lg` below `lg`, where the column is the container: the body
            is `text-sm`, and at the 720px of a tablet that is a 95-character
            measure. Released at `lg`, where `col-span-4` is already narrower
            than the cap.
          -->
          <div
            class="mt-12 grid gap-8 sm:mt-14 lg:mt-16 lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-14"
          >
            <div
              data-reveal
              style="--reveal-delay: calc(var(--stagger) * 1)"
              class="max-w-lg lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:max-w-none"
            >
              <h3 class="text-lg font-semibold tracking-tight text-slate-900">
                {{ t('partners.runday.beats.list.label') }}
              </h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-600">
                {{ t('partners.runday.beats.list.body') }}
              </p>
              <ul class="mt-5 space-y-2.5">
                <li
                  v-for="key in RUN_DAY_LIST_POINTS"
                  :key="key"
                  class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
                >
                  <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
                  {{ t(`partners.runday.points.${key}`) }}
                </li>
              </ul>
            </div>

            <!--
              The guest panel, and the breakpoint that picks its capture.

              Below `sm` the page shows the app's own phone layout: the 960px
              capture rendered into a 358px column puts its guest names at about
              five pixels, and on a page read mostly on phones — this is
              Cambodia, and the reader is a shop owner between customers — that
              would be the whole audience getting the unreadable picture.

              `<picture>` rather than a pair of plain images and `sm:hidden`,
              which is what this was: a lazily-loaded image inside a
              `display: none` box is still fetched, so every reader was
              downloading both captures and using one. A `<source>` with a media
              query is resolved before the fetch, so exactly one crosses the
              wire.

              `width`/`height` on the source and the image rather than a CSS
              `aspect-ratio`: the browser derives the box from the attributes of
              whichever one it picked, so a lazy image reserves its own space
              before it decodes and the two captures can have different shapes
              without either one needing a rule. Update them with the captures —
              a stale pair reserves the wrong height and the row below jumps.
            -->
            <figure
              data-reveal
              style="--reveal-lift: 20px"
              class="app-card app-card--continues app-card--crop app-card--crop-tall lg:col-span-8 lg:col-start-1 lg:row-start-1"
            >
              <picture>
                <source
                  :srcset="DashboardGuestsImg"
                  media="(min-width: 640px)"
                  width="1500"
                  height="1052"
                />
                <img
                  :src="DashboardGuestsPhoneImg"
                  :alt="t('partners.runday.imageAlt')"
                  width="796"
                  height="1726"
                  class="block w-full"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </figure>
          </div>

          <!--
            BEAT TWO — what the list comes to.

            Ruled off from the first beat rather than only spaced apart: the
            page already uses a hairline to mean "same argument, next part" (the
            benefits list, the browse-designs footer), and a long page separated
            only by whitespace loses its joints.

            `md:grid-cols-2` rather than `sm:`: at `sm` the two analytics cards
            side by side are 288px each, which renders the app's 14px type at
            about 8px. One card per row up to `md` is bigger, not smaller — the
            pair only splits once the row is wide enough to keep both legible.

            `items-start`: the two captures are a few percent apart in aspect
            ratio, and a stretched grid item would pad the shorter card with a
            strip of empty white below its image.

            Words left, evidence right — the page's default handedness, which
            this beat returns to after the first one turns it (see BEAT ONE).
            The alternation is what the two beats have instead of a repeat.
          -->
          <div
            class="mt-12 grid gap-8 border-t border-slate-200 pt-12 sm:mt-14 sm:pt-14 lg:mt-16 lg:grid-cols-12 lg:items-start lg:gap-10 lg:pt-16 xl:gap-14"
          >
            <div data-reveal class="max-w-lg lg:col-span-4 lg:max-w-none">
              <h3 class="text-lg font-semibold tracking-tight text-slate-900">
                {{ t('partners.runday.beats.totals.label') }}
              </h3>
              <p class="mt-2.5 text-sm leading-relaxed text-slate-600">
                {{ t('partners.runday.beats.totals.body') }}
              </p>
              <ul class="mt-5 space-y-2.5">
                <li
                  v-for="key in RUN_DAY_TOTAL_POINTS"
                  :key="key"
                  class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600"
                >
                  <Check class="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2ecc71]" aria-hidden="true" />
                  {{ t(`partners.runday.points.${key}`) }}
                </li>
              </ul>
            </div>

            <div class="grid items-start gap-3 sm:gap-4 md:grid-cols-2 lg:col-span-8">
              <figure
                v-for="(shot, i) in RUN_DAY_SHOTS"
                :key="shot.key"
                data-reveal
                :style="{
                  '--reveal-delay': `calc(var(--stagger) * ${i + 1})`,
                  '--reveal-lift': '20px',
                }"
                class="app-card app-card--crop"
              >
                <img
                  :src="shot.src"
                  :alt="t(`partners.runday.shots.${shot.key}`)"
                  :width="shot.w"
                  :height="shot.h"
                  class="block w-full"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </div>
      </section>
      <!--
        7. PARTNER BENEFITS — a spec sheet, not a feature grid: each item is
        ruled off at the top and carries no icon disc, so it reads as terms
        rather than as marketing, which is the register a business audience
        trusts at this point in the page.

        FULL WIDTH, NOT A LEFT RAIL. This was a `col-span-4` heading beside a
        `col-span-8` list, and it was the fourth consecutive row on the page to
        put words on the left and content on the right — after the product
        section and both beats of the guest list. That run is what made the
        page feel like one layout repeated rather than seven sections.

        Handedness was not the thing to fix, though. Measured at 1440x900, the
        left column here was 248px wide and 29% full: an eyebrow, a three-line
        heading, and then 71% of the row's height as white. The page has no
        subtitle to put under that heading, so the column had nothing left to
        say. What the eye tracked down the second half of the page was not a
        repeating layout but a repeating *hole* — which is why alternating the
        sides would have mirrored the problem rather than solved it.

        Full width costs the heading nothing (it was never wider than
        `max-w-2xl` anyway) and pays the list: at two columns of the whole
        container the items go from ~251px to ~393px, so no title wraps any
        more, and five items land as 2 + 2 + 1. Three columns would have fitted
        the width too, and returned the items to their old 251px measure for
        nothing.
      -->
      <section class="py-12 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="max-w-2xl">
            <h2
              class="type-display-sm text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.partner.title') }}
            </h2>
          </header>

          <ul class="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:mt-12 lg:gap-x-16">
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
      </section>

      <!--
        8. WHAT SHOPS SAY — the proof for the claims directly above it, and it
        sits between them and the questions because a reader who has just been
        told what they get is exactly the reader asking who else already has it.

        One review on a stage, every shop on a roster beside it — see
        PartnerTestimonials.vue. The stage is the one card here, because a
        review is the one thing in the section a reader is asked to stop and
        read; the roster is what a shop owner scans for (anyone like me, near
        me?) and is also the control.

        No aggregate strip, because a "180 shops on the programme" line would
        be a figure nobody has given us, and no star rows: stars are
        marketplace furniture, and what makes a testimonial land is one shop's
        sentence read properly.
      -->
      <section class="bg-slate-50 py-12 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-6xl lg:px-8 2xl:max-w-7xl">
          <header data-reveal class="mb-12 max-w-2xl lg:mb-16">
            <h2
              class="type-display-sm text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
            >
              {{ t('partners.testimonials.title') }}
            </h2>
            <p class="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              {{ t('partners.testimonials.subtitle') }}
            </p>
          </header>

          <PartnerTestimonials :items="PARTNER_TESTIMONIALS" />
        </div>
      </section>

      <!--
        9. FAQ — the last informative section and the only interactive one, so
        it earns a shape of its own: a single panel lifted off the page's tinted
        ground, with full-bleed rows inside it.

        One card, however many questions. The set is one object — a reader opens
        it, works down it and leaves — so the panel is the card and the questions
        are its contents. A bordered box per question would be a dozen objects to
        separate from each other before reading any of them, which is chrome
        charged for nothing. The panel clips its own corners (`overflow-hidden`) so a row's
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

        Open on arrival, because a stack of headings over an empty section reads
        as a section with nothing in it. One open row gives the section its body and
        teaches that the rows open, without spending a line of copy saying so.
      -->
      <section class="border-t border-slate-200 py-12 sm:py-20 lg:py-28">
        <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header data-reveal class="text-center">
            <h2
              class="type-display-sm text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
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
                      {{ t(`partners.faq.${key}.a`, offer) }}
                    </p>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </section>

      <!--
        10. CLOSING — the ask, said once more where the decision is made, and
        also the page's end. `AppFooter` is gone from here for the reason the
        top bar is: its nav, its social row and its "explore the app" link all
        belong to a product this reader has no account for, and on a page that
        is a pitch they are five ways to leave before the ask. So everything the
        reader still needs lands in this section or nowhere — the ask, a person
        to talk to, and the way back.

        ON THE PAGE'S OWN GROUND, NOT IN A GRADIENT SLAB. It was a full-width
        rounded panel of the brand gradient with white type centred on it — the
        most recognisable close a generated page has — and on this page it
        broke in two ways. The subtitle was regular-weight white at 90% on the
        gradient's green end, about 2:1, where DESIGN.md §8 keeps white on the
        gradient for medium weight and up. And it turned the primary action
        white: the one button the page exists for was the only "Request partner
        access" on it not drawn in the brand gradient. The landing page's close
        was rebuilt the same way for the same reasons, so the two marketing
        pages now end in one voice.

        The gradient is spent once, on the button — the gradient's first claim
        anyway — and the phone action pill withdraws as this section arrives,
        so there is still one gradient object on screen. The two buttons are
        the hero's pair, class for class: the page asks the same question in
        the same words at both ends.

        White, not a slate-50 band: below `lg` the layout pads the page's foot
        by the action pill's inset, and a tinted band would end on a white
        strip of that height under the last link.
      -->
      <section
        ref="closingRef"
        class="px-4 pb-12 pt-4 sm:px-6 sm:pb-20 sm:pt-6 lg:px-8 lg:pb-24 lg:pt-8"
      >
        <div class="mx-auto flex max-w-2xl flex-col items-center text-center">
          <!-- The voucher's face value, carried down to the ask: the reader
               who skimmed past the gift section still learns what the free
               events are worth in the one place they decide. The hero
               eyebrow's tinted chip, so it reads as a mark and not a button. -->
          <p
            data-reveal
            class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71]/10 to-[#1e90ff]/10 px-3.5 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-900/5"
          >
            <Gift class="h-4 w-4 text-slate-500" aria-hidden="true" />
            {{ t('partners.closing.badge', offer) }}
          </p>
          <h2
            data-reveal
            style="--reveal-delay: var(--stagger)"
            class="type-display-sm mt-5 text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl"
          >
            {{ t('partners.closing.title') }}
          </h2>
          <p
            data-reveal
            style="--reveal-delay: calc(var(--stagger) * 2)"
            class="mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            {{ t('partners.closing.subtitle') }}
          </p>

          <div
            data-reveal
            style="--reveal-delay: calc(var(--stagger) * 3)"
            class="mt-9 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center"
          >
            <RouterLink
              to="/partners/apply"
              class="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#1e90ff] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-[transform,box-shadow,background-image] duration-200 ease-out hover:from-[#27ae60] hover:to-[#1873cc] hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 sm:text-base"
            >
              {{ t('partners.closing.cta') }}
              <ArrowRight
                class="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </RouterLink>

            <!-- The one control for a shop owner who would rather ask a person
                 than fill in a form: the hero's secondary, a slate fill. -->
            <a
              :href="TELEGRAM_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-slate-100 px-6 py-3.5 text-sm font-medium text-slate-700 transition-[transform,background-color] duration-200 ease-out hover:bg-slate-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:text-base"
            >
              <MessageCircle class="h-4 w-4" aria-hidden="true" />
              {{ t('partners.closing.telegram') }}
            </a>
          </div>

          <!--
            The way back, at the end of the page rather than in a footer. The
            hero's copy of this link is the escape a reader takes on arrival;
            this one is for the reader who has finished and now has to decide.
            One link on the page's own ground, deliberately not a bar with a
            rule over it — that would be the footer again, rebuilt by hand.
          -->
          <RouterLink
            data-reveal
            style="--reveal-delay: calc(var(--stagger) * 4)"
            to="/events"
            class="group mt-10 inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-medium text-slate-500 transition-colors duration-200 ease-out hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 sm:mt-12"
          >
            <ArrowLeft
              class="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
            {{ t('partners.backToEvents') }}
          </RouterLink>
        </div>
      </section>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
/**
 * The partner offer, as a page a salesperson can send or present.
 *
 * WHICH PRICES IT PRINTS, AND WHICH IT NEVER WILL. The offer is a ladder with
 * three rungs, and the page names the first two in figures: two free events
 * worth up to $170, then pay-as-you-go at 50% off retail. Those are the owner's
 * decision of October 2026 — the gift and the discount ARE the pitch, and a
 * shop owner weighs them before applying, not after. The third rung, packs,
 * gets a sentence and no rate: pack prices are bespoke and stay on `/credits`
 * behind `is_partner`, for the reason a wholesale rail was taken off this page
 * in September (a rate at a public URL is a rate the partner's own customer can
 * read).
 *
 * Every figure comes from `PARTNER_OFFER` (src/constants/partnerOffer.ts),
 * interpolated into `partners.json` — never typed into the copy — so the page
 * and its prerendered body cannot quote different numbers, and a reprice of
 * the plan the gift is measured against fails a test instead of a promise. The
 * page still fetches nothing.
 *
 * Every CTA points at `/partners/apply`, and used to point at `/credits`. That
 * was one link serving the signed-out prospect, the applicant and the approved
 * partner without this page knowing which it is talking to — which is still the
 * property worth having, and `/partners/apply` has it too (it resolves to the
 * form, "under review", or "you are already a partner", and sends the last of
 * those on to `/credits`).
 *
 * What `/credits` did NOT have is a way in for the audience this page is
 * written for. It is `requiresAuth`, so a shop owner who had just been argued
 * into applying met a sign-in wall — register, verify, land on a credits page
 * that refuses them, then find the application inside it. The application is a
 * public page now and the account is asked for at its submit, so the ask on this
 * page leads to the thing it names.
 */
import { computed, ref, nextTick, onMounted, onBeforeUnmount, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Eye,
  Film,
  Gift,
  Images,
  Languages,
  LifeBuoy,
  Link2,
  MessageCircle,
  Palette,
  QrCode,
  ShieldCheck,
  Store,
  Tag,
  UserCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-vue-next'
import MainLayout from '@/components/MainLayout.vue'
import PartnerInvitationMoments from '@/components/PartnerInvitationMoments.vue'
import PartnerTestimonials from '@/components/PartnerTestimonials.vue'
import testimonialsData from '@/assets/testimonials.json'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { partnerOfferFigures } from '@/constants/partnerOffer'
/**
 * Real screenshots of a real invitation and a real guest list, captured from
 * the app itself rather than drawn. They are checked in rather than fetched
 * because this page must make its argument for a reader with no account and
 * possibly no network to spare: every endpoint that could produce them live is
 * either behind `is_partner` or three full app boots away (see
 * /partners/templates, which is where the live version lives).
 *
 * Regenerating them is documented in docs/guides/PARTNER_PAGE_SCREENSHOTS.md.
 */
import HeroFanLeftImg from '@/assets/partners/invite-cover-khmer.webp'
import HeroFanLeadImg from '@/assets/partners/invite-cover-blush.webp'
import HeroFanRightImg from '@/assets/partners/invite-cover-crimson.webp'
import CoverRoyalImg from '@/assets/partners/invite-cover-royal.webp'
import DashboardGuestsImg from '@/assets/partners/dashboard-guests.webp'
import DashboardGuestsPhoneImg from '@/assets/partners/dashboard-guests-phone.webp'
import DashboardRsvpImg from '@/assets/partners/dashboard-rsvp.webp'
import DashboardGiftsImg from '@/assets/partners/dashboard-gifts.webp'

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

/**
 * `{worth}`, `{retail}` and `{partnerPrice}` for every string that quotes the
 * offer. Computed once — the figures are constants, and only the words around
 * them change with the language.
 */
const offer = partnerOfferFigures()

const HERO_LEDGER = ['free', 'payg', 'upfront'] as const
const STEPS = ['open', 'build', 'sell'] as const

/**
 * What each step costs the partner. The build step's is time (a quarter of an
 * hour, an hour for a big wedding with a long guest list) because that is what a
 * shop owner is really asking about the work; the other two are the offer
 * itself, said where it applies — opening the account is free, and sending is
 * free twice and then half price.
 */
const STEP_META: Record<(typeof STEPS)[number], { label: string; icon: Component }> = {
  open: { label: 'partners.steps.open.cost', icon: Gift },
  build: { label: 'partners.steps.build.time', icon: Clock },
  sell: { label: 'partners.steps.sell.cost', icon: Tag },
}

/** The three answers to "what's the catch" under the voucher. */
const GIFT_FACTS = [
  { key: 'real', icon: CalendarCheck },
  { key: 'keep', icon: Wallet },
  { key: 'nocard', icon: ShieldCheck },
] as const

/**
 * The two questions the offer raises go first, and the first of them is open on
 * arrival — a reader who has just seen "free" and "50% off" is asking about
 * exactly those, and the old opener (what if I do not sell them all) is a
 * question about packs, which are now the offer's last rung rather than its
 * first.
 */
const FAQ_KEYS = [
  'gift',
  'payg',
  'unsold',
  'future',
  'price',
  'domain',
  'lifetime',
  'exclusive',
  'plans',
  'payment',
  'customer',
  'names',
  'apply',
] as const

/**
 * Evidence for "browse every design", not decoration: four covers that share
 * nothing but the product — ivory Khmer gold, blush rose, deep crimson, royal
 * blue. Three of them are already the hero's fan, which is deliberate; a
 * visitor who scrolled past the hero recognises them, and recognising them is
 * what makes the fourth one read as "and more where those came from".
 */
const COVER_STRIP = [
  { src: HeroFanLeadImg },
  { src: HeroFanLeftImg },
  { src: HeroFanRightImg },
  { src: CoverRoyalImg },
] as const

/**
 * The claims, split between the two beats and sitting beside the picture that
 * proves each one, rather than pooled into one strip under all three pictures.
 * A tick under a screenshot is a caption; a tick beside it is a claim with its
 * evidence in view, which is the only reason to write one.
 *
 * Four and three, not five and two. `gifts` belongs to the list — a cash gift
 * is recorded against a name, on a row — and the totals beat needed a second
 * and third line of its own, which the analytics cards were already showing and
 * the page had never said out loud.
 *
 * `share` is the one claim here whose evidence is NOT in view, and it is a
 * deliberate exception rather than a lapse: `dashboard-guests.webp` predates
 * the Share control, so the capture shows the list but not the handing over of
 * it. It closes the list beat because the first objection a shop owner raises
 * to running somebody else's guest list is that they would have to type it —
 * so the answer belongs beside the list, not three sections later. Re-capture
 * the guest panel with the Share button in frame and this becomes an ordinary
 * tick again (docs/guides/PARTNER_PAGE_SCREENSHOTS.md).
 */
const RUN_DAY_LIST_POINTS = ['replies', 'seating', 'gifts', 'share'] as const
const RUN_DAY_TOTAL_POINTS = ['totals', 'chase', 'bygroup'] as const

/**
 * RSVP first, gifts second — the order the two questions actually arrive in.
 * A shop owner is asked "how many are coming?" weeks before anyone asks "how
 * much came in?". (The app's own Analytics tab happens to stack them the other
 * way round; that is a screen being managed, this is an argument being made.)
 *
 * The intrinsic size travels with the file so the image element can reserve
 * its box before it decodes. Update both numbers together with the capture —
 * a stale pair reserves the wrong height and the row below it jumps.
 */
const RUN_DAY_SHOTS = [
  { key: 'rsvp', src: DashboardRsvpImg, w: 976, h: 1318 },
  { key: 'gifts', src: DashboardGiftsImg, w: 976, h: 1386 },
] as const

/**
 * `personal` leads, because it is the one thing on this list a customer cannot
 * approximate with a poster and a group chat: the guest list issues a link per
 * guest, the name is already written on the invitation when it opens, and the
 * reply that comes back is attached to that guest rather than to a stranger who
 * typed a name into a form. The link card in the middle of the plate shows
 * exactly this — the guest's own name in the preview's title.
 *
 * Nine and not ten: the wishes line is gone, because the wishes are already
 * the third card beside this list — a tick that repeats a picture in view
 * argues nothing the picture has not already made. `agenda` stays; it is a
 * real part of the invitation the list had never mentioned.
 *
 * Split by who meets the feature, because that is the question the plate's two
 * flanks answer: the guest sees the left one on the invitation, the customer
 * runs their event from the right one. Five and four, so the two flanks stand
 * within a row of each other beside the cards.
 */
const FEATURE_GROUPS = [
  {
    key: 'guest',
    items: [
      { key: 'personal', icon: UserCheck },
      { key: 'cinematic', icon: Film },
      { key: 'bilingual', icon: Languages },
      { key: 'agenda', icon: CalendarDays },
      { key: 'media', icon: Images },
    ],
  },
  {
    key: 'host',
    items: [
      { key: 'rsvp', icon: ClipboardCheck },
      { key: 'notify', icon: BellRing },
      { key: 'guests', icon: Users },
      { key: 'checkin', icon: QrCode },
    ],
  },
] as const

/**
 * Order is load-bearing at `sm`, where the grid fills row-wise in pairs: the
 * first row is what the partner's own name gets out of this, the second pairs
 * the job they hand back to the customer with the one they can take on
 * themselves, and the third is what we carry so the shop does not have to — the
 * platform and the person behind it. Six, so three full rows: `freeStart` used
 * to sit alone on a fourth, and left with the gift section, which says it with
 * a voucher instead of a line. Add items two at a time, or an orphan opens a
 * hole in the last row.
 */
/*
  Placeholder quotes for now — a generated set, in Khmer, which is the
  language the shops this page is written for would actually review in.
  Swap the JSON for real ones; nothing here reads anything but the array.
*/
const PARTNER_TESTIMONIALS = testimonialsData.partners.items

const PARTNER_BENEFITS = [
  { key: 'branding', icon: BadgeCheck },
  { key: 'listing', icon: Store },
  { key: 'share', icon: Link2 },
  { key: 'studio', icon: Palette },
  { key: 'upkeep', icon: Wrench },
  { key: 'support', icon: LifeBuoy },
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

const offerRef = ref<HTMLElement | null>(null)
const scrollToOffer = () => {
  offerRef.value?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  })
}

/**
 * ---------------------------------------------------------------------------
 * The phone action pill's window
 * ---------------------------------------------------------------------------
 * Two boundaries, both measured from real elements rather than from a scroll
 * fraction: the pill arrives once the hero's own CTA row has left the top of
 * the screen, and leaves again as the closing panel — the same button at full
 * size — comes up. A page fraction would drift the moment the catalogue adds a
 * pack or a translation runs longer.
 *
 * Rect reads, not an IntersectionObserver, and for the reason set out at
 * length above `sweep()`: an observer only reports a *change between two
 * samples*, so a single-frame jump — pressing "See the prices", landing on an
 * anchor, dragging a scrollbar — can carry an element from below the viewport
 * to above it without ever delivering an entry. For a one-shot reveal that
 * leaves content invisible; for a persistent piece of chrome it would leave the
 * bar stuck in whichever state it was last in. A position check has no such
 * blind spot, and two `getBoundingClientRect` calls a frame is nothing.
 *
 * `actionBarMounted` latches on and never off. Until the reader has scrolled
 * past the hero there is no bar in the DOM at all — a visitor who reads the
 * first screen and leaves pays nothing for it — and once it exists it is
 * cheaper to leave it there and animate than to unmount a fixed element the
 * reader is likely to scroll back into.
 *
 * The 0.9 on the closing test is the same fold line `REVEAL_LINE` uses, so the
 * pill withdraws on exactly the frame the closing panel starts revealing rather
 * than a moment after it is already legible.
 */
const heroCtaRef = ref<HTMLElement | null>(null)
const closingRef = ref<HTMLElement | null>(null)
const actionBarMounted = ref(false)
const showActionBar = ref(false)
let barFrame = 0

function measureActionBar() {
  barFrame = 0
  const hero = heroCtaRef.value
  const closing = closingRef.value
  if (!hero || !closing) return

  const wanted =
    hero.getBoundingClientRect().bottom < 0 &&
    closing.getBoundingClientRect().top > window.innerHeight * REVEAL_LINE

  if (wanted && !actionBarMounted.value) {
    actionBarMounted.value = true
    // Mounted hidden, shown on the next frame — an element created with its
    // final transform already applied has nothing to transition from, and the
    // pill would appear in place instead of rising into the band.
    nextTick(() => requestAnimationFrame(() => (showActionBar.value = wanted)))
    return
  }
  showActionBar.value = wanted
}

function scheduleActionBar() {
  barFrame ||= requestAnimationFrame(measureActionBar)
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
 * `scanReveals()` stays re-runnable rather than collapsing into a one-shot
 * pass on mount. It was written that way for the live pricing cards, which
 * arrived after mount and which a mount-time snapshot missed entirely — a
 * partner saw one card and two holes. Those cards are gone with the wholesale
 * rail, but `seen` makes a second call free, so the next section that renders
 * asynchronously costs one line rather than this machinery rebuilt.
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
      el.setAttribute('data-reveal', 'arm')
      return true
    }
    // Once only — a section that re-animates on every pass is ambient motion,
    // which spends attention and returns nothing.
    el.setAttribute('data-reveal', 'in')
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
    fresh.forEach((el) => el.setAttribute('data-reveal', 'in'))
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

onMounted(() => {
  scanReveals()
  // Both listeners stay for the life of the page rather than detaching the way
  // the reveal sweep's do: the pill's window has two edges and a reader crosses
  // them in both directions, so there is no point at which the answer stops
  // being able to change.
  window.addEventListener('scroll', scheduleActionBar, { passive: true })
  window.addEventListener('resize', scheduleActionBar, { passive: true })
  scheduleActionBar()
})

onBeforeUnmount(() => {
  stopSweeping()
  window.removeEventListener('scroll', scheduleActionBar)
  window.removeEventListener('resize', scheduleActionBar)
  if (barFrame) cancelAnimationFrame(barFrame)
})
</script>

<style scoped>
/* Hallmark · macrostructure: Offer Ladder (gift voucher → price slip, under a split hero) · tone: generous, plain-spoken
 * design-system: DESIGN.md (slate · brand gradient · Figtree / Noto Serif Khmer) · studied: no */

/*
  ---------------------------------------------------------------------------
  The page's motion vocabulary, in four numbers
  ---------------------------------------------------------------------------
  Declared once and read by everything below, because a landing page is one
  performance and eight sections each cascading at their own rate read as eight
  pages stapled together. That was literally true here: 80ms between two steps,
  70ms between two pack cards, 60ms between two feature tiles, 45ms between
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
  /*
    One curve, two names. `--ease-out` is the page's UI easing — anything a
    reader is waiting on the result of. `--ease-reveal` is an alias rather than
    a second value, because a scroll reveal wants exactly the same shape and a
    page with two nearly-identical curves is a page whose motion nobody can
    keep in tune. Extend this pair; never write a fourth cubic-bezier inline.
  */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-reveal: var(--ease-out);
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
  ---------------------------------------------------------------------------
  The reveal's two states live in `data-reveal`'s own value, NOT in a class
  ---------------------------------------------------------------------------
  They were classes, added with `classList.add()`, and that is a trap in a Vue
  template. Vue patches a dynamic `:class` by writing the whole `class`
  attribute, so the moment any `[data-reveal]` element's class binding changed,
  every class added from outside Vue was wiped with it. On this page the screen
  picker's three buttons carry both `data-reveal` and a `:class` that flips on
  click: pressing one dropped `reveal-in` from it and from the previously
  selected one, putting both back to `opacity: 0` — and because `seen` already
  held them, no later sweep ever revealed them again. Two of the three tabs
  vanished on the first press and never returned.

  A static attribute is not patched (the vnode's patch flag names class and
  style only), so writing the state into `data-reveal` itself survives every
  re-render. It also means the trap cannot come back: there is no longer a way
  to put a `[data-reveal]` next to a `:class` and get it wrong.

  All three selectors have the same specificity, so ORDER decides — `'in'` must
  stay last, and the reduced-motion override after that.

  On `will-change`: it is a promise the browser keeps by handing the element its
  own compositor layer, and it holds that layer for as long as the declaration
  stands. In the base state that meant all forty `[data-reveal]` elements were
  promoted at first paint — most of them screens below the fold, several never
  reached at all. That is the case DESIGN.md §7 names when it says to add
  `will-change` only to elements that actually animate. Armed one viewport out
  instead, and released in the very rule that hands the transition over.
*/
[data-reveal='arm'] {
  will-change: opacity, transform;
}

[data-reveal='in'] {
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
  ---------------------------------------------------------------------------
  The hero's reveal ladder — which is not the same ladder in the two layouts
  ---------------------------------------------------------------------------
  The rule for the whole page is that the cascade follows the eye, and the hero
  is the one place where the eye takes two different paths: beside the copy on a
  desktop the fan is the last thing to land, so the hero assembles as a sentence
  and then the picture arrives under it; stacked on a phone the fan sits between
  the subtitle and the buttons, and a fixed delay would have played that column
  bottom-to-top — the buttons and the small print arriving before the picture
  above them, which is a ripple against the reading direction and the one thing
  a 60ms stagger is guaranteed to make visible.

  So the three delays swap at `lg`, in CSS rather than in three `:style`
  bindings, because that is the only place that knows about the breakpoint.
  Every step is still one `--stagger`; nothing here invents a second pulse.

  `--reveal-lift` rides along on the fan for the same reason it always did — it
  is the near thing in the frame, so it travels further than the copy.
*/
.hero-fan-slot {
  --reveal-delay: calc(var(--stagger) * 3);
  --reveal-lift: 24px;
}

.hero-cta-slot__row {
  --reveal-delay: calc(var(--stagger) * 4);
}

.hero-ledger {
  --reveal-delay: calc(var(--stagger) * 5);
}

@media (min-width: 1024px) {
  .hero-fan-slot {
    --reveal-delay: calc(var(--stagger) * 5);
  }

  .hero-cta-slot__row {
    --reveal-delay: calc(var(--stagger) * 3);
  }

  .hero-ledger {
    --reveal-delay: calc(var(--stagger) * 4);
  }

  /*
    The hero grid's row gap is what separates subtitle → fan → buttons on a
    phone, so at `lg` — where the copy is one column again and the fan has
    moved out beside it — the gap is zeroed and this margin puts the buttons
    back where they were. Splitting the copy into two grid rows must not cost
    the desktop hero a pixel of its old spacing.
  */
  .hero-cta-slot {
    margin-top: 2rem;
  }
}

/*
  The language FAB's transform states.

  In scoped CSS rather than Tailwind because the hover lift has to be gated on a
  real pointer — a touch device fires `:hover` on tap, so an ungated
  `hover:scale-110` leaves the button sitting 10% large under the reader's
  finger until they tap elsewhere. The press feedback is deliberately NOT gated:
  `:active` is for everybody, and it is the whole reason the control feels heard.

  This replaces a `transition-all duration-300`, which animated every property
  the element has (and every one it might gain) on Tailwind's default
  ease-in-out, at 300ms, against a page where every other control answers in
  200ms on `--ease-out`. Naming the three properties also stops the transition
  from firing on `bottom`, which is a `var(--fab-stack-2)` that changes with the
  viewport.

  `:active` sits after the media query so it wins the tie on source order — the
  two selectors have identical specificity, and a press must override a hover.
*/
.fab-lang {
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out),
    background-image 200ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .fab-lang:hover {
    transform: scale(1.1);
  }
}

.fab-lang:active {
  transform: scale(0.95);
}

@media (prefers-reduced-motion: reduce) {
  .fab-lang {
    transition: box-shadow 200ms var(--ease-out);
  }

  .fab-lang:hover,
  .fab-lang:active {
    transform: none;
  }
}

/*
  ---------------------------------------------------------------------------
  The phone action pill's arrival
  ---------------------------------------------------------------------------
  It rises out of the band it lives in rather than fading in place: the bar is
  a physical object entering from off-screen, and `translateY(100%)` plus the
  inset it floats above is exactly how far off-screen that is — a percentage,
  so the distance is the pill's own height whatever the label inside it does to
  that height in either language.

  Faster out than in, which is this page's rule everywhere (see `.collapse-*`):
  220ms to arrive is chrome presenting itself, 160ms to leave is chrome getting
  out of the way of the closing panel it is handing over to. Both under the
  300ms interface ceiling.

  `visibility` rather than `aria-hidden` + `inert` bindings on the element: it
  takes the pill out of the accessibility tree AND out of hit-testing in one
  declaration that cannot drift from the visual state, since both are driven by
  the same class. It is transitioned at 0s with a delay so it flips only after
  the pill has finished leaving — without the delay the bar would vanish on the
  first frame of its own exit.
*/
.action-pill {
  transform: translateY(calc(100% + 1.5rem));
  opacity: 0;
  visibility: hidden;
  transition:
    transform 160ms var(--ease-out),
    opacity 140ms var(--ease-out),
    visibility 0s linear 160ms;
}

.action-pill.is-in {
  transform: none;
  opacity: 1;
  visibility: visible;
  transition:
    transform 220ms var(--ease-out),
    opacity 180ms var(--ease-out),
    visibility 0s;
}

@media (prefers-reduced-motion: reduce) {
  .action-pill {
    transform: none;
    transition:
      opacity 140ms linear,
      visibility 0s linear 140ms;
  }

  .action-pill.is-in {
    transform: none;
    transition:
      opacity 180ms linear,
      visibility 0s;
  }
}

/*
  The gift voucher's inner light (it was the closing panel's too, until that
  panel came off its gradient). Two radial washes over the brand gradient, not
  a second gradient object: white at low alpha, so whatever the voucher's own
  colour is underneath, this only lifts it. Authored here rather than as two
  arbitrary `bg-[radial-gradient(...)]` values because the commas and spaces a
  two-stop radial needs are exactly what Tailwind's arbitrary-value parser
  makes unreadable.

  Painted, not blurred: a `blur-3xl` disc would be the same picture at the cost
  of a 64px filter pass over the whole voucher on every paint.
*/
.cta-sheen {
  background:
    radial-gradient(58% 78% at 12% 0%, rgb(255 255 255 / 0.22), transparent 68%),
    radial-gradient(52% 72% at 92% 100%, rgb(255 255 255 / 0.14), transparent 70%);
}

/*
  ---------------------------------------------------------------------------
  The gift voucher
  ---------------------------------------------------------------------------
  One gradient element with a fixed-width stub as its second column, so the
  perforation sits at a position CSS already knows — `100% - var(--stub-w)` —
  and the two notches can be cut there with a mask. Cut, not painted: a circle
  of the section's own grey laid over each edge would stop matching the moment
  the ground changes, and the drop shadow would run straight past it. A mask
  takes the pixels out, so the shadow — which is why it lives on the wrapper as
  a `drop-shadow` filter rather than a `box-shadow` here — follows the notches.

  Two mask layers, each just over half the height, each with one hole: the top
  layer's at the top edge, the bottom layer's at the bottom. The 0.5px ramp at
  the hole's rim is the anti-aliasing.

  The stub is sized for its two short lines in Khmer, which run longer: 6.5rem
  holds "២ កម្មវិធី" on one line at 320px and lets "× up to $85 each" wrap
  under it, which it is allowed to.
*/
.voucher-lift {
  filter: drop-shadow(0 1.25rem 1.5rem rgb(30 144 255 / 0.2))
    drop-shadow(0 0.125rem 0.375rem rgb(15 23 42 / 0.08));
}

.voucher {
  --notch: 0.75rem;
  --stub-w: 6.5rem;
  --cut: calc(100% - var(--stub-w));

  grid-template-columns: minmax(0, 1fr) var(--stub-w);
  border-radius: 1.25rem;
  -webkit-mask:
    radial-gradient(circle var(--notch) at var(--cut) 0, #0000 calc(100% - 0.5px), #000) top / 100%
      51% no-repeat,
    radial-gradient(circle var(--notch) at var(--cut) 100%, #0000 calc(100% - 0.5px), #000) bottom /
      100% 51% no-repeat;
  mask:
    radial-gradient(circle var(--notch) at var(--cut) 0, #0000 calc(100% - 0.5px), #000) top / 100%
      51% no-repeat,
    radial-gradient(circle var(--notch) at var(--cut) 100%, #0000 calc(100% - 0.5px), #000) bottom /
      100% 51% no-repeat;
}

@media (min-width: 640px) {
  .voucher {
    --notch: 0.875rem;
    --stub-w: 9.5rem;

    border-radius: 1.5rem;
  }
}

/* The perforation: a dashed rule on the stub's leading edge, stopping short of
   both notches so no dash runs into a hole. */
.voucher__stub::before {
  content: '';
  position: absolute;
  inset-block: calc(var(--notch) + 0.5rem);
  inset-inline-start: -1px;
  border-inline-start: 2px dashed rgb(255 255 255 / 0.55);
}

/*
  One pass of light across the voucher as it lands, the way a gift card catches
  it when it is handed over. Decoration, and allowed for the reason the hero's
  fan is: it happens once, on arrival, and never again. A transition keyed off
  the reveal rather than a keyframe, so it cannot replay.
*/
.voucher__shine {
  width: 45%;
  background: linear-gradient(105deg, transparent 20%, rgb(255 255 255 / 0.3) 50%, transparent 80%);
  transform: translateX(-110%);
}

[data-reveal='in'] .voucher__shine {
  transform: translateX(340%);
  transition: transform 1100ms var(--ease-out) 450ms;
}

@media (prefers-reduced-motion: reduce) {
  .voucher__shine {
    display: none;
  }
}

/*
  ---------------------------------------------------------------------------
  The price slip's three beats
  ---------------------------------------------------------------------------
  The slip arrives with the page's reveal; then, in order: the 50% sticker is
  stamped on (450ms), the "you pay" bar drops from full price to half (750ms),
  and the "you keep" column it uncovers fades in (1250ms). Each beat is the one
  before it explained, which is why they are sequenced rather than staggered.

  The bar is clipped, not scaled: `scaleX(0.5)` would squash its rounded end
  into an ellipse, and `clip-path` with `round` keeps a true pill at any width.
  The sticker lands from slightly larger and further turned, pressed down into
  place — never from nothing.

  Reduced motion gets the end state with no transitions, which the reveal
  machinery already provides by setting every element to `in` on mount.
*/
.slip__sticker {
  position: absolute;
  top: -1.25rem;
  right: 1rem;
  display: flex;
  height: 4.5rem;
  width: 4.5rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgb(15 23 42);
  color: #fff;
  box-shadow: 0 0.75rem 1.5rem -0.75rem rgb(15 23 42 / 0.6);
  opacity: 0;
  transform: rotate(-22deg) scale(1.18);
  transition:
    opacity 200ms var(--ease-out),
    transform 380ms var(--ease-out);
}

@media (min-width: 640px) {
  .slip__sticker {
    top: -1.75rem;
    right: 1.75rem;
    height: 6rem;
    width: 6rem;
  }
}

[data-reveal='in'] .slip__sticker {
  opacity: 1;
  transform: rotate(-10deg) scale(1);
  transition-delay: 450ms;
}

.slip__pay {
  clip-path: inset(0 0 0 0 round 9999px);
  transition: clip-path 900ms var(--ease-out);
}

[data-reveal='in'] .slip__pay {
  clip-path: inset(0 50% 0 0 round 9999px);
  transition-delay: 750ms;
}

.slip__keep {
  opacity: 0;
  transition: opacity 400ms var(--ease-out);
}

[data-reveal='in'] .slip__keep {
  opacity: 1;
  transition-delay: 1250ms;
}

@media (prefers-reduced-motion: reduce) {
  .slip__sticker,
  .slip__pay,
  .slip__keep {
    transition: none;
  }
}

/*
  ---------------------------------------------------------------------------
  The hero's fan of covers
  ---------------------------------------------------------------------------
  The lead card is the only one in normal flow, so it alone sets the block's
  height and the two behind it can be swapped, added to or removed without
  moving the hero's baseline by a pixel.

  The spread is a percentage of each card's own width (`--fan-x`) rather than a
  pixel count, so the footprint scales with the container.

  What the footprint actually is, though, is NOT lead + 2 × spread: rotating a
  card 8° adds `height × sin(8°)` to its horizontal extent, and these cards are
  2.16 times taller than they are wide, so the rotation contributes more width
  than the translate does. Measured, the fan ends up about 1.93 times the lead's
  width. Sizing it by eye from the translate alone put a 371px fan in a 288px
  column on a 320px phone, and the only reason that did not scroll the page
  sideways was the section's `overflow-hidden` quietly cutting a card in half.

  Hence the `min(<rem>, 48%)` at every breakpoint. The percentage resolves
  against the grid column the fan sits in, so capping the lead at 48% of it
  keeps the ~1.93× footprint inside that column BY CONSTRUCTION, at any viewport
  and either root font size. The `rem` half is the size we actually want; the
  percentage is the guard that stops it.

  A per-breakpoint `rem` alone could not do this, and the tell was a viewport
  nobody thinks to check: at exactly 1024px the grid becomes two columns, the
  container is still viewport-bound rather than at its 72rem cap, and the
  column is only 480px — so a 16rem lead put a 494px fan in it and the right
  card hung 12px off the screen. The same trap sits at 1280–1535 on a window
  tall enough (>1100px) to miss the 75% root-font rule. One percentage closes
  both without anyone having to enumerate them.

  The section clips for the ground, and nothing here leans on it — which is the
  point, because it hides this class of mistake by cutting a card in half rather
  than scrolling the page. It is `overflow: clip`, NOT `hidden`, and that is
  load-bearing: `hidden` makes the section a scroll container, so the cards'
  scroll-driven depth (`animation-timeline: view()`, see "Scroll-driven motion")
  would bind to a box that never scrolls and sit frozen on its first frame.
  `clip` cuts the same pixels without becoming a scroller.

  The cards start stacked and spread on reveal. It is the one piece of motion on
  the page that is decoration rather than orientation, and it is affordable for
  exactly one reason: a reader sees it once. A deck that opens says "these are
  designs, and there are more" in a way three static overlapping pictures do
  not. It is a sibling of the reveal rather than part of it — the wrapper does
  opacity and lift, the cards do the spread — because `[data-reveal]` already
  owns `transform` on the element it is placed on.
*/
/*
  THE PHONE'S DECK IS FLATTER, WHICH IS WHAT PAYS FOR IT BEING BIGGER.

  The fan's footprint is not lead + 2 x spread (see above); at the desktop's 30%
  and 8 degrees it measures about 1.93 x the lead. Closing that to 21% and 5.5
  degrees brings the multiplier down to ~1.65 — measured, not derived — and the
  width that buys goes back into the card: 185px against 164px on a 375px
  screen, with the same three covers still visibly a deck.

  The percentage guard stays and is still the thing that makes this safe at any
  viewport; only its ceiling moves, because a stacked column is not a 6/12 grid
  cell and 48% of it was a rule inherited from a layout that is not on screen.
  54% x 1.65 = 89% of the column, so the deck sits inside the text measure at
  every phone width — 320, 375 and 412 all measured — rather than relying on the
  section's `overflow-hidden` to quietly cut a card in half.

  THE SIZE IS SET BY WHERE THE FOLD LANDS, not by how big the covers could be.
  At 54% the primary CTA's top edge sits at 793px on the 812px screen this page
  is mostly read on: the deck gets the screen, and the button breaks the bottom
  edge by just enough to say there is more below it. Every step larger pushed
  that button entirely off-screen and turned the hero into a picture with no
  visible way out of it.
*/
.hero-fan {
  --fan-x: 21%;
  --fan-r: 5.5deg;

  position: relative;
  width: 100%;
  max-width: min(13.5rem, 54%);
  margin-inline: auto;
  /*
    Room for the cards' own shadow inside the clip.

    The lead card is in normal flow, so it sets this box's height and its bottom
    edge WAS this box's bottom edge — which, because the hero section is
    `overflow-hidden`, is a clip boundary. The result was all three cards sliced
    off flat: no rounded bottom corners, no shadow, the fan ending on a hard
    horizontal line against the next section.

    3rem covers the 2.75rem the shadow reaches below the card. It belongs here
    rather than on the section because it is the fan's own requirement — the
    section's padding is about the page's rhythm, and the two should not have to
    be kept in sync by hand.
  */
  padding-bottom: 3rem;
}

@media (min-width: 640px) {
  .hero-fan {
    --fan-x: 38%;
    --fan-r: 9deg;

    max-width: min(14.5rem, 48%);
  }
}

@media (min-width: 1024px) {
  .hero-fan {
    max-width: min(16rem, 48%);
  }
}

/* At `xl` the fan drops to 5/12 of the container, so it gives back the width it
   just gained by closing a degree of spread rather than by shrinking a card. */
@media (min-width: 1280px) {
  .hero-fan {
    --fan-x: 36%;

    max-width: min(16.5rem, 48%);
  }
}

.hero-fan__card {
  display: block;
  width: 100%;
  border-radius: 1.25rem;
  /* An outline rather than a border: a border would be inside the element's own
     box and eat 1px of a photograph whose edges are its artwork. */
  outline: 1px solid rgb(15 23 42 / 0.08);
  outline-offset: -1px;
  /*
    In `rem`, not `px`, and that is not a style preference here.

    The app drops the root font to 75% on laptop viewports (main.css), so the
    card itself is 25% smaller there. A pixel shadow would not shrink with it —
    it would read as a heavier, lower shadow on exactly the screens where the
    card is smallest, and it would no longer fit the padding reserved for it
    below. In `rem` the shadow is part of the card and scales with it, so the
    clearance `.hero-fan`'s padding provides is correct at every root size.

    Reach below the card: 1.25 + 2.5 − 1 = 2.75rem. That number is what
    `.hero-fan`'s `padding-bottom` has to cover.
  */
  box-shadow:
    0 1.25rem 2.5rem -1rem rgb(15 23 42 / 0.4),
    0 0.125rem 0.5rem rgb(15 23 42 / 0.08);
}

.hero-fan__card--lead {
  position: relative;
  z-index: 2;
}

.hero-fan__card--left,
.hero-fan__card--right {
  position: absolute;
  inset-block-start: 5%;
  z-index: 1;
  width: 88%;
  transition: transform 700ms var(--ease-reveal);
}

/* Rotating about a point low on the *inner* edge is what makes the two read as
   one deck opening rather than as two cards pivoting on their own centres. */
.hero-fan__card--left {
  inset-inline-start: 0;
  transform-origin: 100% 80%;
  transform: translateX(6%);
}

.hero-fan__card--right {
  inset-inline-end: 0;
  transform-origin: 0 80%;
  transform: translateX(-6%);
}

[data-reveal='in'] .hero-fan__card--left {
  transform: translateX(calc(var(--fan-x) * -1)) rotate(calc(var(--fan-r) * -1));
}

[data-reveal='in'] .hero-fan__card--right {
  transform: translateX(var(--fan-x)) rotate(var(--fan-r));
}

@media (prefers-reduced-motion: reduce) {
  .hero-fan__card--left,
  .hero-fan__card--right {
    transition: none;
  }
}

/*
  ---------------------------------------------------------------------------
  The spec plate
  ---------------------------------------------------------------------------
  Grid areas, so the DOM stays in the phone's order — the cards, then the
  guest group, then the host group — while the desktop flanks the cards with
  the two groups. Every track is `minmax(0, 1fr)` or a fixed size: a flank
  holds Khmer, which must wrap inside its track rather than widen it.

  Two columns from `sm`, under the cards: a tablet is too narrow to flank a
  tall cluster with two lists, and too wide to stack nine short lines in one
  column. The centre track is the cluster's own width (23rem, its max) at
  `xl`, and two rem under it at `lg`, where the cards simply take what is
  there. Wider than the phone's was, because the cards carry text to be read
  where the phone carried a picture.
*/
.plate {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'moments'
    'guest'
    'host';
  gap: 2.75rem;
}

.plate__moments {
  grid-area: moments;
}

.plate__group--guest {
  grid-area: guest;
}

.plate__group--host {
  grid-area: host;
}

@media (min-width: 640px) {
  .plate {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      'moments moments'
      'guest host';
    gap: 3rem 2.5rem;
  }
}

@media (min-width: 1024px) {
  .plate {
    grid-template-columns: minmax(0, 1fr) 21rem minmax(0, 1fr);
    grid-template-areas: 'guest moments host';
    align-items: center;
    gap: 0 3rem;
  }
}

@media (min-width: 1280px) {
  .plate {
    grid-template-columns: minmax(0, 1fr) 23rem minmax(0, 1fr);
    column-gap: 4rem;
  }
}

.plate__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* White discs on the section's grey: the icon is a marker, not a colour, and
 * the brand gradient is not spent on nine captions. */
.plate__disc {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: #fff;
  color: rgb(100 116 139);
  box-shadow: inset 0 0 0 1px rgb(226 232 240);
}

/* Balanced, because a flank is narrow enough that a label wraps, and an
 * unbalanced wrap leaves one word ("it", "name") alone under a full line. */
.plate__label {
  min-width: 0;
  text-wrap: balance;
  font-size: 0.9375rem;
  font-weight: 500;
  color: rgb(30 41 59);
}

.plate__leader {
  display: none;
}

/*
  Desktop: each flank is set toward the cards — the guest group right-aligned
  with its discs on the inner edge, the host group mirrored — and every row ends
  in a hairline leader reaching across the gutter. The leaders are what turn two
  lists into a diagram of one object.

  They draw outward from the disc as their group arrives, one after another down
  the column — once, keyed off the page's own reveal, and not at all under
  reduced motion. `order` does the mirroring so the markup stays disc, label,
  leader for both flanks and for a phone.
*/
@media (min-width: 1024px) {
  .plate__group--guest {
    text-align: right;
  }

  .plate__group--guest .plate__item {
    justify-content: flex-end;
  }

  .plate__group--guest .plate__label {
    order: 1;
  }

  .plate__group--guest .plate__disc {
    order: 2;
  }

  .plate__leader {
    display: block;
    height: 1px;
    width: 3rem;
    flex: none;
    background: rgb(203 213 225);
    transform: scaleX(0);
    transition: transform 500ms var(--ease-out);
    transition-delay: calc(250ms + var(--i, 0) * 60ms);
  }

  /*
    The leader spends all but 0.25rem of itself in the gutter (the negative
    margin), so it ends ~1.25rem short of the centre track at both widths below,
    and each disc's outer edge sits 1rem inside the flank. The headings are
    padded by that same 1rem so they stand over the discs rather than a disc's
    width outside them.
  */
  .plate__group--guest .plate__leader {
    order: 3;
    margin-inline-end: -2.75rem;
    transform-origin: left center;
  }

  .plate__group--host .plate__leader {
    order: -1;
    margin-inline-start: -2.75rem;
    transform-origin: right center;
  }

  .plate__group--guest .plate__heading {
    padding-inline-end: 1rem;
  }

  .plate__group--host .plate__heading {
    padding-inline-start: 1rem;
  }

  [data-reveal='in'] .plate__leader {
    transform: none;
  }
}

/* The gutter widens by 1rem at `xl`, and the leader with it. */
@media (min-width: 1280px) {
  .plate__leader {
    width: 4rem;
  }

  .plate__group--guest .plate__leader {
    margin-inline-end: -3.75rem;
  }

  .plate__group--host .plate__leader {
    margin-inline-start: -3.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .plate__leader {
    transition: none;
  }
}

/*
  The frame every back-office capture sits in. One class for all three, because
  they are three panels of one app and anything that framed them differently
  would be saying they are not.

  Not a device bezel and not a browser chrome. The reader is holding the bezel,
  and the drawn browser bar that used to sit here existed to frame a full-window
  screenshot; the captures are cropped to the panel now, so the frame's whole
  job is to give the picture an edge and lift it off the page.

  The captures themselves are taken with their own radius, border, ring and
  shadow switched off (see docs/guides/PARTNER_PAGE_SCREENSHOTS.md), so this
  rounding is the only one in play — a baked-in corner would show the app's
  background as four tinted nubs just inside this border.
*/
.app-card {
  overflow: hidden;
  border-radius: 1rem;
  border: 1px solid rgb(226 232 240);
  background: #fff;
  box-shadow:
    0 18px 40px -22px rgb(15 23 42 / 0.35),
    0 2px 6px rgb(15 23 42 / 0.05);
}

@media (min-width: 640px) {
  .app-card {
    border-radius: 1.25rem;
  }
}

/*
  The guest capture ends part-way through a row, because a guest list does. Left
  hard, that crop is the one genuinely untidy edge in the section — a name
  sliced through the middle by a card border, which reads as a mistake rather
  than as a list that carries on past the frame. The fade turns it into the
  claim the heading is already making: this is *the whole* guest list, and it
  does not stop at eight.

  A mask, not a white overlay: the capture's own ground is near-white but not
  white, so an opaque wash would be a pale bar sitting on top of it rather than
  a dissolve. A mask takes the pixels out. (The pricing rail's edge fades were
  the other user of this reasoning, and went with the rail.)

  The band is a percentage so it holds its proportion across both captures and
  every column width — the cut row is ~7% of the desktop capture's height, so
  10% covers it with a little feather and never eats the row above. Only on the
  card that continues: a fade over an edge with nothing past it reads as
  clipping, and both analytics captures end on their own last line.
*/
.app-card--continues img {
  -webkit-mask-image: linear-gradient(to bottom, #000 90%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 90%, transparent 100%);
}

/*
  ---------------------------------------------------------------------------
  On a phone the captures are cropped, not shrunk
  ---------------------------------------------------------------------------
  This is the section that broke worst on a phone, and the numbers say why: the
  three back-office captures came to 2,150px of a 812px screen — two and a half
  screens of pictures inside a section that is three and a half — because an
  image with `width: 100%` and a fixed aspect ratio gets *taller* the narrower
  the column is. The guest panel alone was 743px. Nobody scrolls through that;
  they scroll past it, which means the strongest evidence on the page was the
  part a phone reader skipped.

  Shrinking them was the obvious fix and the wrong one. These are captures of a
  real interface at a real type size, and the ratio between the column and the
  capture is exactly what decides whether the app's own 14px renders as
  something or as grey texture — halving the box halves the type with it. So
  the box is cut instead: fixed height, image at its natural scale, anchored to
  the top. The reader sees less of each panel at the size it was meant to be
  read rather than all of it at a size nobody can.

  ANCHORED TOP because these three captures are all top-loaded by construction —
  a guest list starts with its header and first rows, and both analytics panels
  open on the figure they exist to report (61% replied, 45% gift participation).
  The bottom of each is the long tail that repeats the same shape.

  The fade is what makes a cut read as "continues" instead of "clipped", which
  is the same argument `--continues` already makes for the guest panel at every
  width; here it is extended to all three, but only while they are cropped. At
  `sm` and above nothing applies and every capture is whole again, including
  the two analytics ones, which end on their own last line and must never be
  faded — a fade over an edge with nothing past it reads as a mistake.

  It must sit AFTER `--continues` in source order: the two selectors have the
  same specificity, and this one has to win for the card that carries both.
*/
@media (max-width: 639.98px) {
  .app-card--crop {
    height: 13.5rem;
  }

  /* The guest list is the beat's whole subject and is shot in the app's own
     phone layout, so it is legible here in a way the two desktop analytics
     panels are not — it earns roughly twice the height. */
  .app-card--crop-tall {
    height: 26rem;
  }

  /* `<picture>` is inline by default, which would leave the image measuring
     against a line box instead of the card. */
  .app-card--crop picture {
    display: block;
    height: 100%;
  }

  .app-card--crop img {
    height: 100%;
    width: 100%;
    object-fit: cover;
    object-position: top center;
    -webkit-mask-image: linear-gradient(to bottom, #000 86%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 86%, transparent 100%);
  }
}

/*
  The four covers over "Browse every design".

  They were 44px and hung at the left edge of the band, where four thumbnails
  that size read as noise beside a dark pill. Centred, they are the coda's
  anchor — the object that holds the axis and stands in for the section rule
  that used to be here — so they are sized to be looked at: ~52px, ~64px from
  `sm`. Still a sample, not a gallery; the gallery is a page away.
*/
.cover-chip {
  display: block;
  width: 3.25rem;
  border-radius: 0.5rem;
  outline: 1px solid rgb(15 23 42 / 0.08);
  outline-offset: -1px;
  box-shadow: 0 6px 14px -8px rgb(15 23 42 / 0.4);
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out);
}

@media (min-width: 640px) {
  .cover-chip {
    width: 4rem;
    border-radius: 0.625rem;
  }
}

/*
  The covers answer the button, because they are what is behind it.

  `:has()` rather than a `group` on the wrapper: the wrapper is the full
  container width, so hovering it would mean hovering the empty air either side
  of a centred object — motion with no cause. Keyed off the link itself, the
  lift only ever fires when the reader is actually over the thing that opens the
  catalogue, and it says "these four are what is through here" without a word.

  Pointer-only, because a touch device fires `:hover` on tap and would leave
  four covers held 3px up until the reader pressed somewhere else. Seen once per
  visit, so it is allowed to be decorative — but the ripple is 30ms a step, not
  60: four covers 12px apart are one object, and the page's `--stagger` is
  tuned for rows of cards a reader's eye travels between.
*/
@media (hover: hover) and (pointer: fine) {
  .catalogue:has(a:hover) .cover-chip {
    transform: translateY(-3px);
    box-shadow: 0 12px 22px -10px rgb(15 23 42 / 0.45);
  }

  .catalogue li:nth-child(2) .cover-chip {
    transition-delay: 30ms;
  }

  .catalogue li:nth-child(3) .cover-chip {
    transition-delay: 60ms;
  }

  .catalogue li:nth-child(4) .cover-chip {
    transition-delay: 90ms;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cover-chip {
    transition: box-shadow 200ms var(--ease-out);
  }

  .catalogue:has(a:hover) .cover-chip {
    transform: none;
  }
}

/*
  The sanctioned collapse: grid-template-rows 0fr↔1fr, never max-height.

  The curve was `cubic-bezier(0.4, 0, 0.2, 1)` — Material's standard easing,
  inlined here and nowhere else on the page, which is the exact shape of the
  "familiar-looking curve typed from memory" mistake. It is also an ease-in-out,
  and an answer opening is an entrance: it should start fast.

  Faster out than in. 250ms to open is the reader's own press being answered;
  180ms to close is the page getting out of the way of the next question, and a
  panel that takes as long to leave as to arrive reads as reluctant. Both sit
  under the 300ms ceiling the rest of the page's interface keeps.
*/
.collapse-enter-active {
  transition:
    grid-template-rows 250ms var(--ease-out),
    opacity 200ms var(--ease-out);
}

.collapse-leave-active {
  transition:
    grid-template-rows 180ms var(--ease-out),
    opacity 120ms var(--ease-out);
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

/*
  ---------------------------------------------------------------------------
  Scroll-driven motion
  ---------------------------------------------------------------------------
  Four things move with the reader's own scroll, each because the motion says
  something the still frame cannot:

  1. The hero's deck comes apart in depth as the hero leaves — the front card
     rises faster than the page, the two behind it lag and part — so the first
     scroll on the page feels like moving past real objects.
  2. The gift voucher is handed over: it arrives turned and a little low, and
     straightens into place as it comes up the screen.
  3. The invitation's three cards gather: they come up the screen spread apart
     and settle into one cluster at its middle, the front card travelling
     furthest. Its rules live in PartnerInvitationMoments.vue, beside the cards
     they move, and follow every rule set out here.
  4. The steps' thread draws itself across as the row comes into view, and each
     numeral inks as the thread reaches it: the sequence explained by motion.

  CSS scroll timelines, not a scroll listener: no rAF loop and nothing to tear
  down when the route changes (this is a SPA view, and the scroll-world engine's
  missing teardown is exactly the hazard this avoids). It also runs off the
  main thread. A browser without `animation-timeline` gets the finished state,
  because every animation here ends on the element's own resting style — so
  does `prefers-reduced-motion`.

  None of it sits on a `[data-reveal]` element: those own `transform` and
  `opacity` for the arrival. Each lands on a child, and where that child already
  has a `transform` (the fan cards' spread) it moves with the independent
  `translate` property instead, which composes with it rather than replacing it.

  LONGHANDS ONLY. The `animation` shorthand resets `animation-timeline` to
  `auto`, so a shorthand written after a timeline silently turns a scroll-driven
  animation back into a 0s time-based one.

  Timing: `linear`, all four. A scrubbed animation's easing is the reader's own
  scroll — it slows when they slow — so a curve on top of it is a second easing
  fighting the first. It was measured, not assumed: on the page's strong
  `--ease-out` the phone that stood where the cards are now was 99.8% upright
  when it had barely entered the screen, and on a 1440x900 laptop the voucher had finished turning before it
  was in view. The settle each one needs comes from where its range ends (the
  middle of the screen), not from a curve.
*/
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    /* 1. One timeline for the whole deck, so the three cards part together. */
    .hero-fan {
      view-timeline-name: --fan;
    }

    .hero-fan__card {
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: --fan;
      animation-range: exit 0% exit 100%;
    }

    .hero-fan__card--lead {
      animation-name: fanDepthLead;
    }

    .hero-fan__card--left {
      animation-name: fanDepthLeft;
    }

    .hero-fan__card--right {
      animation-name: fanDepthRight;
    }

    /* 2. */
    .voucher {
      animation-name: voucherHandOver;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: view();
      animation-range: entry 0% cover 50%;
    }

    /* 4. The row's thread, and on a phone each step's own segment downward. */
    .steps-track {
      view-timeline-name: --steps;
    }

    .steps-thread {
      transform-origin: left center;
      animation-name: threadDraw;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: --steps;
      animation-range: cover 20% cover 50%;
    }

    .steps-seg {
      transform-origin: top center;
      animation-name: segDraw;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: view();
      animation-range: cover 25% cover 55%;
    }

    /* Stacked, a numeral inks as it passes the upper half of the screen. */
    .steps-num {
      animation-name: stepInk;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: view();
      animation-range: cover 35% cover 45%;
    }

    /*
      In a row, each numeral inks as the thread reaches it. The numerals sit at
      roughly 0, 0.36 and 0.72 of the thread's length, and the thread draws over
      cover 20%–50%, so step n inks around 20% + n × 10%. `--step` is set on its
      list item.
    */
    @media (min-width: 768px) {
      .steps-num {
        animation-timeline: --steps;
        animation-range: cover calc(18% + var(--step, 0) * 10%) cover
          calc(23% + var(--step, 0) * 10%);
      }
    }
  }
}

@keyframes fanDepthLead {
  to {
    translate: 0 -8%;
  }
}

@keyframes fanDepthLeft {
  to {
    translate: -6% 10%;
  }
}

@keyframes fanDepthRight {
  to {
    translate: 6% 10%;
  }
}

@keyframes voucherHandOver {
  from {
    rotate: -6deg;
    translate: 0 1.5rem;
    scale: 0.94;
  }

  to {
    rotate: 0deg;
    translate: 0 0;
    scale: 1;
  }
}

@keyframes threadDraw {
  from {
    scale: 0 1;
  }

  to {
    scale: 1 1;
  }
}

@keyframes segDraw {
  from {
    scale: 1 0;
  }

  to {
    scale: 1 1;
  }
}

@keyframes stepInk {
  from {
    color: rgb(203 213 225);
  }

  to {
    color: rgb(15 23 42);
  }
}
</style>
