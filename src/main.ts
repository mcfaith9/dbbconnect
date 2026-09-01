import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { storage } from './services/storage'

// Initialize IndexedDB database
storage.init().catch((err) => {
  console.warn('IndexedDB initialization notice:', err)
})

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker registration failed:', err)
    })
  })
}

const app = createApp(App)
app.use(router)
app.mount('#app')

