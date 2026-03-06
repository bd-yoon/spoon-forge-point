/**
 * 일일 게임 상태 관리
 * KST 자정 기준 리셋
 */

const PREFIX = 'spoon_'

// KST 날짜 문자열 (필수 패턴: UTC +9h)
export const getKSTDateStr = () =>
  new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

// SSR-safe localStorage
const ls = () => typeof window !== 'undefined' ? window.localStorage : null

const key = (k) => PREFIX + k

// ── 일일 리셋 ────────────────────────────────────────────
export function resetDailyStateIfNewDay() {
  const store = ls()
  if (!store) return

  const today = getKSTDateStr()
  const stored = store.getItem(key('dailyDate'))

  if (stored !== today) {
    store.setItem(key('dailyDate'), today)
    store.removeItem(key('attemptsUsed'))
    store.removeItem(key('adAttemptsUsed'))
    store.removeItem(key('hammerActive'))
    store.removeItem(key('exchangedToday'))
    store.removeItem(key('todayValue'))
    // diamondBoostExpiry는 타임스탬프 기반이라 별도 만료 체크
    _updateStreak(store, today)
  }
}

function _updateStreak(store, today) {
  const lastVisit = store.getItem(key('lastVisitDate'))
  const streak = parseInt(store.getItem(key('streakCount')) || '0')

  if (!lastVisit) {
    store.setItem(key('streakCount'), '1')
  } else {
    const yesterday = new Date(Date.now() + 9 * 3600 * 1000 - 86400000)
      .toISOString().slice(0, 10)
    store.setItem(key('streakCount'), lastVisit === yesterday ? String(streak + 1) : '1')
  }
  store.setItem(key('lastVisitDate'), today)
}

// ── 기회 수 ──────────────────────────────────────────────
const FREE_ATTEMPTS = 2
const MAX_AD_ATTEMPTS = 3

export function getAttemptsLeft() {
  const used = parseInt(ls()?.getItem(key('attemptsUsed')) || '0')
  const adUsed = parseInt(ls()?.getItem(key('adAttemptsUsed')) || '0')
  return Math.max(0, FREE_ATTEMPTS + adUsed - used)
}

export function useAttempt() {
  const used = parseInt(ls()?.getItem(key('attemptsUsed')) || '0')
  ls()?.setItem(key('attemptsUsed'), String(used + 1))
}

export function getAdAttemptsLeft() {
  const adUsed = parseInt(ls()?.getItem(key('adAttemptsUsed')) || '0')
  return Math.max(0, MAX_AD_ATTEMPTS - adUsed)
}

export function addAdAttempt() {
  const adUsed = parseInt(ls()?.getItem(key('adAttemptsUsed')) || '0')
  if (adUsed < MAX_AD_ATTEMPTS) {
    ls()?.setItem(key('adAttemptsUsed'), String(adUsed + 1))
    return true
  }
  return false
}

// ── 해머 강화 (당일 전체) ─────────────────────────────────
export function isHammerActive() {
  return ls()?.getItem(key('hammerActive')) === 'true'
}

export function activateHammer() {
  ls()?.setItem(key('hammerActive'), 'true')
}

// ── 다이아 부스터 (1시간 타임스탬프 기반) ─────────────────
export function isDiamondBoosted() {
  const expiry = parseInt(ls()?.getItem(key('diamondBoostExpiry')) || '0')
  return Date.now() < expiry
}

export function getDiamondBoostRemainingMs() {
  const expiry = parseInt(ls()?.getItem(key('diamondBoostExpiry')) || '0')
  return Math.max(0, expiry - Date.now())
}

export function activateDiamondBoost() {
  const expiry = Date.now() + 60 * 60 * 1000 // 1시간
  ls()?.setItem(key('diamondBoostExpiry'), String(expiry))
}

// ── 교환 상태 ─────────────────────────────────────────────
export function hasExchangedToday() {
  return ls()?.getItem(key('exchangedToday')) === 'true'
}

export function setExchangedToday() {
  ls()?.setItem(key('exchangedToday'), 'true')
}

// ── 오늘 획득 포인트 합산 ────────────────────────────────
export function getTodayValue() {
  return parseInt(ls()?.getItem(key('todayValue')) || '0')
}

export function addTodayValue(amount) {
  const current = getTodayValue()
  ls()?.setItem(key('todayValue'), String(current + amount))
}

// ── 스트릭 ────────────────────────────────────────────────
export function getStreak() {
  return parseInt(ls()?.getItem(key('streakCount')) || '1')
}
