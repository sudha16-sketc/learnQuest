import React from 'react';
import { Environment } from './Environment';
import { Platform } from './Platform';
import { XPOrb } from './XPOrb';
import { Player } from './Player';

export function GameWorld({
  courseData,
  onCheckpointReached,
  onOrbCollected,
  onFallRespawn,
  equippedAccessories = []
}) {
  return (
    <>
      <Environment clouds={courseData.clouds} />

      {/* Course Platforms */}
      {courseData.platforms.map((platform) => (
        <Platform key={platform.id} platform={platform} />
      ))}

      {/* Collectible XP Orbs */}
      {courseData.orbs.map((orb) => (
        <XPOrb key={orb.id} orb={orb} />
      ))}

      {/* 3D Controllable Player */}
      <Player
        courseData={courseData}
        onCheckpointReached={onCheckpointReached}
        onOrbCollected={onOrbCollected}
        onFallRespawn={onFallRespawn}
        equippedAccessories={equippedAccessories}
      />
    </>
  );
}
