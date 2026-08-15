import { computed, onBeforeUnmount, ref } from 'vue'

/**
 * useExclusiveMenu
 *
 * One open menu at a time, app-wide. Every caller shares a single module-level
 * slot holding the id of whichever popover is open, so opening one closes the
 * rest by reactivity alone — no cross-component wiring, no ordering assumptions.
 *
 * Written for the top bar, where the notification bell owns its own component
 * while the profile and language menus live in TopNavBar. Each trigger stops
 * propagation (otherwise its own click-outside listener would close it again on
 * the same click), which also means no menu's listener ever sees another menu's
 * trigger click — so "open the bell, the profile menu closes" cannot come from
 * click-outside handling. It has to be shared state.
 *
 * Usage:
 *   const { isOpen, open, close, toggle } = useExclusiveMenu()
 */

// null = nothing open. Module scope: shared across all component instances.
const activeMenuId = ref<string | null>(null)

let nextMenuId = 0

export function useExclusiveMenu() {
  const id = `menu-${nextMenuId++}`

  const isOpen = computed(() => activeMenuId.value === id)

  const open = () => {
    activeMenuId.value = id
  }

  const close = () => {
    // Only give up the slot if we still hold it — never close someone else's menu
    if (activeMenuId.value === id) {
      activeMenuId.value = null
    }
  }

  const toggle = () => {
    activeMenuId.value = isOpen.value ? null : id
  }

  // A menu torn down while open must not keep the slot locked
  onBeforeUnmount(close)

  return { isOpen, open, close, toggle }
}
