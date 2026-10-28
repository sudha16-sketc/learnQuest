import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from './Environment';
import { Platform } from './Platform';
import { XPOrb } from './XPOrb';
import { Player } from './Player';

function GameClock({ clockRef, paused }) {
  useFrame((_, delta) => {
    if (!paused) {
      clockRef.current.elapsed += Math.min(delta, 0.1);
    }
  });
  return null;
}

function MovingPlatformGroup({ platform, clockRef }) {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current || !platform.isMoving) return;
    const t = clockRef.current.elapsed;
    const axis = platform.movementAxis || 'x';
    const range = platform.movementRange || 3;
    const speed = platform.movementSpeed || 1;
    const offset = Math.sin(t * speed) * range;
    if (axis === 'x') {
      groupRef.current.position.x = platform.position[0] + offset;
    } else if (axis === 'y') {
      groupRef.current.position.y = platform.position[1] + offset;
    } else {
      groupRef.current.position.z = platform.position[2] + offset;
    }
  });

  return (
    <group ref={groupRef} position={platform.position}>
      <Platform platform={{ ...platform, position: [0, 0, 0] }} />
    </group>
  );
}

export function GameWorld({
  courseData,
  onCheckpointReached,
  onOrbCollected,
  onFallRespawn,
  paused = false,
  equippedAccessories = []
}) {
  const clockRef = useRef({ elapsed: 0 });
  const [hiddenPlatformIds, setHiddenPlatformIds] = useState(() => new Set());
  const lastHiddenIndexRef = useRef(-1);

  useEffect(() => {
    clockRef.current.elapsed = 0;
    setHiddenPlatformIds(new Set());
    lastHiddenIndexRef.current = -1;
  }, [courseData]);

  const handlePlatformLanded = useCallback((platform) => {
    if (!platform || typeof platform.index !== 'number') return;
    if (platform.type === 'START' || platform.type === 'FINISH' || platform.type === 'BOSS') return;

    // Keep the current platform and two behind it; remove anything older.
    const maxIndexToHide = platform.index - 3;
    if (maxIndexToHide <= lastHiddenIndexRef.current) return;

    setHiddenPlatformIds(prev => {
      const next = new Set(prev);
      for (const p of courseData.platforms) {
        if (p.index <= maxIndexToHide && p.type !== 'START' && p.type !== 'FINISH' && p.type !== 'BOSS') {
          next.add(p.id);
        }
      }
      return next;
    });
    lastHiddenIndexRef.current = maxIndexToHide;
  }, [courseData.platforms]);

  const visiblePlatforms = useMemo(
    () => (courseData.platforms || []).filter(p => !hiddenPlatformIds.has(p.id)),
    [courseData.platforms, hiddenPlatformIds]
  );

  return (
    <>
      <GameClock clockRef={clockRef} paused={paused} />
      <Environment clouds={courseData.clouds} />

      {/* Course Platforms */}
      {visiblePlatforms.map((platform) =>
        platform.isMoving ? (
          <MovingPlatformGroup key={platform.id} platform={platform} clockRef={clockRef} />
        ) : (
          <Platform key={platform.id} platform={platform} />
        )
      )}

      {/* Collectible XP Orbs */}
      {courseData.orbs.map((orb) => (
        <XPOrb key={orb.id} orb={orb} />
      ))}

      {/* 3D Controllable Player */}
      <Player
        courseData={courseData}
        clockRef={clockRef}
        hiddenPlatformIds={hiddenPlatformIds}
        onPlatformLanded={handlePlatformLanded}
        onCheckpointReached={onCheckpointReached}
        onOrbCollected={onOrbCollected}
        onFallRespawn={onFallRespawn}
        paused={paused}
        equippedAccessories={equippedAccessories}
      />
    </>
  );
}
