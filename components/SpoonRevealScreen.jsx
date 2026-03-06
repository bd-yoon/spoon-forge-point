'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { getAttemptsLeft } from '../lib/gameState'
import { getTotalValue } from '../lib/collectionState'

export default function SpoonRevealScreen({ spoon, onContinue, onGoCollection }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const [attemptsLeft, setAttemptsLeft] = useState(0)
  const [totalValue, setTotalValue] = useState(0)
  const [displayValue, setDisplayValue] = useState(0)

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

  // 컨페티
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // 티어 색상 기반 컨페티
    const baseColor = spoon.color
    const colors = [baseColor, '#FFD700', '#FFFFFF', '#F0F8FF', spoon.color + '99']

    const particles = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        r: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 1,
      })
    }

    let frame = 0
    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotSpeed
        if (p.y > canvas.height) p.life = 0
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
      if (frame < 120) {
        animRef.current = requestAnimationFrame(loop)
      }
    }
    setTimeout(() => loop(), 300)

    return () => cancelAnimationFrame(animRef.current)
  }, [spoon.color])

  return (
    <div
      className="relative w-full min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-5"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 컨페티 캔버스 */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* 배경 글로우 */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${spoon.glow} 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-sm">
        {/* 등급명 */}
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-[28px] font-extrabold"
          style={{ color: spoon.color }}
        >
          ✨ {spoon.label} 획득! ✨
        </motion.h2>

        {/* 수저 아이콘 */}
        <motion.div
          initial={{ y: 80, scale: 0.2, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.15 }}
          className="flex flex-col items-center gap-2"
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${spoon.glow}, transparent)`,
              boxShadow: `0 0 40px ${spoon.glow}`,
            }}
          >
            <span style={{ fontSize: 72 }}>{spoon.emoji}🥄</span>
          </div>
        </motion.div>

        {/* 포인트 가치 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div className="text-[32px] font-bold text-[#191F28]">
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
    </div>
  )
}
