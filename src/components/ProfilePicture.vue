<script setup>
import profile from '@/data/profile-data.json'
</script>
<template>
  <div class="rounded-lg bg-no-repeat bg-cover bg-center" :style="{ backgroundImage: `url(${profile.photo})` }" role="img" :aria-label="profile.name"></div>
</template>
