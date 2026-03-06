/**
 * 누적 수저 보관함 (일일 리셋 없음, 영구 보존)
 */

import { SPOON_TIERS } from './spoonLogic'

const PREFIX = 'spoon_'
const ls = () => typeof window !== 'undefined' ? window.localStorage : null
const key = (k) => PREFIX + k

/**
 * 수저 1개 추가
 * @param {string} tierId - 'diamond' | 'gold' | 'silver' | 'bronze' | 'stone'
 */
export function addSpoon(tierId) {
  const current = parseInt(ls()?.getItem(key('count_' + tierId)) || '0')
  ls()?.setItem(key('count_' + tierId), String(current + 1))
}

/**
 * 전체 보관함 조회
 * @returns {Array} [{...tier, count}]
 */
export function getCollection() {
  return SPOON_TIERS.map(t => ({
    ...t,
    count: parseInt(ls()?.getItem(key('count_' + t.id)) || '0'),
  }))
}

/**
 * 보관함 전체 가치 합산 (원)
 */
export function getTotalValue() {
  return getCollection().reduce((sum, t) => sum + t.value * t.count, 0)
}

/**
 * 교환 처리: 보관함 수저 전량 차감, 교환 금액 반환
 * @returns {number} 교환된 포인트 금액
 */
export function exchangeAll() {
  const collection = getCollection()
  const total = collection.reduce((sum, t) => sum + t.value * t.count, 0)
  collection.forEach(t => {
    if (t.count > 0) {
      ls()?.removeItem(key('count_' + t.id))
    }
  })
  return total
}
