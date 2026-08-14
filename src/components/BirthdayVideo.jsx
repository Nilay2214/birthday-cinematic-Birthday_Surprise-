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
  const [isMuted, setIsMuted] = useState(true)

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
    setIsMuted(!withSound)
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
          setIsMuted(!withSound)
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
    startVideo(true)
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

  const handleEnableSound = async (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }

    const video = videoRef.current
    if (!video) return

    video.defaultMuted = false
    video.muted = false
    video.volume = 1

    try {
      await video.play()
      setIsMuted(false)
      setSoundBlocked(false)
      setVideoStatus('playing')
    } catch (err) {
      console.warn('Play with sound request rejected by browser:', err)
    }
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

        <div
          className="birthday-video-frame"
          style={{ position: 'relative', minHeight: '260px' }}
        >
          <video
            ref={videoRef}
            className="birthday-video-player"
            src={src}
            poster={poster}
            playsInline
            preload="auto"
            controls
            autoPlay={false}
            defaultMuted={true}
            onClick={isMuted ? handleEnableSound : undefined}
            onCanPlay={() => {
              if (videoStatus === 'loading') setVideoStatus('ready')
            }}
            onPlay={() => {
              setVideoStatus('playing')
              if (videoRef.current && !videoRef.current.muted) {
                setIsMuted(false)
                setSoundBlocked(false)
              }
            }}
            onPause={() => {
              if (videoStatus === 'playing') setVideoStatus('ready')
            }}
            onVolumeChange={() => {
              if (videoRef.current) {
                setIsMuted(videoRef.current.muted)
              }
            }}
            onError={() => {
              if (videoStatus === 'loading') setVideoStatus('ready')
            }}
            aria-label={`Play ${title}`}
          />

          {isMuted && (
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
