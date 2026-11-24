import { createRouter, createWebHistory } from 'vue-router'
import Loader from '../views/Loader.vue'
import Office from '../views/Office.vue'
import profile from '@/data/profile-data.json'
const meta = {
  title: `${profile.name} | ${profile.title}`,
  metaTags: [
    { name: 'description', content: profile.bio[0] },
    { name: 'author', content: profile.name },
    { property: 'og:title', content: `${profile.name} | Windows XP Portfolio` },
    { property: 'og:description', content: profile.bio[0] },
    { property: 'og:type', content: 'website' }
  ]
}
export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Loader, meta },
    { path: '/office', name: 'Office', component: Office, meta },
    { path: '/:pathMatch(.*)*', redirect: '/office' }
  ]
})
