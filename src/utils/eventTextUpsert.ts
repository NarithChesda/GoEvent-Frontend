import { eventTextsService } from '@/services/api'

/**
 * Minimal structural shape both the showcase types and the API types satisfy,
 * so the util can mutate whichever event_texts array the caller holds.
 */
export interface EventTextRecord {
  id: number
  text_type: string
  language: string
  title?: string
  content: string
}

export interface EventTextFieldEdit {
  textType: string
  language: string
  field: 'title' | 'content'
  value: string
}

export interface EventTextSaveResult {
  success: boolean
  message?: string
}

/**
 * The single upsert rule for editing one field of one (text_type, language)
 * event-text slot: PATCH when a row exists, POST when it doesn't and the new
 * value is non-empty, DELETE when the edit clears the last remaining field.
 *
 * The `texts` array is mutated OPTIMISTICALLY — before the request, not
 * after — and rolled back only if the request fails. This matters because
 * the caller (InlineEditableText) flips itself out of edit mode synchronously
 * right after calling this, before the request settles; mutating on success
 * (the old behaviour) meant the display briefly re-rendered the STALE value
 * for the round-trip's duration, then jumped to the new one once the request
 * landed — a visible flash on every single save. Mutating first means both
 * happen in the same synchronous tick, so Vue's next render already reflects
 * the new value and there's nothing to flash.
 */
export async function saveEventTextField(
  eventId: string,
  texts: EventTextRecord[],
  edit: EventTextFieldEdit,
): Promise<EventTextSaveResult> {
  const existing = texts.find(
    (t) => t.text_type === edit.textType && t.language === edit.language,
  )

  if (existing) {
    const otherField = edit.field === 'title' ? existing.content : existing.title
    if (!edit.value && !otherField) {
      const index = texts.indexOf(existing)
      texts.splice(index, 1)
      const res = await eventTextsService.deleteEventText(eventId, existing.id)
      if (!res.success) texts.splice(index, 0, existing)
      return res
    }
    const previous = existing[edit.field] ?? ''
    existing[edit.field] = edit.value
    const res = await eventTextsService.patchEventText(eventId, existing.id, {
      [edit.field]: edit.value,
    })
    if (!res.success) existing[edit.field] = previous
    return res
  }

  if (!edit.value) return { success: true }

  // No row (and so no id) to key an in-place mutation on yet — insert a
  // placeholder so the display picks up the new value immediately, then swap
  // it for the real record (or drop it) once the create call settles.
  const draft: EventTextRecord = {
    id: -Date.now(),
    text_type: edit.textType,
    language: edit.language,
    title: edit.field === 'title' ? edit.value : '',
    content: edit.field === 'content' ? edit.value : '',
  }
  texts.push(draft)

  const res = await eventTextsService.createEventText(eventId, {
    text_type: edit.textType,
    language: edit.language,
    title: draft.title,
    content: draft.content,
    is_active: true,
  })

  const index = texts.indexOf(draft)
  if (index !== -1) {
    if (res.success && res.data) texts.splice(index, 1, res.data as unknown as EventTextRecord)
    else texts.splice(index, 1)
  } else if (res.success && res.data) {
    texts.push(res.data as unknown as EventTextRecord)
  }
  return res
}
