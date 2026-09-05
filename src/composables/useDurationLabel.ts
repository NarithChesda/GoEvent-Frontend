import { computed, type ComputedRef } from 'vue'
import { useAppLanguage } from './useAppLanguage'

/**
 * "Lasts 2 hours" for a start/end pair.
 *
 * Two absolute timestamps do not answer "is this two hours or two days?"
 * without the reader doing the subtraction, and getting that wrong is the
 * mistake a pair of date fields actually invites. It goes in the slot the
 * end-before-start error would otherwise occupy, so the pair never grows a
 * second line and nothing below it moves.
 *
 * Shared by the create and edit drawers rather than copied into both: the
 * strings live under `common.duration`, so the same event cannot be described
 * as lasting different things depending on which drawer opened it.
 *
 * Returns `''` for an incomplete or inverted range — the caller is already
 * showing a validation error in that case.
 */
export function useDurationLabel(
  start: () => string,
  end: () => string,
): ComputedRef<string> {
  const { t } = useAppLanguage()

  return computed(() => {
    const from = start()
    const to = end()
    if (!from || !to) return ''

    const minutes = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000)
    if (!Number.isFinite(minutes) || minutes <= 0) return ''

    const days = Math.floor(minutes / 1440)
    const hours = Math.floor((minutes % 1440) / 60)
    const mins = minutes % 60

    const parts: string[] = []
    if (days) parts.push(t('common.duration.days', { n: days }, days))
    if (hours) parts.push(t('common.duration.hours', { n: hours }, hours))
    if (mins) parts.push(t('common.duration.minutes', { n: mins }, mins))

    return parts.length ? t('common.duration.summary', { value: parts.join(' ') }) : ''
  })
}
