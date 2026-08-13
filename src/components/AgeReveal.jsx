import React, { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import birthdayData from '../data/birthdayData'
import '../styles/ageReveal.css'

function calculateAge(birthDateString, birthYearNumber) {
  const today = new Date()
  const currentYear = today.getFullYear()

  if (birthYearNumber && !Number.isNaN(Number(birthYearNumber))) {
    const year = Number(birthYearNumber)
    let age = currentYear - year
    if (birthDateString) {
      const birth = new Date(birthDateString)
      if (!Number.isNaN(birth.getTime())) {
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--
        }
      }
    }
    return age > 0 ? age : 21
  }

  if (birthDateString) {
    const birth = new Date(birthDateString)
    if (!Number.isNaN(birth.getTime())) {
      let age = currentYear - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age > 0 ? age : 21
    }
  }

  return 21
}

export default function AgeReveal({ onComplete = () => {} }) {
  const containerRef = useRef(null)
  const eyebrowRef = useRef(null)
  const ageRef = useRef(null)
  const subtitleRef = useRef(null)
  const particlesRef = useRef(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const ageNumber = useMemo(
    () => calculateAge(birthdayData.birthDate, birthdayData.birthYear),
    []
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (typeof window !== 'undefined' && window.__markAgeRevealMount) {
      window.__markAgeRevealMount()
    }
    if (typeof window !== 'undefined' && window.__markAgeRevealPaint) {
      window.__markAgeRevealPaint()
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      const timeline = gsap.timeline({
        onComplete: () => onCompleteRef.current?.(),
      })

      timeline
        .set([eyebrowRef.current, ageRef.current, subtitleRef.current], { opacity: 1, y: 0 })
        .to(container, { opacity: 0, duration: 0.6, delay: 1.8, ease: 'power2.inOut' })

      return () => timeline.kill()
    }

    const timeline = gsap.timeline({
      onComplete: () => onCompleteRef.current?.(),
    })

    const particleEls = particlesRef.current ? Array.from(particlesRef.current.children) : []

    timeline
      .fromTo(
        eyebrowRef.current,
        { opacity: 0, y: 14, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }
      )
      .fromTo(
        ageRef.current,
        { opacity: 0, scale: 0.92, y: 16, filter: 'blur(8px)' },
        { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' },
        '-=0.3'
      )
      .fromTo(
        subtitleRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )

      .to({}, { duration: 1.0 })

      .to(ageRef.current, {
        className: 'age-reveal-number age-reveal-number--burning',
        duration: 0.25,
        ease: 'power1.in',
      })

      .to(
        particleEls,
        {
          opacity: (i) => 0.4 + (i % 5) * 0.12,
          y: (i) => -50 - (i % 6) * 30,
          x: (i) => (i % 2 === 0 ? 1 : -1) * (15 + (i % 7) * 10),
          scale: (i) => 0.4 + (i % 3) * 0.3,
          duration: 1.1,
          stagger: 0.02,
          ease: 'power2.out',
        },
        '<'
      )

      .to(
        ageRef.current,
        {
          opacity: 0,
          scale: 1.06,
          filter: 'blur(14px) brightness(2.0)',
          duration: 1.1,
          ease: 'power3.in',
        },
        '<0.1'
      )
      .to(
        [eyebrowRef.current, subtitleRef.current],
        {
          opacity: 0,
          y: -8,
          filter: 'blur(5px)',
          duration: 0.7,
          ease: 'power2.in',
        },
        '<0.1'
      )
      .to(
        particleEls,
        {
          opacity: 0,
          duration: 0.5,
          ease: 'power1.out',
        },
        '-=0.3'
      )

      .to(container, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
      })

    return () => timeline.kill()
  }, [])

  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => i), [])

  return (
    <section
      className="age-reveal-stage"
      ref={containerRef}
      role="region"
      aria-label="Birthday age reveal stage"
    >
      <div className="sr-only">
        Birthday age reveal. Sakshi is turning {ageNumber}. Another chapter begins.
      </div>

      <div className="age-reveal-bg" aria-hidden="true">
        <div className="age-reveal-glow" />
        <div className="age-reveal-grain" />
      </div>

      <div className="age-reveal-content">
        <div className="age-reveal-eyebrow" ref={eyebrowRef}>
          TODAY, SHE TURNS
        </div>

        <div className="age-reveal-number-wrap">
          <div className="age-reveal-number" ref={ageRef}>
            {ageNumber}
          </div>

          <div className="age-reveal-particles" ref={particlesRef} aria-hidden="true">
            {particles.map((p) => (
              <span key={p} className={`age-particle age-particle--${p % 4}`} />
            ))}
          </div>
        </div>

        <div className="age-reveal-subtitle" ref={subtitleRef}>
          Another chapter of the woman I’m so lucky to know.
        </div>
      </div>
    </section>
  )
}
