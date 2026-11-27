<script setup>
import { computed } from 'vue'
import { RANKS } from '@/lib/spider-solitaire.mjs'
import { cardArtwork, SPIDER_ART } from '@/lib/spider-card-art.mjs'
const props = defineProps({ card: Object, back: Boolean })
const symbols = { spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦' }
const source = computed(() => (props.back ? `${SPIDER_ART}back.png` : cardArtwork(props.card)))
</script>
<template>
  <div class="spider-playing-card" :class="{ 'spider-card-back': back, 'spider-card-red': ['hearts', 'diamonds'].includes(card?.suit) }" aria-hidden="true">
    <img :src="source" alt="" width="71" height="96" draggable="false" decoding="sync" />
    <span v-if="!back && card" class="spider-compact-rank"
      >{{ RANKS[card.rank - 1] }}<i>{{ symbols[card.suit] }}</i></span
    >
  </div>
</template>
