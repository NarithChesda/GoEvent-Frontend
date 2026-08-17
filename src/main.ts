import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vue3GoogleLogin from 'vue3-google-login'

import App from './App.vue'
import router from './router'
import { ensureLocaleMessages, i18n } from './i18n'
import { useLanguageStore } from './stores/language'
import { isPreviewFrameDocument } from './utils/previewFrameContext'

// The Design Studio's preview iframes each boot this file in full (see
// previewFrameContext.ts). Startup work that only serves app chrome they never
// render is skipped there, so the studio pays for it once instead of 3-4 times.
const isPreviewFrame = isPreviewFrameDocument()

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)

// Google Sign-In. `install()` injects https://accounts.google.com/gsi/client
// unconditionally, so every mounted preview frame was pulling the Google SDK
// (plus its stylesheet) over the network purely to render an invitation stage
// that has no sign-in button anywhere in it.
if (!isPreviewFrame) {
  app.use(vue3GoogleLogin, {
    clientId: '671277865303-d7pcuvm6tg2pkq8ee3ffkc18en29u5sd.apps.googleusercontent.com',
  })
}

// Sync <html lang> and ensure store is aligned with persisted locale.
// Must run after Pinia is installed.
const languageStore = useLanguageStore()
languageStore.init()

// Non-fallback locales are lazily loaded chunks, so the startup locale's
// messages are awaited before the first render — otherwise a Khmer session
// would paint one frame of English and then swap. No-op (already resolved) for
// English, which is bundled.
await ensureLocaleMessages(languageStore.locale)

app.mount('#app')
