import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  GRAVITY,
  JUMP_VELOCITY,
  MOVE_SPEED,
  checkPlatformLanding,
} from '@learnquest/game-core';
import { virtualInput } from './controls';

function lerp(current, target, amount) {
  return current + (target - current) * amount;
}

function MobilePlayer({ courseData, paused, onCheckpointReached }) {
  const groupRef = useRef(null);
  const positionRef = useRef(courseData.startPosition);
  const velocityY = useRef(0);
  const isGrounded = useRef(false);
  const jumpHeld = useRef(false);
  const lastSafePosition = useRef(courseData.startPosition);
  const lastCheckpointIndex = useRef(-1);

  useEffect(() => {
    positionRef.current = [...courseData.startPosition];
    velocityY.current = 0;
    isGrounded.current = false;
    jumpHeld.current = false;
    lastSafePosition.current = [...courseData.startPosition];
    lastCheckpointIndex.current = -1;
    if (groupRef.current) {
      groupRef.current.position.set(...positionRef.current);
    }
  }, [courseData]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group || paused) return;

    const step = Math.min(delta, 0.1);
    let [px, py, pz] = positionRef.current;
    let dx = 0;
    let dz = 0;

    if (virtualInput.forward) dz -= MOVE_SPEED * step;
    if (virtualInput.backward) dz += MOVE_SPEED * step;
    if (virtualInput.left) dx -= MOVE_SPEED * step;
    if (virtualInput.right) dx += MOVE_SPEED * step;

    if (virtualInput.jump && isGrounded.current && !jumpHeld.current) {
      velocityY.current = JUMP_VELOCITY;
      isGrounded.current = false;
    }
    jumpHeld.current = virtualInput.jump;

    velocityY.current += GRAVITY * step;
    px += dx;
    py += velocityY.current * step;
    pz += dz;

    let landed = false;
    for (const platform of courseData.platforms) {
      const check = checkPlatformLanding([px, py, pz], velocityY.current, platform);
      if (check.landed) {
        py = check.surfaceY;
        velocityY.current = 0;
        isGrounded.current = true;
        lastSafePosition.current = [platform.position[0], check.surfaceY, platform.position[2]];
        landed = true;
        const isNewCheckpoint =
          platform.isCheckpoint &&
          lastCheckpointIndex.current !== platform.index;
        const isNewFinish =
          platform.type === 'FINISH' &&
          lastCheckpointIndex.current !== platform.index;
        if (isNewCheckpoint || isNewFinish) {
          lastCheckpointIndex.current = platform.index;
          onCheckpointReached?.(platform);
        }
        break;
      }
    }

    if (!landed) isGrounded.current = false;

    if (py < courseData.fallThresholdY) {
      const [rx, ry, rz] = lastSafePosition.current;
      px = rx;
      py = ry + 1.5;
      pz = rz;
      velocityY.current = 0;
      isGrounded.current = false;
    }

    positionRef.current = [px, py, pz];
    group.position.set(px, py, pz);

    if (dx !== 0 || dz !== 0) {
      const targetRotation = Math.atan2(dx, dz);
      let rotationDelta = targetRotation - group.rotation.y;
      while (rotationDelta > Math.PI) rotationDelta -= Math.PI * 2;
      while (rotationDelta < -Math.PI) rotationDelta += Math.PI * 2;
      group.rotation.y += rotationDelta * 0.2;
    }

    const { camera } = state;
    camera.position.x = lerp(camera.position.x, px, 0.08);
    camera.position.y = lerp(camera.position.y, py + 4.5, 0.08);
    camera.position.z = lerp(camera.position.z, pz + 9, 0.08);
    camera.lookAt(px, py + 1.2, pz);
  });

  return (
    <group ref={groupRef} position={courseData.startPosition}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.7, 8]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.38, 0.22]}>
        <boxGeometry args={[0.38, 0.12, 0.15]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.8, -0.32]}>
        <boxGeometry args={[0.4, 0.5, 0.2]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.18, 0.25, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh position={[0.18, 0.25, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
    </group>
  );
}

function MobilePlatform({ platform }) {
  const crystalRef = useRef(null);
  const portalRef = useRef(null);
  const [width, height, depth] = platform.size;
  const isFinish = platform.type === 'FINISH';
  const isCheckpoint = platform.isCheckpoint;

  useFrame((_, delta) => {
    if (crystalRef.current) crystalRef.current.rotation.y += delta * 1.5;
    if (portalRef.current) portalRef.current.rotation.z += delta * 1.5;
  });

  return (
    <group position={platform.position}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={platform.color || '#4f46e5'} roughness={0.6} />
      </mesh>
      {isCheckpoint && (
        <group ref={crystalRef} position={[0, height / 2 + 0.65, 0]}>
          <mesh>
            <octahedronGeometry args={[0.5]} />
            <meshStandardMaterial color="#c084fc" emissive="#7c3aed" emissiveIntensity={0.5} />
          </mesh>
        </group>
      )}
      {isFinish && (
        <group position={[0, height / 2 + 1.2, 0]}>
          <group ref={portalRef}>
            <mesh>
              <torusGeometry args={[1.3, 0.12, 12, 28]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#34d399"
                emissiveIntensity={1.5}
              />
            </mesh>
          </group>
          <mesh>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial
              color="#6ee7b7"
              emissive="#a7f3d0"
              emissiveIntensity={2}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function GameCanvas3D({ courseData, paused, onCheckpointReached }) {
  if (!courseData) return null;
  return (
    <Canvas camera={{ position: [0, 4, 8], fov: 60 }} style={{ flex: 1 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} />
      <directionalLight position={[-10, 8, -10]} intensity={0.35} />
      {courseData.platforms.map((platform) => (
        <MobilePlatform key={platform.id} platform={platform} />
      ))}
      <MobilePlayer
        courseData={courseData}
        paused={paused}
        onCheckpointReached={onCheckpointReached}
      />
    </Canvas>
  );
}
