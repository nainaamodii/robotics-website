"use client"

import { Suspense, useRef, useState, useEffect, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { Loader2 } from "lucide-react"

const MODEL_PATH = "/cute_little_robot_web.glb"
const DRACO_CDN = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"

const messages = [
  "Hey there! Welcome to MNNIT Robotics!",
  "We build autonomous systems.",
  "Wanna see our self-driving car?",
  "Join the club — we don't byte!",
  "Beep boop. I like your vibe.",
  "Let's build something awesome!",
]

function useRobotModel() {
  const [scene, setScene] = useState<THREE.Group | null>(null)
  const [error, setError] = useState(false)
  const attemptsRef = useRef(0)

  const load = useCallback(() => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_CDN)
    dracoLoader.setDecoderConfig({ type: "js" })

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    loader.load(
      MODEL_PATH,
      (gltf) => {
        setScene(gltf.scene)
        setError(false)
        dracoLoader.dispose()
      },
      undefined,
      () => {
        dracoLoader.dispose()
        attemptsRef.current++
        if (attemptsRef.current < 3) {
          setTimeout(load, 1000)
        } else {
          setError(true)
        }
      }
    )
  }, [])

  useEffect(() => { load() }, [load])

  return { scene, error, retry: load }
}

function Robot({ scene }: { scene: THREE.Group }) {
  const groupRef = useRef<THREE.Group>(null!)
  const mouse = useRef({ x: 0, y: 0 })
  const { viewport } = useThree()

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const targetY = mouse.current.x * 0.3
    const targetX = mouse.current.y * 0.15
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, delta * 2)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, delta * 2)
  })

  const box = new THREE.Box3().setFromObject(scene)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = (viewport.height * 0.7) / maxDim

  const center = new THREE.Vector3()
  box.getCenter(center)

  return (
    <group ref={groupRef}>
      <primitive
        object={scene}
        scale={scale}
        position={[-center.x * scale, -center.y * scale + 2.8, -center.z * scale]}
      />
    </group>
  )
}

function SceneContent({ scene }: { scene: THREE.Group }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <ambientLight intensity={isDark ? 1.2 : 0.6} />
      <directionalLight position={[5, 8, 5]} intensity={isDark ? 2 : 1} />
      <directionalLight position={[-3, 4, -4]} intensity={isDark ? 0.8 : 0.3} />
      <directionalLight position={[0, -3, 3]} intensity={isDark ? 0.6 : 0} />
      <Environment preset="city" environmentIntensity={isDark ? 0.8 : 0.4} />
      <Robot scene={scene} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate
        autoRotateSpeed={0.8}
      />
    </>
  )
}

function MessageBubble() {
  const [msg, setMsg] = useState(messages[0])
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsg(prev => {
          const idx = messages.indexOf(prev)
          return messages[(idx + 1) % messages.length]
        })
        setVisible(true)
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [visible])

  return (
    <div
      className={`absolute top-4 left-4 md:top-8 md:left-8 z-10 max-w-[200px] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="rounded-2xl rounded-bl-sm bg-[var(--bg)]/90 backdrop-blur-sm border border-[var(--border)] px-4 py-3 shadow-[var(--shadow-md)]">
        <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">{msg}</p>
      </div>
      {/* Tail — left side */}
      <div className="absolute -bottom-1.5 left-3 w-3 h-3 bg-[var(--bg)]/90 border-l border-b border-[var(--border)] rotate-45" />
    </div>
  )
}

export default function HeroScene() {
  const { scene, error, retry } = useRobotModel()

  return (
    <div className="relative w-full h-full">
      <MessageBubble />

      {!scene && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[var(--fg-tertiary)] animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <p className="text-xs text-[var(--fg-tertiary)]">Failed to load 3D model</p>
          <button
            onClick={retry}
            className="px-4 py-1.5 rounded-full border border-[var(--border)] text-xs text-[var(--fg-secondary)] hover:border-[var(--border-hover)] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {scene && (
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 1, 5], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <Suspense fallback={null}>
            <SceneContent scene={scene} />
          </Suspense>
        </Canvas>
      )}
    </div>
  )
}
