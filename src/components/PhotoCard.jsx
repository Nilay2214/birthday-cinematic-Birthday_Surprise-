import React, { useMemo, useState } from 'react'
import '../styles/photoCard.css'

export default function PhotoCard({ photo, style, isActive, onToggle, index = 0, arrangeMode, priority = 'auto' }) {
  const [failed, setFailed] = useState(false)

  const altText = useMemo(
    () => photo.caption || photo.label || 'Memory photograph',
    [photo.caption, photo.label]
  )

  const handleError = () => {
    setFailed(true)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }

  const isHero = index === 0 || priority === 'high'

  return (
    <div
      className={`photo-card ${isActive ? 'is-active' : ''} ${arrangeMode && isActive ? 'photo-card--arrange-active' : ''}`}
      style={style}
      aria-live="polite"
    >
      <button
        type="button"
        className="photo-card-button"
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-pressed={isActive}
      >
        <div className="photo-card-frame">
          {failed ? (
            <div className="photo-card-fallback">
              <span>Memory unavailable</span>
            </div>
          ) : (
            <img
              src={photo.src}
              alt={altText}
              loading={isHero ? 'eager' : 'lazy'}
              decoding="async"
              fetchpriority={isHero ? 'high' : undefined}
              onError={handleError}
            />
          )}
        </div>
        {(photo.label || photo.caption) && (
          <figcaption className="photo-card-caption">
            {photo.label && <strong>{photo.label}</strong>}
            {photo.caption && <span>{photo.caption}</span>}
          </figcaption>
        )}
      </button>
    </div>
  )
}

