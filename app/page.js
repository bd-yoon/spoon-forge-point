'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MainScreen from '../components/MainScreen'
import SpoonRevealScreen from '../components/SpoonRevealScreen'
import CollectionScreen from '../components/CollectionScreen'
import { resetDailyStateIfNewDay } from '../lib/gameState'

const SCREEN = {
  MAIN: 'MAIN',
  REVEAL: 'REVEAL',
  COLLECTION: 'COLLECTION',
}

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

export default function Page() {
  const [screen, setScreen] = useState(SCREEN.MAIN)
  const [currentSpoon, setCurrentSpoon] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    resetDailyStateIfNewDay()
  }, [])

  function handleTappingComplete(spoon) {
    setCurrentSpoon(spoon)
    setScreen(SCREEN.REVEAL)
  }

  function handleRevealContinue() {
    setRefresh(r => r + 1)
    setScreen(SCREEN.MAIN)
  }

  function handleGoCollection() {
    setScreen(SCREEN.COLLECTION)
  }

  function handleCollectionBack() {
    setRefresh(r => r + 1)
    setScreen(SCREEN.MAIN)
  }

  return (
    <div
      className="relative w-full min-h-screen min-h-[100dvh] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #C5E8F8 0%, #E8F4FF 55%, #F0F8FF 100%)' }}
    >
      <AnimatePresence mode="wait">
        {screen === SCREEN.MAIN && (
          <motion.div key={`main-${refresh}`} {...screenVariants} className="w-full min-h-screen min-h-[100dvh]">
            <MainScreen
              onTappingComplete={handleTappingComplete}
              onGoCollection={handleGoCollection}
            />
          </motion.div>
        )}
        {screen === SCREEN.REVEAL && (
          <motion.div key="reveal" {...screenVariants} className="w-full min-h-screen min-h-[100dvh]">
            <SpoonRevealScreen
              spoon={currentSpoon}
              onContinue={handleRevealContinue}
              onGoCollection={handleGoCollection}
            />
          </motion.div>
        )}
        {screen === SCREEN.COLLECTION && (
          <motion.div
            key="collection"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }}
            exit={{ x: '100%', opacity: 0, transition: { duration: 0.2 } }}
            className="w-full min-h-screen min-h-[100dvh]"
          >
            <CollectionScreen onBack={handleCollectionBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
