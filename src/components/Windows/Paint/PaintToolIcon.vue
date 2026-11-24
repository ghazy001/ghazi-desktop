<script setup>
defineProps({ name:String })
</script>
<template>
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#222" stroke-width="1" stroke-linejoin="round" aria-hidden="true">
    <path v-if="name==='lasso'" d="M5 3 2 8 5 10 2 14 7 17 9 14 15 14 17 8 13 6 14 3 9 4Z" stroke-dasharray="2 1" />
    <rect v-else-if="name==='select'" x="3" y="4" width="14" height="12" stroke-dasharray="2 1" />
    <g v-else-if="name==='eraser'"><path d="m3 12 8-9 6 5-8 9Z" fill="#ffe5a4"/><path d="m3 12 5 4 3-4-5-4Z" fill="#fff" /></g>
    <g v-else-if="name==='fill'"><path d="m3 9 7-7 6 7-7 7Z" fill="#d1d8dc"/><path d="m7 4 2-2 4 4M1 17h14"/><path d="M17 11c0 0-3 4-3 5a3 3 0 0 0 6 0c0-1-3-5-3-5" fill="#265cae"/></g>
    <g v-else-if="name==='picker'"><path d="m3 17 4-1 8-8-3-3-8 8Z" fill="#afd5c9"/><path d="m11 4 5 5M13 3l3-2 3 3-2 3" fill="#166450"/></g>
    <g v-else-if="name==='zoom'"><circle cx="8" cy="7" r="5" fill="#d6edf4"/><path d="m12 11 5 7" stroke-width="3"/></g>
    <g v-else-if="name==='pencil'"><path d="m4 14 9-12 4 3-9 12-5 2Z" fill="#ffe68e"/><path d="m13 2 2-1 3 2-1 2" fill="#eda0ab"/><path d="m3 19 2-5 3 3Z" fill="#333"/></g>
    <g v-else-if="name==='brush'"><path d="m9 10 4-9 3 2-5 9" fill="#d8ab68"/><path d="M7 10c-3 2-1 5-4 7 5 2 10-1 9-5Z" fill="#8f7653"/></g>
    <g v-else-if="name==='spray'"><path d="M4 7h6v11H4ZM5 4h4v3" fill="#d0d6d0"/><path d="M8 3h4"/><path d="M13 3h1m2 1h1m-2 2h1m2 1h1m-5 1h1m2 2h1m-5 1h1m3 1h1" stroke="#246abb"/></g>
    <text v-else-if="name==='text'" x="2" y="16" fill="#111" stroke="none" font-family="serif" font-size="18" font-weight="bold">A</text>
    <path v-else-if="name==='line'" d="M3 3 17 17" />
    <path v-else-if="name==='curve'" d="M5 3c15 6-12 8 9 14" />
    <rect v-else-if="name==='rectangle'" x="3" y="5" width="14" height="11" fill="#c5c7be"/>
    <path v-else-if="name==='polygon'" d="m3 15 4-11 3 6 7-4-4 9Z" fill="#c5c7be"/>
    <ellipse v-else-if="name==='ellipse'" cx="10" cy="10" rx="7" ry="5" fill="#c5c7be"/>
    <rect v-else-if="name==='rounded'" x="3" y="5" width="14" height="11" rx="3" fill="#c5c7be"/>
    <g v-else-if="name==='save'"><path d="M3 2h12l3 3v13H3Z" fill="#829fc4"/><path d="M6 2h8v5H6ZM6 11h9v7H6Z" fill="white"/><path d="M11 3v3M8 14h5M8 16h5"/></g>
    <path v-else-if="name==='undo'" d="m7 3-5 5 5 4V9c8-2 10 4 7 8 8-7 1-14-7-11Z" fill="#487db3"/>
    <path v-else-if="name==='redo'" d="m13 3 5 5-5 4V9c-8-2-10 4-7 8C-2 10 5 3 13 6Z" fill="#487db3"/>
  </svg>
</template>
