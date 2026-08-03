import type { InjectionKey, Ref } from 'vue'

/**
 * The templates modal's desktop header row, offered to the panes rendered
 * inside it.
 *
 * The modal, the "Mine" panel and the template editor each own a strip of
 * controls, and each used to render its own full-width bar — so the Mine tab
 * spent one row on "Templates + Browse/Mine" and a second on two status chips
 * and a button, while the editor spent a third on its title and save actions.
 * Three rows of chrome, all of them mostly empty space.
 *
 * Rather than hoisting each pane's state up into the modal (status counts, form
 * dirtiness, save handlers) just to render it one level higher, the panes keep
 * their controls and `<Teleport>` them into this element. Ownership stays where
 * the state is; only the rendering location moves.
 *
 * The ref is null until the modal's header mounts, so consumers must guard on
 * it — `<Teleport v-if="headerSlot" :to="headerSlot">`. It is also only useful
 * from `lg` up: the target lives in a `hidden lg:flex` row, so below that
 * breakpoint the panes render their controls in place instead (see the
 * `useMediaQuery` guard at each call site). Vertical space is cheap on a phone;
 * horizontal space is not.
 */
export const TEMPLATES_HEADER_SLOT: InjectionKey<Ref<HTMLElement | null>> =
  Symbol('templatesHeaderSlot')
