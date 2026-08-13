import React, { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import birthdayData from '../data/birthdayData'
import '../styles/countdown.css'

function getNextBirthday(birthDateString) {
  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.search.includes('testCountdown=true')) {
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
  const targetDate = useMemo(() => getNextBirthday(birthdayData.birthDate), [])
  const [timeState, setTimeState] = useState(() =>
    targetDate ? getTimeParts(targetDate) : null
  )
  const [completed, setCompleted] = useState(false)
  const valueRefs = {
    days: useRef(null),
    hours: useRef(null),
    minutes: useRef(null),
    seconds: useRef(null),
  }
  const sectionRef = useRef(null)
  const intervalRef = useRef(null)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])
  const completedHandledRef = useRef(false)

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
      window.clearInterval(intervalRef.current)
    }
  }, [targetDate])

  useEffect(() => {
    if (completed && !completedHandledRef.current) {
      completedHandledRef.current = true
      try {
        if (birthdayData.birthDate) {
          localStorage.setItem(`birthday_unlocked_${birthdayData.birthDate}`, 'true')
        }
      } catch (e) {}
      onCompleteRef.current?.()
    }
  }, [completed])

  useEffect(() => {
    if (!timeState || completed) return

    Object.entries(timeState).forEach(([key, value]) => {
      if (key === 'totalSeconds') return
      const ref = valueRefs[key]?.current
      if (!ref) return

      gsap.fromTo(
        ref,
        { opacity: 0.24, y: 6, filter: 'blur(2px)', scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          scale: 1,
          duration: 0.44,
          ease: 'power3.out',
          overwrite: true,
        }
      )
    })
  }, [timeState, completed])

  useEffect(() => {
    if (!sectionRef.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const bg = gsap.fromTo(
      sectionRef.current,
      { scale: 1, opacity: 0.98 },
      { scale: 1.003, opacity: 1, duration: 12, ease: 'slow(0.7, 0.7, false)', repeat: -1, yoyo: true }
    )

    return () => bg.kill()
  }, [])

  useEffect(() => {
    if (!completed || !sectionRef.current) return
    if (completedHandledRef.current) return
    completedHandledRef.current = true

    if (typeof window !== 'undefined' && window.__markCountdownZero) {
      window.__markCountdownZero()
    }

    // Call onComplete immediately for zero-lag stage transition
    onCompleteRef.current?.()
  }, [completed])

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

  const renderCountdown = () => {
    if (!timeState) {
      return <div className="countdown-invalid">Birthday date is missing or invalid. Please update the birthday data.</div>
    }

    return (
      <>
        <div className="countdown-grid" aria-label="Birthday countdown timer">
          {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
            <div key={unit} className="countdown-item">
              <div
                ref={valueRefs[unit]}
                className="countdown-value"
                aria-live="polite"
                aria-label={`${unit} remaining`}
              >
                {displayValues[unit]}
              </div>
              <div className="countdown-label">{unit.toUpperCase()}</div>
            </div>
          ))}
        </div>
        <div className="countdown-note">
          {completed
            ? 'Birthday has arrived. Continue to the reveal for the next cinematic chapter.'
            : 'The countdown is set to the next birthday date from the provided data.'}
        </div>
        {testModeEnabled && (
          <div className="countdown-test-controls">
            <button
              type="button"
              className="countdown-test-button"
              onClick={handleUnlockForTesting}
            >
              TEST MODE — Unlock Experience
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <section className="countdown-section" ref={sectionRef} aria-labelledby="countdown-heading" aria-live="polite">
      <p className="countdown-lock-note" role="status">
        Birthday experience begins when the countdown reaches zero.
      </p>
      <div className="countdown-background" aria-hidden="true" />
      <div className="countdown-vignette" aria-hidden="true" />
      <div className="countdown-grain" aria-hidden="true" />

      <div className="countdown-inner">
        {birthdayData.openingMessage && (
          <p className="countdown-opening">{birthdayData.openingMessage}</p>
        )}
        <div className="countdown-heading" id="countdown-heading">
          The next birthday begins in
        </div>
        <div className="countdown-copy">
          {birthdayData.sectionMessages?.countdown ||
            'A quietly cinematic moment to mark the day. Numbers update in real time and the sequence transitions smoothly when it reaches zero.'}
        </div>
        {renderCountdown()}
      </div>
    </section>
  )
}
