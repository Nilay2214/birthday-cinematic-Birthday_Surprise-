import React, { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Volume2, Play, ArrowRight } from 'lucide-react'
import birthdayData from '../data/birthdayData'
import '../styles/birthdayVideo.css'

export default function BirthdayVideo({ autoStart = false, video: customVideo, onVideoEnded }) {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const endedHandledRef = useRef(false)

  // State machine: 'loading' | 'ready' | 'playing' | 'ended' | 'error'
  const [videoStatus, setVideoStatus] = useState('loading')
  const [soundBlocked, setSoundBlocked] = useState(false)

  const videoConfig = customVideo || birthdayData.videos?.main || {
    src: '/assets/converted/VID_20260813205638-converted.mp4',
    poster: '/assets/optimized/hero_photo.webp',
    title: 'A Moment Just for You',
  }

  const src = videoConfig.src
  const poster = videoConfig.poster
  const title = videoConfig.title

  const handleProceed = useCallback(() => {
    if (endedHandledRef.current) return
    endedHandledRef.current = true

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced || !sectionRef.current) {
      onVideoEnded?.()
      return
    }

    gsap.to(sectionRef.current, {
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => onVideoEnded?.(),
    })
  }, [onVideoEnded])

  const syncAudioState = useCallback((withSound) => {
    const video = videoRef.current
    if (!video) return

    video.defaultMuted = !withSound
    video.muted = !withSound
    video.volume = withSound ? 1 : 0
  }, [])

  const startVideo = useCallback((withSound) => {
    const video = videoRef.current
    if (!video) return

    syncAudioState(withSound)
    const attempt = video.play()
    if (attempt) {
      attempt
        .then(() => {
          setVideoStatus('playing')
        })
        .catch(() => {
          if (withSound) {
            syncAudioState(false)
            setSoundBlocked(true)
            video
              .play()
              .then(() => setVideoStatus('playing'))
              .catch(() => setVideoStatus('ready'))
          } else {
            setVideoStatus('ready')
          }
        })
    }
  }, [syncAudioState])

  useEffect(() => {
    if (!autoStart) return
    const timer = setTimeout(() => startVideo(true), 120)
    return () => clearTimeout(timer)
  }, [autoStart, startVideo])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onEnded = () => {
      setVideoStatus('ended')
      handleProceed()
    }

    video.addEventListener('ended', onEnded)
    return () => video.removeEventListener('ended', onEnded)
  }, [handleProceed])

  const handleEnableSound = () => {
    const video = videoRef.current
    if (!video) return

    syncAudioState(true)
    setSoundBlocked(false)
    video.play().then(() => setVideoStatus('playing')).catch(() => {})
  }

  return (
    <section
      className="birthday-video"
      ref={sectionRef}
      aria-label="Birthday video"
      aria-live="polite"
    >
      <div className="birthday-video-vignette" aria-hidden="true" />
      <div className="birthday-video-inner">
        <header className="birthday-video-header">
          <div className="section-label">Birthday Video</div>
          <h1 className="birthday-video-title">{title}</h1>
          <p className="birthday-video-copy">A candid little memory, just for you.</p>
        </header>

        <div className="birthday-video-frame" style={{ position: 'relative', minHeight: '260px' }}>
          {videoStatus === 'error' ? (
            <div
              className="birthday-video-error"
              role="status"
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                background: 'rgba(26, 14, 20, 0.85)',
                borderRadius: '16px',
                border: '1px solid rgba(232, 160, 184, 0.2)',
              }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#F6D6DF' }}>
                Video Moment
              </div>
              <p style={{ fontSize: '0.95rem', color: 'rgba(248, 241, 234, 0.8)', marginBottom: '24px' }}>
                Ready to continue to the photo reveal experience.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleProceed}
                style={{
                  padding: '12px 28px',
                  borderRadius: '30px',
                  background: '#E8A0B8',
                  color: '#120C11',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue to Birthday Reveal →
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="birthday-video-player"
              src={src}
              poster={poster}
              playsInline
              preload="auto"
              controls
              autoPlay={false}
              muted={false}
              onCanPlay={() => {
                if (videoStatus === 'loading') setVideoStatus('ready')
              }}
              onPlay={() => setVideoStatus('playing')}
              onError={() => setVideoStatus('error')}
              aria-label={`Play ${title}`}
            />
          )}

          {soundBlocked && videoStatus !== 'error' && (
            <button
              type="button"
              className="birthday-video-sound"
              onClick={handleEnableSound}
              aria-label="Play with sound"
            >
              <Volume2 size={20} />
              <span>Play with sound</span>
            </button>
          )}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <p className="birthday-video-hint" style={{ margin: 0 }}>Sit back and enjoy the moment.</p>
          <button
            type="button"
            onClick={handleProceed}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(232, 160, 184, 0.85)',
              fontSize: '0.88rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Continue to reveal</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  )
}
