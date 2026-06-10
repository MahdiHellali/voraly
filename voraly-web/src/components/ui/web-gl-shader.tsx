'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * WebGLShader — adapted from 21st.dev (aliimam/web-gl-shader).
 * Same RawShaderMaterial + orthographic full-screen quad + animation loop.
 * The fragment shader's color math is preserved (chromatic distortion via
 * `distortion`), but the final palette is remapped to Voraly branding:
 *   deep-abyss base (zinc-950) + dark-violet core + indigo / pink fringes.
 * Intensity is dialed down hard (`uIntensity`, `uBrightness`) so it reads as a
 * subtle ambient field behind the UI — never bright.
 */
export function WebGLShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene | null
    camera: THREE.OrthographicCamera | null
    renderer: THREE.WebGLRenderer | null
    mesh: THREE.Mesh | null
    uniforms: Record<string, { value: unknown }> | null
    animationId: number | null
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const { current: refs } = sceneRef

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    // Original chromatic-line math kept intact; only the output is recolored
    // through the Voraly palette and attenuated by uIntensity / uBrightness.
    const fragmentShader = `
      precision highp float;
      uniform vec2  resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;
      uniform float uIntensity;
      uniform float uBrightness;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

        float d = length(p) * distortion;

        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = uIntensity / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = uIntensity / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = uIntensity / abs(p.y + sin((bx + time) * xScale) * yScale);

        // Voraly palette: violet core, indigo + pink chromatic fringes.
        vec3 violet = vec3(0.545, 0.361, 0.965); // #8b5cf6
        vec3 indigo = vec3(0.388, 0.400, 0.945); // #6366f1
        vec3 pink   = vec3(0.910, 0.475, 0.976); // #e879f9

        vec3 col = r * violet + g * indigo + b * pink;

        // Deep-abyss base (≈ zinc-950) so black areas never go fully flat.
        vec3 base = vec3(0.035, 0.035, 0.043);
        col += base;

        // Keep it subtle — never bright.
        col *= uBrightness;

        gl_FragColor = vec4(col, 1.0);
      }
    `

    const initScene = () => {
      refs.scene = new THREE.Scene()
      refs.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      refs.renderer.setClearColor(new THREE.Color(0x09090b))

      refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

      refs.uniforms = {
        resolution: { value: [window.innerWidth, window.innerHeight] },
        time: { value: 0.0 },
        xScale: { value: 1.0 },
        yScale: { value: 0.5 },
        distortion: { value: 0.09 },
        uIntensity: { value: 0.017 },
        uBrightness: { value: 0.6 },
      }

      const position = [
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0,  1.0, 0.0,
      ]

      const positions = new THREE.BufferAttribute(new Float32Array(position), 3)
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', positions)

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: refs.uniforms,
        side: THREE.DoubleSide,
      })

      refs.mesh = new THREE.Mesh(geometry, material)
      refs.scene.add(refs.mesh)

      handleResize()
    }

    const animate = () => {
      if (refs.uniforms) {
        ;(refs.uniforms.time.value as number) += 0.006 // calm, slow drift
      }
      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera)
      }
      refs.animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return
      const width = window.innerWidth
      const height = window.innerHeight
      refs.renderer.setSize(width, height, false)
      refs.uniforms.resolution.value = [width, height]
    }

    initScene()
    animate()
    window.addEventListener('resize', handleResize)

    return () => {
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      window.removeEventListener('resize', handleResize)
      if (refs.mesh) {
        refs.scene?.remove(refs.mesh)
        refs.mesh.geometry.dispose()
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose()
        }
      }
      refs.renderer?.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 block h-full w-full"
    />
  )
}

export default WebGLShader
