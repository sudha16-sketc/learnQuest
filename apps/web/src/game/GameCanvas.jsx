import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameWorld } from './GameWorld';

export function GameCanvas({
  courseData,
  onCheckpointReached,
  onOrbCollected,
  onFallRespawn,
  paused = false,
  equippedAccessories = []
}) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none touch-none">
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 70 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <GameWorld
            courseData={courseData}
            onCheckpointReached={onCheckpointReached}
            onOrbCollected={onOrbCollected}
            onFallRespawn={onFallRespawn}
            paused={paused}
            equippedAccessories={equippedAccessories}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
