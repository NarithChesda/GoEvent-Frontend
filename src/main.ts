import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import vue3GoogleLogin from 'vue3-google-login'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vue3GoogleLogin, {
  clientId: '671277865303-d7pcuvm6tg2pkq8ee3ffkc18en29u5sd.apps.googleusercontent.com'
})

app.mount('#app')
