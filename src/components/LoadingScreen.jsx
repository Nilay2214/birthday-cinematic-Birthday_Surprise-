import React, { useEffect, useRef } from 'react'
import birthdayData from '../data/birthdayData'
import { gsap } from 'gsap'
import '../styles/loading.css'

function preloadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve({ src, ok: false })
    const img = new Image()
    img.onload = () => resolve({ src, ok: true })
    img.onerror = () => resolve({ src, ok: false })
    img.src = src
  })
}

export default function LoadingScreen({ onFinish = () => {} }) {
  const rootRef = useRef(null)
  const barRef = useRef(null)
  const tlRef = useRef(null)

  // Check if loader has already run in this session
  const alreadySeen = React.useMemo(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem('birthday_loading_seen') === 'true'
    } catch (e) {
      return false
    }
  }, [])

  const [isDone, setIsDone] = React.useState(alreadySeen)

  useEffect(() => {
    if (alreadySeen) {
      onFinish()
      return
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let mounted = true

    async function run() {
      // initial subtle entrance
      if (!prefersReduced) {
        tlRef.current = gsap.timeline()
        tlRef.current.fromTo(
          rootRef.current,
          { autoAlpha: 0.98, filter: 'blur(0.6px) contrast(0.98)' },
          { autoAlpha: 1, duration: 0.7, ease: 'power3.out' }
        )
      }

      // gather all unique photo sources
      const allPhotos = [
        birthdayData.heroPhoto,
        ...(Array.isArray(birthdayData.photoJourneyPhotos) ? birthdayData.photoJourneyPhotos : []),
        ...(Array.isArray(birthdayData.movableMemoryPhotos) ? birthdayData.movableMemoryPhotos : []),
        ...(Array.isArray(birthdayData.memoryUniversePhotos) ? birthdayData.memoryUniversePhotos : []),
        { src: birthdayData.videos?.first?.poster },
        { src: birthdayData.videos?.second?.poster },
      ].filter(Boolean)

      const preloadPromises = allPhotos.map((p) => preloadImage(p.src))

      let completed = 0
      const total = Math.max(preloadPromises.length, 1)

      preloadPromises.forEach((pr) => {
        pr.then(() => {
          completed += 1
          const progress = completed / total
          if (barRef.current && !prefersReduced) {
            gsap.to(barRef.current, { scaleX: Math.max(0.06, progress), duration: 0.25, ease: 'expo.out' })
          }
        })
      })

      // Wait for all to settle or max timeout of 1.5s
      await Promise.race([
        Promise.all(preloadPromises.map((p) => p.catch(() => null))),
        new Promise((res) => setTimeout(res, 1500)),
      ])

      if (!mounted) return

      try {
        sessionStorage.setItem('birthday_loading_seen', 'true')
      } catch (e) {}

      // animate out
      if (!prefersReduced && rootRef.current) {
        await gsap.to(rootRef.current, { autoAlpha: 0, y: -24, duration: 0.5, ease: 'power4.inOut' })
      }

      if (mounted) {
        setIsDone(true)
        onFinish()
      }
    }

    run()

    return () => {
      mounted = false
      if (tlRef.current) tlRef.current.kill()
      if (barRef.current) gsap.killTweensOf(barRef.current)
    }
  }, [alreadySeen, onFinish])

  if (isDone) {
    return null
  }

  return (
    <div ref={rootRef} className="loading-screen-root" role="status" aria-label="Preparing content">
      <div className="loading-vignette" aria-hidden="true" />
      <div className="loading-grain" aria-hidden="true" />

      <div className="loading-center">
        <div className="loader-title">Preparing something special...</div>
        <div className="loader-sub">A brief cinematic moment</div>

        <div className="loader-indicator" aria-hidden="true">
          <div ref={barRef} className="bar" style={{ transformOrigin: 'left center', transform: 'scaleX(0.06)' }} />
        </div>
      </div>
    </div>
  )
}

