'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCollection, getTotalValue, exchangeAll } from '../lib/collectionState'
import { hasExchangedToday, setExchangedToday } from '../lib/gameState'
import { formatProb } from '../lib/spoonLogic'

export default function CollectionScreen({ onBack }) {
  const [collection, setCollection] = useState([])
  const [totalValue, setTotalValue] = useState(0)
  const [exchangedToday, setExchangedTodayState] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState(null)
  const [exchangeDone, setExchangeDone] = useState(false)

  function refreshState() {
    const c = getCollection()
    setCollection(c)
    setTotalValue(getTotalValue())
    setExchangedTodayState(hasExchangedToday())
  }

  useEffect(() => {
    refreshState()
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleExchange() {
    const amount = exchangeAll()
    setExchangedToday()
    setExchangeDone(true)
    refreshState()
    setShowConfirm(false)
    showToast(`🎉 ${amount.toLocaleString()}포인트 교환 완료!`)
  }

  const canExchange = totalValue >= 10 && !exchangedToday

  return (
    <div
      className="flex flex-col min-h-screen min-h-[100dvh]"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* 헤더 */}
      <div className="flex items-center px-5 py-3 gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center text-[#6B7684] text-xl active:opacity-60"
        >
          ←
        </button>
        <h1 className="text-[18px] font-bold text-[#191F28]">나의 수저 보관함</h1>
      </div>

      {/* 가치 카드 */}
      <div className="px-4 pb-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0064FF] rounded-2xl p-4 text-white"
        >
          <div className="text-[24px] font-bold">
            💰 총 {totalValue.toLocaleString()}원 모였어요
          </div>
          <div className="text-[13px] text-white/80 mt-1">
            {exchangedToday
              ? '오늘 교환 완료 ✓ 내일 다시 교환할 수 있어요'
              : totalValue >= 10
              ? '오늘 교환 가능해요'
              : '10원 이상 모이면 교환할 수 있어요'}
          </div>
        </motion.div>
      </div>

      {/* 수저 목록 */}
      <div className="px-4 flex-1">
        <h2 className="text-[14px] font-semibold text-[#6B7684] mb-3">수저 목록</h2>
        <div className="grid grid-cols-3 gap-3">
          {collection.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl border transition-all
                ${t.count > 0
                  ? 'bg-white shadow-sm border-[#E8EDF2]'
                  : 'bg-white/40 border-[#E8EDF2]/50'
                }`}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center p-1"
                style={{ background: t.count > 0 ? t.glow : 'rgba(107,114,128,0.1)' }}
              >
                <img
                  src={t.svgSrc}
                  alt={t.label}
                  className="w-full h-full object-contain"
                  style={{ opacity: t.count > 0 ? 1 : 0.35 }}
                />
              </div>
              <span
                className="text-[18px] font-bold"
                style={{ color: t.count > 0 ? t.color : '#B0B8C1' }}
              >
                {t.count}개
              </span>
              <span className="text-[11px] text-[#6B7684]">{t.label}</span>
              <span className="text-[11px] text-[#6B7684]">{t.value}원/개</span>
              <span className="text-[10px] font-medium" style={{ color: t.count > 0 ? t.color : '#B0B8C1' }}>
                확률 {formatProb(t.prob)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 확률 법적 고지 */}
      <div className="px-4 pt-2 pb-1">
        <p className="text-[11px] text-[#B0B8C1] leading-relaxed text-center">
          수저 등급별 출현 확률은 위와 같습니다.<br />
          확률은 1회 시도당 기준이며 각 시도는 독립시행입니다.
        </p>
      </div>

      {/* 교환 CTA */}
      <div className="px-4 py-4 mt-auto">
        <button
          onClick={() => canExchange && setShowConfirm(true)}
          disabled={!canExchange}
          className={`w-full py-4 rounded-2xl text-[16px] font-bold transition-all
            ${canExchange
              ? 'bg-[#0064FF] text-white active:scale-95'
              : 'bg-[#E8EDF2] text-[#B0B8C1] cursor-not-allowed'
            }`}
        >
          {exchangedToday
            ? '내일 교환 가능 ✓'
            : totalValue < 10
            ? `${10 - totalValue}원 더 모으면 교환할 수 있어요`
            : '토스포인트로 교환하기'}
        </button>
      </div>

      {/* 교환 확인 모달 */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full bg-white rounded-t-3xl p-6"
              style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-[18px] font-bold text-[#191F28] mb-2">
                토스포인트로 교환하기?
              </h3>
              <p className="text-[14px] text-[#6B7684] mb-6">
                {totalValue.toLocaleString()}원 → 토스포인트 {totalValue.toLocaleString()}포인트
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 rounded-2xl border border-[#E8EDF2] text-[#6B7684] text-[15px] font-medium active:opacity-80"
                >
                  취소
                </button>
                <button
                  onClick={handleExchange}
                  className="flex-1 py-4 rounded-2xl bg-[#0064FF] text-white text-[15px] font-bold active:scale-95 transition-transform"
                >
                  교환하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#191F28]/90 text-white text-[13px] font-medium px-4 py-2.5 rounded-full whitespace-nowrap z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
