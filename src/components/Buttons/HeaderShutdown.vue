<script setup>
const emit = defineEmits(['select'])
</script>
<template>
  <button @click="emit('select')" class="flex text-white text-xs h-full items-center buttons-header-bottom px-1 full-screen">
    <img src="/img/icons/shutdown-icon.webp" alt="" class="w-6 h-6 sm:w-7 sm:h-7 mr-0.5 sm:mr-1" />
    <p class="small-p">{{ $t('header.shutdown') }}</p>
  </button>
</template>
