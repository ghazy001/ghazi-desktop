<script setup>
import { computed } from 'vue'
import { useLocaleStore } from '@/stores/localeStore'
const locale = useLocaleStore()
const french = computed(() => locale.currentLocale === 'fr')
defineProps({ error: Object })
</script>
<template>
  <div class="xp-app-loading" role="status" aria-live="polite">
    <img src="/img/icons/windows-icon.webp" width="24" height="24" alt="" />
    <div>
      <p>
        {{
          error
            ? french
              ? 'Impossible d’ouvrir l’application.'
              : 'This application could not be opened.'
            : french
              ? 'Ouverture de l’application…'
              : 'Opening application…'
        }}
      </p>
      <small v-if="error">{{
        french ? 'Vérifiez votre connexion, puis fermez et rouvrez cette fenêtre.' : 'Check your connection, then close and reopen this window.'
      }}</small>
      <div v-else class="xp-app-progress" aria-hidden="true"><span></span></div>
    </div>
  </div>
</template>
<style scoped>
.xp-app-loading {
  height: calc(100% - 28px);
  margin-top: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: #ece9d8;
  color: #31466a;
  font:
    12px/1.5 Tahoma,
    Arial,
    sans-serif;
}
.xp-app-loading p {
  font: inherit;
}
.xp-app-loading small {
  display: block;
  max-width: 290px;
  font-size: 11px;
  margin-top: 5px;
  color: #53657d;
}
.xp-app-progress {
  height: 13px;
  width: 180px;
  border: 1px solid #8a9aa8;
  border-radius: 2px;
  background: #fff;
  overflow: hidden;
  margin-top: 8px;
  padding: 2px;
}
.xp-app-progress span {
  display: block;
  width: 42px;
  height: 7px;
  background: repeating-linear-gradient(90deg, #3f73df 0 11px, transparent 11px 14px);
  animation: xp-app-progress 1.4s linear infinite;
}
@keyframes xp-app-progress {
  from {
    transform: translateX(-46px);
  }
  to {
    transform: translateX(180px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .xp-app-progress span {
    animation: none;
    margin-left: 65px;
  }
}
</style>
