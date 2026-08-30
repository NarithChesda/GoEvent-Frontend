# GoEvent Design Standard

**Version 1.0 · July 2026 · Status: Authoritative**

This document is the single source of truth for GoEvent's visual identity and web application design. Every screen, component, and animation shipped in this codebase must conform to it. When this document and existing code disagree, this document wins — fix the code, don't fork the standard.

Companion references:

- **Component implementation recipes**: [.claude/skills/goevent-design/SKILL.md](.claude/skills/goevent-design/SKILL.md) — exact Tailwind class recipes for buttons, cards, drawers, modals, dropdowns, toasts, navigation, and the showcase animation system. This document defines *the standard*; the skill file defines *how to build to it*.
- **Tailwind theme**: [tailwind.config.js](tailwind.config.js)
- **Global styles & fonts**: [src/assets/main.css](src/assets/main.css)
- **All other documentation** (backend API references, feature plans, deployment guides): [docs/README.md](docs/README.md)

---

## 1. Brand Identity

### 1.1 Logo assets

| Asset | File | Use |
|---|---|---|
| Icon logo (app mark) | [src/assets/icon-logo.png](src/assets/icon-logo.png) | Favicons, app icons, avatars, compact nav, loading marks. Square, rounded-corner tile filled with the brand gradient, white "G" glyph knocked out. |
| Full logo (wordmark) | [src/assets/logo.png](src/assets/logo.png) | Marketing surfaces, headers, footers, splash/showcase branding. Khmer wordmark + "GOEVENT" in Latin, drawn in the brand gradient on transparent background. |
| White Khmer logo | [src/assets/white-kh-logo.svg](src/assets/white-kh-logo.svg) | Single-color white variant for dark or photographic backgrounds. |
| Icon (SVG) | [src/assets/icon.svg](src/assets/icon.svg) | Vector icon variant where scalability matters. |

### 1.2 Brand colors (sampled from the logo artwork)

The logo is painted with a single continuous linear gradient sweeping **left → right** from spring green to azure blue. Measured values from the source PNGs:

| Stop | Hex | Where it appears |
|---|---|---|
| Gradient start (green) | `#02DF74` | Far-left of the wordmark |
| Icon-tile start | `#02D084` | Top-left of the icon logo |
| Mid teal | `#03B89E` – `#03A5B2` | Center of both marks |
| Icon-tile end | `#0482D8` | Bottom-right of the icon logo |
| Gradient end (blue) | `#0488D2` | Far-right of the wordmark |

**Canonical brand gradient (asset-accurate):** `linear-gradient(90deg, #02DF74 0%, #03B89E 50%, #0488D2 100%)`

### 1.3 UI brand gradient (the working gradient)

The **UI uses a slightly softer companion gradient** that is the established convention across the entire codebase (43+ usages) and must be used for all interface elements:

```
bg-gradient-to-r from-[#2ecc71] to-[#1e90ff]
hover: hover:from-[#27ae60] hover:to-[#1873cc]   (or hover:opacity-90 on small buttons)
```

**Rule of thumb:**

- **Logo artwork colors** (`#02DF74 → #0488D2`) live only inside the logo files. Never rebuild the logo in CSS, never recolor it, never approximate it with the UI gradient.
- **UI gradient** (`#2ecc71 → #1e90ff`) is used for every interface element: primary CTAs, drawer headers, FABs, active nav/filter states, hero accents, gradient underlines and edge bars.
- Always write the raw hex arbitrary values (`from-[#2ecc71] to-[#1e90ff]`) — not the `brand-*` Tailwind aliases and not `from-emerald-500 to-blue-500` (legacy, do not add new usages).

**Tinted brand surfaces** — soften the UI gradient with alpha for backgrounds:

- `from-[#2ecc71]/20 to-[#1e90ff]/20` — empty-state icon discs
- `from-[#2ecc71]/10 to-[#1e90ff]/10` — image/content placeholders

### 1.4 Logo usage rules

**Do:**

- Keep the logo on white, very light slate (`slate-50`), or clean photographic backgrounds; use the white variant on dark/gradient/photo backgrounds.
- Preserve clear space around the mark equal to the height of the "G" counter (roughly 25% of the mark's height) on every side.
- Scale proportionally. Minimum sizes: icon logo 24×24 px; full wordmark 120 px wide.

**Don't:**

- Recolor, re-gradient, outline, shadow, rotate, skew, or add effects to any logo.
- Place the gradient logo on top of the UI brand gradient or on busy mid-tone imagery (use the white variant instead).
- Recreate the wordmark with live text or reconstruct the gradient in CSS.
- Stretch, crop, or separate the Khmer wordmark from "GOEVENT" in the full logo.

---

## 2. Color System

GoEvent is **light-mode only**. Do not introduce dark-mode variants, `dark:` utilities, or theme switching.

### 2.1 Neutrals — `slate` only

`slate` is the **only** neutral scale. `gray-*`, `zinc-*`, `neutral-*`, and `stone-*` are banned (the codebase was fully migrated to `slate` in July 2026 — never reintroduce them).

| Token | Use |
|---|---|
| `text-slate-900` | Headings, primary text |
| `text-slate-700` | Form labels, strong body |
| `text-slate-600` | Body copy, secondary buttons |
| `text-slate-500` | Muted meta text, captions |
| `text-slate-400` | Placeholders, disabled text, inactive icons |
| `border-slate-300` | Input borders |
| `border-slate-200` | Card borders, dividers |
| `bg-slate-50` / `bg-slate-100` | Subtle fills, hover fills, toggles-off |
| `bg-slate-900` | Dark tooltips, dark-solid CTAs |

### 2.2 Interactive accent — `sky`

Focus and form interactivity use **sky**, not the brand gradient:

- Focus rings: `focus:ring-2 focus:ring-sky-200 focus:border-sky-400`
- Toggles on: `bg-sky-500`; form icons: `text-sky-500`
- Focus-visible on rows/buttons: `focus-visible:ring-2 focus-visible:ring-sky-200`

### 2.3 Status colors

| Meaning | Color |
|---|---|
| Success / live / registered | `green-500` / `green-600` |
| Info / upcoming | `#1e90ff` (brand blue) |
| Neutral / past | `slate-600` |
| Destructive / error | `red-500` / `red-600` |
| Warning | `yellow-500` (toasts) / `amber` (chips) |
| Private-event accent | `purple` scale |

### 2.4 Dynamic entity colors

Categories, guest groups, and agenda types carry user/backend-defined hex colors. Apply them with inline styles using hex + alpha suffix concatenation, e.g. `backgroundColor: ${event.category_color || '#3B82F6'}E6`. Indicator dots are `w-3 h-3 rounded-full flex-shrink-0`. Showcase templates drive all their colors from template props (`primaryColor`, `accentColor`, `blurEffectColor`) — never hardcode showcase colors.

---

## 3. Typography

### 3.1 Typefaces

Loaded via Google Fonts in [src/assets/main.css](src/assets/main.css) and set as the default `font-sans`:

- **Figtree** (300–900) — all Latin text
- **Kantumruy Pro** (300–700) — all Khmer body and UI text, applied automatically via unicode fallback
- **Noto Serif Khmer** (500–700) — Khmer *display* text only, i.e. marketing headlines carrying `.type-display` / `.type-display-sm`. Kantumruy Pro is a UI face: at `font-bold` and headline sizes its counters close up and the coeng subscripts mass into a bar. Noto Serif Khmer is drawn for setting, so a Khmer headline reads as a headline instead of as enlarged interface text. Latin is untouched — Figtree still wins for anything in its own unicode range.

Never hardcode fonts in showcase templates — they load their own fonts dynamically via `primaryFont` / `secondaryFont` props.

### 3.1.1 Khmer is not a heavier Latin

Every size, leading and tracking value in this file was chosen against Figtree. Khmer *stacks* — a vowel sign above the consonant, a coeng subscript below it — so the Latin ladder does not merely run tight, it collides. The corrections live in [main.css](src/assets/main.css) keyed off `:lang(km)` (i18n stamps `<html lang="km">`) and are applied **through the utilities this file already prescribes**, so a component keeps saying what it means once and gets the right number in both scripts:

| Utility | Latin | Khmer |
|---|---|---|
| `leading-tight` | 1.25 | 1.35 |
| `leading-snug` | 1.375 | 1.45 |
| `leading-normal` | 1.5 | 1.65 |
| `leading-relaxed` | 1.625 | **1.85** |
| `leading-loose` | 2 | 2.05 |
| `tracking-tight(er)` | −0.025em | `normal` |
| `tracking-wide/wider/widest` | up to 0.1em | 0.01em |

Rules of thumb when writing new UI:

- **Body copy gets `leading-relaxed`.** It is already the prescribed body class (§3.2); it is also the single rule that keeps Khmer paragraphs, list items and descriptions off each other.
- **Never put display leading in a `text-*` utility's shadow.** Tailwind's `text-*` classes ship their own `line-height` and sort *after* every `leading-*`, so `text-3xl leading-[1.2] lg:text-5xl` silently becomes 1.0 from `lg:` up. Use `.type-display` (hero headline) or `.type-display-sm` (section heading) instead — they are emitted after the utilities and win at every breakpoint, and they carry the Khmer face and leading with them.
- **Wrap `bg-clip-text` runs in `.clip-text-safe`.** A gradient is painted only inside the element's own background box; a Khmer coeng hangs outside it and, the text being transparent, simply vanishes.
- **Khmer has no spaces between words.** The reader finds boundaries by cluster shape, so tracking costs more than it costs Latin — never reach for `tracking-*` to fix a Khmer heading.
- **`ch` is the wrong unit for a Khmer measure.** It is the advance of the current font's zero; use `em`.

### 3.2 Scale (mobile-first, never a fixed large size on mobile)

| Role | Classes |
|---|---|
| Page title | `text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900` |
| Section / empty-state title | `text-xl lg:text-2xl font-bold text-slate-900` |
| Card title | `text-lg sm:text-xl font-semibold text-slate-900 line-clamp-2` |
| Panel / drawer header | `text-base font-semibold` |
| Body / description | `text-sm sm:text-base text-slate-600 leading-relaxed` |
| Meta / captions | `text-xs sm:text-sm text-slate-500` |
| Form section heading | `text-xs font-semibold text-slate-500 uppercase tracking-wider` |
| Micro labels (nav) | `text-[10.5px] font-medium` |

Weights: `font-bold` for page/section titles, `font-semibold` for card titles and primary buttons, `font-medium` for labels, badges, and secondary buttons. Long user-generated text always gets `truncate` or `line-clamp-2`.

---

## 4. Shape, Elevation & Surfaces

### 4.1 Radius scale — pick by component size, never invent

| Radius | Components |
|---|---|
| `rounded-lg` (8px) | Inputs, small buttons, badges, icon buttons |
| `rounded-xl` (12px) | Dropdown menus, list rows, large buttons, toasts |
| `rounded-2xl` (16px) | Cards, drawer panels |
| `rounded-3xl` (24px) | Modals, glass section panels, bottom sheets |
| `rounded-full` | Pills, avatars, FABs, toggles, icon discs |

### 4.2 Shadow scale

| Shadow | Components |
|---|---|
| `shadow-sm` | Chips, subtle cards |
| `shadow-md` | Badges, active pills, small CTAs |
| `shadow-lg` | Toasts, FABs (with colored tint, e.g. `shadow-emerald-500/25`) |
| `shadow-xl` | Glass panels, dropdown menus |
| `shadow-2xl` | Drawers, modals |

### 4.3 Glassmorphism — the signature surface

- Panels: `bg-white/80 backdrop-blur-sm border border-white/20`
- Badges/buttons over images: `bg-white/90 backdrop-blur-sm`
- Toggle groups: `rgba(255,255,255,0.6)` + `blur(12px)`
- Overlay backdrops: `bg-black/40` (drawers) or `bg-black/50` (modals) + `backdrop-blur-sm`

---

## 5. Layout & Responsive Rules

### 5.1 Breakpoints

Mobile-first, always. Base classes target phones; scale up with `sm:` (640) → `md:` (768) → `lg:` (1024) → `xl:` / `2xl:` (1536). Custom wide breakpoints `3xl` (1920) and `4xl` (2560) exist for showcase/full-bleed layouts only.

**`lg` (1024px) is the desktop/mobile navigation switch.** Desktop chrome is `hidden lg:flex`; mobile chrome is `lg:hidden`.

### 5.2 Page shell

- Wrap pages in `<MainLayout>`; content: `py-4 sm:py-6 lg:py-8` inside `max-w-4xl lg:max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`.
- Top-level list pages (Events, Discover, Services) paint the page wrapper with the subtle brand tint: `bg-gradient-to-r from-[#2ecc71]/[0.02] via-white to-[#1e90ff]/[0.02]`.
- Vertical rhythm: sibling sections `space-y-5` or `space-y-6 sm:space-y-8`; within a group `space-y-3`; grids `gap-3` (forms) to `gap-6` (card grids).
- Top bar height is `4rem`; fixed sub-navigation sits at `top-16`.
- **Anything fixed to the bottom positions off the shared inset vars, never a hardcoded offset.** The mobile tab bar is a floating pill, so the space it occupies is its own height *plus* the safe-area gap it floats above the edge by — 66px on Android, ~88px on a notched iPhone. `MainLayout` publishes `--nav-inset` (the band the pill occupies, and the pad a scrolling page needs to clear it), `--fab-bottom` (the primary floating action's bottom edge) and `--fab-stack-2` (the slot above it); all three are 0/edge-relative on desktop and on pages rendered without a tab bar. Use `bottom-[var(--fab-bottom)]`, `pb-[var(--nav-inset)]`, `min-h-[calc(100vh-var(--nav-inset))]`.

### 5.3 Cross-device rules

- Touch targets ≥ 40px on mobile (`min-h-[40px]`, `w-10 h-10`); may shrink on desktop.
- Hover-only affordances must have a mobile path (always visible on touch, or an explicit menu).
- Horizontal overflow is handled per container (`overflow-x-auto scrollbar-hide` + gradient edge fades) — the page never scrolls sideways.
- Grids collapse to one column on mobile: `grid-cols-1 sm:grid-cols-2` (forms), `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (card grids).
- No dark mode, no RTL — but every string must work in both English and Khmer (Khmer runs longer; avoid fixed widths on text containers).

### 5.4 Z-index ladder

Sub-nav/sidebars `z-40` → contact FAB `z-[55]` → primary FAB `z-[60]` → mobile tab bar `z-[70]`. Dropdown click-outside overlay `z-[90]`, menu `z-[100]`. Drawer backdrop `z-[998]`, drawer panel `z-[999]`, modal `z-[1000]`. The toast stack tops the ladder at `z-[1100]` — a toast raised from inside a drawer or modal must still be visible. Always match neighboring components.

---

## 6. Components

Full class-by-class recipes live in the [design skill](.claude/skills/goevent-design/SKILL.md). Judgment calls the token scales cannot make for you — whether an element is earned, how many is too many, how much emphasis it deserves — live in the [taste skill](.claude/skills/goevent-taste/SKILL.md); it operates strictly inside the scales below and never overrides them. The binding principles:

- **Buttons**: primary = UI brand gradient + white `font-semibold`; secondary = `bg-slate-100`; ghost = `hover:bg-slate-100`; destructive = `bg-red-600`; empty-state CTAs = dark solid `bg-slate-900`. All buttons declare `disabled:opacity-50 disabled:cursor-not-allowed` and show a spinner + progressive label ("Create" → "Creating…") while loading.
- **Cards**: white `rounded-2xl` with `border-slate-200/60`, lift on hover via border + `shadow-lg` (never scale). Banners are `aspect-[1.9/1]` with a two-stage image fallback ending in a gradient placeholder. Images route through ImageKit with explicit `tr:w-,h-` transforms.
- **Drawers, not modals, for create/edit flows**: full-screen sheet on mobile, floating right panel on desktop, brand-gradient header, sticky footer with gradient submit. Modals are reserved for confirmations and pickers (`rounded-3xl`, centered, destructive confirms use the red icon-disc layout).
- **Multilingual editing**: per-language stacked cards (base language first), never language tabs.
- **Dropdowns**: white `rounded-xl shadow-xl` menus with a transparent click-outside overlay; selected item = brand gradient + white text.
- **Toasts**: one app-wide stack only — `useToast()` feeding `ToastHost` (mounted once in `App.vue`); never render toast markup in a feature component. Compact glass rows with a small colored icon disc and no progress bar, anchored bottom-right on desktop (in the lane beside the FAB column, never over it) and top-center on mobile, capped at three on desktop and **one** below `lg`, auto-dismissing with hover-pause, duplicate coalescing, and swipe-to-dismiss away from the anchored edge. **A toast is the last resort, not the default.** If the result is already on screen (a row appears, a price redraws), say nothing; if the control can answer, flip it to a tick and a past-tense word via `useActionConfirmation` (`Copy → Copied`, `Activate now → Template activated`); only toast what happens away from what the user pressed. Never both. Failures are the exception — they always toast or use an inline banner, because a control returning to idle cannot say why.
- **Every page ships four states**: loading skeleton (mirrors the real layout with `animate-pulse` slate blocks), populated content, empty state (gradient-tinted icon disc + title + description + optional CTA), and error (red icon disc + friendly message + retry). Auth-gated pages add an unauthenticated state.
- **Icons**: `lucide-vue-next` only — `w-4 h-4` inline/buttons, `w-5 h-5` nav/toasts, `w-6 h-6` FABs; larger only inside icon discs.

---

## 7. Motion Language

- Micro-interactions: `transition-colors duration-200`; composite hovers `transition-all duration-300`; image zooms `duration-500`.
- Scale on hover only for FABs and primary CTAs (`hover:scale-110`); cards lift via border + shadow. Mobile press feedback: `active:scale-95`.
- Named Vue transitions in use: `fade` (backdrops), `slide-right` (drawers), `slide-fade` (conditional fields), `modal` (dialogs), `slide-up` (mobile sheet panels, in-drawer inline messages), `dropdown` (menus), `toast` (the toast TransitionGroup), `sheet` (bottom sheets), `collapse` (expand/collapse sections).
- Drawer/sheet enter: `cubic-bezier(0.32, 0.72, 0, 1)` (spring-like); leave: `cubic-bezier(0.4, 0, 0.6, 1)`.
- **Expand/collapse sections** (accordion rows, collapsible overview cards, "more details" reveals) use the `collapse` transition built on `grid-template-rows: 0fr ↔ 1fr` — never animate `max-height` (a large max-height cap makes one direction ease unevenly with dead time). Structure: the transitioned element is `grid grid-rows-[1fr]`, wrapping a `min-h-0 overflow-hidden` clip div, wrapping the content (put the content's own padding/margins on this innermost layer so they collapse too). Timing: `grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1)` + `opacity 0.3s ease`; disable under `prefers-reduced-motion`. Reference implementation: `ExpenseSummaryView.vue` / `ExpenseBudgetsView.vue`.
- Prefer transform + opacity (compositor-friendly); add `will-change` only on elements that actually animate.
- The showcase cover → main-content transition is the app's cinematic signature — see §16 of the design skill for the full choreography (veil reveal, Ken Burns, light sweep, letter bloom, bokeh). **All showcase-grade animation must honor `@media (prefers-reduced-motion: reduce)`**: kill drifts/sweeps/particles, shorten fades, zero out stagger delays.

---

## 8. Accessibility & Internationalization

- Semantic HTML: everything clickable is a real `<button>` or `<a>`; interactive cards get `role` + `aria-label`; toggles get `role="switch"` + `aria-checked`; every icon-only button gets `title` or `aria-label`; decorative layers get `aria-hidden="true"`.
- Keyboard: Escape closes overlays; focus is always visible via the sky ring pattern; tab order follows the visual order.
- All user-facing strings go through i18n `t(...)` (via `useAppLanguage`) with keys added to **both** `en` and `kh` locale files. Never hardcode display strings.
- Sanitize any user-generated HTML with the DOMPurify utilities ([src/utils/sanitize.ts](src/utils/sanitize.ts)) before `v-html`.
- Maintain WCAG AA contrast: body text is `slate-600`+ on white; never place `slate-400` text on tinted fills; white text on the brand gradient is reserved for `font-medium`+ at `text-sm`+.

---

## 9. Definition of Done — design checklist

Every new page or component must pass all of these before merge:

1. ☐ Four states exist (loading skeleton, content, empty, error) and match §6.
2. ☐ All strings i18n'd in `en` **and** `kh`.
3. ☐ Neutrals are `slate-*` only; CTAs use the raw-hex brand gradient (§1.3).
4. ☐ Radius and shadow chosen from §4's scales; overlays follow §5.4's z-index ladder.
5. ☐ Verified at 375px, 768px, 1024px, and 1536px — no horizontal page scroll, touch targets ≥ 40px, fixed bottom elements clear the mobile tab bar.
6. ☐ Transitions come from §7's named set; large animations respect `prefers-reduced-motion`.
7. ☐ Icon-only buttons labeled; switches have ARIA roles; focus visible; user HTML sanitized.
8. ☐ Logos used per §1.4 — no recolored, rebuilt, or squeezed marks.

---

## 10. Governance

- **Changing the standard**: propose changes as a PR that edits this file *and* the design skill together, with before/after screenshots. A convention change is only real once both documents and the reference components agree.
- **Reference components** (copy these, don't invent): [EventCard.vue](src/components/EventCard.vue), [EventCreateDrawer.vue](src/components/EventCreateDrawer.vue), [DeleteConfirmModal.vue](src/components/DeleteConfirmModal.vue), [EventTextTab.vue](src/components/EventTextTab.vue), [ToastHost.vue](src/components/ToastHost.vue).
- **Deviation is a bug.** If a design need genuinely isn't covered here, extend the closest existing pattern, then document it — never ship a one-off style.
