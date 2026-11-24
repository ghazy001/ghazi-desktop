<script setup>
defineProps({ name: { type: String, required: true } })
</script>
<template>
  <svg class="wmp8-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
    <path v-if="name === 'play'" d="M6 3.5 16 10 6 16.5Z" fill="currentColor" />
    <path v-else-if="name === 'pause'" d="M5 4h4v12H5zm7 0h4v12h-4z" fill="currentColor" />
    <path v-else-if="name === 'stop'" d="M6 6h8v8H6z" fill="currentColor" />
    <path v-else-if="name === 'previous'" d="M3 5h2v10H3zm13 0L7 10l9 5z" fill="currentColor" />
    <path v-else-if="name === 'next'" d="M15 5h2v10h-2zM4 5v10l9-5z" fill="currentColor" />
    <path v-else-if="name === 'rewind'" d="m9 4-7 6 7 6zm9 0-7 6 7 6z" fill="currentColor" />
    <path v-else-if="name === 'fast-forward'" d="m2 4 7 6-7 6zm9 0 7 6-7 6z" fill="currentColor" />
    <g v-else-if="name === 'volume' || name === 'muted'" stroke-linejoin="round">
      <path d="M1.5 7h4L11 3v14l-5.5-4h-4z" fill="#e4efff" stroke="#365786" stroke-width=".9" />
      <path d="M2.5 8h3M7 6l3-2" fill="none" stroke="white" stroke-width=".8" />
      <g v-if="name === 'volume'" fill="none" stroke="#e4efff" stroke-width="1.4">
        <path d="M13 6.5c2 2 2 5 0 7" />
        <path d="M15.5 4.5c3 3 3 8 0 11" />
      </g>
      <path v-else d="m13 7 5 6m0-6-5 6" fill="none" stroke="#a92525" stroke-width="1.6" />
    </g>
    <g v-else-if="name === 'playlist'" fill="currentColor"><path d="m2 5 4 2.5L2 10zM8 5h9v2H8zm0 4h9v2H8zm-6 4h15v2H2z" /></g>
    <g v-else-if="name === 'document'" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M4 2h8l4 4v12H4zM12 2v4h4M6 9h8M6 12h8M6 15h6" /></g>
    <g v-else-if="name === 'artwork'" fill="none" stroke="currentColor" stroke-width="1.2">
      <path d="M3 4h14v12H3z" />
      <path d="m4 14 4-5 3 3 2-2 3 4" />
      <path d="M13 6h1v1h-1z" />
    </g>
    <g v-else-if="name === 'shuffle'" fill="none" stroke="currentColor" stroke-width="1.4">
      <path d="M2 5h3c4 0 5 10 9 10h3M2 15h3c4 0 5-10 9-10h3" />
      <path d="m14 2 3 3-3 3m0 4 3 3-3 3" />
    </g>
    <g v-else-if="name === 'switch'" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 8 4-4 4 4m-8 4 4 4 4-4" /></g>
    <g v-else-if="name === 'maximize'" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 5h13v11H3zM3 7h13m-5-4h6v6M17 3l-7 7" /></g>
  </svg>
</template>
