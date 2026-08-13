import React, { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { Play, Pause } from 'lucide-react'
import '../styles/videoMemory.css'

gsap.registerPlugin(ScrollTrigger)

export default function VideoMemory({ videoData, message, variant = 'light' }) {
  const sectionRef = useRef(null)
  const frameRef = useRef(null)
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const pendingPlayRef = useRef(false)

  const src = videoData?.src?.trim() || ''
  const title = videoData?.title || 'Memory Video'
  const poster = videoData?.poster?.trim() || ''
  const placeholder = videoData?.placeholder || 'Your memory video will live here.'
  const hasVideo = Boolean(src)

  useEffect(() => {
    if (!sectionRef.current) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        frameRef.current,
        { autoAlpha: 0, y: 36, scale: 0.97 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !hasVideo) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            setIsLoaded(true)
          }
        })
      },
      { rootMargin: '200px 0px', threshold: 0.1 }
    )

    observer.observe(section)
    return () => observer.disconnect()
  }, [hasVideo, isLoaded])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onError = () => setHasError(true)

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('error', onError)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('error', onError)
    }
  }, [isLoaded])

  const togglePlay = async () => {
    if (!hasVideo) return

    if (!isLoaded) {
      pendingPlayRef.current = true
      setIsLoaded(true)
      return
    }

    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      try {
        await video.play()
        setShowControls(false)
      } catch {
        try {
          video.muted = true
          await video.play()
          setShowControls(false)
        } catch {
          // Keep video element mounted and visible
        }
      }
    } else {
      video.pause()
      setShowControls(true)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!isLoaded || !video || !pendingPlayRef.current) return

    pendingPlayRef.current = false
    video.play()
      .then(() => setShowControls(false))
      .catch(() => {
        video.muted = true
        video.play().then(() => setShowControls(false)).catch(() => {})
      })
  }, [isLoaded])

  const handleVideoClick = () => {
    if (isPlaying) {
      videoRef.current?.pause()
      setShowControls(true)
    } else {
      togglePlay()
    }
  }

  return (
    <section
      className={`video-memory video-memory--${variant}`}
      ref={sectionRef}
      aria-label={`${title} video section`}
    >
      <div className="video-memory-glow" aria-hidden="true" />
      <div className="video-memory-inner">
        <header className="video-memory-intro">
          <div className="section-label">{title}</div>
          <h2 className={`section-title video-memory-title ${variant === 'dark' ? 'video-memory-title--dark' : ''}`}>
            {title}
          </h2>
          {message && (
            <p className={`section-copy video-memory-copy ${variant === 'dark' ? 'section-copy--light' : ''}`}>
              {message}
            </p>
          )}
          <span className="section-deco-line" aria-hidden="true" />
        </header>

        <div className="video-memory-frame-wrap" ref={frameRef}>
          <div className="video-memory-frame">
            <div className="video-memory-vignette" aria-hidden="true" />
            {hasVideo && !hasError ? (
              <>
                {isLoaded ? (
                  <video
                    ref={videoRef}
                    className="video-memory-video"
                    src={src}
                    poster={poster || undefined}
                    playsInline
                    preload="metadata"
                    defaultMuted={false}
                    muted={false}
                    onLoadedMetadata={() => {
                      const video = videoRef.current
                      if (!video) return
                      video.defaultMuted = false
                      video.muted = false
                      video.volume = 1
                    }}
                    onClick={handleVideoClick}
                    aria-label={`Play ${title} video`}
                  />
                ) : (
                  <div
                    className="video-memory-poster"
                    style={poster ? { backgroundImage: `url(${poster})` } : undefined}
                    aria-hidden="true"
                  />
                )}
                {(showControls || !isPlaying) && (
                  <button
                    type="button"
                    className="video-memory-play"
                    onClick={togglePlay}
                    aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
                  >
                    {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                  </button>
                )}
              </>
            ) : (
              <div className="video-memory-placeholder" role="status">
                <div className="video-memory-placeholder-icon" aria-hidden="true">
                  <Play size={32} />
                </div>
                <p>{hasError ? 'Video unavailable — check the file path in birthdayData.js' : placeholder}</p>
              </div>
            )}
          </div>
          <div className="video-memory-caption">{title}</div>
        </div>
      </div>
    </section>
  )
}
