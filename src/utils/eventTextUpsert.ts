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
 * On success the `texts` array is mutated in place so the caller's local
 * state reflects the change without a refetch.
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
      const res = await eventTextsService.deleteEventText(eventId, existing.id)
      if (res.success) texts.splice(texts.indexOf(existing), 1)
      return res
    }
    const res = await eventTextsService.patchEventText(eventId, existing.id, {
      [edit.field]: edit.value,
    })
    if (res.success) existing[edit.field] = edit.value
    return res
  }

  if (!edit.value) return { success: true }

  const res = await eventTextsService.createEventText(eventId, {
    text_type: edit.textType,
    language: edit.language,
    title: edit.field === 'title' ? edit.value : '',
    content: edit.field === 'content' ? edit.value : '',
    is_active: true,
  })
  if (res.success && res.data) texts.push(res.data as unknown as EventTextRecord)
  return res
}
