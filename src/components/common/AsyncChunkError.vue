<template>
  <div class="async-chunk-error">
    <div class="async-chunk-error__icon">
      <AlertCircle class="w-6 h-6" />
    </div>
    <h3 class="async-chunk-error__title">{{ t('common.asyncChunkError.title') }}</h3>
    <p class="async-chunk-error__body">{{ t('common.asyncChunkError.description') }}</p>
    <button type="button" class="async-chunk-error__action" @click="reload">
      {{ t('common.asyncChunkError.action') }}
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Shown in place of a lazily loaded component whose chunk could not be
 * fetched — see defineResilientAsyncComponent.
 *
 * Without it a failed chunk renders nothing at all, which on a whole tab is
 * indistinguishable from a blank page and gives the user no way forward. The
 * retries have already been exhausted by the time this appears, so the only
 * honest offer left is a full reload.
 */
import { AlertCircle } from 'lucide-vue-next'
import { useAppLanguage } from '@/composables/useAppLanguage'

const { t } = useAppLanguage()

const reload = () => window.location.reload()
</script>

<style scoped>
.async-chunk-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

.async-chunk-error__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.25rem;
  border-radius: 9999px;
  background: rgb(241 245 249);
  color: rgb(148 163 184);
}

.async-chunk-error__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: rgb(15 23 42);
}

.async-chunk-error__body {
  max-width: 28rem;
  font-size: 0.875rem;
  color: rgb(71 85 105);
}

.async-chunk-error__action {
  margin-top: 0.75rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  background-image: linear-gradient(to right, #2ecc71, #1e90ff);
  transition: opacity 0.2s ease;
}

.async-chunk-error__action:hover {
  opacity: 0.9;
}
</style>
