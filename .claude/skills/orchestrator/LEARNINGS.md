# Orchestrator learnings

Rules distilled from human reviews. **Every sub-agent reads this file before it starts, and a rule here overrides the agent's own defaults.** Reviewers treat breaking one as a **major** finding.

How the file grows: when the human's final review contains a note that is a rule for *next time*, not just a fix for this feature, the planner proposes it as a `learning`. The orchestrator keeps only the ones that generalise. `orch.mjs plan --append` then writes them here. Edit by hand when a rule turns out wrong: delete it, don't add a contradicting one.

Each entry: the rule as a heading, then **Why** (in the human's terms), **Applies to**, and **From**.

---

## Seeded from earlier human reviews (before this pipeline existed)

### List filters are the guest-group dropdown, never a chip row or segmented pills

- **Why:** a chip row with ten or more entries scrolls off-screen and hides the selected state. The human rejected it on sight: "why are we doing this instead of a simplified dropdown menu just like the guest group filter?"
- **Applies to:** any list filter.
  - The trigger is `bg-slate-50 hover:bg-slate-100 rounded-xl`, then a `w-[280px]` dropdown.
  - On phones, an icon-only trigger opens `src/components/common/MobileBottomSheet.vue`, gated with `useMediaQuery('(min-width: 640px)')`.
  - The reference implementation is `GuestGroupsView.vue`.
- **From:** expense-tab redesign, July 2026.

### No generic summary card over a generic table

- **Why:** "it doesn't feel like a real app". A stats card floating above a list reads as an admin-dashboard template.
- **Applies to:** any "totals + breakdown" screen.
  - Either the summary is the first cell of the same sheet as the rows, or it is several tiles that each state a *different* fact.
  - Put progress in each row, not only in the summary.
  - Meter tracks are neutral `slate-100`, never tinted with the entity's own colour.
- **From:** expense-tab redesign, September 2026.

### A modal's form can be reused as-is inside a ~280px dropdown

- **Why:** the human confirmed an inline group form extracted from a drawer reads cleanly at that width. Don't invent a wider surface for inline create/edit.
- **Applies to:** inline create/edit inside dropdowns and popovers. Extract the existing markup into a small component instead of redesigning the fields.
- **From:** guest-management inline redesign.

### A mobile grid always names its track: `grid grid-cols-1 … lg:grid-cols-2`

- **Why:** without `grid-cols-1`, the item lands in an implicit `auto` track whose floor is the item's min-content width. On a 390px phone the whole page scrolled sideways, and `min-w-0` inside the card can't fix it.
- **Applies to:** every responsive grid. The UI reviewer checks the Pixel 7 shots for horizontal overflow.
- **From:** a list page that scrolled sideways on phones, 2026.

### `mx-auto max-w-*` inside a flex column needs `w-full`

- **Why:** cross-axis auto margins beat `align-items: stretch`. The item shrink-wraps to its content, so sections with identical classes render at different widths and their left edges don't line up.
- **Applies to:** page sections inside `flex flex-col` wrappers.
- **From:** the marketing pages (`/home`, `/about`), 2026.

### Never begin a scoped selector with `:global()`

- **Why:** in `<style scoped>`, `:global(.a) .b` compiles to bare `.a`. The rule silently lands on the ancestor. It once hid the whole preview stage.
- **Applies to:** Vue SFC styles. Reach into a child from the component that owns the ancestor class, with `.a :deep(.b)`. Verify by grepping the built CSS.
- **From:** showcase live preview editor.

### Ratio-critical images sized off one axis need `max-w-none`

- **Why:** Tailwind's preflight `img { max-width: 100% }` survives `w-auto h-full`. On tall phones it squashed the showcase's side artwork by 18–20%.
- **Applies to:** any `<img>` whose aspect ratio matters and that is sized by height alone.
- **From:** showcase decorations, August 2026.

### A literal `@` in a locale string is written `{'@'}`

- **Why:** vue-i18n reads a bare `@` as its linked-message sigil. It throws only when that string is first *rendered*, so it passes build, type-check and lint, then breaks inside an unopened accordion or drawer.
- **Applies to:** every string in `src/i18n/locales/en` and `kh`. E2E tests should open what they add, and fail on console errors.
- **From:** landing FAQ.

### Nothing in this pipeline commits or pushes

- **Why:** the human approves each commit explicitly. Finishing the work is not approval, and neither is an earlier "yes" given for a different change.
- **Applies to:** every role. The run ends with the working tree changed and uncommitted; the human decides what to do with it.
- **From:** standing instruction.
