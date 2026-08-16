import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import birthdayData from '../data/birthdayData'
import PhotoLightbox from '../components/PhotoLightbox'
import '../styles/movableMemories.css'

gsap.registerPlugin(ScrollTrigger)

const DRAG_THRESHOLD = 8

// 100% Deterministic Initial Card Layout (Reference design measured from verified localhost layout)
const INITIAL_MEMORIES = [
  // 0: HERO CARD (Center-Anchor)
  {
    left: '35.7%',
    top: '16.2%',
    width: 255,
    rotate: 2.2,
    scale: 1.05,
    z: 8,
    isHero: true,
  },
  // 1: Primary (Mid-Left)
  {
    left: '8.5%',
    top: '14.2%',
    width: 235,
    rotate: -3.2,
    scale: 0.98,
    z: 3,
  },
  // 2: Supporting (Upper-Center)
  {
    left: '27.5%',
    top: '2.5%',
    width: 210,
    rotate: 1.5,
    scale: 0.95,
    z: 2,
  },
  // 3: Primary (Upper-Right)
  {
    left: '64.5%',
    top: '2.5%',
    width: 235,
    rotate: -2.1,
    scale: 1.00,
    z: 4,
  },
  // 4: Primary (Mid-Right)
  {
    left: '72.7%',
    top: '24.8%',
    width: 230,
    rotate: -1.8,
    scale: 0.98,
    z: 4,
  },
  // 5: Supporting (Lower-Center)
  {
    left: '49.3%',
    top: '46.0%',
    width: 215,
    rotate: 2.2,
    scale: 0.96,
    z: 5,
  },
  // 6: Supporting (Bottom-Left)
  {
    left: '7.7%',
    top: '48.0%',
    width: 205,
    rotate: -2.7,
    scale: 0.94,
    z: 1,
  },
  // 7: Supporting (Bottom-Right)
  {
    left: '73.5%',
    top: '47.0%',
    width: 210,
    rotate: 1.8,
    scale: 0.95,
    z: 3,
  },
]

function getInitialConfig(index) {
  return INITIAL_MEMORIES[index % INITIAL_MEMORIES.length]
}

export default function MovableMemories() {
  const photos = useMemo(
    () => (Array.isArray(birthdayData.movableMemoryPhotos) ? birthdayData.movableMemoryPhotos : birthdayData.photos || []),
    []
  )
  const sectionMessage = birthdayData.sectionMessages?.movableMemories || ''
  const tableRef = useRef(null)
  const cardsRef = useRef([])
  const [movedPositions, setMovedPositions] = useState({})
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [failedImages, setFailedImages] = useState({})
  const topZ = useRef(20)

  const draggingRef = useRef({
    index: null,
    startX: 0,
    startY: 0,
    origLeft: 0,
    origTop: 0,
    isDragging: false,
    moved: false,
  })

  // GSAP ScrollTrigger intro animation with selective clearProps
  useEffect(() => {
    if (!tableRef.current || photos.length === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      cardsRef.current.forEach((card, index) => {
        if (!card) return
        tl.from(
          card,
          {
            y: 28,
            autoAlpha: 0,
            duration: 0.7,
            ease: 'power2.out',
            clearProps: 'opacity,visibility',
          },
          index * 0.07
        )
      })

      ScrollTrigger.create({
        trigger: tableRef.current,
        start: 'top 85%',
        animation: tl,
        once: true,
      })
    }, tableRef)

    return () => ctx.revert()
  }, [photos])

  // Drag interaction system
  useEffect(() => {
    const table = tableRef.current
    if (!table) return

    const handlePointerDown = (e) => {
      // Ignore if on mobile viewport
      if (window.innerWidth <= 768) return

      const cardEl = e.target.closest('.movable-memories-card')
      if (!cardEl) return
      const index = cardsRef.current.indexOf(cardEl)
      if (index === -1) return

      draggingRef.current = {
        index,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: cardEl.offsetLeft,
        origTop: cardEl.offsetTop,
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
      const cfg = getInitialConfig(drag.index)
      if (!cardEl || !cfg) return

      const rect = table.getBoundingClientRect()
      const cardW = cardEl.offsetWidth || cfg.width || 230
      const cardH = cardEl.offsetHeight || (cardW * 1.25 + 50)

      const curLeft = Math.max(16, Math.min(rect.width - cardW - 16, drag.origLeft + dx))
      const curTop = Math.max(16, Math.min(rect.height - cardH - 16, drag.origTop + dy))

      cardEl.style.left = `${curLeft}px`
      cardEl.style.top = `${curTop}px`
      cardEl.style.transform = `rotate(${cfg.rotate + 1.2}deg) scale(${cfg.scale * 1.06})`
      cardEl.style.boxShadow = '0 52px 100px rgba(84, 37, 54, 0.24), 0 16px 40px rgba(26, 14, 20, 0.2)'
    }

    const handlePointerUp = (e) => {
      const drag = draggingRef.current
      if (drag.index === null) return

      const index = drag.index
      const cardEl = cardsRef.current[index]
      const cfg = getInitialConfig(index)

      if (drag.isDragging && cardEl && cfg) {
        cardEl.classList.remove('is-dragging')
        cardEl.style.boxShadow = ''
        const rect = table.getBoundingClientRect()
        const cardW = cardEl.offsetWidth || cfg.width || 230
        const cardH = cardEl.offsetHeight || (cardW * 1.25 + 50)
        const finalLeft = Math.max(16, Math.min(rect.width - cardW - 16, drag.origLeft + (e.clientX - drag.startX)))
        const finalTop = Math.max(16, Math.min(rect.height - cardH - 16, drag.origTop + (e.clientY - drag.startY)))

        setMovedPositions((prev) => ({
          ...prev,
          [index]: {
            left: `${finalLeft}px`,
            top: `${finalTop}px`,
            z: topZ.current,
          },
        }))
      } else if (!drag.moved) {
        setLightboxIndex(index)
      }

      draggingRef.current = {
        index: null,
        startX: 0,
        startY: 0,
        origLeft: 0,
        origTop: 0,
        isDragging: false,
        moved: false,
      }
    }

    table.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      table.removeEventListener('pointerdown', handlePointerDown)
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
          <div className="movable-memories-table" ref={tableRef} aria-label="Interactive memory table">
            {photos.map((photo, index) => {
              const cfg = getInitialConfig(index)
              const custom = movedPositions[index]

              const cardStyle = {
                left: custom ? custom.left : cfg.left,
                top: custom ? custom.top : cfg.top,
                width: `${cfg.width}px`,
                zIndex: custom ? custom.z : cfg.z,
                transform: `rotate(${cfg.rotate}deg) scale(${cfg.scale})`,
              }

              return (
                <div
                  key={`movable-${photo.src}-${index}`}
                  ref={(el) => (cardsRef.current[index] = el)}
                  className="movable-memories-card"
                  style={cardStyle}
                  tabIndex={0}
                  role="button"
                  aria-label={`Memory: ${photo.caption || photo.label}. Drag to move, click to view.`}
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
              )
            })}
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
