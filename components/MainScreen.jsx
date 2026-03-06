'use client'

const ROCK_THOUGHTS = [
  '나는 커서 무엇이 될까... 🤔',
  '금수저가 되고 싶다... ✨',
  '누가 좀 두드려줬으면...',
  '다이아몬드 꿈 꿨어 💎',
  '오늘도 열심히 살아야지 🪨',
  '두드리면 열린다던데...',
  '나도 빛나고 싶어 🌟',
  '은수저도 나쁘지 않지...',
  '오늘 운이 좋을 것 같은데? 🍀',
  '따뜻한 봄이 오면 수저가 될 거야...',
]

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import {
  getAttemptsLeft, getAdAttemptsLeft, addAdAttempt,
  isHammerActive, activateHammer,
  isDiamondBoosted, activateDiamondBoost, getDiamondBoostRemainingMs,
  getTodayValue,
  useAttempt, addTodayValue,
} from '../lib/gameState'
import { rollSpoon, getTapCount } from '../lib/spoonLogic'
import { getCollection } from '../lib/collectionState'
import { addSpoon } from '../lib/collectionState'
import { showAd } from '../lib/adsInToss'

export default function MainScreen({ onTappingComplete, onGoCollection }) {
  const [attemptsLeft, setAttemptsLeft] = useState(0)
  const [adAttemptsLeft, setAdAttemptsLeft] = useState(0)
  const [hammerActive, setHammerActive] = useState(false)
  const [diamondBoosted, setDiamondBoosted] = useState(false)
  const [boostRemaining, setBoostRemaining] = useState(0)
  const [todayValue, setTodayValue] = useState(0)
  const [collection, setCollection] = useState([])
  const [adLoading, setAdLoading] = useState(null) // 'attempt' | 'hammer' | 'diamond'
  const [toast, setToast] = useState(null)

  // 바위 생각 말풍선
  const [thought, setThought] = useState(null)

  // 탭핑 세션 상태
  const [isTapping, setIsTapping] = useState(false)
  const [tapCount, setTapCount] = useState(0)
  const [targetTaps, setTargetTaps] = useState(0)
  const completedRef = useRef(false)
  const tapStateRef = useRef({ spoon: null, targetTaps: 0 })

  // Canvas 파티클
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animFrameRef = useRef(null)

  // 바위 ref (hit-test용)
  const rockRef = useRef(null)

  // framer-motion 바위 bounce
  const tapControls = useAnimation()

  const refreshState = useCallback(() => {
    setAttemptsLeft(getAttemptsLeft())
    setAdAttemptsLeft(getAdAttemptsLeft())
    setHammerActive(isHammerActive())
    setDiamondBoosted(isDiamondBoosted())
    setBoostRemaining(getDiamondBoostRemainingMs())
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

  // Canvas 파티클 루프
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current = particlesRef.current.filter(p => p.life > 0)
      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.3
        p.life -= 0.04
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1
      animFrameRef.current = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // 바위 idle 생각 말풍선 타이머
  useEffect(() => {
    if (isTapping) {
      setThought(null)
      return
    }
    let timeoutId
    let dismissId
    function scheduleThought() {
      const delay = 3000 + Math.random() * 3000
      timeoutId = setTimeout(() => {
        const msg = ROCK_THOUGHTS[Math.floor(Math.random() * ROCK_THOUGHTS.length)]
        setThought(msg)
        dismissId = setTimeout(() => setThought(null), 1700)
        scheduleThought()
      }, delay)
    }
    scheduleThought()
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(dismissId)
    }
  }, [isTapping])

  function spawnParticles(x, y) {
    const colors = ['#8B95A1', '#A0A8B0', '#6B7280', '#C5CDD6']
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.8
      const speed = 2 + Math.random() * 4
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        r: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.8 + Math.random() * 0.4,
      })
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function _completeSession(spoon) {
    completedRef.current = true
    addSpoon(spoon.id)
    addTodayValue(spoon.value)
    useAttempt()
    setTimeout(() => onTappingComplete(spoon), 300)
  }

  function handleScreenTap(clientX, clientY) {
    if (completedRef.current) return

    // 항상 바위 위 탭만 허용
    if (rockRef.current) {
      const rect = rockRef.current.getBoundingClientRect()
      const padding = 24
      const inBounds =
        clientX >= rect.left - padding &&
        clientX <= rect.right + padding &&
        clientY >= rect.top - padding &&
        clientY <= rect.bottom + padding
      if (!inBounds) return
    }

    if (!isTapping) {
      if (attemptsLeft <= 0) return
      const spoon = rollSpoon(diamondBoosted)
      const taps = getTapCount(spoon, hammerActive)
      tapStateRef.current = { spoon, targetTaps: taps }
      setTargetTaps(taps)
      setTapCount(1)
      setIsTapping(true)
      spawnParticles(clientX, clientY)
      navigator.vibrate?.(10)
      tapControls.start({ scale: [1, 0.90, 1.05, 1], transition: { duration: 0.18 } })
      if (taps <= 1) { _completeSession(spoon) }
      return
    }

    const next = tapCount + 1
    setTapCount(next)
    spawnParticles(clientX, clientY)
    navigator.vibrate?.(10)
    tapControls.start({ scale: [1, 0.90, 1.05, 1], transition: { duration: 0.18 } })
    if (next >= tapStateRef.current.targetTaps && !completedRef.current) {
      _completeSession(tapStateRef.current.spoon)
    }
  }

  function handleTouch(e) {
    e.preventDefault()
    const touch = e.touches[0] || e.changedTouches[0]
    if (touch) handleScreenTap(touch.clientX, touch.clientY)
  }

  function handleClick(e) {
    handleScreenTap(e.clientX, e.clientY)
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

  const todaySpoons = collection.filter(t => t.count > 0)
  const totalValue = collection.reduce((s, t) => s + t.value * t.count, 0)

  const boostMins = Math.floor(boostRemaining / 60000)
  const boostSecs = Math.floor((boostRemaining % 60000) / 1000)
  const boostDisplay = `${boostMins}:${String(boostSecs).padStart(2, '0')}`

  const progress = targetTaps > 0 ? Math.min(tapCount / targetTaps, 1) : 0
  const crackStage = isTapping
    ? (progress < 0.33 ? 0 : progress < 0.66 ? 1 : progress < 1 ? 2 : 3)
    : 0
  const rockEmoji = crackStage === 3 ? '💥' : '🪨'

  return (
    <div
      className="relative w-full min-h-screen min-h-[100dvh] flex flex-col select-none overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        touchAction: isTapping ? 'none' : 'auto',
      }}
      onTouchStart={isTapping || attemptsLeft > 0 ? handleTouch : undefined}
      onClick={isTapping || attemptsLeft > 0 ? handleClick : undefined}
    >
      {/* Canvas 파티클 레이어 */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* 균열 오버레이 */}
      {crackStage >= 1 && (
        <svg
          className="fixed inset-0 pointer-events-none z-10"
          width="100%" height="100%"
          style={{ opacity: crackStage >= 2 ? 0.7 : 0.4 }}
        >
          <line x1="45%" y1="35%" x2="52%" y2="55%" stroke="#4B5563" strokeWidth={crackStage >= 2 ? 3 : 2} />
          <line x1="55%" y1="30%" x2="48%" y2="55%" stroke="#4B5563" strokeWidth={crackStage >= 2 ? 3 : 2} />
          {crackStage >= 2 && (
            <>
              <line x1="40%" y1="45%" x2="60%" y2="50%" stroke="#374151" strokeWidth="2" />
              <line x1="50%" y1="25%" x2="50%" y2="65%" stroke="#374151" strokeWidth="2" opacity="0.5" />
            </>
          )}
        </svg>
      )}

      {/* 헤더 */}
      <div className={`relative z-10 px-5 py-3 transition-opacity duration-300 ${isTapping ? 'opacity-40 pointer-events-none' : ''}`}>
        <h1 className="text-[18px] font-bold text-[#191F28]">숟가락 대장간</h1>
      </div>

      {/* 진행 바 (탭핑 중) */}
      <AnimatePresence>
        {isTapping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 px-5"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-semibold text-[#191F28] tabular-nums">
                {tapCount.toLocaleString()} / {targetTaps.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E8EDF2] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0064FF] rounded-full"
                style={{ width: `${progress * 100}%`, transition: 'width 0.08s linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 남은 기회 pill (탭핑 중 숨김) */}
      {!isTapping && (
        <div className="relative z-10 flex justify-center mt-3">
          <div className="bg-[#EBF3FF] text-[#0064FF] text-[14px] font-semibold px-4 py-1.5 rounded-full">
            오늘 남은 기회: {attemptsLeft}회
          </div>
        </div>
      )}

      {/* 바위 영역 */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 px-5 pb-8">
        <div className="relative flex flex-col items-center">
          {/* 말풍선 */}
          <AnimatePresence>
            {thought && !isTapping && (
              <motion.div
                key={thought}
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="absolute bottom-full mb-4 bg-white rounded-2xl px-4 py-2.5 shadow-md border border-[#E8EDF2] whitespace-nowrap pointer-events-none"
                style={{ zIndex: 20 }}
              >
                <p className="text-[14px] font-medium text-[#191F28]">{thought}</p>
                {/* 꼬리 테두리 */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full"
                  style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '9px solid #E8EDF2' }}
                />
                {/* 꼬리 흰색 */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-full -mt-px"
                  style={{ width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '8px solid white' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            ref={rockRef}
            animate={isTapping ? tapControls : { y: [0, -6, 0] }}
            transition={isTapping ? undefined : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="flex items-center justify-center"
            style={{ fontSize: 200, lineHeight: 1, filter: `drop-shadow(0 20px 30px rgba(0,0,0,0.12)) ${crackStage >= 2 ? 'brightness(0.85)' : ''}` }}
          >
            {rockEmoji}
          </motion.div>
        </div>

        {/* 안내 pill */}
        <AnimatePresence mode="wait">
          {isTapping ? (
            <motion.div
              key="tapping-guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-white/60"
            >
              <p className="text-[17px] font-bold text-[#191F28] text-center">
                {crackStage === 0 && '화면을 탭해서 바위를 쪼개세요! 🪨'}
                {crackStage === 1 && '균열이 생겼어요! 계속 두드리세요! 💪'}
                {crackStage === 2 && '거의 다 왔어요! 조금만 더! 🔥'}
                {crackStage === 3 && '💥 쪼개지고 있어요!'}
              </p>
            </motion.div>
          ) : attemptsLeft > 0 ? (
            <motion.div
              key="idle-guide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <p className="text-[17px] font-bold text-[#191F28]/70 text-center">
                👆 두들겨서 수저 만들기
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* 광고 오퍼 버튼 2개 */}
        <div className={`flex gap-3 w-full max-w-xs transition-opacity duration-300 ${isTapping ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* 해머 강화 */}
          <button
            onClick={(e) => { e.stopPropagation(); handleAdHammer() }}
            disabled={!!adLoading || hammerActive}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all
              ${hammerActive
                ? 'bg-green-50 border-green-200 text-green-600'
                : 'bg-white/80 border-[#E8EDF2] text-[#191F28] active:scale-95'
              } disabled:opacity-60`}
          >
            {!hammerActive && (
              <span className="text-[9px] font-bold bg-[#0064FF] text-white px-1.5 py-0.5 rounded-full leading-none">
                ADS
              </span>
            )}
            {adLoading === 'hammer' ? (
              <div className="w-5 h-5 border-2 border-[#0064FF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-xl">{hammerActive ? '✅' : '🔨'}</span>
            )}
            <span className="text-[11px] font-medium leading-tight text-center">
              {hammerActive ? '강화 중' : '망치 강화(속도×2)'}
            </span>
          </button>

          {/* 다이아 부스터 */}
          <button
            onClick={(e) => { e.stopPropagation(); handleAdDiamond() }}
            disabled={!!adLoading || diamondBoosted}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all
              ${diamondBoosted
                ? 'bg-sky-50 border-sky-200 text-sky-600'
                : 'bg-white/80 border-[#E8EDF2] text-[#191F28] active:scale-95'
              } disabled:opacity-60`}
          >
            {!diamondBoosted && (
              <span className="text-[9px] font-bold bg-[#0064FF] text-white px-1.5 py-0.5 rounded-full leading-none">
                ADS
              </span>
            )}
            {adLoading === 'diamond' ? (
              <div className="w-5 h-5 border-2 border-[#0064FF] border-t-transparent rounded-full animate-spin" />
            ) : (
              <img src="/spoons/spoon-diamond.png" alt="다이아 수저" className="w-7 h-7 object-contain" />
            )}
            <span className="text-[10px] font-medium leading-tight text-center">
              {diamondBoosted ? boostDisplay : '다이아수저 확률×10'}
            </span>
          </button>
        </div>
      </div>

      {/* 하단 카드 + CTA (탭핑 중 반투명) */}
      <div className={`relative z-10 px-4 pb-4 transition-opacity duration-300 ${isTapping ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* 오늘 획득 수저 요약 */}
        <div
          className="bg-white/90 rounded-2xl p-4 shadow-sm border border-[#E8EDF2] mb-3 cursor-pointer active:opacity-80 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onGoCollection() }}
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

        {/* CTA: 기회 소진 시에만 표시 */}
        {attemptsLeft === 0 && (
          adAttemptsLeft > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleAdAttempt() }}
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
          )
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
