<template>
  <div class="mt-2 mb-5">
    <h4 class="font-trebuchet-pixel uppercase text-xs">{{ workExperience.jobTitle }}</h4>
    <p class="font-trebuchet-pixel font-medium text-xs">
      <a :href="workExperience.url" target="_blank" rel="noopener noreferrer">{{ workExperience.company }}</a> | {{ workExperience.year }}
    </p>
    <ul class="font-trebuchet-pixel list-disc pl-5 text-xs">
      <li v-for="(responsibility, index) in workExperience.responsibilities" :key="index">
        {{ responsibility }}
      </li>
    </ul>
    <p v-if="workExperience.technologies" class="text-xs mt-2">{{ workExperience.technologies.join(' · ') }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  workExperience: Object
})
</script>
