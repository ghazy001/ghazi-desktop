<script setup>
defineProps({ name: String })
</script>
<template>
  <svg class="ie-icon" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
    <g v-if="name === 'home'" stroke-linejoin="round">
      <path d="M5 12h18v12H5z" fill="#e6ebf7" stroke="#7a8cb6" />
      <path d="M3 13 14 3l11 10h-4l-7-6-7 6z" fill="#ed8a69" stroke="#a34d38" />
      <path d="M8 15h5v9H8z" fill="#7595d1" />
      <path d="M16 15h4v4h-4z" fill="#c7e6ff" stroke="#7597c3" />
      <path d="M19 4h3v6l-3-3z" fill="#dca080" />
    </g>
    <path
      v-else-if="name === 'favorites'"
      d="m14 2 3.5 7.8 8.5 1-6.2 6 1.7 8.2-7.5-4.2L6.5 25l1.7-8.2L2 10.8l8.5-1z"
      fill="#ffda42"
      stroke="#b88a00"
      stroke-width="1.2"
      stroke-linejoin="round"
    />
    <g v-else-if="name === 'history'">
      <circle cx="13" cy="13" r="10" fill="#c0e7ff" stroke="#5c8bbd" />
      <path d="M13 6v7l5 3" fill="none" stroke="#445e8c" stroke-width="2" />
      <path d="M23 12a10 10 0 0 1-17 9" fill="none" stroke="#4d9a43" stroke-width="3" />
      <path d="m3 15 1 9 8-2z" fill="#63b953" stroke="#3e8735" />
    </g>
    <g v-else-if="name === 'print'">
      <path d="M8 2h13v9H8z" fill="#fff" stroke="#888" />
      <path d="M3 11h22v10H3z" fill="#bfc3c8" stroke="#7c828c" />
      <path d="M7 17h15v9H7z" fill="#f6f7f8" stroke="#92969e" />
      <path d="M10 20h9m-9 3h9" stroke="#9da3ab" />
      <path d="M5 13h3v2H5z" fill="#6bca73" />
    </g>
    <g v-else-if="name === 'external'" fill="none" stroke="#426caa" stroke-width="2">
      <path d="M12 6H4v18h18v-8M15 3h10v10M25 3 12 16" />
      <path d="M5 7h6v6H5z" fill="#deedff" stroke="none" />
    </g>
    <g v-else-if="name === 'search'">
      <circle cx="11" cy="11" r="7" fill="#b8e0ff" stroke="#5c83a7" stroke-width="2" />
      <path d="m16 16 8 8" stroke="#8b795b" stroke-width="5" />
      <path d="M7 8 12 6" stroke="white" stroke-width="2" />
    </g>
  </svg>
</template>
