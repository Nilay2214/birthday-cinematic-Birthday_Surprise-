import React, { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import birthdayData from '../data/birthdayData'
import PhotoCard from '../components/PhotoCard'
import PhotoLightbox from '../components/PhotoLightbox'
import '../styles/photoJourney.css'

gsap.registerPlugin(ScrollTrigger)

export default function PhotoJourney() {
  const photos = useMemo(
    () => (Array.isArray(birthdayData.photoJourneyPhotos) ? birthdayData.photoJourneyPhotos : birthdayData.photos || []),
    []
  )
  const sectionMessage = birthdayData.sectionMessages?.photoJourney || ''
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const sectionRef = useRef(null)
  const act1Ref = useRef(null)
  const act2Ref = useRef(null)
  const act3Ref = useRef(null)

  useEffect(() => {
    if (photos.length === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      // Act 1 scroll trigger
      if (act1Ref.current) {
        gsap.fromTo(
          act1Ref.current.querySelectorAll('.photo-journey-item'),
          { y: 44, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: act1Ref.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      // Act 2 scroll trigger
      if (act2Ref.current) {
        gsap.fromTo(
          act2Ref.current.querySelectorAll('.photo-journey-item, .photo-journey-chapter'),
          { y: 44, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: act2Ref.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }

      // Act 3 scroll trigger
      if (act3Ref.current) {
        gsap.fromTo(
          act3Ref.current.querySelectorAll('.photo-journey-item, .photo-journey-chapter'),
          { y: 44, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.9,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: act3Ref.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [photos])

  // Split photos into 3 acts
  const act1Photos = photos.slice(0, 3)
  const act2Photos = photos.slice(3, 6)
  const act3Photos = photos.slice(6, 8)

  return (
    <section className="photo-journey" ref={sectionRef} aria-label="Photo journey section">
      <div className="photo-journey-bg" aria-hidden="true">
        <div className="photo-journey-glow" />
        <div className="photo-journey-grain" />
      </div>

      <div className="photo-journey-inner">
        <header className="photo-journey-header">
          <div className="section-label">Photo Journey</div>
          <h2 className="section-title">Every frame, a little more of you.</h2>
          {sectionMessage && <p className="section-copy photo-journey-tagline">{sectionMessage}</p>}
          <span className="section-deco-line" aria-hidden="true" />
        </header>

        {photos.length === 0 ? (
          <p className="section-copy">The memory collection is being prepared.</p>
        ) : (
          <div className="photo-journey-story">
            {/* Act 1: Hero & Opening Memories */}
            <div className="photo-journey-act photo-journey-act--1" ref={act1Ref}>
              {act1Photos.map((photo, idx) => {
                const globalIndex = idx
                const isHero = globalIndex === 0
                return (
                  <div
                    key={`${photo.src}-${globalIndex}`}
                    className={`photo-journey-item photo-journey-item--act1-${idx + 1} ${isHero ? 'photo-journey-item--hero' : ''}`}
                  >
                    <PhotoCard
                      photo={photo}
                      index={globalIndex}
                      priority={isHero ? 'high' : 'auto'}
                      isActive={lightboxIndex === globalIndex}
                      onToggle={() => setLightboxIndex(globalIndex)}
                    />
                  </div>
                )
              })}
            </div>

            {/* Act 2: Middle Memories */}
            {act2Photos.length > 0 && (
              <div className="photo-journey-act photo-journey-act--2" ref={act2Ref}>
                <div className="photo-journey-chapter" aria-hidden="true">
                  <span>CHAPTER TWO — SHARED LAUGHTER</span>
                </div>
                <div className="photo-journey-act-grid">
                  {act2Photos.map((photo, idx) => {
                    const globalIndex = idx + 3
                    return (
                      <div
                        key={`${photo.src}-${globalIndex}`}
                        className={`photo-journey-item photo-journey-item--act2-${idx + 1}`}
                      >
                        <PhotoCard
                          photo={photo}
                          index={globalIndex}
                          isActive={lightboxIndex === globalIndex}
                          onToggle={() => setLightboxIndex(globalIndex)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Act 3: Final Memories */}
            {act3Photos.length > 0 && (
              <div className="photo-journey-act photo-journey-act--3" ref={act3Ref}>
                <div className="photo-journey-chapter" aria-hidden="true">
                  <span>CHAPTER THREE — FOREVER MEMORIES</span>
                </div>
                <div className="photo-journey-act-grid photo-journey-act-grid--two">
                  {act3Photos.map((photo, idx) => {
                    const globalIndex = idx + 6
                    return (
                      <div
                        key={`${photo.src}-${globalIndex}`}
                        className={`photo-journey-item photo-journey-item--act3-${idx + 1}`}
                      >
                        <PhotoCard
                          photo={photo}
                          index={globalIndex}
                          isActive={lightboxIndex === globalIndex}
                          onToggle={() => setLightboxIndex(globalIndex)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
