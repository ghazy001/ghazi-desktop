<script setup>
defineProps({ name: String })
</script>
<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" stroke-linejoin="round">
    <g v-if="name === 'zoom-in' || name === 'zoom-out'" fill="none">
      <circle cx="9" cy="9" r="6" fill="#d6f4ff" stroke="#4985a6" />
      <path d="m14 14 7 7" stroke="#637f8a" stroke-width="4" />
      <path d="M5 9h8" stroke="#245d8a" stroke-width="2" />
      <path v-if="name === 'zoom-in'" d="M9 5v8" stroke="#245d8a" stroke-width="2" />
    </g>
    <g v-else-if="name === 'fit' || name === 'actual'" stroke="#657b91" fill="#eaf1f5">
      <path d="M3 4h18v15H3z" />
      <path d="M6 7h12v9H6z" fill="#85c0dd" />
      <path v-if="name === 'fit'" d="m1 12 4-3v6zM23 12l-4-3v6zM12 1l-3 4h6zM12 23l-3-4h6z" fill="#528db4" stroke="none" />
      <path v-else d="M9 7h2v9M14 7h2v9" stroke="#fff" stroke-width="2" />
    </g>
    <g v-else-if="name === 'slideshow'" stroke="#62859b">
      <path d="M3 3h18v14H3z" fill="#c9e7f3" />
      <path d="m10 6 7 4-7 4z" fill="#419351" />
      <path d="M12 17v5m-5 0h10" fill="none" stroke-width="2" />
    </g>
    <g v-else-if="name === 'save'" stroke="#647e99">
      <path d="M3 2h16l3 3v17H3z" fill="#87b4df" />
      <path d="M7 2h10v7H7zM7 13h12v9H7z" fill="#f4f5ec" />
      <path d="M14 2v6" stroke-width="3" />
    </g>
    <g v-else-if="name === 'print'" stroke="#7b8490">
      <path d="M6 1h12v8H6z" fill="#fafafa" />
      <path d="M2 8h20v11H2z" fill="#a7becd" />
      <path d="M6 15h13v8H6z" fill="white" />
      <path d="M8 18h9m-9 2h9" />
      <path d="M4 11h3" stroke="#6ca73f" stroke-width="2" />
    </g>
  </svg>
</template>
