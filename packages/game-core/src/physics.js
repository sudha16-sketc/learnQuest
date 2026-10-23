/**
 * Game Physics & Collision Math
 */

export const GRAVITY = -24.0;
export const JUMP_VELOCITY = 11.0;
export const MOVE_SPEED = 7.5;
export const PLAYER_RADIUS = 0.5;
export const PLAYER_HEIGHT = 1.6;

export function checkPlatformLanding(playerPos, playerVelocityY, platform) {
  const [px, py, pz] = playerPos;
  const [bx, by, bz] = platform.position;
  const [halfWidth, halfHeight, halfDepth] = [
    platform.size[0] / 2,
    platform.size[1] / 2,
    platform.size[2] / 2
  ];

  const minX = bx - halfWidth - 0.2;
  const maxX = bx + halfWidth + 0.2;
  const minZ = bz - halfDepth - 0.2;
  const maxZ = bz + halfDepth + 0.2;
  const topY = by + halfHeight;

  // Check if player is horizontally within platform boundaries
  const isWithinBounds = px >= minX && px <= maxX && pz >= minZ && pz <= maxZ;

  // Check if player's feet touch or pass through top surface while falling downwards
  const isAtPlatformLevel = py >= topY - 0.3 && py <= topY + 0.5;

  if (isWithinBounds && isAtPlatformLevel && playerVelocityY <= 0) {
    return {
      landed: true,
      surfaceY: topY,
      platform
    };
  }

  return { landed: false };
}

export function checkOrbCollision(playerPos, orb, collectRadius = 1.0) {
  if (orb.collected) return false;
  const dx = playerPos[0] - orb.position[0];
  const dy = playerPos[1] - orb.position[1];
  const dz = playerPos[2] - orb.position[2];
  const distanceSq = dx * dx + dy * dy + dz * dz;
  return distanceSq <= collectRadius * collectRadius;
}
