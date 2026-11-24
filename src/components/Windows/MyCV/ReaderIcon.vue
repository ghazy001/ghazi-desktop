<script setup>
defineProps({ name: String })
</script>
<template>
  <svg class="pdf-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false" stroke-linejoin="round">
    <g v-if="name === 'open'" fill="#f1f1e9" stroke="#aaa">
      <path d="M3 9h10l3 3h12v16H3z" />
      <path d="M8 5h9l3 4h9v4H8z" />
      <path d="M2 15h29l-6 13H1z" fill="#fff" />
    </g>
    <g v-else-if="name === 'save'" fill="#ecece6" stroke="#aaa">
      <path d="M4 3h23l3 3v24H3V3z" />
      <path d="M8 3h16v11H8zM8 20h17v10H8z" fill="#555" />
      <path d="M11 3h5v9h-5zM10 23h13m-13 3h13" fill="#fff" stroke="#ddd" />
    </g>
    <g v-else-if="name === 'print'" fill="#eee" stroke="#aaa">
      <path d="M8 2h16v10H8zM3 11h26v15H3z" />
      <path d="M8 20h17v11H8z" fill="#fff" />
      <path d="M11 24h11m-11 3h11" stroke="#888" />
      <path d="M5 14h4v3H5z" fill="#777" />
    </g>
    <g v-else-if="name === 'mail'" fill="#f8f8f1" stroke="#999">
      <path d="M2 7h28v20H2z" />
      <path d="m3 8 13 11L29 8M3 26l10-10m16 10L19 16" fill="none" stroke="#666" stroke-width="2" />
    </g>
    <g v-else-if="['previous', 'next', 'plus', 'minus'].includes(name)">
      <circle cx="16" cy="16" r="13" fill="#f8f8f3" stroke="#aaa" />
      <path v-if="name === 'previous'" d="m16 5-8 10h5v11h6V15h5z" fill="#555" />
      <path v-if="name === 'next'" d="m16 27 8-10h-5V6h-6v11H8z" fill="#555" />
      <path v-if="name === 'plus'" d="M6 16h20M16 6v20" stroke="#555" stroke-width="4" />
      <path v-if="name === 'minus'" d="M6 16h20" stroke="#555" stroke-width="4" />
    </g>
    <g v-else-if="['width', 'page'].includes(name)" fill="#f3f3ed" stroke="#aaa">
      <path d="M8 2h12l6 6v22H8z" />
      <path d="M20 2v7h6" fill="#aaa" />
      <path v-if="name === 'width'" d="M2 24h28M4 20v8m24-8v8" stroke="#fff" stroke-width="2" />
      <g v-else fill="#555" stroke="none"><path d="M12 21h2v7h-2zm4 0h2v7h-2zm4 0h2v7h-2z" /></g>
    </g>
    <g v-else-if="name === 'grid'" fill="#f8f8f1" stroke="#aaa"><path d="M3 3h11v11H3zm15 0h11v11H18zM3 18h11v11H3zm15 0h11v11H18z" /></g>
    <g v-else-if="name === 'search'" fill="none" stroke="#f3f3ed" stroke-width="5">
      <circle cx="20" cy="12" r="9" />
      <path d="M14 19 3 30" />
    </g>
    <g v-else-if="name === 'book'" fill="none" stroke="#fff" stroke-width="2.4"><path d="M2 5q7-4 14 1 7-5 14-1v24q-7-5-14-1-7-4-14 1zM16 6v22" /></g>
    <g v-else-if="name === 'bookmark'" stroke="#777">
      <path d="M8 2h16v28l-8-6-8 6z" fill="currentColor" />
      <path d="M11 4h2v20" stroke="#ffffffaa" />
    </g>
  </svg>
</template>
