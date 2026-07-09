"use client"

import { useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, ContactShadows, Float } from "@react-three/drei"
import * as THREE from "three"

const CHROME = { color: "#c8c8c8", metalness: 0.95, roughness: 0.08 }
const DARK_METAL = { color: "#2a2a2a", metalness: 0.9, roughness: 0.15 }
const ACCENT_METAL = { color: "#FF6B35", metalness: 0.7, roughness: 0.2, emissive: "#FF6B35", emissiveIntensity: 0.15 }

function Joint({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.18 * scale, 32, 32]} />
      <meshStandardMaterial {...ACCENT_METAL} />
    </mesh>
  )
}

function RoboticArm() {
  const groupRef = useRef<THREE.Group>(null)
  const { pointer } = useThree()
  const target = useRef({ x: 0, y: 0 })

  useFrame((_, delta) => {
    if (!groupRef.current) return
    target.current.x = pointer.y * 0.15
    target.current.y = pointer.x * 0.3 + delta * 0.08
    groupRef.current.rotation.x += (target.current.x - groupRef.current.rotation.x) * delta * 1.5
    groupRef.current.rotation.y += delta * 0.08
  })

  return (
    <Float speed={0.8} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={groupRef} position={[0, -0.5, 0]}>
        {/* Base platform */}
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[1.1, 1.2, 0.2, 64]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
        <mesh position={[0, -1.05, 0]}>
          <cylinderGeometry args={[0.85, 0.9, 0.15, 64]} />
          <meshStandardMaterial {...CHROME} />
        </mesh>

        {/* Base turret */}
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.45, 0.55, 0.5, 32]} />
          <meshStandardMaterial {...DARK_METAL} />
        </mesh>
        <mesh position={[0, -0.75, 0]}>
          <torusGeometry args={[0.48, 0.04, 16, 48]} />
          <meshStandardMaterial {...ACCENT_METAL} />
        </mesh>

        <Joint position={[0, -0.5, 0]} scale={1.2} />

        {/* Lower arm */}
        <group position={[0, -0.5, 0]} rotation={[0, 0, 0.25]}>
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 1.0, 24]} />
            <meshStandardMaterial {...CHROME} />
          </mesh>
          {/* Hydraulic detail */}
          <mesh position={[0.18, 0.4, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 12]} />
            <meshStandardMaterial {...DARK_METAL} />
          </mesh>

          {/* Elbow */}
          <Joint position={[0, 1.1, 0]} />

          {/* Upper arm */}
          <group position={[0, 1.1, 0]} rotation={[0, 0, -0.6]}>
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.85, 24]} />
              <meshStandardMaterial {...CHROME} />
            </mesh>
            <mesh position={[-0.14, 0.35, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.55, 12]} />
              <meshStandardMaterial {...DARK_METAL} />
            </mesh>

            {/* Wrist */}
            <Joint position={[0, 0.9, 0]} scale={0.9} />

            {/* End effector / gripper */}
            <group position={[0, 1.05, 0]} rotation={[0, 0, 0.2]}>
              <mesh>
                <boxGeometry args={[0.25, 0.12, 0.15]} />
                <meshStandardMaterial {...DARK_METAL} />
              </mesh>
              {/* Gripper fingers */}
              <mesh position={[0.05, 0.15, 0.04]} rotation={[0, 0, 0.15]}>
                <boxGeometry args={[0.04, 0.2, 0.04]} />
                <meshStandardMaterial {...CHROME} />
              </mesh>
              <mesh position={[0.05, 0.15, -0.04]} rotation={[0, 0, 0.15]}>
                <boxGeometry args={[0.04, 0.2, 0.04]} />
                <meshStandardMaterial {...CHROME} />
              </mesh>
              <mesh position={[-0.05, 0.15, 0.04]} rotation={[0, 0, -0.15]}>
                <boxGeometry args={[0.04, 0.2, 0.04]} />
                <meshStandardMaterial {...CHROME} />
              </mesh>
              <mesh position={[-0.05, 0.15, -0.04]} rotation={[0, 0, -0.15]}>
                <boxGeometry args={[0.04, 0.2, 0.04]} />
                <meshStandardMaterial {...CHROME} />
              </mesh>
              {/* Gripper tips */}
              <mesh position={[0.06, 0.27, 0]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshStandardMaterial {...ACCENT_METAL} />
              </mesh>
              <mesh position={[-0.06, 0.27, 0]}>
                <sphereGeometry args={[0.025, 12, 12]} />
                <meshStandardMaterial {...ACCENT_METAL} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </Float>
  )
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [3, 2, 5], fov: 35 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      style={{ pointerEvents: "auto" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#FFE4C4" />
      <pointLight position={[0, 3, 0]} intensity={0.6} color="#FF6B35" />

      <RoboticArm />

      <ContactShadows position={[0, -1.35, 0]} opacity={0.3} scale={8} blur={2.5} far={4} />
      <Environment preset="studio" />
    </Canvas>
  )
}
