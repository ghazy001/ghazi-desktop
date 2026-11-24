<script setup>
import profile from '@/data/profile-data.json'
import { useConnectionStore } from '@/stores/connectionStore'
const connectionStore = useConnectionStore()
</script>

<template>
  <router-link to="/office" class="xp-login-account" @click="connectionStore.login()" :aria-label="$t('login.logIn', { name: profile.name })">
    <img class="xp-login-photo" :src="profile.photo" :alt="profile.name" />
    <span class="xp-login-identity">
      <span class="xp-login-name">{{ profile.name }}</span>
      <span class="xp-login-role">{{ $t('login.role') }}</span>
    </span>
  </router-link>
</template>

<style scoped>
.xp-login-account {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  text-decoration: none;
  width: max-content;
  max-width: 100%;
  font-family: Arial, Tahoma, sans-serif;
}
.xp-login-photo {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: 3px solid #fff;
  border-radius: 4px;
  box-shadow: 1px 2px 3px #294a9370;
  flex-shrink: 0;
}
.xp-login-identity {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.xp-login-name {
  font-size: 28px;
  line-height: 1.1;
  color: white;
  font-weight: 400;
}
.xp-login-role {
  font-size: 15px;
  line-height: 1.35;
  color: #071b63;
  font-weight: 700;
}
.xp-login-account:hover {
  background: linear-gradient(90deg, #1742a44d, transparent);
  border-color: #c2d6ff70 transparent #c2d6ff70 #c2d6ff70;
}
.xp-login-account:focus-visible {
  outline: 2px dotted white;
  outline-offset: 3px;
  background: #1742a440;
}
.xp-login-account:hover .xp-login-photo {
  border-color: #fff3a5;
}
@media (max-width: 520px) {
  .xp-login-name {
    font-size: 25px;
  }
  .xp-login-photo {
    width: 64px;
    height: 64px;
  }
}
</style>
