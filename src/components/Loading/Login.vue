<script setup>
import { computed, ref } from 'vue'
import profile from '@/data/profile-data.json'
import { useLocaleStore } from '@/stores/localeStore'
import LoginForm from './LoginForm.vue'
import LoginBrand from './LoginBrand.vue'
const localeStore = useLocaleStore()
const dropdownOpen = ref(false)
const locales = ['en', 'fr']
const localeNames = { en: 'English', fr: 'Français' }
const currentLocale = computed(() => localeStore.currentLocale)
const changeLocale = (locale) => {
  localeStore.setLocale(locale)
  dropdownOpen.value = false
}
</script>

<template>
  <section class="xp-logon" @keydown.esc="dropdownOpen = false">
    <div class="xp-logon-top" aria-hidden="true"></div>
    <main class="xp-logon-main">
      <div class="xp-logon-intro">
        <LoginBrand />
        <h1>{{ $t('login.toBegin', { name: profile.name }) }}</h1>
      </div>
      <div class="xp-logon-divider" aria-hidden="true"></div>
      <div class="xp-logon-users"><LoginForm /></div>
    </main>
    <footer class="xp-logon-footer">
      <div class="xp-logon-language" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (dropdownOpen = false)">
        <button
          class="xp-language-toggle"
          @click="dropdownOpen = !dropdownOpen"
          :aria-expanded="dropdownOpen"
          aria-controls="login-languages"
          :aria-label="$t('common.language') + ': ' + localeNames[currentLocale]"
        >
          <img :src="`/img/icons/langs/flag-${currentLocale}.webp`" alt="" />
          <span>{{ localeNames[currentLocale] }}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" /></svg>
        </button>
        <div v-if="dropdownOpen" id="login-languages" class="xp-language-options" :aria-label="$t('common.language')">
          <button v-for="language in locales" :key="language" @click="changeLocale(language)" :aria-pressed="language === currentLocale" :lang="language">
            <img :src="`/img/icons/langs/flag-${language}.webp`" alt="" />{{ localeNames[language] }}<span v-if="language === currentLocale">✓</span>
          </button>
        </div>
      </div>
      <p>{{ $t('login.explore') }}<br />{{ $t('login.exploreDetails') }}</p>
    </footer>
  </section>
</template>

<style scoped>
.xp-logon {
  isolation: isolate;
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  color: white;
  background: #587fda;
  font-family: Arial, Tahoma, sans-serif;
}
.xp-logon::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
  opacity: 0.12;
  background-image: repeating-linear-gradient(0deg, transparent 0 2px, #122d7220 2px 3px), repeating-linear-gradient(90deg, transparent 0 2px, #122d7220 2px 3px);
}
.xp-logon-top {
  height: 12.2svh;
  min-height: 48px;
  background: linear-gradient(100deg, #0737a4, #06309b);
  position: relative;
  flex-shrink: 0;
}
.xp-logon-top::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d8e6ff, transparent);
}
.xp-logon-main {
  flex: 1;
  min-height: 420px;
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  align-items: center;
  background: radial-gradient(ellipse at 25% 0, #90a9e8 0, #6d92e3 35%, #5b80dc 70%);
}
.xp-logon-intro {
  width: 100%;
  padding: 30px 52px 30px 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.xp-logon-intro h1 {
  font-size: 20px;
  line-height: 1.4;
  font-weight: 400;
  margin: 17px 0 0;
  max-width: 440px;
  text-align: right;
}
.xp-logon-divider {
  width: 1px;
  height: 330px;
  max-height: 85%;
  background: linear-gradient(transparent, #d1dfff65, transparent);
}
.xp-logon-users {
  padding: 28px 24px 28px 50px;
  min-width: 0;
}
.xp-logon-footer {
  min-height: 12.5svh;
  padding: 26px 3.5%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: linear-gradient(100deg, #073aa8, #0535a0);
  position: relative;
}
.xp-logon-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #ef9f5c, transparent);
}
.xp-logon-footer > p {
  margin: 0;
  max-width: 390px;
  font-size: 15px;
  line-height: 1.45;
  font-weight: 400;
}
.xp-logon-language {
  position: relative;
  flex-shrink: 0;
}
.xp-language-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  color: white;
  font-size: 17px;
}
.xp-language-toggle > img {
  width: 34px;
  height: 28px;
  object-fit: contain;
}
.xp-language-toggle:focus-visible {
  outline: 1px dotted white;
  outline-offset: 4px;
}
.xp-language-options {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 0;
  min-width: 160px;
  padding: 3px;
  background: #ece9d8;
  color: #111;
  border: 1px solid #7892b6;
  box-shadow:
    2px 2px 0 #15336a80,
    inset 1px 1px white;
  z-index: 10;
}
.xp-language-options button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  font:
    13px Tahoma,
    sans-serif;
  text-align: left;
}
.xp-language-options img {
  width: 22px;
  height: 18px;
  object-fit: contain;
}
.xp-language-options button > span {
  margin-left: auto;
}
.xp-language-options button:hover,
.xp-language-options button:focus-visible {
  color: white;
  background: #316ac5;
  outline: 0;
}
@media (min-width: 1800px) {
  .xp-logon-intro {
    padding-right: 72px;
  }
  .xp-logon-users {
    padding-left: 70px;
  }
}
@media (max-width: 820px) {
  .xp-logon-intro {
    padding-right: 26px;
  }
  .xp-logon-users {
    padding-left: 22px;
  }
  .xp-logon-intro h1 {
    font-size: 17px;
  }
}
@media (max-width: 620px) {
  .xp-logon-main {
    grid-template-columns: 1fr;
    align-content: center;
    gap: 16px;
    min-height: 440px;
    padding: 25px 18px;
  }
  .xp-logon-intro {
    align-items: center;
    padding: 0;
  }
  .xp-logon-intro h1 {
    text-align: center;
    font-size: 16px;
    max-width: 290px;
    margin-top: 16px;
  }
  .xp-logon-divider {
    width: 80%;
    height: 1px;
    max-height: none;
    margin: 4px auto;
    background: linear-gradient(90deg, transparent, #d1dfff65, transparent);
  }
  .xp-logon-users {
    padding: 0;
    display: flex;
    justify-content: center;
  }
  .xp-logon-footer {
    padding: 17px 22px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .xp-logon-footer > p {
    font-size: 12px;
    max-width: 100%;
  }
}
</style>
