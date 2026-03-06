'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { getTapCount } from '../lib/spoonLogic'
import { isHammerActive, useAttempt, addTodayValue } from '../lib/gameState'
import { addSpoon } from '../lib/collectionState'

export default function TappingScreen({ spoon, onComplete, onBack }) {
  const targetTaps = getTapCount(spoon, isHammerActive())
  const [tapCount, setTapCount] = useState(0)
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animFrameRef = useRef(null)
  const controls = useAnimation()
  const completedRef = useRef(false)

  const progress = Math.min(tapCount / targetTaps, 1)
  const crackStage = progress < 0.33 ? 0 : progress < 0.66 ? 1 : progress < 1 ? 2 : 3

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
        p.vy += 0.3 // gravity
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

  const handleTap = useCallback((clientX, clientY) => {
    if (completedRef.current) return

    const nextCount = tapCount + 1
    setTapCount(nextCount)

    // 바위 bounce
    controls.start({
      scale: [1, 0.90, 1.05, 1],
      transition: { duration: 0.18 }
    })

    // 파티클
    spawnParticles(clientX, clientY)

    // 햅틱 (10ms — 더 선명한 클릭감)
    navigator.vibrate?.(10)

    // 완료 체크
    if (nextCount >= targetTaps && !completedRef.current) {
      completedRef.current = true
      // 수저 보관함에 추가
      addSpoon(spoon.id)
      addTodayValue(spoon.value)
      useAttempt()
      setTimeout(() => onComplete(), 300)
    }
  }, [tapCount, targetTaps, spoon, controls, onComplete])

  function handleTouch(e) {
    e.preventDefault()
    const touch = e.touches[0] || e.changedTouches[0]
    if (touch) handleTap(touch.clientX, touch.clientY)
  }

  function handleClick(e) {
    handleTap(e.clientX, e.clientY)
  }

  const rockEmoji = crackStage === 0 ? '🪨' : crackStage === 1 ? '🪨' : crackStage === 2 ? '🪨' : '💥'

  return (
    <div
      className="relative w-full min-h-screen min-h-[100dvh] flex flex-col select-none overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        touchAction: 'none',
      }}
      onTouchStart={handleTouch}
      onClick={handleClick}
    >
      {/* Canvas 파티클 레이어 */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* 헤더 */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3">
        <button
          onClick={(e) => { e.stopPropagation(); onBack() }}
          className="w-10 h-10 flex items-center justify-center text-[#6B7684] text-xl active:opacity-60"
        >
          ✕
        </button>
        <div className="text-[18px] font-bold text-[#191F28] tabular-nums">
          {tapCount.toLocaleString()} / {targetTaps.toLocaleString()}
        </div>
        <div className="w-10" />
      </div>

      {/* 진행 바 */}
      <div className="relative z-10 px-5">
        <div className="w-full h-1.5 bg-[#E8EDF2] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0064FF] rounded-full transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* 균열 오버레이 (SVG) */}
      {crackStage >= 1 && (
        <svg
          className="fixed inset-0 pointer-events-none z-10"
          width="100%" height="100%"
          style={{ opacity: crackStage >= 2 ? 0.7 : 0.4 }}
        >
          {/* 균열 1 */}
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

      {/* 바위 + 안내 텍스트 (인라인 배치) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          animate={controls}
          className="flex items-center justify-center"
          style={{
            fontSize: 180,
            lineHeight: 1,
            filter: `drop-shadow(0 20px 40px rgba(0,0,0,0.15)) ${crackStage >= 2 ? 'brightness(0.85)' : ''}`,
            transition: 'filter 0.3s',
          }}
        >
          {rockEmoji}
        </motion.div>

        {/* 안내 텍스트 — 눈에 잘 띄는 pill 스타일 */}
        <div className="bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-white/60">
          <p className="text-[17px] font-bold text-[#191F28] text-center">
            {crackStage === 0 && '화면을 탭해서 바위를 쪼개세요! 🪨'}
            {crackStage === 1 && '균열이 생겼어요! 계속 두드리세요! 💪'}
            {crackStage === 2 && '거의 다 왔어요! 조금만 더! 🔥'}
            {crackStage === 3 && '💥 쪼개지고 있어요!'}
          </p>
        </div>
      </div>
    </div>
  )
}
