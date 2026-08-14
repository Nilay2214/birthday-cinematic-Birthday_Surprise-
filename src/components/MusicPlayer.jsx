import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import birthdayData from '../data/birthdayData'
import '../styles/musicPlayer.css'

export default function MusicPlayer({ autoStart = false, locked = false }) {
  const musicPath = useMemo(() => birthdayData.music?.trim() || '', [])
  const audioRef = useRef(null)
  const userPausedRef = useRef(false)
  const autoStartedRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0
  const isDisabled = !musicPath || hasError

  // Stable audio element setup effect — runs only once per musicPath
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.5

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
      setIsReady(true)
    }
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handlePlay = () => {
      setIsPlaying(true)
      setAutoplayBlocked(false)
      setHasError(false)
    }
    const handlePlaying = () => {
      setIsPlaying(true)
      setAutoplayBlocked(false)
      setHasError(false)
    }
    const handlePause = () => {
      setIsPlaying(false)
    }
    const handleEnded = () => {
      setIsPlaying(false)
    }
    const handleVolumeChange = () => {
      setIsMuted(audio.muted)
    }
    const handleError = () => {
      if (audio.error) {
        setHasError(true)
        setErrorMessage('Music unavailable')
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('canplay', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('volumechange', handleVolumeChange)
    audio.addEventListener('error', handleError)

    if (audio.readyState >= 1) {
      handleLoadedMetadata()
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('canplay', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('volumechange', handleVolumeChange)
      audio.removeEventListener('error', handleError)
    }
  }, [musicPath])

  // Playback attempt function for autoplay
  const attemptPlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || userPausedRef.current) return

    try {
      audio.loop = true
      audio.preload = 'auto'
      if (audio.volume === 0) {
        audio.volume = 0.5
      }
      await audio.play()
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
        // Browser autoplay policy blocked audible playback
        setAutoplayBlocked(true)
      } else {
        setAutoplayBlocked(true)
      }
    }
  }, [])

  // Explicit user play / pause toggle
  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      // User requested PLAY
      userPausedRef.current = false
      setAutoplayBlocked(false)
      try {
        audio.muted = false
        if (audio.volume === 0) {
          audio.volume = 0.5
        }
        await audio.play()
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
          setAutoplayBlocked(true)
        }
      }
    } else {
      // User requested PAUSE — strictly pause DOM audio and record user intent
      userPausedRef.current = true
      audio.pause()
    }
  }

  // Autoplay trigger: Runs ONLY once when autoStart becomes true and user hasn't paused
  useEffect(() => {
    if (autoStart && !autoStartedRef.current && !userPausedRef.current) {
      autoStartedRef.current = true
      attemptPlay()
    }
  }, [autoStart, attemptPlay])

  // First user gesture fallback when autoplay was blocked and experience is unlocked
  useEffect(() => {
    if (!autoplayBlocked || locked) return

    const handleFirstGesture = async () => {
      const audio = audioRef.current
      if (!audio || !audio.paused || userPausedRef.current) return
      try {
        await audio.play()
        setAutoplayBlocked(false)
      } catch (err) {
        // Still waiting for eligible interaction
      }
    }

    const events = ['click', 'touchstart', 'keydown']
    events.forEach((evt) =>
      document.addEventListener(evt, handleFirstGesture, { once: true })
    )

    return () => {
      events.forEach((evt) =>
        document.removeEventListener(evt, handleFirstGesture)
      )
    }
  }, [autoplayBlocked, locked])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  if (!musicPath) {
    return null
  }

  const trackTitle = 'Saudebazi'
  const eyebrowText = hasError
    ? 'UNAVAILABLE'
    : isPlaying
    ? 'NOW PLAYING'
    : autoplayBlocked
    ? 'TAP TO PLAY'
    : isMuted
    ? 'MUTED'
    : isReady
    ? 'PAUSED'
    : 'LOADING'

  const subtext = hasError
    ? (errorMessage || 'Music unavailable')
    : isPlaying
    ? 'A little music for this moment.'
    : autoplayBlocked
    ? 'Tap to start background music.'
    : isMuted
    ? 'Sound is muted.'
    : 'Ready when you are.'

  return (
    <aside
      className={`music-player ${isPlaying ? 'music-player--playing' : ''} ${
        isDisabled ? 'music-player--disabled' : ''
      } ${locked ? 'music-player--locked' : ''} ${
        autoplayBlocked ? 'music-player--blocked' : ''
      }`}
      aria-label="Background music player"
    >
      <audio ref={audioRef} src={musicPath} preload="auto" loop hidden />

      <div className="music-player-card" aria-live="polite">
        <div className="music-player-body">
          {/* Left: Luxury Vinyl / Disc Visual */}
          <div className="music-player-disc-wrap" aria-hidden="true">
            <div className={`music-player-disc ${isPlaying ? 'music-player-disc--spinning' : ''}`}>
              <div className="music-player-disc-groove" />
              <div className="music-player-disc-center">
                <Music size={12} className="music-player-disc-icon" />
              </div>
            </div>
            {isPlaying && <span className="music-player-disc-glow" />}
          </div>

          {/* Center: Editorial Song Information */}
          <div className="music-player-meta">
            <div className="music-player-eyebrow">
              {autoplayBlocked && <span className="music-player-pulse-dot" />}
              <span>{eyebrowText}</span>
            </div>
            <div className="music-player-title" title={trackTitle}>
              {trackTitle}
            </div>
            <div className="music-player-subtext" title={subtext}>
              {subtext}
            </div>
          </div>

          {/* Right: Luxury Play/Pause & Mute Controls */}
          <div className="music-player-controls">
            <button
              type="button"
              className="music-player-play-btn"
              onClick={handlePlayPause}
              disabled={isDisabled}
              aria-label={isPlaying ? 'Pause music' : 'Play music'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="music-player-play-icon" />}
            </button>

            <button
              type="button"
              className="music-player-mute-btn"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute music' : 'Mute music'}
              disabled={isDisabled}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </div>

        {/* Bottom: Minimal Editorial Progress Line */}
        <div className="music-player-progress-bar" aria-hidden="true">
          <div className="music-player-progress-track">
            <div
              className="music-player-progress-current"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

