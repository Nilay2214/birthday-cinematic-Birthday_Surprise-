import React, { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import birthdayData from '../data/birthdayData'
import '../styles/birthdayReveal.css'

export default function BirthdayReveal() {
  const headingRef = useRef(null)
  const birthdayRef = useRef(null)
  const nameRef = useRef(null)
  const messageRef = useRef(null)
  const decorRef = useRef(null)
  const sectionRef = useRef(null)

  const heroPhoto = useMemo(() => {
    return birthdayData.heroPhoto || (Array.isArray(birthdayData.photos) ? birthdayData.photos[0] : null)
  }, [])

  const displayName = useMemo(() => birthdayData.name || birthdayData.nickname || 'Beloved Guest', [])
  const displayMessage = useMemo(
    () => birthdayData.birthdayMessage || 'Wishing you an unforgettable day filled with warmth and light.',
    []
  )

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })

      timeline.fromTo(
        sectionRef.current,
        { autoAlpha: 0, scale: 0.994 },
        { autoAlpha: 1, scale: 1, duration: prefersReduced ? 0.6 : 0.9 }
      )

      timeline.fromTo(
        headingRef.current,
        { y: 24, opacity: 0, filter: 'blur(2px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: prefersReduced ? 0.5 : 0.75 },
        '<0.1'
      )

      timeline.fromTo(
        birthdayRef.current,
        { y: 24, opacity: 0, filter: 'blur(2px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: prefersReduced ? 0.5 : 0.75 },
        '<0.08'
      )

      timeline.fromTo(
        nameRef.current,
        { y: 18, opacity: 0, letterSpacing: '0.01em' },
        { y: 0, opacity: 1, letterSpacing: '0em', duration: prefersReduced ? 0.45 : 0.72 },
        '<0.08'
      )

      timeline.fromTo(
        messageRef.current,
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: prefersReduced ? 0.4 : 0.65 },
        '<0.1'
      )

      if (!prefersReduced) {
        timeline.fromTo(
          decorRef.current,
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 0.85 },
          '<0.12'
        )
      }

      return () => timeline.kill()
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="birthday-reveal-section" ref={sectionRef} aria-labelledby="birthday-reveal-heading">
      <div className="birthday-reveal-glow" aria-hidden="true" />
      <div className="birthday-reveal-paper" aria-hidden="true" />
      <div className="birthday-reveal-decor" ref={decorRef} aria-hidden="true">
        <span className="birthday-reveal-line" style={{ top: '22%', left: '10%' }} />
        <span className="birthday-reveal-line" style={{ top: '72%', right: '12%', width: '90px' }} />
        <span className="birthday-reveal-dot" style={{ top: '28%', right: '18%' }} />
        <span className="birthday-reveal-dot" style={{ bottom: '26%', left: '14%' }} />
      </div>

      <div className="birthday-reveal-inner">
        <div className="birthday-reveal-visual" aria-label="Birthday memory portrait">
          {heroPhoto && (
            <div className="birthday-reveal-photo-frame">
              <img
                className="birthday-reveal-photo"
                src={heroPhoto.src}
                alt={heroPhoto.alt || heroPhoto.caption || `${displayName} birthday memory`}
                loading="eager"
                decoding="async"
                width={900}
                height={1200}
              />
            </div>
          )}
        </div>

        <div className="birthday-reveal-hero">
          <p className="birthday-reveal-kicker">For the one who lights every room</p>
          <h1 className="birthday-reveal-heading" ref={headingRef} id="birthday-reveal-heading">
            Happy
          </h1>
          <h1 className="birthday-reveal-heading" ref={birthdayRef}>
            Birthday
          </h1>
          <h2 className="birthday-reveal-name" ref={nameRef}>
            {displayName}
          </h2>
          <p className="birthday-reveal-copy" ref={messageRef}>
            {displayMessage}
          </p>
        </div>
      </div>
    </section>
  )
}
