import React, { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import birthdayData from '../data/birthdayData'
import '../styles/polaroidGallery.css'
import '../styles/photoLightbox.css'
import PhotoCard from '../components/PhotoCard'
import PhotoLightbox from '../components/PhotoLightbox'

gsap.registerPlugin(ScrollTrigger)

const layout = [
  { left: '16%', top: '10%', rotate: '-4deg', scale: 1.02, w: 340, z: 4 },
  { left: '55%', top: '6%', rotate: '3deg', scale: 0.96, w: 300, z: 3 },
  { left: '78%', top: '16%', rotate: '-1.5deg', scale: 0.88, w: 250, z: 2 },
  { left: '24%', top: '36%', rotate: '2deg', scale: 1.06, w: 380, z: 6 },
  { left: '65%', top: '34%', rotate: '-3deg', scale: 0.94, w: 300, z: 4 },
  { left: '10%', top: '64%', rotate: '3.5deg', scale: 0.92, w: 270, z: 3 },
  { left: '44%', top: '62%', rotate: '-1deg', scale: 1, w: 320, z: 5 },
  { left: '70%', top: '66%', rotate: '2.5deg', scale: 0.94, w: 290, z: 7 },
]

function getPosition(index) {
  return layout[index % layout.length]
}

export default function PolaroidGallery() {
  const photos = useMemo(() => (Array.isArray(birthdayData.photos) ? birthdayData.photos : []), [])
  const sectionMessage = birthdayData.sectionMessages?.polaroidGallery || ''
  const cardsRef = useRef([])
  const sectionRef = useRef(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    if (!sectionRef.current || photos.length === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })

      cardsRef.current.forEach((card, index) => {
        if (!card) return
        const pos = getPosition(index)
        tl.from(
          card,
          {
            y: 40,
            rotation: `${parseFloat(pos.rotate) + 6}deg`,
            scale: pos.scale * 0.88,
            filter: prefersReduced ? 'none' : 'blur(3px)',
            autoAlpha: 1,
            duration: prefersReduced ? 0.4 : 0.85,
            ease: 'power3.out',
          },
          index * 0.09
        )
      })

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 82%',
        end: 'bottom 20%',
        animation: tl,
        scrub: prefersReduced ? false : 0.45,
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [photos])

  const polaroidCards =
    photos.length > 0 ? (
      photos.map((photo, index) => {
        const position = getPosition(index)
        return (
          <div
            key={`${photo.src}-${index}`}
            ref={(el) => (cardsRef.current[index] = el)}
            className="polaroid-gallery-card"
            style={{
              left: position.left,
              top: position.top,
              width: position.w,
              transform: `translate(-50%, -50%) rotate(${position.rotate}) scale(${position.scale})`,
              zIndex: position.z,
            }}
          >
            <PhotoCard
              photo={photo}
              onToggle={() => setLightboxIndex(index)}
              isActive={lightboxIndex === index}
            />
          </div>
        )
      })
    ) : (
      <p className="polaroid-empty">An intimate collection of memories will appear here once photos are added.</p>
    )

  return (
    <section className="polaroid-gallery" ref={sectionRef} aria-label="Polaroid memory gallery">
      <div className="polaroid-gallery-glow" aria-hidden="true" />
      <div className="polaroid-gallery-texture" aria-hidden="true" />
      <div className="polaroid-gallery-inner">
        <header className="polaroid-gallery-intro">
          <div className="section-label">Memory Gallery</div>
          <h2 className="section-title">The moments that stayed.</h2>
          {sectionMessage && <p className="section-copy">{sectionMessage}</p>}
          <span className="section-deco-line" aria-hidden="true" />
        </header>
        <div className="polaroid-gallery-grid">{polaroidCards}</div>
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
