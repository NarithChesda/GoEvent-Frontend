<template>
  <button
    type="button"
    class="w-full flex flex-col items-center gap-2 py-10 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white hover:border-sky-400 hover:bg-sky-50/40 transition-colors"
    @click="emit('pick')"
  >
    <Layers class="w-7 h-7 text-slate-300" />
    <span class="text-sm font-medium text-slate-600">{{ t('management.partnerTemplateForm.planRequired.title') }}</span>
    <span class="text-xs text-slate-400">{{ t('management.partnerTemplateForm.planRequired.action') }}</span>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Layers } from 'lucide-vue-next'

/**
 * Stands in for the asset sections until a package plan is picked. Which slots
 * a template even has depends on the plan — basic takes photos plus four
 * decorations, standard takes videos — so there is nothing honest to render
 * before that choice, and an empty section would just look broken.
 */
const emit = defineEmits<{ pick: [] }>()

const { t } = useI18n()
</script>
