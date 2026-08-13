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
  const decorativeRef = useRef(null)

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
        closingBlockRef.current,
        decorativeRef.current,
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
          { autoAlpha: 0, y: 20, duration: 0.55, ease: 'power3.out', stagger: 0.14 },
          '-=0.4'
        )
        .from(
          closingBlockRef.current,
          { autoAlpha: 0, y: 24, duration: 0.65, ease: 'power3.out' },
          '-=0.3'
        )
        .from(
          decorativeRef.current,
          { autoAlpha: 0, scale: 0.94, duration: 0.5, ease: 'power3.out' },
          '-=0.35'
        )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section className="final-message" ref={sectionRef} aria-label="Final birthday message">
      <div className="final-message-inner">
        <div className="final-message-eyebrow" ref={eyebrowRef}>
          Happy Birthday, Beautiful.
        </div>

        {displayName && (
          <h2 className="final-message-name" ref={nameRef}>
            {displayName},
          </h2>
        )}

        <div className="final-message-copy">
          {messageLines.map((line, index) => (
            <p
              key={index}
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
          <div
            style={{
              marginTop: '32px',
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 'clamp(1.2rem, 1.8vw, 1.5rem)',
              fontStyle: 'italic',
              color: '#F3C6CC',
              lineHeight: 1.6,
            }}
          >
            {birthdayData.finalSignature.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        {(closing.status || closing.position || closing.duration) && (
          <div className="final-message-application" ref={closingBlockRef}>
            {closing.status && (
              <div className="final-message-application-item">
                {closing.status.split('\n').map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            )}
            {closing.position && (
              <div className="final-message-application-item">
                {closing.position.split('\n').map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            )}
            {closing.duration && (
              <div className="final-message-application-item final-message-application-item--duration">
                {closing.duration.split('\n').map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="final-message-decorative" ref={decorativeRef} aria-hidden="true" />
      </div>
    </section>
  )
}
