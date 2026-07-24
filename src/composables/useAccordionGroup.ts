import { provide, inject, ref, type InjectionKey, type Ref } from 'vue'

export interface AccordionGroup {
  activeId: Ref<string | null>
}

export const ACCORDION_GROUP_KEY: InjectionKey<AccordionGroup> = Symbol('accordion-group')

/**
 * Call once in an ancestor component to coordinate every descendant
 * `useCollapsibleSection(id)` call into a single-open accordion — expanding
 * one section collapses whichever other was open. Descendants that call
 * `useCollapsibleSection()` with no id, or aren't under a provided group,
 * keep their own independent collapse state.
 */
export function provideAccordionGroup() {
  const activeId = ref<string | null>(null)
  provide(ACCORDION_GROUP_KEY, { activeId })
  return { activeId }
}

export function useAccordionGroup(): AccordionGroup | null {
  return inject(ACCORDION_GROUP_KEY, null)
}
