<script setup>
import profile from '@/data/profile-data.json'
</script>

<template>
  <div class="login-brand" :aria-label="profile.firstName + ' XP'">
    <img class="login-brand-flag" src="/img/windows-xp-flag.png" alt="" />
    <div class="login-brand-name">{{ profile.firstName }}<span>xp</span></div>
    <div class="login-brand-role">{{ $t('login.role') }}</div>
  </div>
</template>

<style scoped>
.login-brand {
  width: max-content;
  color: #fff;
  font-family: Arial, Tahoma, sans-serif;
}
.login-brand-flag {
  display: block;
  width: 108px;
  height: 108px;
  object-fit: contain;
  margin: 0 26px -3px auto;
}
.login-brand-name {
  font-size: 54px;
  font-weight: 600;
  letter-spacing: -2.8px;
  line-height: 1;
  white-space: nowrap;
}
.login-brand-name > span {
  display: inline-block;
  color: #f87725;
  font-size: 32px;
  font-weight: 400;
  vertical-align: top;
  margin: -7px 0 0 3px;
  letter-spacing: -1.8px;
}
.login-brand-role {
  font-size: 17px;
  line-height: 1.2;
  font-style: italic;
  padding-left: 7px;
}
</style>
