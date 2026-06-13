'use client'

/**
 * HeroScene — scène R3F (ssr:false, chargé uniquement via dynamic())
 * Logo « M » verre + 6 cartes bento orbitales + lumières + post-processing
 * Boucle seamless ~18s, parallaxe souris, pause quand onglet caché.
 */

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  MeshTransmissionMaterial,
  Float,
  Environment,
  Lightformer,
  RoundedBox,
} from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

// ── Cartes bento orbitales ────────────────────────────────────────────────────

interface CardConfig {
  baseAngle: number
  radius: number
  y: number
  speed: number
}

const CARD_CONFIGS: CardConfig[] = [
  { baseAngle: 0,    radius: 3.2, y:  0.8, speed: 0.14 },
  { baseAngle: 2.0,  radius: 3.2, y: -0.9, speed: 0.11 },
  { baseAngle: 4.2,  radius: 3.2, y:  0.2, speed: 0.17 },
  { baseAngle: 1.1,  radius: 4.8, y:  1.5, speed: 0.10 },
  { baseAngle: 3.3,  radius: 4.8, y: -1.2, speed: 0.13 },
  { baseAngle: 5.5,  radius: 4.8, y:  0.6, speed: 0.09 },
]

function makeCardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 160
  const ctx = canvas.getContext('2d')!

  // fond sombre
  ctx.fillStyle = '#0a0812'
  ctx.fillRect(0, 0, 256, 160)

  // barres abstraites
  const barColors = ['#8b5cf6', '#FF66CC', '#6366f1', '#c084fc']
  for (let i = 0; i < 8; i++) {
    const h = 4 + Math.random() * 40
    const x = 12 + i * 28
    const col = barColors[i % barColors.length]
    ctx.fillStyle = col + '99'
    ctx.fillRect(x, 130 - h, 18, h)
  }

  // ligne de chiffres abstraits
  ctx.font = 'bold 11px monospace'
  ctx.fillStyle = '#8b5cf688'
  for (let row = 0; row < 3; row++) {
    let txt = ''
    for (let j = 0; j < 6; j++) {
      txt += Math.floor(Math.random() * 9999).toString().padStart(4, '0') + ' '
    }
    ctx.fillText(txt, 8, 20 + row * 18)
  }

  // label court émissif
  ctx.font = 'bold 14px monospace'
  ctx.fillStyle = '#FF66CCCC'
  const labels = ['+38%', '4 PLF', '12h', '2min', '€€€', '✦']
  ctx.fillText(labels[Math.floor(Math.random() * labels.length)], 10, 72)

  return new THREE.CanvasTexture(canvas)
}

function OrbitalCard({ config, mouseRef }: { config: CardConfig; mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useMemo(() => makeCardTexture(), [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()
    const theta = config.baseAngle + t * config.speed
    const mx = mouseRef.current?.x ?? 0
    const my = mouseRef.current?.y ?? 0

    meshRef.current.position.x = Math.cos(theta) * config.radius + mx * 0.15
    meshRef.current.position.z = Math.sin(theta) * config.radius * 0.6
    meshRef.current.position.y = config.y + Math.sin(t * 0.7 + config.baseAngle) * 0.25 + my * 0.08

    // flip propre
    meshRef.current.rotation.y = theta + Math.PI / 2
    meshRef.current.rotation.x = Math.sin(t * 0.4 + config.baseAngle) * 0.15
  })

  return (
    <mesh ref={meshRef}>
      <RoundedBox args={[1.6, 1.0, 0.06]} radius={0.08} smoothness={4}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.4}
          roughness={0.12}
          ior={1.35}
          chromaticAberration={0.06}
          anisotropy={0.3}
          distortion={0.25}
          distortionScale={0.4}
          temporalDistortion={0.1}
          clearcoat={1}
          attenuationColor="#b48bff"
          attenuationDistance={2.5}
          emissiveMap={texture}
          emissive="#FF66CC"
          emissiveIntensity={0.35}
        />
      </RoundedBox>
    </mesh>
  )
}

// ── Logo « M » central ────────────────────────────────────────────────────────

function LogoMesh({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null)

  // Courbe en forme de M (points de contrôle)
  const mShape = useMemo(() => {
    const shape = new THREE.Shape()
    // M : départ bas-gauche, monte, descend au centre, remonte, descend bas-droite
    shape.moveTo(-0.9, -1.0)
    shape.lineTo(-0.9,  1.0)
    shape.lineTo(-0.45, 0.0)
    shape.lineTo( 0.0,  1.0)
    shape.lineTo( 0.45, 0.0)
    shape.lineTo( 0.9,  1.0)
    shape.lineTo( 0.9, -1.0)
    shape.lineTo( 0.65, -1.0)
    shape.lineTo( 0.65, 0.65)
    shape.lineTo( 0.28, -0.25)
    shape.lineTo( 0.0,   0.55)
    shape.lineTo(-0.28, -0.25)
    shape.lineTo(-0.65,  0.65)
    shape.lineTo(-0.65, -1.0)
    shape.closePath()
    return shape
  }, [])

  const extrudeSettings = useMemo(() => ({
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 4,
  }), [])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()
    const mx = mouseRef.current?.x ?? 0
    const my = mouseRef.current?.y ?? 0

    groupRef.current.rotation.y += 0.0015
    groupRef.current.rotation.x = 0.12 + Math.sin(t * 0.6) * 0.04 + my * 0.05
    groupRef.current.rotation.z = 0.05 + Math.sin(t * 0.4) * 0.03
    groupRef.current.position.x = -0.35 + mx * 0.3
    groupRef.current.position.y = Math.sin(t * 1.2 * 0.3) * 0.15 + my * 0.12
  })

  return (
    <Float speed={1.2} floatIntensity={0.4} rotationIntensity={0.2}>
      <group ref={groupRef} rotation={[0.12, -0.35, 0.05]}>
        <mesh>
          <extrudeGeometry args={[mShape, extrudeSettings]} />
          <MeshTransmissionMaterial
            transmission={1}
            thickness={1.4}
            roughness={0.12}
            ior={1.35}
            chromaticAberration={0.06}
            anisotropy={0.3}
            distortion={0.25}
            distortionScale={0.4}
            temporalDistortion={0.1}
            clearcoat={1}
            color="#8b5cf6"
            attenuationColor="#b48bff"
            attenuationDistance={2.5}
          />
        </mesh>
      </group>
    </Float>
  )
}

// ── Caméra chorégraphiée ─────────────────────────────────────────────────────

function CameraRig({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3())

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const mx = mouseRef.current?.x ?? 0
    const my = mouseRef.current?.y ?? 0

    targetRef.current.x = Math.sin(t * 0.12) * 1.2 + mx * 0.3
    targetRef.current.y = 0.4 + Math.sin(t * 0.09) * 0.3 + my * 0.15
    targetRef.current.z = 7 - Math.sin(t * 0.07) * 0.7  // 7→6.3

    camera.position.lerp(targetRef.current, 0.04)
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ── Scène principale ──────────────────────────────────────────────────────────

function Scene({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  return (
    <>
      {/* Environnement — généré PROCÉDURALEMENT via Lightformers (aucun fetch
          HDR externe : pas de dépendance CDN tiers, pas de fuite IP, compatible
          CSP stricte). Donne les reflets on-brand (violet/rose/indigo) au verre. */}
      <Environment resolution={256}>
        <Lightformer intensity={2}   color="#8b5cf6" position={[0, 3, -4]}  scale={[6, 3, 1]} />
        <Lightformer intensity={3}   color="#FF66CC" position={[-4, -1, -3]} scale={[4, 2, 1]} />
        <Lightformer intensity={1.5} color="#6366f1" position={[4, 1, -2]}  scale={[3, 2, 1]} />
        <Lightformer intensity={1}   color="#ffffff" position={[0, -3, 2]}  scale={[5, 2, 1]} />
      </Environment>
      <fog attach="fog" args={['#0c0a14', 6, 22]} />

      {/* Lumières */}
      <ambientLight intensity={0.15} />
      <pointLight color="#8b5cf6" intensity={3} position={[3, 4, 2]} />
      <pointLight color="#FF66CC" intensity={4} position={[0, 0, -2]} />
      <pointLight color="#6366f1" intensity={1} position={[-3, -2, 3]} />

      {/* Logo M central */}
      <LogoMesh mouseRef={mouseRef} />

      {/* Cartes orbitales */}
      {CARD_CONFIGS.map((cfg, i) => (
        <OrbitalCard key={i} config={cfg} mouseRef={mouseRef} />
      ))}

      {/* Post-processing */}
      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.6} mipmapBlur />
        <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={4} />
        <Vignette darkness={0.6} offset={0.3} />
      </EffectComposer>

      {/* Caméra */}
      <CameraRig mouseRef={mouseRef} />
    </>
  )
}

// ── Export (le Canvas lui-même) ───────────────────────────────────────────────

export default function HeroScene({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const { gl } = useThree()

  // Pause quand l'onglet est caché
  useEffect(() => {
    const canvas = gl?.domElement
    if (!canvas) return

    const handleVisibility = () => {
      if (document.hidden) {
        gl.setAnimationLoop(null)
      } else {
        gl.setAnimationLoop(() => {}) // R3F re-prend le contrôle
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [gl])

  return <Scene mouseRef={mouseRef} />
}

// ── Wrapper Canvas (exporté par HeroBackground via dynamic) ──────────────────

export function HeroSceneCanvas({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number }> }) {
  const frameloopRef = useRef<'always' | 'never'>('always')

  useEffect(() => {
    const handleVisibility = () => {
      frameloopRef.current = document.hidden ? 'never' : 'always'
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <Canvas
      camera={{ fov: 38, position: [0, 0.4, 7] }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#09090b')
      }}
    >
      <Scene mouseRef={mouseRef} />
    </Canvas>
  )
}
