'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getAttemptsLeft, getAdAttemptsLeft, addAdAttempt,
  isHammerActive, activateHammer,
  isDiamondBoosted, activateDiamondBoost, getDiamondBoostRemainingMs,
  getStreak, getTodayValue
} from '../lib/gameState'
import { rollSpoon } from '../lib/spoonLogic'
import { getCollection } from '../lib/collectionState'
import { showAd } from '../lib/adsInToss'

export default function MainScreen({ onStartAttempt, onGoCollection }) {
  const [attemptsLeft, setAttemptsLeft] = useState(0)
  const [adAttemptsLeft, setAdAttemptsLeft] = useState(0)
  const [hammerActive, setHammerActive] = useState(false)
  const [diamondBoosted, setDiamondBoosted] = useState(false)
  const [boostRemaining, setBoostRemaining] = useState(0)
  const [streak, setStreak] = useState(1)
  const [todayValue, setTodayValue] = useState(0)
  const [collection, setCollection] = useState([])
  const [adLoading, setAdLoading] = useState(null) // 'attempt' | 'hammer' | 'diamond'
  const [toast, setToast] = useState(null)

  const refreshState = useCallback(() => {
    setAttemptsLeft(getAttemptsLeft())
    setAdAttemptsLeft(getAdAttemptsLeft())
    setHammerActive(isHammerActive())
    setDiamondBoosted(isDiamondBoosted())
    setBoostRemaining(getDiamondBoostRemainingMs())
    setStreak(getStreak())
    setTodayValue(getTodayValue())
    setCollection(getCollection())
  }, [])

  useEffect(() => {
    refreshState()
    const timer = setInterval(() => {
      setBoostRemaining(getDiamondBoostRemainingMs())
      setDiamondBoosted(isDiamondBoosted())
    }, 1000)
    return () => clearInterval(timer)
  }, [refreshState])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleAdAttempt() {
    if (adLoading) return
    setAdLoading('attempt')
    try {
      const rewarded = await showAd()
      if (rewarded) {
        const added = addAdAttempt()
        if (added) {
          refreshState()
          showToast('🎉 기회 1회 추가!')
        } else {
          showToast('오늘 추가 기회를 모두 사용했어요')
        }
      } else {
        showToast('광고를 끝까지 시청해야 보상을 받을 수 있어요')
      }
    } finally {
      setAdLoading(null)
    }
  }

  async function handleAdHammer() {
    if (adLoading || hammerActive) return
    setAdLoading('hammer')
    try {
      const rewarded = await showAd()
      if (rewarded) {
        activateHammer()
        refreshState()
        showToast('🔨 해머 강화! 오늘 탭수가 절반이 됩니다')
      } else {
        showToast('광고를 끝까지 시청해야 보상을 받을 수 있어요')
      }
    } finally {
      setAdLoading(null)
    }
  }

  async function handleAdDiamond() {
    if (adLoading || diamondBoosted) return
    setAdLoading('diamond')
    try {
      const rewarded = await showAd()
      if (rewarded) {
        activateDiamondBoost()
        refreshState()
        showToast('💎 다이아 확률 ×10 부스터 1시간!')
      } else {
        showToast('광고를 끝까지 시청해야 보상을 받을 수 있어요')
      }
    } finally {
      setAdLoading(null)
    }
  }

  function handleStart() {
    if (attemptsLeft <= 0) return
    const spoon = rollSpoon(diamondBoosted)
    onStartAttempt(spoon)
  }

  const todaySpoons = collection.filter(t => t.count > 0)
  const totalValue = collection.reduce((s, t) => s + t.value * t.count, 0)

  const boostMins = Math.floor(boostRemaining / 60000)
  const boostSecs = Math.floor((boostRemaining % 60000) / 1000)
  const boostDisplay = `${boostMins}:${String(boostSecs).padStart(2, '0')}`

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] select-none"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>

      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3">
        <h1 className="text-[18px] font-bold text-[#191F28]">숟가락 대장간</h1>
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
            className="flex items-center gap-1 bg-orange-100 text-orange-600 text-[13px] font-semibold px-3 py-1 rounded-full"
          >
            🔥 {streak}일
          </motion.div>
        )}
      </div>

      {/* 남은 기회 pill */}
      <div className="flex justify-center mt-1">
        <div className="bg-[#EBF3FF] text-[#0064FF] text-[14px] font-semibold px-4 py-1.5 rounded-full">
          오늘 남은 기회: {attemptsLeft}회
        </div>
      </div>

      {/* 바위 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 py-4">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="flex items-center justify-center"
          style={{ fontSize: 160, lineHeight: 1, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.12))' }}
        >
          🪨
        </motion.div>

        {/* 광고 오퍼 버튼 2개 */}
        <div className="flex gap-3 w-full max-w-xs">
          {/* 해머 강화 */}
          <button
            onClick={handleAdHammer}
            disabled={!!adLoading || hammerActive}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all
              ${hammerActive
                ? 'bg-green-50 border-green-200 text-green-600'
                : 'bg-white/80 border-[#E8EDF2] text-[#191F28] active:scale-95'
              } disabled:opacity-60`}
          >
            {adLoading === 'hammer' ? (
              <div className="w-5 h-5 border-2 border-[#0064FF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xl">{hammerActive ? '✅' : '🔨'}</span>
            )}
            <span className="text-[11px] font-medium leading-tight text-center">
              {hammerActive ? '강화 중' : '해머 강화'}
            </span>
          </button>

          {/* 다이아 부스터 */}
          <button
            onClick={handleAdDiamond}
            disabled={!!adLoading || diamondBoosted}
            className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border transition-all
              ${diamondBoosted
                ? 'bg-sky-50 border-sky-200 text-sky-600'
                : 'bg-white/80 border-[#E8EDF2] text-[#191F28] active:scale-95'
              } disabled:opacity-60`}
          >
            {adLoading === 'diamond' ? (
              <div className="w-5 h-5 border-2 border-[#0064FF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xl">💎</span>
            )}
            <span className="text-[11px] font-medium leading-tight text-center">
              {diamondBoosted ? boostDisplay : '확률 ×10'}
            </span>
          </button>
        </div>
      </div>

      {/* 하단 카드: 오늘 획득 수저 요약 */}
      <div className="px-4 pb-4">
        <div
          className="bg-white/90 rounded-2xl p-4 shadow-sm border border-[#E8EDF2] mb-3 cursor-pointer active:opacity-80 transition-opacity"
          onClick={onGoCollection}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-[#191F28]">오늘 획득한 수저</span>
            <span className="text-[13px] text-[#0064FF] font-medium">보관함 →</span>
          </div>
          {todaySpoons.length > 0 ? (
            <div className="flex items-center gap-3">
              {todaySpoons.slice(0, 4).map(t => (
                <div key={t.id} className="flex flex-col items-center gap-0.5">
                  <img src={t.svgSrc} alt={t.label} className="w-9 h-9 object-contain" />
                  <span className="text-[11px] text-[#6B7684]">{t.count}개</span>
                </div>
              ))}
              {todayValue > 0 && (
                <div className="ml-auto text-[13px] font-semibold text-[#191F28]">
                  합계 {totalValue.toLocaleString()}원
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-[#6B7684]">아직 수저를 만들지 않았어요</p>
          )}
        </div>

        {/* CTA 버튼 */}
        {attemptsLeft > 0 ? (
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-[#0064FF] text-white text-[16px] font-bold shadow-md active:scale-95 transition-transform"
          >
            숟가락 만들기
          </button>
        ) : adAttemptsLeft > 0 ? (
          <button
            onClick={handleAdAttempt}
            disabled={!!adLoading}
            className="w-full py-4 rounded-2xl bg-white border-2 border-[#0064FF] text-[#0064FF] text-[16px] font-bold active:scale-95 transition-transform disabled:opacity-60"
          >
            {adLoading === 'attempt' ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[#0064FF] border-t-transparent rounded-full animate-spin" />
                광고 불러오는 중...
              </div>
            ) : (
              '광고 보고 1회 추가'
            )}
          </button>
        ) : (
          <button
            disabled
            className="w-full py-4 rounded-2xl bg-[#E8EDF2] text-[#B0B8C1] text-[16px] font-bold"
          >
            내일 다시 오세요 🌙
          </button>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#191F28]/90 text-white text-[13px] font-medium px-4 py-2.5 rounded-full whitespace-nowrap z-50"
            style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
