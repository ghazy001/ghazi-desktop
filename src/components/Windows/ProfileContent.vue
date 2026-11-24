<script setup>
import { computed, inject } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
import profile from '@/data/profile-data.json'
import windows from '@/data/windows-data.json'
import EducationItem from './MyCV/EducationItem.vue'
import WorkExperienceItem from './MyCV/WorkExperienceItem.vue'
import WindowLeftMenu from './WindowLeftMenu.vue'
const props = defineProps({ mode: { type: String, default: 'overview' }, leftMenuType: String })
const openWindow = inject('openWindow')
const locale = useLocaleStore()
const shortcuts = computed(() => windows.filter((w) => ['about', 'myProjects', 'skills', 'myCV', 'certifications', 'contact'].includes(w.id)))
const cvCategory = {
  'Programming Languages': 'Languages',
  Frontend: 'Frontend',
  Backend: 'Backend',
  Databases: 'Databases',
  'AI / Machine Learning': 'AI & Machine Learning',
  'DevOps / Cloud': 'DevOps & Cloud',
  'Testing / QA': 'Tests & QA',
  'Tools and Platforms': 'Tools',
  'Architecture Patterns': 'Architecture'
}
const skillGroups = computed(() =>
  profile.skills.map((group) => ({ ...group, items: [...new Set([...group.items, ...profile.cvSkills.find((cv) => cv.category === cvCategory[group.category]).items])] }))
)
</script>

<template>
  <div class="relative h-content-window flex">
    <WindowLeftMenu v-if="leftMenuType" :leftMenuType="leftMenuType" />
    <main class="xp-content bg-white w-full h-full overflow-auto p-4 select-text">
      <template v-if="mode === 'overview'">
        <div class="xp-profile-heading">
          <img :src="profile.portrait" :alt="profile.name" width="90" height="110" />
          <div>
            <h1>{{ profile.name }}</h1>
            <p>{{ profile.title }}</p>
            <p>{{ profile.location }}</p>
          </div>
        </div>
        <h2>{{ profile.tagline }}</h2>
        <p>{{ profile.intro }}</p>
        <h2>{{ locale.currentLocale === 'fr' ? 'Dossiers du portfolio' : 'Portfolio folders' }}</h2>
        <div class="xp-shortcuts">
          <button v-for="app in shortcuts" :key="app.id" @click="openWindow(app.id)" class="xp-shortcut">
            <img :src="app.imgSrc" alt="" width="40" height="40" />
            <span>{{ app.title[locale.currentLocale] }}</span>
          </button>
        </div>
        <p class="xp-hint">
          {{
            locale.currentLocale === 'fr'
              ? 'Double-cliquez sur une icône du bureau pour ouvrir une application. Sur mobile, touchez une fois.'
              : 'Double-click a desktop icon to open an application. On mobile, tap once.'
          }}
        </p>
      </template>
      <template v-else-if="mode === 'about'">
        <h1>{{ profile.name }}</h1>
        <p>{{ profile.specialization }}</p>
        <p>{{ profile.location }}</p>
        <p v-for="paragraph in profile.bio" :key="paragraph">{{ paragraph }}</p>
        <h2>{{ $t('windows.cv.education') }}</h2>
        <EducationItem v-for="item in profile.education" :key="item.degree" :education="item" />
        <h2>{{ $t('windows.cv.proExperience') }}</h2>
        <WorkExperienceItem v-for="item in profile.experience" :key="item.company" :workExperience="item" />
        <h2>Focus</h2>
        <p>{{ profile.focus }}</p>
        <h2>{{ locale.currentLocale === 'fr' ? 'Langues' : 'Languages' }}</h2>
        <ul>
          <li v-for="language in profile.languages" :key="language.name">{{ language.name }} — {{ language.level }}</li>
        </ul>
        <h2>{{ locale.currentLocale === 'fr' ? 'Qualités professionnelles' : 'Professional strengths' }}</h2>
        <p>{{ profile.softSkills.join(' · ') }}</p>
      </template>
      <template v-else-if="mode === 'skills'">
        <h1>{{ locale.currentLocale === 'fr' ? 'Compétences techniques' : 'Technical skills' }}</h1>
        <p>{{ profile.specialization }}</p>
        <fieldset v-for="group in skillGroups" :key="group.category" class="xp-fieldset">
          <legend>{{ group.category }}</legend>
          <p>{{ group.items.join(' · ') }}</p>
        </fieldset>
      </template>
      <template v-else-if="mode === 'certifications'">
        <h1>{{ locale.currentLocale === 'fr' ? 'Certifications' : 'Certifications' }}</h1>
        <p>
          <a :href="profile.credly" target="_blank" rel="noopener noreferrer">Credly — {{ profile.name }}</a>
        </p>
        <div v-for="cert in profile.certifications" :key="cert.name" class="xp-credential">
          <img v-if="cert.image" :src="cert.image" :alt="cert.name + ' badge'" width="64" height="64" loading="lazy" />
          <img v-else src="/img/icons/cv/cv-icon-lg.webp" alt="" width="40" height="40" />
          <div>
            <h2>{{ cert.name }}</h2>
            <p>{{ cert.issuer }}</p>
            <p v-if="cert.issued">{{ cert.issued }}</p>
            <a v-if="cert.url" :href="cert.url" target="_blank" rel="noopener noreferrer">{{
              locale.currentLocale === 'fr' ? 'Vérifier le certificat' : 'Verify credential'
            }}</a>
            <p v-else class="xp-hint">
              {{
                locale.currentLocale === 'fr'
                  ? 'Mentionné dans le CV. Date et lien de vérification non fournis.'
                  : 'Listed in the CV. Issue date and verification link were not provided.'
              }}
            </p>
          </div>
        </div>
      </template>
      <template v-else-if="mode === 'links'">
        <h1>{{ locale.currentLocale === 'fr' ? 'Favoris professionnels' : 'Professional Favorites' }}</h1>
        <p>{{ profile.name }} — {{ profile.title }}</p>
        <div class="xp-link-list">
          <a v-for="link in profile.links" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer" class="xp-favorite">
            <img :src="link.icon" alt="" width="32" height="32" /><span
              ><strong>{{ link.name }}</strong
              ><br />{{ link.description }}<br /><small>{{ link.url }}</small></span
            >
          </a>
        </div>
        <h2>Contact</h2>
        <p>
          <a :href="'mailto:' + profile.email">{{ profile.email }}</a>
        </p>
        <p>
          <a :href="profile.phoneUrl">{{ profile.phone }}</a>
        </p>
      </template>
    </main>
  </div>
</template>
