<script setup>
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { onMounted, watch } from 'vue'

const route = useRoute()

const updateMetaTags = (to) => {
  useHead({
    title: to.meta.title || 'Default title',
    meta: (to.meta.metaTags || []).map((tag) => ({
      ...(tag.property ? { property: tag.property } : { name: tag.name }),
      content: tag.content
    }))
  })
}

onBeforeRouteUpdate((to, from, next) => {
  updateMetaTags(to)
  next()
})

onMounted(() => {
  updateMetaTags(route)
})

watch(route, (newRoute) => {
  updateMetaTags(newRoute)
})
</script>

<template>
  <div></div>
</template>
