<script setup>
import profile from '@/data/profile-data.json'
import ContentCenter from '@/layouts/ContentCenter.vue'
import LoadingBar from './LoadingBar.vue'
import LoginBrand from './LoginBrand.vue'
</script>

<template>
  <ContentCenter class="bg-black">
    <template #center>
      <LoginBrand />
    </template>

    <template #bottom-center>
      <LoadingBar />
    </template>

    <template #bottom>
      <div class="app-container absolute bottom-0 md:my-16 my-8">
        <div>
          <div class="flex justify-between items-center gap-8 text-white">
            <div>
              <h1 class="md:text-xl text-sm">{{ $t('message.welcome') }}</h1>
            </div>
            <div>
              <h2 class="md:text-2xl text-md tracking-tighter font-helvetica font-semibold">{{ profile.name }}</h2>
            </div>
          </div>
        </div>
      </div>
    </template>
  </ContentCenter>
</template>
