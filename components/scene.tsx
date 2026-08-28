"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function Core() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => { if (!ref.current) return; ref.current.rotation.y = clock.elapsedTime * .12 + pointer.x * .2; ref.current.rotation.x = pointer.y * .12; });
  return <group ref={ref}>
    <Float speed={1.8} rotationIntensity={.35} floatIntensity={.55}>
      <mesh><icosahedronGeometry args={[1.45, 5]} /><MeshTransmissionMaterial thickness={.7} roughness={.08} transmission={1} ior={1.25} chromaticAberration={.08} color="#8b5cf6" /></mesh>
      <mesh scale={.72}><icosahedronGeometry args={[1.45, 2]} /><meshStandardMaterial color="#ff4dc4" emissive="#6d28d9" emissiveIntensity={3} wireframe /></mesh>
      {[0,1,2].map((n) => <mesh key={n} rotation={[n*.9, n*.7, n*.4]}><torusGeometry args={[2+n*.27,.007,8,120]} /><meshBasicMaterial color={n===1?"#ff70d0":"#8b5cf6"} transparent opacity={.6}/></mesh>)}
    </Float>
    <Sparkles count={85} scale={6} size={1.8} speed={.25} color="#b38aff" />
  </group>;
}

export default function NovaScene() { return <Canvas dpr={[1, 1.6]} camera={{ position: [0,0,7.1], fov: 42 }} gl={{ antialias: true, alpha: true }}><ambientLight intensity={1.4}/><pointLight position={[3,4,4]} intensity={30} color="#ff6bd6"/><pointLight position={[-4,-2,2]} intensity={25} color="#7047ff"/><Core /></Canvas>; }
