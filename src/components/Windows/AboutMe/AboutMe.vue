<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import profile from '@/data/profile-data.json'
import data from '@/data/about-data.json'
import apps from '@/data/windows-data.json'
import './about.css'
const locale = useLocaleStore()
const openWindow = inject('openWindow')
const activeWindow = inject('activeWindow', ref(null))
const copy = computed(() => data[locale.currentLocale === 'fr' ? 'fr' : 'en'])
const selected = ref('profile')
const panel = ref(null)
const tabs = ref(null)
const icon = (id) => apps.find((app) => app.id === id)?.imgSrc
function select(id, focus = false) {
  if (!data.tabs.includes(id)) return
  selected.value = id
  nextTick(() => {
    if (panel.value) panel.value.scrollTop = 0
    if (focus) tabs.value?.querySelector(`#about-tab-${id}`)?.focus()
  })
}
function tabKey(event, index) {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()
  const last = data.tabs.length - 1
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? last : (index + (event.key === 'ArrowRight' ? 1 : last)) % data.tabs.length
  select(data.tabs[next], true)
}
function command(event) {
  if (activeWindow.value === 'about') select(event.detail)
}
onMounted(() => window.addEventListener('about-command', command))
onBeforeUnmount(() => window.removeEventListener('about-command', command))
</script>
<template>
  <div class="xp-about">
    <header class="about-banner">
      <img src="/img/icons/side-menu/info-system-icon.webp" alt="" width="42" height="42" />
      <div>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.subtitle }}</p>
      </div>
      <img class="about-windows-logo" src="/img/icons/windows-icon.webp" alt="" width="44" height="44" />
    </header>
    <div class="about-sheet">
      <div ref="tabs" class="about-tabs" role="tablist" :aria-label="copy.title">
        <button
          v-for="(id, index) in data.tabs"
          :id="`about-tab-${id}`"
          :key="id"
          role="tab"
          :aria-selected="selected === id"
          :aria-controls="`about-panel-${id}`"
          :tabindex="selected === id ? 0 : -1"
          @click="select(id)"
          @keydown="tabKey($event, index)"
        >
          {{ copy[id] }}
        </button>
      </div>
      <main :id="`about-panel-${selected}`" ref="panel" class="about-panel" role="tabpanel" :aria-labelledby="`about-tab-${selected}`" tabindex="0">
        <template v-if="selected === 'profile'">
          <div class="about-identity">
            <figure class="about-photo"><img :src="data.photo" :alt="profile.name" width="112" height="132" /></figure>
            <div class="about-name">
              <p class="about-eyebrow">{{ copy.identity }}</p>
              <h2>{{ profile.name }}</h2>
              <p class="about-role">{{ profile.title }}</p>
              <p class="about-location">{{ profile.location }}</p>
            </div>
          </div>
          <section class="about-intro">
            <h3>{{ profile.tagline }}</h3>
            <p>{{ profile.intro }}</p>
          </section>
          <fieldset class="about-fieldset">
            <legend>{{ copy.biography }}</legend>
            <p v-for="paragraph in profile.bio" :key="paragraph">{{ paragraph }}</p>
          </fieldset>
          <div class="about-profile-actions">
            <button class="xp-button" @click="openWindow('myProjects')"><img :src="icon('myProjects')" alt="" />{{ copy.projects }}</button
            ><button class="xp-button" @click="openWindow('contact')"><img :src="icon('contact')" alt="" />{{ copy.contact }}</button>
          </div>
        </template>
        <template v-else-if="selected === 'experience'">
          <div class="about-section-title">
            <img src="/img/icons/side-menu/board-icon.webp" alt="" />
            <div>
              <h2>{{ copy.career }}</h2>
              <p>{{ copy.careerHint }}</p>
            </div>
          </div>
          <div class="about-career">
            <details v-for="(role, index) in profile.experience" :key="role.company" class="about-job" :open="index === 0">
              <summary>
                <span class="about-job-mark" aria-hidden="true"></span
                ><span
                  ><strong>{{ role.jobTitle }}</strong
                  ><span class="about-company">{{ role.company }}</span></span
                ><span class="about-date">{{ role.year }}</span>
              </summary>
              <div class="about-job-body">
                <ul>
                  <li v-for="line in role.cvResponsibilities || role.responsibilities" :key="line">{{ line }}</li>
                </ul>
                <p class="about-stack">
                  <strong>{{ copy.technologies }}</strong
                  ><br />{{ role.technologies.join(' · ') }}
                </p>
              </div>
            </details>
          </div>
        </template>
        <template v-else-if="selected === 'education'">
          <div class="about-section-title">
            <img :src="icon('certifications')" alt="" />
            <h2>{{ copy.academic }}</h2>
          </div>
          <fieldset v-for="school in profile.education" :key="school.degree" class="about-fieldset about-school">
            <legend>{{ school.year }}</legend>
            <h3>{{ school.degree }}</h3>
            <p>{{ school.institution }}</p>
          </fieldset>
          <button class="xp-button about-credential-button" @click="openWindow('certifications')">
            <img :src="icon('certifications')" alt="" />{{ copy.credentials }}
          </button>
        </template>
        <template v-else>
          <div class="about-section-title">
            <img src="/img/icons/side-menu/info-system-icon.webp" alt="" />
            <h2>{{ copy.personal }}</h2>
          </div>
          <fieldset class="about-fieldset">
            <legend>{{ copy.opportunities }}</legend>
            <p>{{ profile.focus }}</p>
          </fieldset>
          <fieldset class="about-fieldset">
            <legend>{{ copy.languages }}</legend>
            <dl class="about-languages">
              <template v-for="language in profile.languages" :key="language.name"
                ><dt>{{ language.name }}</dt>
                <dd>{{ language.level }}</dd></template
              >
            </dl>
          </fieldset>
          <fieldset class="about-fieldset">
            <legend>{{ copy.strengths }}</legend>
            <ul class="about-strengths">
              <li v-for="strength in profile.softSkills" :key="strength">{{ strength }}</li>
            </ul>
          </fieldset>
          <button class="about-paint" @click="openWindow('paint')">
            <img :src="icon('paint')" alt="" /><span
              ><strong>{{ copy.paint }}</strong
              ><span>{{ copy.paintHint }}</span></span
            >
          </button>
        </template>
        <p class="about-source">{{ copy.source }}</p>
      </main>
    </div>
    <footer class="about-footer">
      <span>{{ copy.profileFile }}</span
      ><button class="xp-button" @click="openWindow('myCV')"><img :src="icon('myCV')" alt="" />{{ copy.cv }}</button
      ><button class="xp-button" @click="openWindow('contact')"><img :src="icon('contact')" alt="" />{{ copy.contact }}</button>
    </footer>
  </div>
</template>
