import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import '../styles/photoLightbox.css'

function wrapIndex(index, length) {
  return (index % length + length) % length
}

export default function PhotoLightbox({ photos, activeIndex, onClose, onPrevious, onNext }) {
  const [isClosing, setIsClosing] = useState(false)
  const [displayIndex, setDisplayIndex] = useState(activeIndex)
  const [failed, setFailed] = useState(false)
  const overlayRef = useRef(null)
  const contentRef = useRef(null)
  const imageRef = useRef(null)
  const closeButtonRef = useRef(null)

  const photo = useMemo(() => photos[displayIndex] || {}, [photos, displayIndex])
  const caption = photo.caption || ''
  const label = photo.label || ''
  const altText = photo.caption || photo.label || 'Memory photograph'

  useEffect(() => {
    setDisplayIndex(activeIndex)
  }, [activeIndex])

  useEffect(() => {
    setFailed(false)
  }, [displayIndex])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline()

      timeline
        .fromTo(
          overlayRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: prefersReduced ? 0.2 : 0.45, ease: 'power2.out' }
        )
        .fromTo(
          contentRef.current,
          { autoAlpha: 0, y: 18, scale: prefersReduced ? 1 : 0.96, filter: prefersReduced ? 'none' : 'blur(2px)' },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: prefersReduced ? 0.25 : 0.55,
            ease: 'power3.out',
          },
          '<0.1'
        )
    }, overlayRef)

    return () => ctx.revert()
  }, [])

  const handleClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeline = gsap.timeline({ onComplete: onClose })

    timeline
      .to(contentRef.current, {
        autoAlpha: 0,
        y: 16,
        scale: prefersReduced ? 1 : 0.98,
        duration: prefersReduced ? 0.2 : 0.35,
        ease: 'power2.in',
      })
      .to(
        overlayRef.current,
        {
          autoAlpha: 0,
          duration: prefersReduced ? 0.2 : 0.35,
          ease: 'power2.in',
        },
        '<0.05'
      )
  }, [isClosing, onClose])

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPrevious()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        onNext()
      }
    },
    [handleClose, onNext, onPrevious]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    if (activeIndex === displayIndex) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })

    timeline
      .to(contentRef.current, {
        autoAlpha: 0,
        y: -10,
        duration: prefersReduced ? 0.18 : 0.28,
      })
      .call(() => setDisplayIndex(activeIndex))
      .fromTo(
        contentRef.current,
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: prefersReduced ? 0.18 : 0.3 },
        '+=0.02'
      )

    return () => timeline.kill()
  }, [activeIndex, displayIndex])

  const handleOverlayClick = (event) => {
    if (event.target === overlayRef.current) {
      handleClose()
    }
  }

  const handleImageError = () => {
    setFailed(true)
  }

  return (
    <div
      className="photo-lightbox-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Photo memory lightbox"
      onClick={handleOverlayClick}
    >
      <div className="photo-lightbox-content" ref={contentRef}>
        <button
          type="button"
          className="photo-lightbox-close"
          onClick={handleClose}
          aria-label="Close photo viewer"
          ref={closeButtonRef}
        >
          <X size={22} />
        </button>

        <div className="photo-lightbox-main">
          <button
            type="button"
            className="photo-lightbox-nav photo-lightbox-nav-prev"
            onClick={onPrevious}
            aria-label="Previous photo"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="photo-lightbox-frame">
            {failed ? (
              <div className="photo-lightbox-fallback">Memory unavailable</div>
            ) : (
              <img
                ref={imageRef}
                src={photo.src}
                alt={altText}
                loading="eager"
                onError={handleImageError}
              />
            )}
          </div>

          <button
            type="button"
            className="photo-lightbox-nav photo-lightbox-nav-next"
            onClick={onNext}
            aria-label="Next photo"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="photo-lightbox-caption-wrap">
          {label && <div className="photo-lightbox-label">{label}</div>}
          {caption ? (
            <div className="photo-lightbox-caption">{caption}</div>
          ) : (
            <div className="photo-lightbox-caption-muted">A quiet memory without words.</div>
          )}
        </div>
      </div>
    </div>
  )
}
