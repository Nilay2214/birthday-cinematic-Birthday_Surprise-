import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import birthdayData from '../data/birthdayData'
import PhotoLightbox from '../components/PhotoLightbox'
import '../styles/movableMemories.css'

gsap.registerPlugin(ScrollTrigger)

const DRAG_THRESHOLD = 8

const scatterLayout = [
  { x: 12, y: 18, rotate: -4.0, scale: 1.02, w: 250 },
  { x: 48, y: 15, rotate: 3.2, scale: 0.96, w: 230 },
  { x: 82, y: 20, rotate: -2.5, scale: 0.94, w: 225 },
  { x: 22, y: 48, rotate: 2.8, scale: 1.05, w: 260 },
  { x: 76, y: 46, rotate: -3.0, scale: 0.98, w: 240 },
  { x: 48, y: 64, rotate: 2.0, scale: 0.96, w: 230 },
  { x: 15, y: 80, rotate: -2.8, scale: 0.94, w: 225 },
  { x: 82, y: 78, rotate: 2.5, scale: 0.98, w: 235 },
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

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const computePositions = useCallback(() => {
    if (!tableRef.current || photos.length === 0) return
    const rect = tableRef.current.getBoundingClientRect()
    positionsRef.current = photos.map((_, index) => {
      const layout = getScatter(index)
      const cardW = layout.w
      const cardH = cardW * 1.25 + 50
      const minX = cardW / 2 + 16
      const maxX = Math.max(minX, rect.width - cardW / 2 - 16)
      const minY = cardH / 2 + 16
      const maxY = Math.max(minY, rect.height - cardH / 2 - 16)

      const rawX = (layout.x / 100) * rect.width
      const rawY = (layout.y / 100) * rect.height

      return {
        left: Math.max(minX, Math.min(maxX, rawX)),
        top: Math.max(minY, Math.min(maxY, rawY)),
        rotate: layout.rotate,
        scale: layout.scale,
        width: layout.w,
        z: index + 1,
      }
    })
  }, [photos])

  useEffect(() => {
    if (!tableRef.current || photos.length === 0) return

    computePositions()
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      cardsRef.current.forEach((card, index) => {
        if (!card) return
        const layout = getScatter(index)
        tl.from(
          card,
          {
            y: 36,
            rotation: layout.rotate + 8,
            scale: layout.scale * 0.86,
            autoAlpha: 1,
            duration: prefersReduced ? 0.4 : 0.85,
            ease: 'power3.out',
          },
          index * 0.08
        )
      })

      ScrollTrigger.create({
        trigger: tableRef.current,
        start: 'top 82%',
        animation: tl,
        once: !prefersReduced,
      })
    }, tableRef)

    return () => ctx.revert()
  }, [photos, computePositions])

  const applyPosition = useCallback((cardEl, pos, dragLift = false) => {
    if (!cardEl || !pos) return
    const liftScale = dragLift ? pos.scale * 1.06 : pos.scale
    const dragRotate = dragLift ? pos.rotate + 1.5 : pos.rotate
    cardEl.style.left = `${pos.left}px`
    cardEl.style.top = `${pos.top}px`
    cardEl.style.width = `${pos.width}px`
    cardEl.style.zIndex = pos.z
    cardEl.style.transform = `translate(-50%, -50%) rotate(${dragRotate}deg) scale(${liftScale})`
  }, [])

  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      if (!card) return
      if (isMobile) {
        card.style.left = ''
        card.style.top = ''
        card.style.width = ''
        card.style.transform = ''
        card.style.zIndex = ''
      } else if (positionsRef.current[index]) {
        applyPosition(card, positionsRef.current[index])
      }
    })
  }, [photos, applyPosition, isMobile])

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
      const cardRect = cardEl?.getBoundingClientRect()
      const halfW = (cardRect?.width || pos.width) / 2
      const halfH = (cardRect?.height || pos.width * 1.25) / 2

      pos.left = Math.max(halfW, Math.min(rect.width - halfW, drag.origX + dx))
      pos.top = Math.max(halfH, Math.min(rect.height - halfH, drag.origY + dy))

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
