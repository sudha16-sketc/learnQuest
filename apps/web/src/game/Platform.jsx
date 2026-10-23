import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function Platform({ platform, isCurrentTarget = false }) {
  const crystalRef = useRef();
  const portalRingsRef = useRef();

  useFrame((_, delta) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 1.2;
      crystalRef.current.rotation.x += delta * 0.4;
    }
    if (portalRingsRef.current) {
      portalRingsRef.current.rotation.z += delta * 1.5;
    }
  });

  const [width, height, depth] = platform.size;
  const isStart = platform.type === 'START';
  const isFinish = platform.type === 'FINISH';
  const isCheckpoint = platform.isCheckpoint;

  return (
    <group position={platform.position}>
      {/* Upper Landing Surface */}
      <mesh position={[0, 0, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, height * 0.4, depth]} />
        <meshStandardMaterial
          color={isFinish ? '#059669' : isStart ? '#2563eb' : '#4f46e5'}
          roughness={0.6}
        />
      </mesh>

      {/* Earthy / Cyber Base Underneath */}
      <mesh position={[0, -height * 0.5, 0]} receiveShadow>
        <coneGeometry args={[Math.min(width, depth) * 0.55, height * 1.2, 5]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.9} />
      </mesh>

      {/* Glowing Checkpoint Beacon / Crystal */}
      {isCheckpoint && (
        <group ref={crystalRef} position={[0, height * 0.8 + 0.6, 0]}>
          <mesh castShadow>
            <octahedronGeometry args={[0.55]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#c084fc"
              emissiveIntensity={1.2}
              roughness={0.2}
            />
          </mesh>
          <pointLight color="#c084fc" intensity={2.5} distance={6} />
        </group>
      )}

      {/* Finish Portal Mastery Gate */}
      {isFinish && (
        <group position={[0, height * 0.5 + 1.2, 0]}>
          <group ref={portalRingsRef}>
            <mesh>
              <torusGeometry args={[1.5, 0.12, 16, 32]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#34d399"
                emissiveIntensity={2.0}
              />
            </mesh>
          </group>
          {/* Central Energy Core */}
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial
              color="#6ee7b7"
              emissive="#a7f3d0"
              emissiveIntensity={3.0}
            />
          </mesh>
          <pointLight color="#34d399" intensity={4.0} distance={10} />
        </group>
      )}
    </group>
  );
}
