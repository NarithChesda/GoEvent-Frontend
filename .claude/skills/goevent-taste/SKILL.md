---
name: goevent-taste
description: Design judgment for GoEvent UI — whether an element is earned, how many is too many, and how much emphasis it deserves. Use alongside goevent-design when building or reviewing any UI in this repo, and especially when a screen is technically on-spec but feels flat, busy, generic, or repetitive. Covers hierarchy without color, gradient economy, when a card is justified, label and eyebrow restraint, CTA discipline, motion restraint, and density in English and Khmer.
---

# GoEvent Taste

Craft judgment for a design system that is **already committed**. This is not a second opinion on the brand.

## 0. Where this sits

Three documents, three different jobs. Read them in this order:

| Source | Answers | Example |
|---|---|---|
| [DESIGN.md](DESIGN.md) | **Which token?** | "Cards are `rounded-2xl`." |
| [goevent-design](.claude/skills/goevent-design/SKILL.md) | **Which classes?** | "`bg-white rounded-2xl border-slate-200/60`…" |
| **This skill** | **Whether, how many, how much?** | "Should this be a card at all?" |

DESIGN.md is binding and wins every conflict. This skill never proposes a new color, font, radius, or shadow — every rule here operates strictly inside the existing scales. If a rule here seems to require a new token, the rule is wrong.

**This is not a direction-setting skill.** Do not use it to pick a palette or an aesthetic. For a genuinely new visual world — a new showcase V2 category variant that needs its own palette and type pairing — use `frontend-design` instead, then write the result into the variant's `*.data.ts`.

---

## 1. The central constraint: hierarchy without color

GoEvent is light-mode only, `slate`-only for neutrals, with **one** saturated element in the entire system — the brand gradient. Status colors are semantic and cannot be borrowed for emphasis: turning a heading green makes it mean *success*.

So the usual lever for "make this more important" — give it a color — **is not available.** Hierarchy has to be built from the four levers that are:

1. **Type scale + weight** — `text-lg font-semibold` against `text-sm text-slate-600` is a full step of hierarchy and costs nothing.
2. **Slate value** — `900 → 700 → 600 → 500 → 400` is a five-stop ladder. Most flat screens are flat because they use two stops where they could use four.
3. **Space** — the gap above a heading is what makes it read as a heading. Grouping is hierarchy.
4. **Border and surface** — `border-slate-200` divides; `bg-slate-50` groups; elevation separates a layer.

**When a screen feels flat, the fix is almost always levers 1–3, not adding color or a card.** Reach for the gradient only after those are exhausted, and expect that to be rare.

---

## 2. Gradient economy

The brand gradient appears **278 times** in `src/`. It is the loudest thing in the system and its power is entirely relative — the tenth gradient on a screen is wallpaper.

**One gradient object per viewport.** Count what a user actually sees at once. If a gradient header, a gradient CTA, and a gradient active pill are simultaneously visible, two of them are decoration.

Priority when they compete — the gradient goes to whichever is highest on this list, and the others fall back:

1. The primary action (the one thing this screen is for)
2. The active state in a navigation or filter set
3. A drawer or panel header that establishes context
4. Everything else → `bg-slate-900` (dark solid), `bg-slate-100` (secondary), or `text-slate-600` (ghost)

**Gradient text** (`bg-clip-text`, 16 uses) is the weakest use — it spends the brand's loudest asset to decorate a word. It is earned on a marketing headline where the brand *is* the subject ([HomeView.vue](src/views/HomeView.vue), [AboutView.vue](src/views/AboutView.vue)). It is not earned on a metric, a count, a section heading, or anything inside the app shell.

Tinted brand surfaces (`/10`, `/20`) don't count against the budget — they read as texture, not as an object.

---

## 3. A card must earn its elevation

`goevent-design` §7 tells you how to build a card. It cannot tell you whether you need one, and the default answer is **no**.

A card is justified when its contents are **a separable unit** — independently actionable, navigable, or reorderable. An event, a guest, a listing, a budget: real objects.

A card is **not** justified merely to visually group fields. Cheaper groupings, in order of preference:

- Space (`space-y-6` between groups) — costs nothing, adds no chrome
- A `border-t border-slate-200` rule
- `divide-y divide-slate-200` on a list
- `bg-slate-50` fill for a genuinely subordinate region

**Card-in-card is the failure mode to watch.** A `rounded-2xl` card inside another `rounded-2xl` card means the inner one has stopped signalling "separable object" — nothing is separable from its own parent. Flatten the inner one to a `border-t` group or a `bg-slate-50` region. If you find three levels, the middle one is always the one to delete.

**Elevation must be monotonic with importance.** A `shadow-lg` element nested inside a `shadow-sm` element inverts the depth model and reads as a rendering bug even when nobody can name why.

---

## 4. Label restraint

The uppercase eyebrow (`text-xs font-semibold text-slate-500 uppercase tracking-wider`) is a sanctioned DESIGN.md token for form section headings — which is exactly why it needs a discipline rule. It appears **188 times across 65 files**. [PartnerTemplateForm.vue](src/components/template/PartnerTemplateForm.vue) held 23 of them and now holds 12: the eleven that went were the ones sitting directly on top of a control that already said the same thing — "Cover gilding" over a switch reading *Enable gilding* — or heading a card that contained exactly one field, where the eyebrow was doing a field label's job in a heading's clothes. The twelve that stayed each name a group of three or more slots a partner scrolls between. That ratio is the rule in practice: an eyebrow survives when it names something the control beneath it cannot.

A sanctioned token is not a free one. Every eyebrow costs vertical space and adds a beat to the page's rhythm; when every group has one, they stop separating anything and become texture.

**An eyebrow is earned when the user needs to navigate to that group** — a long form they will scroll, return to, or scan for one field. It is not earned when:

- The group has fewer than ~3 fields
- The whole form is short enough to take in at once (a 4-field drawer needs zero)
- The label restates the only field beneath it ("Email address" over an email input)
- The neighbouring groups are already separated by space or a divider

**Mechanical check:** count `uppercase tracking` in a component against the number of groups a user genuinely scrolls between. In a single-screen form, the target is zero. Prefer deleting the label over shrinking it — an unlabeled group separated by space reads as calmer, not as unfinished.

**Never placeholder-as-label.** A placeholder disappears on focus, exactly when the user needs it. Labels go above the input, helper text below, error text below that. This is non-negotiable and applies to all 264 inputs in the repo.

---

## 5. CTA discipline

- **One primary action per screen.** Two gradient buttons of equal weight means the screen has not decided what it is for. Demote one to `bg-slate-100` or ghost.
- **One label per intent, everywhere.** If the nav says "Create event", the empty state must not say "Add event" and the FAB "New event". Pick one verb per intent and repeat it in every surface, including toasts. The button that says "Publish" produces a toast that says "Published."
- **Primary CTA labels: 1–3 words, and they must not wrap at any breakpoint.** A wrapped CTA at 375px is broken, not tight. Khmer is the real test here (see §8) — check it there, not in English.
- **The button says what happens, not how the system works.** "Save changes", not "Submit". "Send invitations", not "Process guests".
- **Progressive labels during work** ("Create" → "Creating…") are required by DESIGN.md §6 — they are also the cheapest perceived-performance win available, so never skip them on a slow action.

---

## 6. Motion restraint

Motion rules live in DESIGN.md §7 and `goevent-design` §15. The taste layer is **how much**, and the answer is less than it feels like while building.

- **Animate what the user caused.** Motion on a hover, a press, an open, a state change earns attention because it is feedback. Ambient motion with no cause spends attention and returns nothing. The showcase is the deliberate exception — it is a performance, and cinematic motion is the point there.
- **`transition-all` is a smell, not a ban.** It appears **710 times**, and most are harmless: on a hover that changes only `border-color` and `box-shadow`, `all` and an explicit list cost the same. It becomes a real bug when the element's *layout* properties can change — width, height, padding, margin, `top`/`left` — because then a data update animates a reflow and the frame drops. **Rule: if the element's size or position can change for any reason other than the hover, name the properties.**
- **Never transition `height`, `width`, `margin`, `top`, or `left`.** For expand/collapse use the `collapse` transition (`grid-template-rows: 0fr ↔ 1fr`) per DESIGN.md §7; for movement use `transform`. There are 9 remaining violations in `src/` — [AgendaTab.vue](src/components/AgendaTab.vue), [RsvpAnalytics.vue](src/components/invitation/RsvpAnalytics.vue) and others.
- **No bounce or elastic easing.** Real objects decelerate; they do not overshoot and settle. Bounce reads as dated. Use the established `cubic-bezier(0.32, 0.72, 0, 1)` for entrances.
- **`ease-in` on anything the user is waiting for is wrong.** It delays the start, which reads as lag. Entrances and feedback are `ease-out`; only exits may `ease-in`.
- **Nothing appears from `scale(0)` or vanishes to nothing.** Enter from `scale(0.95)` + `opacity: 0`. Nothing in the real world appears from a point.
- **Scale is reserved.** `hover:scale-*` belongs to FABs and primary CTAs only; cards lift via border and shadow. This is respected in the codebase today — keep it that way.

---

## 7. Repetition is the generic tell

A management tab with six identical `rounded-2xl` white cards stacked vertically is technically on-spec and reads as unconsidered. The system's uniformity is a floor, not a target.

- **A layout family appears once per page.** If the overview uses a 3-up stat row, the section below it should not also be a 3-up row of the same shape.
- **Vary by information, not decoration.** A list that is genuinely a list should be `divide-y` rows, not cards. A comparison should be a table. A single number should be large type on the page, not a card containing a number.
- **Long tabs need a rhythm break** — a full-width element, a divider, or a change of density every few sections, so scrolling doesn't feel like one texture.

---

## 8. Density, and Khmer as the real constraint

Khmer text runs meaningfully longer than English and has taller glyphs. **Any density decision that has only been checked in English has not been checked.**

- Never fix the width or height of a container whose text is translated. `truncate` and `line-clamp-2` are the sanctioned escapes.
- Test the tightest components — nav labels, tabs, badges, primary CTAs — in `kh` before considering them done.
- Khmer needs slightly more leading. Where a line-height looks tight in Khmer, fix it with `leading-relaxed`, not by shrinking the type below the scale.
- Denser is usually better for **management** surfaces (users scan, compare, repeat); airier is better for **showcase** and marketing surfaces (users receive). Do not carry management density into a showcase, or showcase airiness into a table.

---

## 9. Pre-flight

Run before calling UI work done. This complements — does not replace — the DESIGN.md §9 checklist.

1. ☐ Gradient objects visible at once: **1**. Gradient text only on a marketing headline.
2. ☐ Every card is a separable object. No card directly inside a card. Elevation increases with importance.
3. ☐ Eyebrow count ≤ the number of groups the user actually scrolls between; zero in single-screen forms.
4. ☐ Every input has a real label above it. No placeholder-as-label.
5. ☐ One primary action; one label per intent across nav, empty state, FAB, and toast.
6. ☐ Primary CTA labels do not wrap at 375px **in Khmer**.
7. ☐ No transitioned `height`/`width`/`margin`/`top`/`left`. `transition-all` only where layout cannot change.
8. ☐ No bounce easing; no `ease-in` on entrances; nothing enters from `scale(0)`.
9. ☐ No two adjacent sections share a layout family.
10. ☐ Flatness was fixed with type, slate value, and space — not by adding color or chrome.

Then run the tooling, which catches different classes of problem than this checklist does:

```bash
npx impeccable detect src/path/to/changed   # aesthetic anti-patterns
```

and invoke `web-design-guidelines` for the accessibility and focus-state pass.
