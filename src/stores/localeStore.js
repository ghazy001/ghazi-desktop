import { defineStore } from 'pinia'
import { storeValue } from '../lib/browser-storage.mjs'
import { i18n } from '@/i18n'

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    currentLocale: i18n.global.locale.value
  }),
  actions: {
    setLocale(newLocale) {
      if (!['en', 'fr'].includes(newLocale)) newLocale = 'en'
      this.currentLocale = newLocale
      storeValue('currentLocale', newLocale)
      i18n.global.locale.value = newLocale
      document.documentElement.lang = newLocale
    }
  }
})
