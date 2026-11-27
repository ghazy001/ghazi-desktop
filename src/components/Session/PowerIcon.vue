<script setup>
defineProps({ kind: String })
</script>
<template>
  <img
    v-if="kind === 'shutdown' || kind === 'logoff'"
    :src="kind === 'shutdown' ? '/img/icons/shutdown-icon.webp' : '/img/icons/key-log-icon.webp'"
    alt=""
    width="48"
    height="48"
  />
  <svg v-else viewBox="0 0 48 48" aria-hidden="true">
    <defs>
      <linearGradient :id="`xp-power-${kind}`" x2="0" y2="1">
        <stop :stop-color="kind === 'standby' ? '#ffdd72' : '#b5e28d'" />
        <stop offset=".5" :stop-color="kind === 'standby' ? '#ed9c15' : '#5d9f40'" />
        <stop offset="1" :stop-color="kind === 'standby' ? '#c57006' : '#246b25'" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="42" height="42" rx="5" fill="#071d5a" opacity=".5" />
    <rect x="2" y="2" width="42" height="42" rx="5" :fill="`url(#xp-power-${kind})`" stroke="#d7ecff" stroke-width="1.3" />
    <path d="M6 17V8q0-3 3-3h27" fill="none" stroke="#fff" opacity=".6" />
    <path v-if="kind === 'standby'" d="M29 10a14 14 0 1 0 7 23A14 14 0 0 1 29 10Z" fill="#fff7cf" stroke="#a7690a" />
    <g v-else-if="kind === 'restart'" fill="#f4ffeb"><path d="m32 9 5 14-14-3 5-4a9 9 0 1 0 4 13l5 2a15 15 0 1 1-13-20l3 1Z" /></g>
    <g v-else fill="#fff7d5" stroke="#32642e" stroke-width=".7">
      <circle cx="17" cy="17" r="6" />
      <path d="M7 35V29c0-8 20-8 20 0v6Z" />
      <circle cx="31" cy="18" r="5" />
      <path d="M28 25c10-3 13 2 13 9H29" />
      <path d="m27 36 5 4 8-7" fill="none" stroke="#eaffdf" stroke-width="2" />
    </g>
  </svg>
</template>
