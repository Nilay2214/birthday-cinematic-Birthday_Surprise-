import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import birthdayData from '../data/birthdayData'
import '../styles/musicPlayer.css'

export default function MusicPlayer({ autoStart = false, locked = false }) {
  const musicPath = useMemo(() => birthdayData.music?.trim() || '', [])
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0
  const isDisabled = !musicPath || hasError

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = true
    audio.volume = 0.46
    audio.muted = isMuted
    audio.preload = 'metadata'

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0)
      setIsReady(true)
    }
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleError = () => {
      setHasError(true)
      setErrorMessage('Add your music file at public/assets/music/birthday.mp3')
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
    }
  }, [musicPath, isMuted])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = isMuted
  }, [isMuted])

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio || isDisabled) return

    if (audio.paused) {
      try {
        await audio.play()
      } catch (error) {
        setHasError(true)
        setIsPlaying(false)
      }
    } else {
      audio.pause()
    }
  }

  // After the birthday video ends, this auto-starts the music.
  useEffect(() => {
    if (autoStart && isReady && !isPlaying) {
      handlePlayPause()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, isReady])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  if (!musicPath) {
    return null
  }

  return (
    <div
      className={`music-player ${isPlaying ? 'music-player--playing' : ''} ${
        isDisabled ? 'music-player--disabled' : ''
      } ${locked ? 'music-player--locked' : ''}`}
    >
      <audio ref={audioRef} src={musicPath} hidden />

      <div className="music-player-card" aria-live="polite">
        <div className="music-player-top">
          <div>
            <div className="music-player-label">Birthday music</div>
            <div className="music-player-state">
              {hasError
                ? errorMessage || 'Unavailable'
                : isPlaying
                ? 'Now playing'
                : isReady
                ? 'Paused'
                : 'Loading…'}
            </div>
          </div>

          <div className="music-player-buttons">
            <button
              type="button"
              className="music-player-button"
              onClick={handlePlayPause}
              disabled={isDisabled}
              aria-label={isPlaying ? 'Pause birthday music' : 'Play birthday music'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              type="button"
              className="music-player-button music-player-button--mute"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute birthday music' : 'Mute birthday music'}
              disabled={isDisabled}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        <div className="music-player-visual" aria-hidden="true">
          <span className="music-player-bar" />
          <span className="music-player-bar" />
          <span className="music-player-bar" />
        </div>

        <div className="music-player-progress" aria-hidden="true">
          <div className="music-player-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}
