import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function Environment({ clouds = [] }) {
  const cloudsGroupRef = useRef();

  useFrame((_, delta) => {
    if (cloudsGroupRef.current) {
      cloudsGroupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <>
      {/* Deep Space / Atmospheric Fog */}
      <color attach="background" args={['#0a0d18']} />
      <fog attach="fog" args={['#0a0d18', 15, 60]} />

      {/* Lighting */}
      <ambientLight intensity={0.4} color="#a5b4fc" />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <directionalLight position={[-15, 10, -20]} intensity={0.3} color="#06b6d4" />

      {/* Floating Ambient Clouds */}
      <group ref={cloudsGroupRef}>
        {clouds.map((cloud) => (
          <mesh key={cloud.id} position={cloud.position} scale={cloud.scale}>
            <sphereGeometry args={[2.5, 7, 7]} />
            <meshStandardMaterial
              color="#1e293b"
              transparent
              opacity={0.35}
              roughness={0.9}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
