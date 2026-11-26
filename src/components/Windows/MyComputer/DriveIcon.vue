<script setup>
defineProps({ kind: String })
</script>
<template>
  <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="xp-drive-top" x1="12" y1="14" x2="48" y2="40" gradientUnits="userSpaceOnUse">
        <stop stop-color="#f8fbff" />
        <stop offset=".5" stop-color="#c3ccd7" />
        <stop offset="1" stop-color="#8798aa" />
      </linearGradient>
      <linearGradient id="xp-drive-face" x1="10" y1="38" x2="10" y2="51" gradientUnits="userSpaceOnUse">
        <stop stop-color="#e8eef6" />
        <stop offset="1" stop-color="#8295a9" />
      </linearGradient>
      <radialGradient id="xp-disc">
        <stop stop-color="#a9b5c2" />
        <stop offset=".3" stop-color="#f7f5e7" />
        <stop offset=".5" stop-color="#c2c4ed" />
        <stop offset=".72" stop-color="#dcf3fa" />
        <stop offset="1" stop-color="#a0a7b2" />
      </radialGradient>
    </defs>
    <ellipse cx="31" cy="53" rx="27" ry="4" fill="#000" opacity=".12" />
    <path d="M7 36 18 17h30l10 19v15H7Z" fill="url(#xp-drive-top)" stroke="#627588" />
    <path d="M7 36h51v15H7Z" fill="url(#xp-drive-face)" stroke="#65788d" />
    <path d="M11 40h32v2H11Z" fill="#52687d" />
    <path d="M12 43h29v2H12Z" fill="#f4faff" />
    <path d="M48 43h5v3h-5Z" fill="#50bc34" stroke="#4a7a3a" />
    <path d="M18 21h27l6 11H12Z" stroke="#fff" opacity=".7" />
    <g v-if="kind === 'system'" stroke-width=".6">
      <path d="m18 20 10-2v9l-10 2Z" fill="#e2512a" stroke="#a73520" />
      <path d="m30 18 10 2v9l-10-2Z" fill="#85be22" stroke="#5f9019" />
      <path d="m18 31 10-2v9l-10 2Z" fill="#367dca" stroke="#22558e" />
      <path d="m30 29 10 2v9l-10-2Z" fill="#f0c63c" stroke="#a98c26" />
    </g>
    <g v-else-if="kind === 'projects'">
      <path d="M32 25h9l3 4h16v19H31Z" fill="#e9b52b" stroke="#a17d1e" />
      <path d="m31 32 29-1-4 18H28Z" fill="#ffe28b" stroke="#b89735" />
      <path d="m40 36-4 4 4 4m7-8 4 4-4 4" stroke="#8a6f27" stroke-width="1.6" />
    </g>
    <g v-else-if="kind === 'media'"><path d="M41 20v23c0 7-11 8-11 2 0-4 6-6 8-4V23l17-4v19c0 7-11 8-11 2 0-4 6-6 8-4V17Z" fill="#5a8fd4" stroke="#2c5b99" /></g>
    <g v-else-if="kind === 'disc'">
      <circle cx="42" cy="30" r="20" fill="url(#xp-disc)" stroke="#909cab" />
      <path d="m43 12 3 12 11-7M25 39l12-7-2 17" fill="#efffe2" opacity=".65" />
      <circle cx="42" cy="30" r="5" fill="#fff" stroke="#8895a5" />
      <circle cx="42" cy="30" r="2" fill="#a5b0c1" />
    </g>
  </svg>
</template>
