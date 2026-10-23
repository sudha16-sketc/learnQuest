import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function XPOrb({ orb }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (!meshRef.current || orb.collected) return;
    meshRef.current.rotation.y += delta * 2.0;
    meshRef.current.rotation.z += delta * 1.0;
    meshRef.current.position.y = orb.position[1] + Math.sin(state.clock.getElapsedTime() * 3 + orb.position[0]) * 0.15;
  });

  if (orb.collected) return null;

  return (
    <group ref={meshRef} position={orb.position}>
      <mesh castShadow>
        <dodecahedronGeometry args={[0.3]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <pointLight color="#f59e0b" intensity={1.5} distance={3} />
    </group>
  );
}
