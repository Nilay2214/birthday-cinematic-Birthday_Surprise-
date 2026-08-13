import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { gsap } from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import { SRGBColorSpace, DoubleSide, Vector3, MathUtils } from 'three'
import birthdayData from '../data/birthdayData'
import PhotoLightbox from '../components/PhotoLightbox'
import '../styles/memoryUniverse.css'

gsap.registerPlugin(ScrollTrigger)

// Preload all photo textures so they are cached by R3F/drei
const universePhotoList = Array.isArray(birthdayData.memoryUniversePhotos)
  ? birthdayData.memoryUniversePhotos
  : Array.isArray(birthdayData.photos) ? birthdayData.photos : []

if (universePhotoList.length > 0) {
  universePhotoList.forEach((p) => {
    if (p.src) {
      try {
        useTexture.preload(p.src)
      } catch (e) {
        // Ignore preload errors during module initialization
      }
    }
  })
}

function DeterministicFloat({ index, speed, floatIntensity, rotationIntensity, floatingRange = [0.08, 0.16], enabled = true, children, ...props }) {
  const groupRef = useRef(null)
  const offset = useMemo(() => index * 1.73, [index])

  useFrame((state) => {
    if (!groupRef.current || !enabled) return

    const t = state.clock.elapsedTime * speed + offset
    groupRef.current.rotation.x = Math.cos(t / 4) * 0.06 * rotationIntensity
    groupRef.current.rotation.y = Math.sin(t / 4) * 0.06 * rotationIntensity
    groupRef.current.rotation.z = Math.sin(t / 5) * 0.03 * rotationIntensity
    groupRef.current.position.y = MathUtils.mapLinear(
      Math.sin(t / 4),
      -1,
      1,
      floatingRange[0],
      floatingRange[1]
    ) * floatIntensity
  })

  return (
    <group ref={groupRef} {...props}>
      {children}
    </group>
  )
}

function getMemoryTransform(index, count, isMobile) {
  const base = [
    { x: -1.5, y: 0.7, z: -2.3, ry: 0.14, scale: 1.0 },
    { x: 1.4, y: 0.8, z: -2.5, ry: -0.14, scale: 1.0 },
    { x: 0.0, y: 1.1, z: -2.1, ry: 0.04, scale: 1.02 },
    { x: -1.6, y: -0.3, z: -2.8, ry: 0.18, scale: 0.95 },
    { x: 1.5, y: -0.4, z: -2.9, ry: -0.18, scale: 0.95 },
    { x: 0.0, y: -1.0, z: -2.2, ry: 0.03, scale: 0.98 },
    { x: -0.75, y: 0.25, z: -2.0, ry: 0.08, scale: 1.04 },
    { x: 0.8, y: -0.1, z: -2.1, ry: -0.08, scale: 1.04 },
  ]

  const transform = base[index % base.length] || { x: 0, y: 0, z: -2, ry: 0, scale: 1 }

  return {
    x: transform.x * (isMobile ? 0.65 : 1),
    y: transform.y * (isMobile ? 0.75 : 1),
    z: transform.z,
    ry: transform.ry,
    scale: transform.scale * (isMobile ? 0.82 : 1),
  }
}

function MemoryCard({ index, photo, transform, selected, onSelect, reducedMotion, isMobile }) {
  const groupRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const texture = useTexture(photo.src)

  useEffect(() => {
    if (texture) {
      texture.colorSpace = SRGBColorSpace
      texture.needsUpdate = true
    }
  }, [texture])

  const aspect = useMemo(() => {
    if (texture && texture.image && texture.image.width > 0) {
      return texture.image.height / texture.image.width
    }
    return 1.25
  }, [texture])

  const width = isMobile ? 0.95 : 1.35
  const height = width * aspect
  const photoDepth = 0.015
  const frameColor = selected ? '#4a2c38' : '#1a1216'

  const targetScale = useRef(new Vector3(1, 1, 1))

  useFrame(() => {
    const target = (selected ? 1.14 : hovered ? 1.08 : 1) * transform.scale
    if (groupRef.current) {
      targetScale.current.set(target, target, target)
      groupRef.current.scale.lerp(targetScale.current, 0.1)
    }
  })

  return (
    <DeterministicFloat
      index={index}
      speed={reducedMotion ? 0.3 : 0.9 + (index % 3) * 0.02}
      floatIntensity={reducedMotion ? 0.06 : 0.18}
      rotationIntensity={0.08}
      floatingRange={[0.06, 0.14]}
      enabled={!reducedMotion}
    >
      <group
        ref={groupRef}
        position={[transform.x, transform.y, transform.z]}
        rotation={[0, transform.ry, 0]}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(event) => {
          event.stopPropagation()
          setHovered(false)
          document.body.style.cursor = ''
        }}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(index)
        }}
      >
        {/* Frame border */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[width + 0.08, height + 0.08]} />
          <meshBasicMaterial color={frameColor} side={DoubleSide} />
        </mesh>

        {/* Photo texture plane */}
        <mesh position={[0, 0, photoDepth]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} side={DoubleSide} />
        </mesh>
      </group>
    </DeterministicFloat>
  )
}

function MemoryScene({ photos, selectedIndex, onSelect, reducedMotion, isMobile }) {
  const sceneRoot = useRef(null)

  useFrame((state) => {
    if (!sceneRoot.current) return
    if (!reducedMotion) {
      const pointerX = MathUtils.lerp(sceneRoot.current.position.x, state.pointer.x * 0.14, 0.06)
      const pointerY = MathUtils.lerp(sceneRoot.current.position.y, state.pointer.y * 0.07, 0.06)
      sceneRoot.current.position.x = pointerX
      sceneRoot.current.position.y = pointerY
    }
  })

  return (
    <group ref={sceneRoot}>
      {photos.map((photo, index) => (
        <MemoryCard
          key={`${photo.src}-${index}`}
          index={index}
          photo={photo}
          transform={getMemoryTransform(index, photos.length, isMobile)}
          selected={selectedIndex === index}
          onSelect={onSelect}
          reducedMotion={reducedMotion}
          isMobile={isMobile}
        />
      ))}
    </group>
  )
}

export default function MemoryUniverse() {
  const photos = useMemo(
    () => (Array.isArray(birthdayData.memoryUniversePhotos) ? birthdayData.memoryUniversePhotos : birthdayData.photos || []),
    []
  )
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [webglAvailable, setWebglAvailable] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const sectionRef = useRef(null)
  const scrollGroupRef = useRef(null)

  useEffect(() => {
    const supportsWebGL = () => {
      try {
        const canvas = document.createElement('canvas')
        return !!(
          window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        )
      } catch {
        return false
      }
    }

    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    setIsMobile(window.matchMedia('(max-width: 760px)').matches)
    setWebglAvailable(supportsWebGL())

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileQuery = window.matchMedia('(max-width: 760px)')

    const onMotionChange = (event) => setReducedMotion(event.matches)
    const onMobileChange = (event) => setIsMobile(event.matches)

    motionQuery.addEventListener('change', onMotionChange)
    mobileQuery.addEventListener('change', onMobileChange)

    return () => {
      motionQuery.removeEventListener('change', onMotionChange)
      mobileQuery.removeEventListener('change', onMobileChange)
    }
  }, [])

  useEffect(() => {
    if (!sectionRef.current || reducedMotion || !scrollGroupRef.current) return

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const progress = Math.min(Math.max(self.progress, 0), 1)
        if (scrollGroupRef.current) {
          scrollGroupRef.current.position.z = -0.6 - progress * 0.5
          scrollGroupRef.current.position.y = -0.1 + progress * 0.15
        }
      },
    })

    return () => {
      trigger.kill()
    }
  }, [reducedMotion])

  const captionText = lightboxIndex !== null ? photos[lightboxIndex]?.caption || photos[lightboxIndex]?.label : ''

  return (
    <section className="memory-universe" ref={sectionRef} aria-label="Memory Universe">
      <div className="memory-universe-inner">
        <div className="memory-universe-intro">
          <div className="memory-universe-label">Memory Universe</div>
          <h2 className="memory-universe-title">A quiet constellation of you.</h2>
          <p className="memory-universe-copy">
            {birthdayData.sectionMessages?.memoryUniverse ||
              'Floating photographs become a gentle universe of moments. Click any memory to explore it more closely.'}
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="memory-universe-empty" role="status">
            <div className="memory-universe-empty-inner">
              <p>There are no memories yet. This space will become a personal universe once photos are added.</p>
            </div>
          </div>
        ) : webglAvailable ? (
          <div className="memory-universe-canvas-wrap">
            <Canvas
              className="memory-universe-canvas"
              shadows={false}
              dpr={[1, 1.5]}
              camera={{ position: [0, 0, 4.2], fov: 42, near: 0.1, far: 18 }}
            >
              <color attach="background" args={['#07070b']} />
              <Suspense fallback={null}>
                <group ref={scrollGroupRef}>
                  <MemoryScene
                    photos={photos}
                    selectedIndex={lightboxIndex}
                    onSelect={setLightboxIndex}
                    reducedMotion={reducedMotion}
                    isMobile={isMobile}
                  />
                </group>
              </Suspense>
            </Canvas>

            {captionText ? (
              <div className="memory-universe-caption">{captionText}</div>
            ) : (
              <div className="memory-universe-caption memory-universe-caption-muted">
                Tap a memory to bring it forward.
              </div>
            )}
          </div>
        ) : (
          <div className="memory-universe-fallback" role="status">
            <div className="memory-universe-fallback-copy">
              <p>Your memory universe is available in a simpler view on this device.</p>
              <p>Tap any photo to open it in the full viewer.</p>
            </div>
            <div className="memory-universe-fallback-grid">
              {photos.map((photo, index) => (
                <button
                  key={`${photo.src}-${index}`}
                  type="button"
                  className="memory-universe-fallback-card"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img src={photo.src} alt={photo.caption || photo.label || `Memory photo ${index + 1}`} />
                  <span>{photo.caption || photo.label || `Memory ${index + 1}`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="memory-universe-accessible" aria-label="Accessible memory list">
          {photos.map((photo, index) => (
            <button
              key={`accessible-${index}`}
              type="button"
              className="memory-universe-accessible-item"
              onClick={() => setLightboxIndex(index)}
            >
              Open memory: {photo.caption || photo.label || `Photo ${index + 1}`}
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrevious={() => setLightboxIndex((current) => (current === null ? null : (current - 1 + photos.length) % photos.length))}
          onNext={() => setLightboxIndex((current) => (current === null ? null : (current + 1) % photos.length))}
        />
      )}
    </section>
  )
}