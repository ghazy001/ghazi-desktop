<script setup>
import profile from '@/data/profile-data.json'
</script>
<template>
  <div class="xp-profile-heading">
    <img :src="profile.photo" :alt="profile.name" width="64" height="64" />
    <div>
      <h1>{{ profile.name }}</h1>
      <p>{{ profile.title }}</p>
      <p>{{ profile.location }}</p>
      <a :href="'mailto:' + profile.email">{{ profile.email }}</a>
    </div>
  </div>
</template>
