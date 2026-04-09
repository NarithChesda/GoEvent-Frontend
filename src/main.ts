import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vue3GoogleLogin from 'vue3-google-login'

import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { useLanguageStore } from './stores/language'

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)
app.use(vue3GoogleLogin, {
  clientId: '671277865303-d7pcuvm6tg2pkq8ee3ffkc18en29u5sd.apps.googleusercontent.com',
})

// Sync <html lang> and ensure store is aligned with persisted locale.
// Must run after Pinia is installed.
useLanguageStore().init()

app.mount('#app')
