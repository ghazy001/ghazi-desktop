export const SPIDER_ART = '/game/spider/'
export const CARD_OFFSETS = Object.freeze({ clubs: 0, diamonds: 13, hearts: 26, spades: 39 })
export function cardArtwork(card) {
  if (!card || !Object.hasOwn(CARD_OFFSETS, card.suit) || !Number.isInteger(card.rank) || card.rank < 1 || card.rank > 13) return `${SPIDER_ART}back.png`
  return `${SPIDER_ART}card-${CARD_OFFSETS[card.suit] + card.rank}.png`
}
