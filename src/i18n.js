import { createI18n } from 'vue-i18n'
import { storedValue } from './lib/browser-storage.mjs'
import en from './locales/en.json'
import fr from './locales/fr.json'
const saved = storedValue('currentLocale')
export const i18n = createI18n({ legacy: false, locale: saved === 'fr' ? 'fr' : 'en', fallbackLocale: 'en', messages: { en, fr } })
document.documentElement.lang = i18n.global.locale.value
