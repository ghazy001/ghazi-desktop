<script setup>
defineProps({ name: String })
</script>
<template>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <g v-if="name === 'back' || name === 'forward'" :transform="name === 'forward' ? 'translate(24 0) scale(-1 1)' : undefined">
      <circle cx="12" cy="12" r="10" fill="#81b53d" stroke="#648f2f" />
      <path d="m13 6-6 6 6 6M8 12h10" stroke="white" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M5 7c3-5 10-5 14 0" stroke="#c9e79a" />
    </g>
    <g v-else-if="name === 'save'">
      <path d="M4 2h13l4 4v16H3V2Z" fill="#7597bf" stroke="#344f71" />
      <path d="M7 2h10v7H7ZM7 14h11v8H7Z" fill="#faffff" stroke="#475e79" />
      <path d="M14 3v4M9 17h7M9 20h7" stroke="#53719c" stroke-width="1.5" />
    </g>
    <g v-else-if="name === 'up'">
      <path d="M2 6h8l2 3h10v12H2Z" fill="#ffe18a" stroke="#bb9329" />
      <path d="M2 9h20" stroke="#d5af43" />
      <path d="M12 19V11m-4 4 4-4 4 4" stroke="#685922" stroke-width="2" />
    </g>
    <g v-else-if="name === 'check'">
      <circle cx="12" cy="12" r="10" fill="#70a843" stroke="#3c7a28" />
      <path d="m6 12 4 4 8-9" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    </g>
    <g v-else>
      <path d="M5 2h11l4 4v16H5Z" fill="#fffef3" stroke="#7187a5" />
      <path d="M16 2v5h4M8 9h9M8 12h9M8 15h5" stroke="#7d98bc" />
      <circle cx="16" cy="18" r="4" fill="#ebc457" stroke="#a47b23" />
      <path d="m14 21-1 3 3-1 2 1v-3" fill="#2e5baa" />
    </g>
  </svg>
</template>
