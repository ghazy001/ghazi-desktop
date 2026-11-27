<script setup>
import config from '@/data/computer-data.json'
defineProps({ kind: String })
</script>
<template>
  <img :src="config.driveIcons[kind] || config.driveIcons.system" alt="" aria-hidden="true" />
</template>
