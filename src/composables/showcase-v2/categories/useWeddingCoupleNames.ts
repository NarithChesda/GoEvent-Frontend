import type { Host } from '../../useEventShowcase'

/** Wedding hosts are typically the couple — joins the first two names. */
export function getWeddingCoupleNames(hosts: Host[]): string | undefined {
  const names = hosts
    .slice(0, 2)
    .map((h) => h.name)
    .filter(Boolean)
  return names.length ? names.join(' & ') : undefined
}
