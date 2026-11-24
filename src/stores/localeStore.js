import { defineStore } from 'pinia'
import { i18n } from '@/i18n'

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    currentLocale: i18n.global.locale.value
  }),
  actions: {
    setLocale(newLocale) {
      this.currentLocale = newLocale
      localStorage.setItem('currentLocale', newLocale)
      i18n.global.locale.value = newLocale
      document.documentElement.lang = newLocale
    }
  }
})
