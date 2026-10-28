import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  GRAVITY,
  JUMP_VELOCITY,
  MOVE_SPEED,
  checkPlatformLanding,
  checkOrbCollision
} from '@learnquest/game-core';
import { useControls } from './useControls';

/**
 * Returns the platform's live position. Moving platforms use the shared
 * R3F clock so rendering and collision always agree.
 */
function getPlatformPosition(platform, elapsedTime) {
  if (!platform.isMoving) return platform.position;
  const axis = platform.movementAxis || 'x';
  const range = platform.movementRange || 3;
  const speed = platform.movementSpeed || 1;
  const offset = Math.sin(elapsedTime * speed) * range;
  const [x, y, z] = platform.position;
  if (axis === 'x') return [x + offset, y, z];
  if (axis === 'y') return [x, y + offset, z];
  return [x, y, z + offset];
}

export function Player({
  courseData,
  clockRef,
  hiddenPlatformIds,
  onPlatformLanded,
  onCheckpointReached,
  onOrbCollected,
  onFallRespawn,
  paused = false,
  equippedAccessories = []
}) {
  const meshRef = useRef();
  const auraRef = useRef();
  const hatRef = useRef();
  const controls = useControls();

  const [position, setPosition] = useState(courseData.startPosition);
  const velocityY = useRef(0);
  const isGrounded = useRef(true);
  const lastSafePosition = useRef(courseData.startPosition);
  const currentPlatformIndex = useRef(0);
  const animationTime = useRef(0);
  const jumpLatch = useRef(false);
  const lastPlatformId = useRef(null);
  const ridingPlatformId = useRef(null);
  const lastPlatformPos = useRef(null);

  // Accessories flags
  const hasNeonAura = equippedAccessories.some(a => a.sku === 'cosmetic-neon-aura');
  const hasScholarHat = equippedAccessories.some(a => a.sku === 'cosmetic-wizard-hat');
  const hasSparkTrail = equippedAccessories.some(a => a.sku === 'cosmetic-spark-trail');

  useEffect(() => {
    setPosition(courseData.startPosition);
    velocityY.current = 0;
    isGrounded.current = true;
    lastSafePosition.current = [...courseData.startPosition];
    currentPlatformIndex.current = 0;
    animationTime.current = 0;
    jumpLatch.current = false;
    lastPlatformId.current = null;
    ridingPlatformId.current = null;
    lastPlatformPos.current = null;
    if (meshRef.current) {
      meshRef.current.position.set(...courseData.startPosition);
    }
  }, [courseData]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const clampedDelta = Math.min(delta, 0.1);
    const elapsed = clockRef?.current?.elapsed ?? state.clock.elapsedTime;

    if (paused) {
      // Keep the animation gentle but freeze physical movement.
      return;
    }

    animationTime.current += clampedDelta;

    let [px, py, pz] = position;
    let dx = 0;
    let dz = 0;

    // Ride moving platforms by applying their frame-to-frame delta.
    if (isGrounded.current && ridingPlatformId.current) {
      const ride = courseData.platforms.find(p => p.id === ridingPlatformId.current);
      if (ride && ride.isMoving) {
        const liveRidePos = getPlatformPosition(ride, elapsed);
        const previousRidePos = lastPlatformPos.current;
        if (previousRidePos) {
          px += liveRidePos[0] - previousRidePos[0];
          py += liveRidePos[1] - previousRidePos[1];
          pz += liveRidePos[2] - previousRidePos[2];
        }
        lastPlatformPos.current = liveRidePos;
      } else {
        ridingPlatformId.current = null;
        lastPlatformPos.current = null;
      }
    }

    // Handle horizontal movement
    if (controls.forward) dz -= MOVE_SPEED * clampedDelta;
    if (controls.backward) dz += MOVE_SPEED * clampedDelta;
    if (controls.left) dx -= MOVE_SPEED * clampedDelta;
    if (controls.right) dx += MOVE_SPEED * clampedDelta;

    // Handle jump edge-triggered so held buttons do not auto-bounce
    const wantsJump = Boolean(controls.jump);
    if (wantsJump && isGrounded.current && !jumpLatch.current) {
      velocityY.current = JUMP_VELOCITY;
      isGrounded.current = false;
    }
    jumpLatch.current = wantsJump;

    // Apply gravity
    velocityY.current += GRAVITY * clampedDelta;
    py += velocityY.current * clampedDelta;
    px += dx;
    pz += dz;

    // Check collision with all non-hidden platforms using live positions
    let landed = false;
    for (const platform of courseData.platforms) {
      if (hiddenPlatformIds && hiddenPlatformIds.has(platform.id)) continue;
      const livePlatform = {
        ...platform,
        position: getPlatformPosition(platform, elapsed)
      };
      const check = checkPlatformLanding([px, py, pz], velocityY.current, livePlatform);
      if (check.landed) {
        landed = true;
        py = check.surfaceY;
        velocityY.current = 0;
        isGrounded.current = true;
        const livePos = livePlatform.position;
        lastSafePosition.current = [livePos[0], check.surfaceY, livePos[2]];
        ridingPlatformId.current = platform.id;
        lastPlatformPos.current = livePos;

        // Notify cleanup whenever we land on a new platform
        if (lastPlatformId.current !== platform.id) {
          lastPlatformId.current = platform.id;
          if (onPlatformLanded) onPlatformLanded(platform);
        }

        // Trigger checkpoint/boss/finish only when it's a new platform
        if (currentPlatformIndex.current !== platform.index) {
          currentPlatformIndex.current = platform.index;
          if ((platform.isCheckpoint || platform.type === 'BOSS' || platform.type === 'FINISH') && onCheckpointReached) {
            onCheckpointReached(platform);
          }
        }
        break;
      }
    }

    if (!landed) {
      isGrounded.current = false;
      ridingPlatformId.current = null;
      lastPlatformPos.current = null;
    }

    // Fall recovery and respawn
    if (py < courseData.fallThresholdY) {
      const [rx, ry, rz] = lastSafePosition.current;
      px = rx;
      py = ry + 1.5;
      pz = rz;
      velocityY.current = 0;
      isGrounded.current = true;
      ridingPlatformId.current = null;
      lastPlatformPos.current = null;
      if (onFallRespawn) onFallRespawn();
    }

    // Check collection of XP Orbs
    for (const orb of courseData.orbs) {
      if (!orb.collected && checkOrbCollision([px, py, pz], orb)) {
        orb.collected = true;
        if (onOrbCollected) onOrbCollected(orb);
      }
    }

    // Update player position
    setPosition([px, py, pz]);
    meshRef.current.position.set(px, py, pz);

    // Character rotation towards movement direction
    if (dx !== 0 || dz !== 0) {
      const targetRotation = Math.atan2(dx, dz);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation, 0.15);
    }

    // Character bobbing animation while walking
    const isMoving = dx !== 0 || dz !== 0;
    if (isMoving && isGrounded.current) {
      meshRef.current.position.y += Math.sin(animationTime.current * 14) * 0.08;
    }

    // Animate accessories
    if (auraRef.current) {
      auraRef.current.rotation.y += delta * 1.5;
      auraRef.current.rotation.x += delta * 0.8;
      const pulse = 1 + Math.sin(animationTime.current * 4) * 0.08;
      auraRef.current.scale.set(pulse, pulse, pulse);
    }

    if (hatRef.current) {
      hatRef.current.position.y = 1.6 + Math.sin(animationTime.current * 3) * 0.05;
      hatRef.current.rotation.y += delta * 0.8;
    }

    // Third-person camera: behind and slightly above the player, aiming forward.
    const targetCamX = px;
    const targetCamY = py + 5.0;
    const targetCamZ = pz + 10.5;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetCamX, 0.1);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.1);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetCamZ, 0.1);
    state.camera.lookAt(px, py + 1.6, pz);
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Adventurer Character Mesh */}
      {/* Body / Torso */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.4, 0.7, 8]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </mesh>

      {/* Futuristic Explorer Visor */}
      <mesh position={[0, 1.38, 0.22]}>
        <boxGeometry args={[0.38, 0.12, 0.15]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Backpack / Jetpack */}
      <mesh position={[0, 0.8, -0.32]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.2]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.18, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh position={[0.18, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* --- COSMETIC ACCESSORIES --- */}

      {/* 1. Cyber Neon Aura */}
      {hasNeonAura && (
        <group ref={auraRef} position={[0, 0.9, 0]}>
          <mesh>
            <sphereGeometry args={[1.1, 16, 16]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={1.2}
              wireframe
              transparent
              opacity={0.4}
            />
          </mesh>
          <pointLight color="#00ffff" intensity={2.0} distance={4} />
        </group>
      )}

      {/* 2. Cosmic Scholar Hat */}
      {hasScholarHat && (
        <group ref={hatRef} position={[0, 1.65, 0]}>
          <mesh castShadow>
            <coneGeometry args={[0.35, 0.6, 8]} />
            <meshStandardMaterial
              color="#8b5cf6"
              emissive="#8b5cf6"
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
          {/* Brim */}
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.05, 16]} />
            <meshStandardMaterial color="#6d28d9" />
          </mesh>
        </group>
      )}

      {/* 3. Stardust Jump Trail */}
      {hasSparkTrail && (
        <pointLight position={[0, 0.2, 0]} color="#f59e0b" intensity={1.5} distance={3} />
      )}
    </group>
  );
}
