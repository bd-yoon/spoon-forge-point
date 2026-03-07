'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { getAttemptsLeft } from '../lib/gameState'
import { getTotalValue } from '../lib/collectionState'

// 등급별 파티클 설정 (P1-A)
const TIER_PARTICLE_CONFIG = {
  diamond: { count: 60, minR: 4, maxR: 8, colors: ['#5BCEFA', '#A0E8FF', '#ffffff', '#5BCEFA99'] },
  gold:    { count: 50, minR: 3, maxR: 7, colors: ['#F5A623', '#FFD700', '#ffffff', '#F5A62399'] },
  silver:  { count: 40, minR: 3, maxR: 6, colors: ['#A0A8B0', '#C5CDD6', '#ffffff', '#A0A8B099'] },
  bronze:  { count: 30, minR: 2, maxR: 5, colors: ['#CD7F32', '#E8A045', '#ffffff', '#CD7F3299'] },
  stone:   { count: 20, minR: 2, maxR: 4, colors: ['#8B95A1', '#A0A8B0', '#6B7280', '#8B95A199'] },
}

// 특별 등급 배경색 (P1-B)
const SPECIAL_BG = {
  diamond: '#1A2A4A',
  gold: '#2A1A00',
}

export default function SpoonRevealScreen({ spoon, onContinue, onGoCollection }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const [attemptsLeft, setAttemptsLeft] = useState(0)
  const [totalValue, setTotalValue] = useState(0)
  const [displayValue, setDisplayValue] = useState(0)
  // 특별 등급 배경 전환 (P1-B)
  const [bgColor, setBgColor] = useState('transparent')

  const isDiamond = spoon.id === 'diamond'
  const isGold = spoon.id === 'gold'
  const isSpecial = isDiamond || isGold

  useEffect(() => {
    setAttemptsLeft(getAttemptsLeft())
    setTotalValue(getTotalValue())

    // 포인트 카운트업
    let start = 0
    const end = spoon.value
    const duration = 600
    const step = 16
    const increment = end / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, step)
    return () => clearInterval(timer)
  }, [spoon.value])

  // 특별 등급 배경 전환 (P1-B)
  useEffect(() => {
    if (!isSpecial) return
    const targetBg = SPECIAL_BG[spoon.id]
    setBgColor(targetBg)
    const restoreDelay = isDiamond ? 1500 : 1200
    const t = setTimeout(() => setBgColor('transparent'), restoreDelay)
    return () => clearTimeout(t)
  }, [spoon.id, isDiamond, isSpecial])

  // 컨페티 파티클 (P1-A 등급별 차별화)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const cfg = TIER_PARTICLE_CONFIG[spoon.id] || TIER_PARTICLE_CONFIG.stone

    const particles = []

    if (isDiamond) {
      // 다이아: 화면 중심에서 방사형 발산 (P1-B)
      const cx = canvas.width / 2
      const cy = canvas.height * 0.4
      for (let i = 0; i < cfg.count; i++) {
        const angle = (Math.PI * 2 * i) / cfg.count + (Math.random() - 0.5) * 0.3
        const speed = 3 + Math.random() * 8
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          r: cfg.minR + Math.random() * (cfg.maxR - cfg.minR),
          color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.25,
          life: 1,
          gravity: 0.12,
        })
      }
    } else {
      // 일반: 상단에서 낙하 (단, 등급별 파티클 수/색상 적용)
      for (let i = 0; i < cfg.count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -10 - Math.random() * 100,
          vx: (Math.random() - 0.5) * 4,
          vy: 2 + Math.random() * 4,
          r: cfg.minR + Math.random() * (cfg.maxR - cfg.minR),
          color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          life: 1,
          gravity: 0,
        })
      }
    }

    let frame = 0
    const maxFrames = isDiamond ? 100 : 120
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity || 0
        p.rotation += p.rotSpeed
        if (!isDiamond && p.y > canvas.height) p.life = 0
        if (isDiamond) p.life -= 0.012
        if (p.life <= 0) return
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.min(1, p.life)
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6)
        ctx.restore()
      })
      frame++
      if (frame < maxFrames) {
        animRef.current = requestAnimationFrame(loop)
      }
    }
    setTimeout(() => loop(), isDiamond ? 150 : 300)

    return () => cancelAnimationFrame(animRef.current)
  }, [spoon.id, spoon.color, isDiamond])

  // 수저 등장 애니메이션 설정 (P1-B)
  const spoonMotionProps = isSpecial ? {
    initial: { y: 60, scale: 0.2, opacity: 0, rotate: 0 },
    animate: {
      y: 0,
      scale: isDiamond ? [0.2, 1.3, 1.0] : [0.2, 1.2, 1.0],
      opacity: 1,
      rotate: isDiamond ? [0, 360] : 0,
    },
    transition: { duration: isDiamond ? 0.8 : 0.6, ease: 'easeOut', delay: 0.15 },
  } : {
    initial: { y: 80, scale: 0.2, opacity: 0 },
    animate: { y: 0, scale: 1, opacity: 1 },
    transition: { type: 'spring', stiffness: 280, damping: 20, delay: 0.15 },
  }

  // 글로우 크기 (P1-B)
  const glowSize = isDiamond ? 200 : isGold ? 160 : 50
  const glowOpacity = isDiamond ? 0.5 : isGold ? 0.4 : undefined

  return (
    <motion.div
      className="relative w-full min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: isDiamond ? 0.5 : 0.4, ease: 'easeIn' }}
    >
      {/* 컨페티 캔버스 */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* 배경 글로우 */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: isSpecial
            ? `radial-gradient(circle at 50% 40%, ${spoon.glow.replace('0.3', String(glowOpacity || 0.3))} 0%, transparent 70%)`
            : `radial-gradient(circle at 50% 40%, ${spoon.glow} 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm">
        {/* 등급명 */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-[28px] font-extrabold text-center"
          style={{
            color: spoon.color,
            textShadow: isDiamond ? `0 0 20px ${spoon.color}, 0 0 40px ${spoon.color}55` : 'none',
          }}
        >
          ✨ {spoon.label} 획득! ✨
        </motion.h2>

        {/* 수저 아이콘 */}
        <motion.div
          {...spoonMotionProps}
          className="flex flex-col items-center gap-2"
        >
          <div
            className="rounded-full flex items-center justify-center p-4"
            style={{
              width: isSpecial ? 144 : 128,
              height: isSpecial ? 144 : 128,
              background: `radial-gradient(circle, ${spoon.glow}, transparent)`,
              boxShadow: `0 0 ${glowSize}px ${spoon.glow}`,
            }}
          >
            <img
              src={spoon.svgSrc}
              alt={spoon.label}
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
        </motion.div>

        {/* 포인트 가치 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div
            className="text-[32px] font-bold"
            style={{ color: isSpecial ? spoon.color : '#191F28' }}
          >
            +{displayValue.toLocaleString()}원
          </div>
          <div className="text-[13px] text-[#6B7684] mt-1">
            보관함 누적: {totalValue.toLocaleString()}원
          </div>
        </motion.div>

        {/* CTA 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full flex flex-col gap-2 mt-4"
        >
          {attemptsLeft > 0 ? (
            <>
              <button
                onClick={onContinue}
                className="w-full py-4 rounded-2xl bg-[#0064FF] text-white text-[16px] font-bold active:scale-95 transition-transform"
              >
                계속하기 (남은 기회: {attemptsLeft}회)
              </button>
              <button
                onClick={onGoCollection}
                className="w-full py-4 rounded-2xl bg-white/80 border border-[#E8EDF2] text-[#191F28] text-[15px] font-medium active:scale-95 transition-transform"
              >
                보관함 보기
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onGoCollection}
                className="w-full py-4 rounded-2xl bg-[#0064FF] text-white text-[16px] font-bold active:scale-95 transition-transform"
              >
                보관함 보기
              </button>
              <button
                onClick={onContinue}
                className="w-full py-4 rounded-2xl bg-white/80 border border-[#E8EDF2] text-[#191F28] text-[15px] font-medium active:scale-95 transition-transform"
              >
                메인으로
              </button>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
