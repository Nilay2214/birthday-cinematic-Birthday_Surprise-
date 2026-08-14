import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import LoadingScreen from './components/LoadingScreen'
import CountdownSection from './sections/CountdownSection'
import AgeReveal from './components/AgeReveal'
import BirthdayReveal from './sections/BirthdayReveal'
import PhotoJourney from './sections/PhotoJourney'
import MovableMemories from './sections/MovableMemories'
import VideoMemory from './sections/VideoMemory'
const MemoryUniverse = React.lazy(() => import('./sections/MemoryUniverse'))
import FinalMessage from './sections/FinalMessage'
import MusicPlayer from './components/MusicPlayer'
import BirthdayVideo from './components/BirthdayVideo'
import birthdayData from './data/birthdayData'
import './styles/experienceLock.css'

export const EXPERIENCE_STAGE = {
  COUNTDOWN: 'countdown',
  AGE_REVEAL: 'ageReveal',
  VIDEO: 'video',
  MEMORIES: 'memories',
}

function MemoryUniverseFallback() {
  return (
    <section
      aria-label="Loading the memory universe"
      style={{
        minHeight: '78vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
        background:
          'radial-gradient(circle at top, rgba(232, 160, 184, 0.08), transparent 30%), linear-gradient(180deg, #120C11 0%, #0d0a0e 100%)',
        color: '#F8F1EA',
      }}
    >
      <div style={{ maxWidth: '640px' }}>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 'clamp(1.6rem, 2.2vw, 2.4rem)',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '14px',
            color: '#F6D6DF',
          }}
        >
          Memory Universe
        </div>
        <div style={{ fontSize: 'clamp(0.98rem, 1.2vw, 1.08rem)', color: 'rgba(248, 241, 234, 0.82)', lineHeight: 1.75 }}>
          Preparing the constellation of memories. This placeholder remains lightweight while the 3D scene loads.
        </div>
      </div>
    </section>
  )
}

export function isBirthdayUnlocked(birthDateStr = birthdayData.birthDate) {
  if (typeof window === 'undefined' || !birthDateStr) return false

  // In DEV mode, allow testing flags via URL search params
  if (import.meta.env.DEV) {
    const search = window.location.search || ''
    if (search.includes('testCountdown=true')) {
      return false // Force countdown locked for testing
    }
    if (
      search.includes('testMode=true') ||
      search.includes('skip=true') ||
      import.meta.env.VITE_SKIP_COUNTDOWN === 'true' ||
      import.meta.env.VITE_BIRTHDAY_TEST_MODE === 'true'
    ) {
      return true // Force unlock for testing
    }
  }

  // Parse target date (YYYY-MM-DD)
  const parts = birthDateStr.split('-').map(Number)
  if (parts.length !== 3) return false
  const [targetYear, targetMonth, targetDay] = parts

  // Calculate browser local YYYY-MM-DD
  const now = new Date()
  const localYear = now.getFullYear()
  const localMonth = now.getMonth() + 1 // 1-indexed
  const localDay = now.getDate()

  if (localYear > targetYear) return true
  if (localYear === targetYear) {
    if (localMonth > targetMonth) return true
    if (localMonth === targetMonth && localDay >= targetDay) return true
  }

  return false
}

export default function App() {
  const [loaded, setLoaded] = React.useState(false)
  
  const testModeEnabled =
    (import.meta.env.DEV &&
      (import.meta.env.VITE_BIRTHDAY_TEST_MODE === 'true' ||
       import.meta.env.VITE_SKIP_COUNTDOWN === 'true')) ||
    (typeof window !== 'undefined' &&
      (window.location.search.includes('testMode=true') ||
       window.location.search.includes('skip=true') ||
       window.location.search.includes('testCountdown=true')))

  const testCountdownEnabled =
    typeof window !== 'undefined' &&
    window.location.search.includes('testCountdown=true')

  const birthdayUnlocked = isBirthdayUnlocked(birthdayData.birthDate)
  const initialStage = (!testCountdownEnabled && (testModeEnabled || birthdayUnlocked))
    ? EXPERIENCE_STAGE.AGE_REVEAL
    : EXPERIENCE_STAGE.COUNTDOWN

  const [stage, setStage] = useState(initialStage)
  const locked = stage === EXPERIENCE_STAGE.COUNTDOWN || stage === EXPERIENCE_STAGE.AGE_REVEAL || stage === EXPERIENCE_STAGE.VIDEO
  const prefersReducedRef = useRef(false)

  useEffect(() => {
    prefersReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    if (locked) {
      window.scrollTo(0, 0)
    }
  }, [locked])

  useEffect(() => {
    document.body.style.overflow = locked ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [locked])

  useEffect(() => {
    if (!locked) return
    const blockScroll = (e) => e.preventDefault()
    const blockKeys = (e) => {
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']
      if (scrollKeys.includes(e.key)) e.preventDefault()
    }
    document.addEventListener('wheel', blockScroll, { passive: false })
    document.addEventListener('touchmove', blockScroll, { passive: false })
    window.addEventListener('keydown', blockKeys)
    return () => {
      document.removeEventListener('wheel', blockScroll)
      document.removeEventListener('touchmove', blockScroll)
      window.removeEventListener('keydown', blockKeys)
    }
  }, [locked])

  const handleCountdownComplete = useCallback(() => {
    if (typeof window !== 'undefined' && window.__markStageChange) {
      window.__markStageChange()
    }
    setStage((s) => (s === EXPERIENCE_STAGE.COUNTDOWN ? EXPERIENCE_STAGE.AGE_REVEAL : s))
  }, [])

  const handleAgeRevealComplete = useCallback(() => {
    setStage((s) => (s === EXPERIENCE_STAGE.AGE_REVEAL ? EXPERIENCE_STAGE.VIDEO : s))
  }, [])

  const handleVideoEnded = useCallback(() => {
    setStage((s) => (s === EXPERIENCE_STAGE.VIDEO ? EXPERIENCE_STAGE.MEMORIES : s))
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        const target =
          document.querySelector('.birthday-reveal-section') ||
          document.querySelector('.photo-journey')
        if (target) {
          target.scrollIntoView({
            behavior: prefersReducedRef.current ? 'auto' : 'smooth',
            block: 'start',
          })
        }
      }, 400)
    })
  }, [])

  return (
    <div className="app-root">
      <LoadingScreen onFinish={() => setLoaded(true)} />

      <div className="experience-hero" aria-hidden={!loaded}>
        {stage === EXPERIENCE_STAGE.COUNTDOWN && (
          <CountdownSection onComplete={handleCountdownComplete} testModeEnabled={testModeEnabled} />
        )}
        {stage === EXPERIENCE_STAGE.AGE_REVEAL && (
          <AgeReveal onComplete={handleAgeRevealComplete} />
        )}
        {stage === EXPERIENCE_STAGE.VIDEO && (
          <BirthdayVideo
            autoStart
            video={birthdayData.videos?.main}
            onVideoEnded={handleVideoEnded}
          />
        )}
      </div>

      <main
        aria-hidden={!loaded || locked}
        inert={locked ? '' : undefined}
        className={`experience-main${locked ? ' experience-main--locked' : ''}`}
      >
        <BirthdayReveal />
        <PhotoJourney />
        <MovableMemories />
        <VideoMemory
          videoData={birthdayData.videos?.second}
          message={birthdayData.sectionMessages?.videoSecond}
          variant="dark"
        />
        <Suspense fallback={<MemoryUniverseFallback />}>
          <MemoryUniverse />
        </Suspense>
        <FinalMessage />
      </main>

      <MusicPlayer autoStart={stage === EXPERIENCE_STAGE.MEMORIES} locked={locked} />

      {locked && <div className="experience-lock-overlay" aria-hidden="true" />}
    </div>
  )
}



