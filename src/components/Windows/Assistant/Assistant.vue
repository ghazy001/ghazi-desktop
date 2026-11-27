<script setup>
import { ref, computed, inject, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useAssistantStore, portfolioProjects } from '@/stores/assistantStore'
import { useLocaleStore } from '@/stores/localeStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useGoBackStore } from '@/stores/goBackStore'
import profile from '@/data/profile-data.json'
import { validatePlan } from '@/lib/portfolio-terminal.mjs'
import './assistant.css'
const store = useAssistantStore(),
  locale = useLocaleStore(),
  session = useConnectionStore(),
  navigation = useGoBackStore()
const openWindow = inject('openWindow'),
  draft = ref(''),
  log = ref(null),
  field = ref(null),
  error = ref(''),
  lastPrompt = ref(''),
  info = ref(false)
let controller = null
const fr = computed(() => locale.currentLocale === 'fr')
const t = (en, french) => (fr.value ? french : en)
const panel = ref(null),
  menu = ref(null),
  showPictures = ref(true),
  largeText = ref(false),
  emoticons = ref(false),
  avatarPicker = ref(false),
  visitorAvatar = ref('/img/icons/assistant/msn.png'),
  nudging = ref(false),
  notice = ref('')
let nudgeTimer
const avatars = ['/img/icons/assistant/msn.png', '/img/icons/gift/gift.png', '/img/icons/paint/paint.webp']
function toggleMenu(name) {
  menu.value = menu.value === name ? null : name
  emoticons.value = false
  avatarPicker.value = false
}
function closeMenus(event) {
  if (!event.target.closest('.msn-menu-anchor, .msn-popover-anchor')) {
    menu.value = null
    emoticons.value = false
    avatarPicker.value = false
  }
}
function launch(command) {
  menu.value = null
  shortcut(command)
}
function insertEmoticon(symbol) {
  if (store.busy) return
  const start = field.value?.selectionStart ?? draft.value.length,
    end = field.value?.selectionEnd ?? start
  const next = draft.value.slice(0, start) + symbol + draft.value.slice(end)
  if (next.length > 1200) return
  draft.value = next
  emoticons.value = false
  nextTick(() => {
    field.value?.focus()
    field.value?.setSelectionRange(start + symbol.length, start + symbol.length)
  })
}
function nudge() {
  if (nudging.value) return
  notice.value = t('You sent a nudge! Ready when you are — ask me about Ghazi’s work.', 'Vous avez envoyé un wizz ! Prêt à parler des projets de Ghazi.')
  nudging.value = true
  clearTimeout(nudgeTimer)
  nudgeTimer = setTimeout(() => (nudging.value = false), 450)
  scrollDown()
}
function escapeMenus(event) {
  if (event.key === 'Escape') {
    menu.value = null
    emoticons.value = false
    avatarPicker.value = false
  }
}
onMounted(() => {
  document.addEventListener('pointerdown', closeMenus)
  document.addEventListener('keydown', escapeMenus)
})
onUnmounted(() => {
  clearTimeout(nudgeTimer)
  document.removeEventListener('pointerdown', closeMenus)
  document.removeEventListener('keydown', escapeMenus)
})
const suggestions = computed(() => [
  {
    icon: '/img/icons/projects/projects-icon-lg.webp',
    title: t('Find the right project', 'Trouver le bon projet'),
    detail: t('AI, full-stack or cloud?', 'IA, full-stack ou cloud ?'),
    prompt: t('Which of Ghazi’s projects best demonstrate his AI and full-stack skills?', 'Quels projets montrent le mieux ses compétences en IA et full-stack ?')
  },
  {
    icon: '/img/icons/cmd-icon-lg.webp',
    title: t('Take the desktop tour', 'Visiter le bureau'),
    detail: t('Let me show you around', 'Laissez-moi vous guider'),
    prompt: t('Give me a short portfolio tour and open TestFlow and my CV.', 'Fais-moi une visite du portfolio et ouvre TestFlow et le CV.')
  },
  {
    icon: '/img/icons/contact/email-icon-lg.webp',
    title: t('Have a project in mind?', 'Un projet en tête ?'),
    detail: t('Explore how Ghazi could help', 'Voyons comment Ghazi peut aider'),
    prompt: t(
      'I need a full-stack web application with AI features. How does Ghazi’s experience fit?',
      'Je souhaite une application web full-stack avec de l’IA. Comment son expérience correspond-elle ?'
    )
  }
])
async function scrollDown() {
  await nextTick()
  if (log.value) log.value.scrollTop = log.value.scrollHeight
}
async function send(prompt = draft.value) {
  if (store.busy || !session.desktopActive || !prompt.trim()) return
  prompt = prompt.trim().slice(0, 1200)
  lastPrompt.value = prompt
  draft.value = ''
  error.value = ''
  info.value = false
  notice.value = ''
  menu.value = null
  store.messages.push({ role: 'user', content: prompt })
  store.messages = store.messages.slice(-30)
  store.busy = true
  controller = new AbortController()
  const requestController = controller,
    timeout = setTimeout(() => requestController.abort('timeout'), 30000)
  scrollDown()
  try {
    // Keep a bounded conversation, ending in the current prompt. Roles are validated again server-side.
    let messages = store.messages.slice(-9).map(({ role, content }) => ({ role, content }))
    while (messages.length > 1 && messages.reduce((sum, m) => sum + m.content.length, 0) > 9000) messages.shift()
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: fr.value ? 'fr' : 'en', messages }),
      signal: requestController.signal
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'provider_error')
    const plan = validatePlan(data, profile, portfolioProjects)
    if (!plan) throw new Error('invalid_response')
    store.messages.push({ role: 'assistant', content: plan.reply, commands: plan.commands, ran: false })
  } catch (failure) {
    const code = failure.message
    error.value = requestController.signal.aborted
      ? t('Request stopped. You can try again whenever you’re ready.', 'Requête arrêtée. Vous pouvez réessayer quand vous voulez.')
      : code === 'not_configured'
        ? t(
            'AI chat is not connected yet. You can still use the desktop shortcuts and Terminal below.',
            'Le chat IA n’est pas encore connecté. Les raccourcis et le terminal restent disponibles.'
          )
        : ['rate_limited', 'quota_or_rate_limit', 'busy'].includes(code)
          ? t(
              'The assistant is taking a short break. Try again later, or explore the portfolio with the shortcuts.',
              'L’assistant fait une petite pause. Réessayez plus tard ou explorez les raccourcis.'
            )
          : t(
              'I couldn’t reach the assistant. Please try again. Your portfolio shortcuts still work.',
              'Impossible de joindre l’assistant. Réessayez. Les raccourcis restent disponibles.'
            )
  } finally {
    clearTimeout(timeout)
    store.busy = false
    controller = null
    scrollDown()
  }
}
function stop() {
  controller?.abort()
}
function newChat() {
  stop()
  store.messages = []
  draft.value = ''
  error.value = ''
  lastPrompt.value = ''
  notice.value = ''
  menu.value = null
  field.value?.focus()
}
function run(message) {
  if (message.ran || !session.desktopActive) return
  const plan = validatePlan({ reply: message.content, commands: message.commands }, profile, portfolioProjects)
  if (!plan) return
  for (const command of plan.commands) store.run(command, openWindow, navigation, 'assistant')
  message.ran = true
  openWindow('terminal')
}
function shortcut(command) {
  if (session.desktopActive) store.run(command, openWindow, navigation)
}
function retry() {
  if (store.messages.at(-1)?.role === 'user') store.messages.pop()
  send(lastPrompt.value)
}
watch(
  () => session.desktopActive,
  (active) => {
    if (!active) stop()
  }
)
onUnmounted(stop)
</script>
<template>
  <div ref="panel" class="msn-app" :class="{ 'msn-nudge': nudging, 'msn-large-text': largeText }" @keydown.esc="escapeMenus">
    <div class="msn-menubar" :aria-label="t('Application menus', 'Menus de l’application')">
      <div class="msn-menu-anchor">
        <button @click="toggleMenu('file')" aria-haspopup="menu" :aria-expanded="menu === 'file'">{{ t('File', 'Fichier') }}</button>
        <div v-if="menu === 'file'" class="msn-menu" role="menu">
          <button role="menuitem" @click="newChat" :disabled="store.busy">{{ t('New conversation', 'Nouvelle conversation') }}</button>
          <button role="menuitem" @click="launch('open documents')">{{ t('My Documents', 'Mes documents') }}</button>
          <button
            role="menuitem"
            @click="
              () => {
                menu = null
                openWindow('terminal')
              }
            "
          >
            {{ t('Command Prompt', 'Invite de commandes') }}
          </button>
        </div>
      </div>
      <div class="msn-menu-anchor">
        <button @click="toggleMenu('view')" aria-haspopup="menu" :aria-expanded="menu === 'view'">{{ t('View', 'Affichage') }}</button>
        <div v-if="menu === 'view'" class="msn-menu" role="menu">
          <button
            class="msn-picture-control"
            role="menuitemcheckbox"
            :aria-checked="showPictures"
            @click="
              () => {
                showPictures = !showPictures
                menu = null
              }
            "
          >
            {{ showPictures ? '✓ ' : '' }}{{ t('Display pictures', 'Images personnelles') }}
          </button>
          <button
            role="menuitemcheckbox"
            :aria-checked="largeText"
            @click="
              () => {
                largeText = !largeText
                menu = null
              }
            "
          >
            {{ largeText ? '✓ ' : '' }}{{ t('Larger conversation text', 'Texte de conversation agrandi') }}
          </button>
        </div>
      </div>
      <button @click="info = !info" :aria-expanded="info">{{ t('Help', 'Aide') }}</button>
      <span class="msn-version">{{ t('Portfolio edition', 'Édition portfolio') }}</span>
    </div>
    <nav class="msn-toolbar" :aria-label="t('Messenger shortcuts', 'Raccourcis Messenger')">
      <button class="msn-tool" @click="shortcut('contact')" :title="t('Write an email to Ghazi', 'Écrire un e-mail à Ghazi')">
        <img src="/img/icons/assistant/msn.png" alt="" /><span>{{ t('Contact', 'Contact') }}</span>
      </button>
      <div class="msn-menu-anchor">
        <button class="msn-tool" @click="toggleMenu('files')" aria-haspopup="menu" :aria-expanded="menu === 'files'">
          <img src="/img/icons/documents/folder-docs-icon-lg.webp" alt="" /><span>{{ t('My Files', 'Mes fichiers') }}<b>⌄</b></span>
        </button>
        <div v-if="menu === 'files'" class="msn-menu" role="menu">
          <button role="menuitem" @click="launch('cv')"><img src="/img/icons/cv/adobe-pdf.png" alt="" />{{ t('My CV', 'Mon CV') }}</button
          ><button role="menuitem" @click="launch('open documents')">{{ t('My Documents', 'Mes documents') }}</button>
        </div>
      </div>
      <button class="msn-tool" @click="shortcut('open music')">
        <img src="/img/icons/music/windows-media-player.png" alt="" /><span>{{ t('Music', 'Musique') }}</span>
      </button>
      <div class="msn-menu-anchor">
        <button class="msn-tool" @click="toggleMenu('activities')" aria-haspopup="menu" :aria-expanded="menu === 'activities'">
          <img src="/img/icons/paint/paint.webp" alt="" /><span>{{ t('Activities', 'Activités') }}<b>⌄</b></span>
        </button>
        <div v-if="menu === 'activities'" class="msn-menu msn-menu-right" role="menu">
          <button role="menuitem" @click="launch('open projects')">{{ t('Explore my projects', 'Explorer mes projets') }}</button><button
            role="menuitem"
            @click="launch('open paint')"
          >
            Paint</button
          ><button
            role="menuitem"
            @click="
              () => {
                menu = null
                openWindow('terminal')
              }
            "
          >
            Terminal
          </button>
        </div>
      </div>
      <div class="msn-menu-anchor">
        <button class="msn-tool" @click="toggleMenu('games')" aria-haspopup="menu" :aria-expanded="menu === 'games'">
          <img src="/game/spider/icon.png" alt="" /><span>{{ t('Games', 'Jeux') }}<b>⌄</b></span>
        </button>
        <div v-if="menu === 'games'" class="msn-menu msn-menu-right" role="menu">
          <button role="menuitem" @click="launch('open solitaire')">Spider Solitaire</button><button role="menuitem" @click="launch('open doom')">Doom</button>
        </div>
      </div>
      <div class="msn-wordmark" aria-label="MSN Messenger"><strong>msn</strong><img src="/img/icons/assistant/msn.png" alt="" /><small>messenger</small></div>
    </nav>
    <div class="msn-body" :class="{ 'msn-hide-pictures': !showPictures }">
      <main class="msn-conversation">
        <section class="msn-chat-frame">
          <div class="msn-to">
            <span>{{ t('To:', 'À :') }}</span> <strong>Ghazi Saoudi</strong><span class="msn-to-detail">{{ t('Software Engineer', 'Ingénieur logiciel') }}</span
            ><img src="/img/icons/assistant/msn.png" alt="" />
          </div>
          <div class="msn-status-note">
            <img src="/img/icons/info-icon.webp" alt="" /><span>{{
              t('You’re chatting with Ghazi’s AI portfolio guide.', 'Vous discutez avec le guide IA du portfolio de Ghazi.')
            }}</span>
          </div>
          <div
            ref="log"
            class="msn-transcript"
            :class="{ 'msn-text-large': largeText }"
            role="log"
            :aria-label="t('Chat messages', 'Messages du chat')"
            aria-live="polite"
            :aria-busy="store.busy"
          >
            <div v-if="info" class="msn-info">
              {{
                t(
                  'MSN is an AI guide based on Ghazi’s verified portfolio. Messages go to OpenAI to generate replies. Commands act only inside this virtual desktop. Ghazi isn’t personally in this chat; use Contact to reach him by email.',
                  'MSN est un guide IA basé sur le portfolio vérifié de Ghazi. Les messages sont envoyés à OpenAI. Les commandes agissent uniquement dans ce bureau virtuel. Ghazi ne répond pas personnellement ici ; utilisez Contact pour lui écrire.'
                )
              }}
            </div>
            <div v-if="!store.messages.length" class="msn-welcome">
              <div class="msn-sender">{{ t('Welcome to MSN', 'Bienvenue sur MSN') }}</div>
              <h1>{{ t('Let’s talk software.', 'Parlons de votre projet.') }}</h1>
              <p>
                {{
                  t(
                    'Explore Ghazi’s work and experience, or tell me about your next project.',
                    'Découvrez les réalisations et le parcours de Ghazi, ou parlez-moi de votre prochain projet.'
                  )
                }}
              </p>
              <p class="msn-prompt-label">{{ t('Suggested conversations', 'Suggestions de conversation') }}</p>
              <div class="msn-suggestions">
                <button v-for="item in suggestions" :key="item.title" @click="send(item.prompt)" :disabled="store.busy">
                  <img :src="item.icon" alt="" /><span
                    ><strong>{{ item.title }}</strong
                    ><small>{{ item.detail }}</small></span
                  ><span class="msn-suggestion-arrow" aria-hidden="true">›</span>
                </button>
              </div>
            </div>
            <article v-for="(message, i) in store.messages" :key="i" class="msn-message" :class="message.role">
              <div class="msn-sender">{{ message.role === 'user' ? t('You say:', 'Vous dites :') : t('MSN says:', 'MSN dit :') }}</div>
              <p>{{ message.content }}</p>
              <div v-if="message.commands?.length" class="msn-command-plan">
                <div>
                  <img src="/img/icons/cmd-icon-sm.webp" alt="" /><strong>{{ t('Your next desktop steps', 'Vos prochaines étapes sur le bureau') }}</strong>
                </div>
                <code v-for="command in message.commands" :key="command">C:\Ghazi&gt; {{ command }}</code>
                <div class="msn-command-actions">
                  <button class="msn-button" @click="run(message)" :disabled="message.ran">
                    {{ message.ran ? t('✓ Commands completed', '✓ Commandes exécutées') : t('Run in Terminal', 'Exécuter dans le terminal') }}</button><button
                    v-if="message.ran"
                    class="msn-link"
                    @click="openWindow('terminal')"
                  >
                    {{ t('View results', 'Voir les résultats') }}
                  </button>
                </div>
              </div>
            </article>
            <p v-if="notice" class="msn-local-notice" role="status">{{ notice }}</p>
            <div v-if="store.busy" class="msn-thinking" role="status">
              <img src="/img/icons/assistant/msn.png" alt="" />{{ t('Ghazi’s AI guide is typing', 'Le guide IA de Ghazi écrit') }}<span>...</span>
            </div>
            <div v-if="error" class="msn-error" role="alert">
              <p>{{ error }}</p>
              <button class="msn-button" @click="retry">{{ t('Try again', 'Réessayer') }}</button>
            </div>
          </div>
        </section>
        <form class="msn-compose" @submit.prevent="send()">
          <div class="msn-formatbar" :aria-label="t('Message tools', 'Outils de message')">
            <button
              type="button"
              class="msn-font-button"
              :aria-label="t('Larger conversation text', 'Texte de conversation agrandi')"
              :aria-pressed="largeText"
              @click="largeText = !largeText"
            >
              A
            </button>
            <div class="msn-popover-anchor">
              <button
                type="button"
                class="msn-emoticon-button"
                @click="emoticons = !emoticons"
                :disabled="store.busy"
                :aria-label="t('Emoticons', 'Émoticônes')"
                :aria-expanded="emoticons"
              >
                <img src="/img/icons/assistant/emoticon.svg" alt="" /><small>⌄</small>
              </button>
              <div v-if="emoticons" class="msn-emoticons" :aria-label="t('Choose an emoticon', 'Choisir une émoticône')">
                <button v-for="face in ['🙂', '😉', '😎', '😄', '🤔', '❤️']" :key="face" type="button" :aria-label="face" @click="insertEmoticon(face)">
                  {{ face }}
                </button>
              </div>
            </div>
            <button type="button" class="msn-nudge-button" @click="nudge" :disabled="nudging" :title="t('Send a nudge', 'Envoyer un wizz')">
              <img src="/img/icons/assistant/nudge.svg" alt="" /><span>{{ t('Nudge', 'Wizz') }}</span>
            </button>
            <span class="msn-format-divider"></span
            ><button type="button" class="msn-gift-button" @click="shortcut('open gift')" :title="t('A little gift for you', 'Un petit cadeau pour vous')">
              <img src="/img/icons/gift/gift.png" alt="" /><span>{{ t('Gift', 'Cadeau') }}</span>
            </button>
            <button type="button" class="msn-terminal-button" @click="openWindow('terminal')" :title="t('Open Terminal', 'Ouvrir le terminal')">
              <img src="/img/icons/cmd-icon-sm.webp" alt="" /><span>Terminal</span>
            </button>
          </div>
          <div class="msn-input-row">
            <label class="sr-only" for="assistant-message">{{ t('Your message', 'Votre message') }}</label><textarea
              id="assistant-message"
              ref="field"
              v-model="draft"
              maxlength="1200"
              rows="3"
              :disabled="store.busy"
              :placeholder="t('Type a message…', 'Écrivez un message…')"
              @keydown.enter.exact.prevent="send()"
            ></textarea
            ><button v-if="store.busy" type="button" class="msn-send msn-button" @click="stop">{{ t('Stop', 'Arrêter') }}</button
            ><button v-else class="msn-send msn-button" :disabled="!draft.trim()">{{ t('Send', 'Envoyer') }}</button>
          </div>
          <div class="msn-compose-status">
            <span>{{ t('Enter to send · Shift + Enter for a new line', 'Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne') }}</span><span
              >{{ draft.length }}/1200</span
            >
          </div>
        </form>
      </main>
      <aside v-if="showPictures" class="msn-display-pictures" :aria-label="t('Display pictures', 'Images personnelles')">
        <div class="msn-contact-display">
          <div class="msn-display-frame">
            <button class="msn-photo-button" @click="shortcut('open about')" :title="t('About Ghazi', 'À propos de Ghazi')">
              <img src="/img/ghazi/about-photo.jpg" alt="Ghazi Saoudi" />
            </button>
            <div class="msn-picture-caption">
              <img src="/img/icons/side-menu/info-system-icon.webp" alt="" /><button @click="shortcut('open about')">
                {{ t('View profile', 'Voir le profil') }}<span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
          <h2>Ghazi Saoudi</h2>
          <p>{{ t('Software Engineer', 'Ingénieur logiciel') }}</p>
          <span class="msn-presence"><i></i>{{ t('AI portfolio guide', 'Guide IA du portfolio') }}</span>
          <button class="msn-link" @click="shortcut('open projects')">{{ t('See what I’ve built', 'Voir mes réalisations') }}</button>
        </div>
        <div class="msn-visitor-display">
          <div class="msn-display-frame">
            <div class="msn-visitor-picture"><img :src="visitorAvatar" :alt="t('Your display picture', 'Votre image personnelle')" /></div>
            <div class="msn-picture-caption msn-popover-anchor">
              <span>{{ t('You', 'Vous') }}</span><button
                :aria-label="t('Change display picture', 'Changer l’image personnelle')"
                :aria-expanded="avatarPicker"
                @click="avatarPicker = !avatarPicker"
              >
                ⌄
              </button>
              <div v-if="avatarPicker" class="msn-avatar-picker">
                <button
                  v-for="(avatar, i) in avatars"
                  :key="avatar"
                  @click="
                    () => {
                      visitorAvatar = avatar
                      avatarPicker = false
                    }
                  "
                  :aria-label="t('Display picture ', 'Image personnelle ') + (i + 1)"
                  :aria-pressed="visitorAvatar === avatar"
                >
                  <img :src="avatar" alt="" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
      <button
        class="msn-picture-toggle"
        :aria-label="showPictures ? t('Hide display pictures', 'Masquer les images personnelles') : t('Show display pictures', 'Afficher les images personnelles')"
        :aria-expanded="showPictures"
        @click="showPictures = !showPictures"
      >
        {{ showPictures ? '›' : '‹' }}
      </button>
    </div>
    <footer class="msn-statusbar">
      <span><img src="/img/icons/assistant/msn.png" alt="" />{{ store.busy ? t('Typing…', 'Écriture…') : t('Ready', 'Prêt') }}</span
      ><button @click="info = !info" :aria-expanded="info">{{ t('About this AI chat', 'À propos de ce chat IA') }}</button>
    </footer>
  </div>
</template>
