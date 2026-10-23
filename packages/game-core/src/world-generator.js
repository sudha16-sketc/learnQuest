/**
 * Procedural Platform & Level Generator for 3D Floating Island Environment
 */

export function generateLevelCourse(levelNumber = 1, platformsCount = 5) {
  const platforms = [];
  const orbs = [];
  const clouds = [];

  // Start Island
  platforms.push({
    id: 'platform-start',
    index: 0,
    type: 'START',
    title: 'Beginner Base',
    position: [0, 0, 0],
    size: [6, 1.2, 6],
    color: '#3b82f6',
    isCheckpoint: false
  });

  let currentPos = [0, 0, 0];

  for (let i = 1; i <= platformsCount; i++) {
    const isFinish = i === platformsCount;
    // Course zigzags forward in Z with minor X curve and gentle elevation Y
    const deltaX = (Math.sin(i * 1.2) * 4);
    const deltaY = (Math.sin(i * 0.8) * 0.5) + (i * 0.2);
    const deltaZ = -(i * 9);

    const platformPos = [deltaX, deltaY, deltaZ];

    platforms.push({
      id: isFinish ? 'platform-finish' : `platform-checkpoint-${i}`,
      index: i,
      type: isFinish ? 'FINISH' : 'CHECKPOINT',
      title: isFinish ? 'Mastery Portal' : `Knowledge Beacon ${i}`,
      position: platformPos,
      size: isFinish ? [7, 1.4, 7] : [4.5, 1.0, 4.5],
      color: isFinish ? '#10b981' : '#8b5cf6',
      isCheckpoint: !isFinish,
      checkpointNumber: isFinish ? null : i,
      questionTriggered: false
    });

    // Add collectible floating XP orbs between platforms
    if (!isFinish) {
      const midPos = [
        (currentPos[0] + platformPos[0]) / 2,
        Math.max(currentPos[1], platformPos[1]) + 1.2,
        (currentPos[2] + platformPos[2]) / 2
      ];
      orbs.push({
        id: `orb-${i}`,
        position: midPos,
        value: 5,
        collected: false
      });
    }

    currentPos = platformPos;
  }

  // Generate ambient floating clouds in background
  for (let c = 0; c < 12; c++) {
    const cloudAngle = (c / 12) * Math.PI * 2;
    const distance = 25 + (Math.sin(c) * 10);
    clouds.push({
      id: `cloud-${c}`,
      position: [
        Math.cos(cloudAngle) * distance,
        -2 + (Math.sin(c * 2) * 3),
        Math.sin(cloudAngle) * distance - 20
      ],
      scale: 1.5 + (Math.cos(c) * 0.8)
    });
  }

  return {
    levelNumber,
    platforms,
    orbs,
    clouds,
    startPosition: [0, 1.5, 0],
    fallThresholdY: -10
  };
}
