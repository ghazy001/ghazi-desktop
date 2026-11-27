<script setup>
import { RouterView } from 'vue-router'
import { useConnectionStore } from '@/stores/connectionStore'
import SessionController from '@/components/Session/SessionController.vue'
const session = useConnectionStore()
</script>
<template>
  <div
    v-show="session.powerPhase === 'running'"
    class="xp-session-desktop"
    :class="{ 'is-power-dialog': session.powerDialog }"
    :inert="!session.desktopActive || undefined"
  >
    <router-view />
  </div>
  <SessionController />
</template>
