import React, { useEffect, useMemo, useRef } from 'react'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import birthdayData from '../data/birthdayData'
import '../styles/finalMessage.css'

gsap.registerPlugin(ScrollTrigger)

export default function FinalMessage() {
  const sectionRef = useRef(null)
  const eyebrowRef = useRef(null)
  const nameRef = useRef(null)
  const messageRefs = useRef([])
  const closingBlockRef = useRef(null)
  const signatureRef = useRef(null)

  const displayName = useMemo(() => birthdayData.name?.trim() || birthdayData.nickname?.trim() || '', [])

  const finalMessage = useMemo(() => {
    const message = birthdayData.finalMessage?.trim()
    return message || 'If this little journey made you smile, then it has already done what it was meant to do.'
  }, [])

  const messageLines = useMemo(() => {
    return finalMessage
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  }, [finalMessage])

  const closing = birthdayData.finalClosing || {}

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          once: true,
        },
      })

      const targets = [
        eyebrowRef.current,
        nameRef.current,
        ...messageRefs.current,
        signatureRef.current,
        closingBlockRef.current,
      ].filter(Boolean)

      if (prefersReduced) {
        gsap.set(targets, { autoAlpha: 1, y: 0 })
        return
      }

      timeline
        .from(eyebrowRef.current, { autoAlpha: 0, y: 22, duration: 0.55, ease: 'power3.out' })
        .from(nameRef.current, { autoAlpha: 0, y: 20, duration: 0.65, ease: 'power3.out' }, '-=0.35')
        .from(
          messageRefs.current,
          { autoAlpha: 0, y: 18, duration: 0.55, ease: 'power3.out', stagger: 0.12 },
          '-=0.4'
        )
        .from(
          signatureRef.current,
          { autoAlpha: 0, y: 20, duration: 0.65, ease: 'power3.out' },
          '-=0.3'
        )
        .from(
          closingBlockRef.current,
          { autoAlpha: 0, y: 22, duration: 0.55, ease: 'power3.out' },
          '-=0.3'
        )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="final-message-section" ref={sectionRef} aria-label="Final birthday message">
      <div className="final-message-glow" aria-hidden="true" />
      <div className="final-message-inner">
        <div className="final-message-card">
          <div className="final-message-eyebrow" ref={eyebrowRef}>
            Happy Birthday, Beautiful.
          </div>

          {displayName && (
            <h2 className="final-message-heading" ref={nameRef}>
              {displayName},
            </h2>
          )}

          <div className="final-message-body">
            {messageLines.map((line, index) => (
              <p
                key={index}
                className="final-message-paragraph"
                ref={(element) => {
                  if (!element) return
                  messageRefs.current[index] = element
                }}
              >
                {line}
              </p>
            ))}
          </div>

          {birthdayData.finalSignature && (
            <div className="final-message-signoff" ref={signatureRef}>
              <div className="final-message-closing">With all my love,</div>
              <div className="final-message-signature">Nilay ❤️</div>
            </div>
          )}

          {(closing.status || closing.position || closing.duration) && (
            <div className="final-message-badges" ref={closingBlockRef}>
              {closing.status && (
                <div className="final-message-badge">
                  <span>{closing.status.replace('\n', ' • ')}</span>
                </div>
              )}
              {closing.position && (
                <div className="final-message-badge">
                  <span>{closing.position.replace('\n', ' • ')}</span>
                </div>
              )}
              {closing.duration && (
                <div className="final-message-badge">
                  <span>{closing.duration.replace('\n', ' • ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

