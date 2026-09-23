import { computed, type WritableComputedRef } from 'vue'

/**
 * Bridges one typed enum field to the plain `string` `v-model` that the choice
 * and select primitives expose.
 *
 * TemplateFormChoice and TemplateFormSelect deal in `string` because their
 * option lists do; the form state deals in unions. Every picker therefore needed
 * a five-line writable computed whose only work was a cast, and there were
 * thirty-five of them — with the cast target written out by hand each time, so
 * a field whose union changed kept compiling against the stale one.
 *
 * `owner` is a getter, not the object itself, and that is the point: hydrating a
 * template replaces whole branches of the form state (`cover_stage_layout` and
 * everything under it), so a model that had captured the nested object at setup
 * would go on writing into a detached copy. Re-reading the parent on every
 * access is what makes `enumModel(() => form.cover_stage_layout.coverDetails,
 * 'separator')` safe.
 *
 * The cast is still unchecked — `T[K]` is derived from the field rather than
 * restated, which is strictly better than what it replaces, but a value that is
 * not a member of the union will still be written if a caller supplies one.
 * Option lists are the guard, as they were before. Where a setter has to do more
 * than assign (validate, or update a sibling field), write the computed out.
 */
export function enumModel<T extends object, K extends keyof T>(
  owner: () => T,
  key: K,
): WritableComputedRef<string> {
  return computed<string>({
    get: () => owner()[key] as string,
    set: (value) => {
      owner()[key] = value as T[K]
    },
  })
}
