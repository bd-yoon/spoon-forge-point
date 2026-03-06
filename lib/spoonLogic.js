/**
 * 수저 티어 테이블 및 확률 로직
 */

export const SPOON_TIERS = [
  { id: 'diamond', label: '다이아 수저', emoji: '💎', svgSrc: '/spoons/spoon-diamond.svg', value: 1000, prob: 0.00001, taps: 10000, color: '#5BCEFA', glow: 'rgba(91,206,250,0.3)' },
  { id: 'gold',    label: '금수저',      emoji: '🥇', svgSrc: '/spoons/spoon-gold.svg',    value: 10,   prob: 0.10,    taps: 100,   color: '#F5A623', glow: 'rgba(245,166,35,0.3)' },
  { id: 'silver',  label: '은수저',      emoji: '🥈', svgSrc: '/spoons/spoon-silver.svg',  value: 5,    prob: 0.20,    taps: 50,    color: '#A0A8B0', glow: 'rgba(160,168,176,0.3)' },
  { id: 'bronze',  label: '동수저',      emoji: '🥉', svgSrc: '/spoons/spoon-bronze.svg',  value: 3,    prob: 0.30,    taps: 30,    color: '#CD7F32', glow: 'rgba(205,127,50,0.3)' },
  { id: 'stone',   label: '돌수저',      emoji: '🪨', svgSrc: '/spoons/spoon-stone.svg',   value: 1,    prob: 0.40,    taps: 10,    color: '#6B7280', glow: 'rgba(107,114,128,0.2)' },
]

/** 확률을 사용자 표시용 퍼센트 문자열로 변환 */
export function formatProb(prob) {
  const pct = prob * 100
  if (pct < 0.01) return pct.toFixed(3) + '%'
  if (pct < 1) return pct.toFixed(1) + '%'
  return pct.toFixed(0) + '%'
}

/**
 * 수저 추첨 (attempt 시작 시 1회 호출)
 * @param {boolean} diamondBoosted - 다이아 부스터 활성 여부 (확률 ×10)
 * @returns {object} SPOON_TIERS 항목
 */
export function rollSpoon(diamondBoosted = false) {
  const tiers = SPOON_TIERS.map(t =>
    t.id === 'diamond' && diamondBoosted
      ? { ...t, prob: t.prob * 10 }
      : t
  )
  const rand = Math.random()
  let cumulative = 0
  for (const tier of tiers) {
    cumulative += tier.prob
    if (rand < cumulative) return tier
  }
  return SPOON_TIERS[SPOON_TIERS.length - 1] // fallback: 돌수저
}

/**
 * 목표 탭 수 계산
 * @param {object} tier - SPOON_TIERS 항목
 * @param {boolean} hammerActive - 해머 강화 여부 (탭수 절반)
 * @returns {number}
 */
export function getTapCount(tier, hammerActive = false) {
  return hammerActive ? Math.ceil(tier.taps / 2) : tier.taps
}

/**
 * id로 티어 찾기
 */
export function getTierById(id) {
  return SPOON_TIERS.find(t => t.id === id) || SPOON_TIERS[SPOON_TIERS.length - 1]
}
