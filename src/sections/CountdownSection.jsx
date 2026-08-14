import React, { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import birthdayData from '../data/birthdayData'
import '../styles/countdown.css'

function getNextBirthday(birthDateString) {
  if (typeof window !== 'undefined' && window.location.search.includes('testCountdown=true')) {
    // 10-second test target for development verification
    return new Date(Date.now() + 10000)
  }

  if (!birthDateString) return null

  const parts = birthDateString.split('-').map(Number)
  if (parts.length !== 3) return null
  const [bYear, bMonth, bDay] = parts

  const now = new Date()
  const localYear = now.getFullYear()

  let target = new Date(localYear, bMonth - 1, bDay, 0, 0, 0)
  if (target < now) {
    target = new Date(localYear + 1, bMonth - 1, bDay, 0, 0, 0)
  }

  return target
}

function getTimeParts(targetDate) {
  const now = new Date()
  const deltaMs = Math.max(0, targetDate - now)

  const totalSeconds = Math.floor(deltaMs / 1000)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours = Math.floor(totalSeconds / 3600) % 24
  const days = Math.floor(totalSeconds / 86400)

  return { days, hours, minutes, seconds, totalSeconds }
}

export default function CountdownSection({ onComplete = () => {}, testModeEnabled = false }) {
  const isDevTest =
    testModeEnabled ||
    (typeof window !== 'undefined' &&
      (window.location.search.includes('testMode=true') ||
       window.location.search.includes('testCountdown=true') ||
       window.location.search.includes('skip=true')))

  const targetDate = useMemo(() => getNextBirthday(birthdayData.birthDate), [])
  const [timeState, setTimeState] = useState(() =>
    targetDate ? getTimeParts(targetDate) : null
  )
  const [completed, setCompleted] = useState(false)

  const containerRef = useRef(null)
  const eyebrowRef = useRef(null)
  const titleRef = useRef(null)
  const subtitleRef = useRef(null)
  const gridRef = useRef(null)
  const footerRef = useRef(null)
  const intervalRef = useRef(null)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])
  const completedHandledRef = useRef(false)

  // Countdown timer interval - updates timeState smoothly without layout shifts
  useEffect(() => {
    if (!targetDate) return

    const initialParts = getTimeParts(targetDate)
    if (initialParts.totalSeconds <= 0) {
      setCompleted(true)
      return
    }

    intervalRef.current = window.setInterval(() => {
      setTimeState((current) => {
        if (!current) return null
        const next = getTimeParts(targetDate)
        if (next.totalSeconds <= 0) {
          setCompleted(true)
          if (intervalRef.current) window.clearInterval(intervalRef.current)
          return { ...next, totalSeconds: 0 }
        }
        return next
      })
    }, 1000)

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [targetDate])

  // Birthday unlock handler
  useEffect(() => {
    if (completed && !completedHandledRef.current) {
      completedHandledRef.current = true
      try {
        if (birthdayData.birthDate) {
          localStorage.setItem(`birthday_unlocked_${birthdayData.birthDate}`, 'true')
        }
      } catch (e) {}

      if (typeof window !== 'undefined' && window.__markCountdownZero) {
        window.__markCountdownZero()
      }

      onCompleteRef.current?.()
    }
  }, [completed])

  // Initial cinematic entrance animation - runs ONCE on load
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.fromTo(
        eyebrowRef.current,
        { opacity: 0, y: 14, letterSpacing: '0.42em' },
        { opacity: 0.85, y: 0, letterSpacing: '0.3em', duration: 1.2, delay: 0.2 }
      )
        .fromTo(
          titleRef.current,
          { opacity: 0, y: 22, filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.4 },
          '-=0.7'
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 16 },
          { opacity: 0.82, y: 0, duration: 1.2 },
          '-=0.8'
        )
        .fromTo(
          gridRef.current,
          { opacity: 0, y: 24, scale: 0.97, filter: 'blur(4px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.4 },
          '-=0.7'
        )
        .fromTo(
          footerRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 1.2 },
          '-=0.8'
        )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  const displayValues = useMemo(() => {
    if (!timeState) return null
    return {
      days: String(timeState.days).padStart(2, '0'),
      hours: String(timeState.hours).padStart(2, '0'),
      minutes: String(timeState.minutes).padStart(2, '0'),
      seconds: String(timeState.seconds).padStart(2, '0'),
    }
  }, [timeState])

  const handleUnlockForTesting = () => {
    if (completed) return
    setCompleted(true)
    onComplete?.()
  }

  const units = [
    { key: 'days', label: 'DAYS' },
    { key: 'hours', label: 'HOURS' },
    { key: 'minutes', label: 'MINUTES' },
    { key: 'seconds', label: 'SECONDS' },
  ]

  return (
    <section
      className="countdown-section"
      ref={containerRef}
      aria-label="Birthday countdown"
    >
      <div className="countdown-background" aria-hidden="true" />
      <div className="countdown-vignette" aria-hidden="true" />
      <div className="countdown-grain" aria-hidden="true" />
      <div className="countdown-ambient-glow" aria-hidden="true" />

      {/* Floating particles for romantic atmosphere */}
      <div className="countdown-particles" aria-hidden="true">
        <span className="particle particle--1" />
        <span className="particle particle--2" />
        <span className="particle particle--3" />
        <span className="particle particle--4" />
        <span className="particle particle--5" />
      </div>

      <div className="countdown-inner">
        {/* Eyebrow */}
        <div className="countdown-eyebrow" ref={eyebrowRef}>
          MADE JUST FOR YOU
        </div>

        {/* Title */}
        <h1 className="countdown-title" ref={titleRef}>
          {birthdayData.name ? `${birthdayData.name},` : 'Sakshi,'}
        </h1>

        {/* Subtitle */}
        <p className="countdown-subtitle" ref={subtitleRef}>
          The wait is almost over.
        </p>

        {/* Countdown Numbers Grid */}
        <div
          className="countdown-grid"
          ref={gridRef}
          role="timer"
          aria-label="Time remaining until birthday"
        >
          {displayValues ? (
            units.map(({ key, label }) => (
              <div key={key} className="countdown-card">
                <div className="countdown-value-wrap">
                  <span className="countdown-value">
                    {displayValues[key]}
                  </span>
                </div>
                <span className="countdown-label">{label}</span>
              </div>
            ))
          ) : (
            <div className="countdown-loading">Preparing your moment...</div>
          )}
        </div>

        {/* Bottom Message */}
        <div className="countdown-footer" ref={footerRef}>
          <p className="countdown-footer-main">
            There's something I made just for you.
          </p>
          <p className="countdown-footer-sub">
            Just a little longer. ❤️
          </p>

          {/* Dev Mode Test Trigger */}
          {isDevTest && (
            <div className="countdown-dev-trigger">
              <button
                type="button"
                className="countdown-test-btn"
                onClick={handleUnlockForTesting}
              >
                Unlock Preview
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

