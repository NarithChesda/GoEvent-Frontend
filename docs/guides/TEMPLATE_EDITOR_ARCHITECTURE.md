# Template editor architecture

The standard the partner template editor is built to, and the one any comparable
editor in this repo should follow. Read this before adding a design option, a
display option, or a new config block — the whole point of the shape below is
that those additions cost a module and three lines instead of a refactor.

Applies to [src/components/template/](../../src/components/template/). The same
shape is the right answer for any editor that has many settings, a live preview,
and a save payload that must agree with both.

## Why this exists

The editor was one 5,583-line SFC. Adding one dropdown meant ten coordinated
edits across it — the state type, the defaults, the hydration, a payload
builder, the save call, the preview draft, an option list, a `v-model` bridge,
and the markup — with nothing checking that those lists still named the same
fields. The same pattern one layer down had already cost three silently
dropped uploads — see the comment on `TEMPLATE_FILE_FIELDS` in
[templates.service.ts](../../src/services/api/modules/templates.service.ts),
where two hand-maintained copies of a field list disagreed. And nothing here
could be tested without mounting the whole component, so nothing was.

## The shape

```
src/components/template/
  PartnerTemplateForm.vue      965  the shell: rail, save path, preview draft
  templateEditorContext.ts      52  the shared editor state, provided once
  formModels.ts                 36  enumModel — the string↔enum v-model bridge
  config/                          one module per config block
    index.ts                   210  FormState, defaultForm, hydrateForm, buildConfigPayload
    basics.ts, hostInfoDesign.ts, sectionDesigns.ts, stageModes.ts,
    textEffects.ts, eventDetailsDesign.ts, fallingEffect.ts,
    ambientCreatures.ts, sparkField.ts, coverLayout.ts, assets.ts
    roundTrip.spec.ts          253  save/reload contract, no component mount
  sections/                        one panel per rail entry
    BasicsSection.vue          233
    TransitionSection.vue      142
    EffectsSection.vue         453
    ContentSection.vue         551
    BrandSection.vue           595
    CoverSection.vue           717
  useTemplateAssets.ts         205  pending picks, staged removals, thumbnails
  useTemplateBrand.ts          798  colours + fonts (child records, own endpoints)
  useCoverEditor.ts            758  cover blocks, text styles, placement
  useTemplatePlans.ts           83  the pricing shelf
```

### Four layers, four rules

**1. `config/` owns the data.** Each module exports exactly three things for one
config block: `defaultX()`, `hydrateX(template)`, `buildXPayload(state)`. Those
three are the round trip, and they sit together so they cannot disagree.
[config/index.ts](../../src/components/template/config/index.ts) composes them
into `FormState`, `defaultForm`, `hydrateForm` and `buildConfigPayload`.

A module never imports Vue, never reads `props`, and never touches the DOM. That
is what makes the round trip testable without mounting anything.

**2. `sections/` owns the markup.** One panel per rail entry. A panel builds its
own option lists and `v-model` bridges locally — they are presentation, they
belong with the markup that uses them, and keeping them there is what stops the
shell growing again.

**3. Composables own logic that outlives one panel.** `useTemplateBrand` exists
because the save path and the live preview both read colours and fonts.
`useCoverEditor` exists because the preview frame is the primary block-placement
editor and shares three values with the Cover panel. `useTemplateAssets` exists
because five of the six panels pick files. **If only one panel needs it, it
goes in that panel.**

**4. `PartnerTemplateForm.vue` owns nothing but wiring.** Props, the form object,
the four composables, the rail, `handleSave`, `previewDraft`. If you find
yourself adding a design option to this file, you are in the wrong file.

## How to add a new design option

The common case: a new `{ type }` config that picks a composition, like
`agenda_design`. Four edits; the first two are adjacent.

1. **Extend a config module** — or add one. For a new member of an existing
   family, `sectionDesigns.ts` already holds the four `{ type }` configs; add
   the union member in
   [template.types.ts](../../src/services/api/types/template.types.ts) and the
   default/hydrate/build lines. For a genuinely new block, copy
   [stageModes.ts](../../src/components/template/config/stageModes.ts) — it is
   the smallest complete example.

2. **Register it in `config/index.ts`** — the `FormState` intersection,
   `defaultForm`, `hydrateForm`, and `buildConfigPayload`. They are within thirty
   lines of each other on purpose.

3. **Add the field to the service list** — `TEMPLATE_JSON_CONFIG_FIELDS` in
   [templates.service.ts](../../src/services/api/modules/templates.service.ts).
   One array, read by both `createTemplate` and `updateTemplate`.

4. **Draw it in one section panel** — an option list, an `enumModel`, and the
   markup. Nothing else.

The live preview needs no work: it shares `buildConfigPayload` with the save
path. Add a case to
[roundTrip.spec.ts](../../src/components/template/config/roundTrip.spec.ts) if
the value is stored as something other than itself (see below).

## Invariants — do not break these

**One builder, two call sites.** `handleSave` and `previewDraft` both spread
`buildConfigPayload(form)`. Never write a config inline at either. Three configs
used to be inline literals duplicated across both; the preview was then a second
opinion on the save rather than a promise about it.

**`hydrateForm` is total.** Every module returns a complete slice, so opening a
template overwrites the whole state. Never go back to "assign defaults, then
override some" — that is how a value survives from the previously opened
template through a field somebody forgot to reset.

**Absent, null and a value are three different answers.** On the wire an absent
config means "do not touch this" and `null` means "switch this off". Several
fields depend on the distinction and must never be backfilled:

- `save_the_date_design: null` keeps each transition stage's own default
- `stage_modes.transition` absent means *infer*; `'none'` means *no middle beat*
- `sparks` must send `{ enabled: false }`, never `null` — null falls back to the
  legacy `coverGilding` spark fields and turns them back on
- `text_effects: null` when no slot carries a finish

Each is covered by a test in `roundTrip.spec.ts`. Add one when you add another.

**Panels write into the shared form directly.** `form` reaches them through
[templateEditorContext.ts](../../src/components/template/templateEditorContext.ts),
not as a prop. It is one shared document, not a value the shell lends out; as a
prop every assignment would trip `vue/no-mutating-props`, and the alternative is
an event per field — there are fifty-seven. Use `useTemplateEditor()`.

**Derived lists, never hand-written twice.** `TEMPLATE_JSON_CONFIG_FIELDS`,
`TEMPLATE_FILE_FIELDS`, `PREVIEWED_ASSET_FIELDS`, `TEMPLATE_FORM_ASSET_FIELDS`
each exist because the same list was previously written out in two or three
places and drifted. If you need a list of fields in more than one function,
declare it once.

**Use the asset helpers.** `configImageSrc` / `stagedImageSrc` in
[useTemplateAssets.ts](../../src/components/template/useTemplateAssets.ts)
implement the pending → saved → staged-for-removal precedence. Do not re-derive
it in a panel.

## Traps that type-check and lint will not catch

These cost real time during the refactor. All three are invisible to
`npm run type-check` and `npx eslint`.

**An unresolved component only warns at runtime.** Move markup between files and
forget an icon import, and Vue logs `[Vue warn]: Failed to resolve component: X`
while rendering nothing. Nothing fails the build. After moving markup, run the
component tests and grep the output:

```bash
npx vitest run src/components/template/ 2>&1 | grep -i "\[Vue warn\]"
```

**A ref nested in a prop object is not unwrapped in templates.** `<script setup>`
unwraps *top-level* refs. Passing a composable's return as a prop and writing
`props.brand.colors.length` in markup silently reads a `Ref` object. Destructure
it once in setup instead — `const { colors } = props.brand` — which is safe here
because the shell creates each composable once and never replaces it.

**A `vi.mock` factory is hoisted above the file.** Referencing a fixture eagerly
inside it throws `Cannot access 'template' before initialization`. Reference it
only inside the mocked function's body.

## Testing

Two layers, both cheap:

- **[config/roundTrip.spec.ts](../../src/components/template/config/roundTrip.spec.ts)**
  — default → hydrate → serialize → hydrate, asserted through
  `buildConfigPayload` so it checks what a second save would send rather than a
  hand-maintained field list. Twelve tests, ~9ms, no component mount. **This is
  where a new config's behaviour belongs.**
- **[PartnerTemplateForm.sections.spec.ts](../../src/components/template/PartnerTemplateForm.sections.spec.ts)**
  — walks every rail section, asserts each panel mounts and only that one, and
  proves a click inside a panel reaches the preview draft. This is what catches a
  panel that throws on mount.

Before committing a change here:

```bash
npm run type-check        # diff against a stashed baseline — ~36 errors pre-exist
npx eslint src/components/template/
npx vitest run src/components/template/   # and grep for [Vue warn]
npm run build-skip-typecheck
```

## What not to do

- **Do not add a design option to `PartnerTemplateForm.vue`.** It is the shell.
- **Do not add per-section font-size fields** — see the font-normalization note
  in [CLAUDE.md](../../CLAUDE.md); the fix is `size-adjust` at the font, not a
  number per section.
- **Do not flatten a new config into loose top-level fields** unless the form
  genuinely edits them separately. `host_info_design` is eight flat fields
  because the panel edits them one at a time; that is the exception, and it is
  why it has a module to itself.
- **Do not reintroduce a `computed<string>({ get, set })` per picker.** Use
  `enumModel(() => owner, 'key')` from
  [formModels.ts](../../src/components/template/formModels.ts). It takes a
  getter, not the object, because hydration replaces whole branches of the form
  state and a captured child would be written into after it was detached.
