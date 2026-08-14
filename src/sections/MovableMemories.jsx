import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import birthdayData from '../data/birthdayData'
import PhotoLightbox from '../components/PhotoLightbox'
import '../styles/movableMemories.css'

gsap.registerPlugin(ScrollTrigger)

const DRAG_THRESHOLD = 8

const scatterLayout = [
  // 0: HERO CARD (Center-Anchor)
  { x: 46, y: 46, rotate: 2.2, scale: 1.05, w: 255, isHero: true },
  // 1: Primary (Mid-Left)
  { x: 18, y: 42, rotate: -3.2, scale: 0.98, w: 235 },
  // 2: Supporting (Upper-Center)
  { x: 36, y: 18, rotate: 1.5, scale: 0.95, w: 210 },
  // 3: Primary (Upper-Right)
  { x: 74, y: 22, rotate: -2.1, scale: 1.00, w: 235 },
  // 4: Primary (Mid-Right)
  { x: 82, y: 52, rotate: -1.8, scale: 0.98, w: 230 },
  // 5: Supporting (Lower-Center)
  { x: 58, y: 72, rotate: 2.2, scale: 0.96, w: 215 },
  // 6: Supporting (Bottom-Left)
  { x: 16, y: 78, rotate: -2.7, scale: 0.94, w: 205 },
  // 7: Supporting (Bottom-Right)
  { x: 82, y: 80, rotate: 1.8, scale: 0.95, w: 210 },
]

function getScatter(index) {
  return scatterLayout[index % scatterLayout.length]
}

export default function MovableMemories() {
  const photos = useMemo(
    () => (Array.isArray(birthdayData.movableMemoryPhotos) ? birthdayData.movableMemoryPhotos : birthdayData.photos || []),
    []
  )
  const sectionMessage = birthdayData.sectionMessages?.movableMemories || ''
  const tableRef = useRef(null)
  const cardsRef = useRef([])
  const positionsRef = useRef([])
  const draggingRef = useRef({
    index: null,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
    origRotate: 0,
    isDragging: false,
    moved: false,
  })
  const topZ = useRef(30)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [failedImages, setFailedImages] = useState({})

  const checkMobile = useCallback(() => {
    return typeof window !== 'undefined' && (window.innerWidth <= 768 || window.matchMedia('(max-width: 768px)').matches)
  }, [])

  const computePositions = useCallback(() => {
    if (!tableRef.current || photos.length === 0) return
    const tableEl = tableRef.current
    const rect = tableEl.getBoundingClientRect()
    const tableWidth = rect.width || tableEl.offsetWidth || tableEl.clientWidth || (typeof window !== 'undefined' ? Math.min(1240, window.innerWidth - 48) : 1200)
    const tableHeight = rect.height || tableEl.offsetHeight || tableEl.clientHeight || 700

    positionsRef.current = photos.map((_, index) => {
      const layout = getScatter(index)
      const cardW = layout.w
      const cardH = cardW * 1.25 + 50

      const rawX = (layout.x / 100) * tableWidth
      const rawY = (layout.y / 100) * tableHeight

      const left = Math.max(16, Math.min(tableWidth - cardW - 16, rawX - cardW / 2))
      const top = Math.max(16, Math.min(tableHeight - cardH - 16, rawY - cardH / 2))

      return {
        left,
        top,
        rotate: layout.rotate,
        scale: layout.scale,
        width: cardW,
        height: cardH,
        z: index + 1,
      }
    })
  }, [photos])

  const applyPosition = useCallback((cardEl, pos, dragLift = false) => {
    if (!cardEl || !pos) return
    const liftScale = dragLift ? pos.scale * 1.06 : pos.scale
    const dragRotate = dragLift ? pos.rotate + 1.2 : pos.rotate
    cardEl.style.left = `${pos.left}px`
    cardEl.style.top = `${pos.top}px`
    cardEl.style.width = `${pos.width}px`
    cardEl.style.zIndex = pos.z
    cardEl.style.transform = `rotate(${dragRotate}deg) scale(${liftScale})`
  }, [])

  // Position calculation, ResizeObserver, IntersectionObserver, and resize listener
  useEffect(() => {
    if (!tableRef.current || photos.length === 0) return

    const updateAll = () => {
      const isMob = checkMobile()
      setIsMobile(isMob)

      if (isMob) {
        cardsRef.current.forEach((card) => {
          if (!card) return
          card.style.left = ''
          card.style.top = ''
          card.style.width = ''
          card.style.transform = ''
          card.style.zIndex = ''
        })
      } else {
        computePositions()
        cardsRef.current.forEach((card, index) => {
          if (card && positionsRef.current[index]) {
            applyPosition(card, positionsRef.current[index])
          }
        })
      }
    }

    updateAll()
    const frameId = requestAnimationFrame(updateAll)
    const timerId = setTimeout(updateAll, 60)

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateAll)
    })
    ro.observe(tableRef.current)

    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        updateAll()
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] })
    io.observe(tableRef.current)

    window.addEventListener('resize', updateAll)

    if (document.fonts?.ready) {
      document.fonts.ready.then(updateAll)
    }

    return () => {
      cancelAnimationFrame(frameId)
      clearTimeout(timerId)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('resize', updateAll)
    }
  }, [photos, computePositions, applyPosition, checkMobile])

  // GSAP ScrollTrigger intro animation
  useEffect(() => {
    if (!tableRef.current || photos.length === 0 || isMobile) return

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
            clearProps: 'all',
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
  }, [photos, isMobile])

  useEffect(() => {
    const table = tableRef.current
    if (!table || isMobile) return

    const handlePointerDown = (e) => {
      const cardEl = e.target.closest('.movable-memories-card')
      if (!cardEl) return
      const index = cardsRef.current.indexOf(cardEl)
      if (index === -1) return

      const pos = positionsRef.current[index]
      draggingRef.current = {
        index,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.left,
        origY: pos.top,
        origRotate: pos.rotate,
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
        const pos = positionsRef.current[drag.index]
        topZ.current += 1
        pos.z = topZ.current
        if (cardEl) {
          cardEl.style.zIndex = topZ.current
          cardEl.classList.add('is-dragging')
        }
      }

      if (!drag.isDragging) return

      e.preventDefault()
      const cardEl = cardsRef.current[drag.index]
      const pos = positionsRef.current[drag.index]
      const rect = table.getBoundingClientRect()
      const cardW = pos.width || 220
      const cardH = pos.height || (cardW * 1.25 + 50)

      pos.left = Math.max(16, Math.min(rect.width - cardW - 16, drag.origX + dx))
      pos.top = Math.max(16, Math.min(rect.height - cardH - 16, drag.origY + dy))

      if (cardEl) {
        applyPosition(cardEl, pos, true)
        cardEl.style.boxShadow = '0 52px 100px rgba(84, 37, 54, 0.24), 0 16px 40px rgba(26, 14, 20, 0.2)'
      }
    }

    const handlePointerUp = () => {
      const drag = draggingRef.current
      if (drag.index === null) return

      const index = drag.index
      const cardEl = cardsRef.current[index]
      const pos = positionsRef.current[index]

      if (drag.isDragging && cardEl) {
        cardEl.classList.remove('is-dragging')
        gsap.to(cardEl, {
          duration: 0.4,
          ease: 'power3.out',
          onUpdate: () => applyPosition(cardEl, pos, false),
          onComplete: () => {
            cardEl.style.boxShadow = ''
          },
        })
      } else if (!drag.moved) {
        setLightboxIndex(index)
      }

      draggingRef.current = {
        index: null,
        startX: 0,
        startY: 0,
        origX: 0,
        origY: 0,
        origRotate: 0,
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
  }, [isMobile, applyPosition])

  const handleCardActivate = (index) => {
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
            {isMobile
              ? 'Tap a photograph to view it full size.'
              : 'Some memories are better when you arrange them yourself.'}
          </p>
        </header>

        {photos.length === 0 ? (
          <p className="section-copy">Memories will appear here once photos are added.</p>
        ) : (
          <div className="movable-memories-table" ref={tableRef} aria-label="Interactive memory table">
            {photos.map((photo, index) => (
              <div
                key={`movable-${photo.src}-${index}`}
                ref={(el) => (cardsRef.current[index] = el)}
                className="movable-memories-card"
                style={{ cursor: isMobile ? 'pointer' : 'grab' }}
                tabIndex={0}
                role="button"
                aria-label={`Memory: ${photo.caption || photo.label}. ${isMobile ? 'Tap to view.' : 'Drag to move, click to view.'}`}
                onClick={isMobile ? () => handleCardActivate(index) : undefined}
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
