import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import birthdayData from '../data/birthdayData'
import PhotoLightbox from '../components/PhotoLightbox'
import '../styles/movableMemories.css'

gsap.registerPlugin(ScrollTrigger)

const DRAG_THRESHOLD = 6

export default function MovableMemories() {
  const photos = useMemo(
    () => (Array.isArray(birthdayData.movableMemoryPhotos) ? birthdayData.movableMemoryPhotos : birthdayData.photos || []),
    []
  )
  const sectionMessage = birthdayData.sectionMessages?.movableMemories || ''
  const gridRef = useRef(null)
  const cardsRef = useRef([])
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [failedImages, setFailedImages] = useState({})
  const topZ = useRef(20)

  const draggingRef = useRef({
    index: null,
    startX: 0,
    startY: 0,
    isDragging: false,
    moved: false,
  })

  // GSAP ScrollTrigger intro animation
  useEffect(() => {
    if (!gridRef.current || photos.length === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      cardsRef.current.forEach((card, index) => {
        if (!card) return
        tl.from(
          card,
          {
            y: 24,
            autoAlpha: 0,
            duration: 0.6,
            ease: 'power2.out',
            clearProps: 'opacity,visibility',
          },
          index * 0.06
        )
      })

      ScrollTrigger.create({
        trigger: gridRef.current,
        start: 'top 85%',
        animation: tl,
        once: true,
      })
    }, gridRef)

    return () => ctx.revert()
  }, [photos])

  // Tactile drag interaction for desktop
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const handlePointerDown = (e) => {
      if (window.innerWidth <= 768) return

      const cardEl = e.target.closest('.movable-memories-card')
      if (!cardEl) return
      const index = cardsRef.current.indexOf(cardEl)
      if (index === -1) return

      draggingRef.current = {
        index,
        startX: e.clientX,
        startY: e.clientY,
        isDragging: false,
        moved: false,
      }
    }

    const handlePointerMove = (e) => {
      const drag = draggingRef.current
      if (drag.index === null) return

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      const distance = Math.hypot(dx, dy)

      if (!drag.isDragging && distance > DRAG_THRESHOLD) {
        drag.isDragging = true
        drag.moved = true
        const cardEl = cardsRef.current[drag.index]
        topZ.current += 1
        if (cardEl) {
          cardEl.style.zIndex = topZ.current
          cardEl.classList.add('is-dragging')
        }
      }

      if (!drag.isDragging) return

      e.preventDefault()
      const cardEl = cardsRef.current[drag.index]
      if (!cardEl) return

      cardEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`
      cardEl.style.boxShadow = '0 36px 70px rgba(84, 37, 54, 0.22), 0 12px 28px rgba(26, 14, 20, 0.16)'
    }

    const handlePointerUp = (e) => {
      const drag = draggingRef.current
      if (drag.index === null) return

      const index = drag.index
      const cardEl = cardsRef.current[index]

      if (drag.isDragging && cardEl) {
        cardEl.classList.remove('is-dragging')
        gsap.to(cardEl, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: 'power3.out',
          clearProps: 'transform,boxShadow',
        })
      } else if (!drag.moved) {
        setLightboxIndex(index)
      }

      draggingRef.current = {
        index: null,
        startX: 0,
        startY: 0,
        isDragging: false,
        moved: false,
      }
    }

    grid.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      grid.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  const handleCardActivate = (index) => {
    if (draggingRef.current.moved) return
    setLightboxIndex(index)
  }

  return (
    <section className="movable-memories" aria-label="Movable memories section">
      <div className="movable-memories-glow" aria-hidden="true" />
      <div className="movable-memories-inner">
        <header className="movable-memories-intro">
          <div className="section-label">Movable Memories</div>
          <h2 className="section-title">Some memories are better when you play with them.</h2>
          {sectionMessage && <p className="section-copy">{sectionMessage}</p>}
          <p className="movable-memories-hint">
            Some memories are better when you arrange them yourself.
          </p>
        </header>

        {photos.length === 0 ? (
          <p className="section-copy">Memories will appear here once photos are added.</p>
        ) : (
          <div className="movable-memories-grid" ref={gridRef} aria-label="Interactive memory collection">
            {photos.map((photo, index) => (
              <div
                key={`movable-${photo.src}-${index}`}
                ref={(el) => (cardsRef.current[index] = el)}
                className="movable-memories-card"
                tabIndex={0}
                role="button"
                aria-label={`Memory: ${photo.caption || photo.label}. Drag to play, click to view.`}
                onClick={() => handleCardActivate(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardActivate(index)
                  }
                }}
              >
                <div className="movable-photo-frame">
                  {failedImages[index] ? (
                    <div className="movable-photo-fallback">Memory unavailable</div>
                  ) : (
                    <img
                      src={photo.src}
                      alt={photo.alt || photo.caption || 'Memory photograph'}
                      loading="lazy"
                      draggable={false}
                      onError={() => setFailedImages((prev) => ({ ...prev, [index]: true }))}
                    />
                  )}
                </div>
                {(photo.label || photo.caption) && (
                  <div className="movable-photo-caption">
                    {photo.label && <strong>{photo.label}</strong>}
                    {photo.caption && <span>{photo.caption}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrevious={() =>
            setLightboxIndex((current) => (current === null ? null : (current - 1 + photos.length) % photos.length))
          }
          onNext={() =>
            setLightboxIndex((current) => (current === null ? null : (current + 1) % photos.length))
          }
        />
      )}
    </section>
  )
}
