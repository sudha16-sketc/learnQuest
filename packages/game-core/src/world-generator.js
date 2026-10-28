/**
 * Procedural Platform & Level Generator for 3D Floating Island Environment
 *
 * Level structure:
 *   START → [4 NORMAL fillers + 1 QUESTION platform] × questionCount → BOSS → FINISH
 * Standard questions placed approximately every 5 platforms (4 fillers + 1 question platform)
 * Each level contains 10-13 standard learning questions plus its final boss question.
 */

const FILLER_PLATFORMS_PER_QUESTION = 4; // fillers between each question platform (so question every 5 platforms total)

/** Probability of a filler platform being "moving" by level number. */
function movingPlatformChance(levelNumber) {
  // Every level has at least some moving platforms so the mechanic is always
  // introduced, with later levels becoming progressively more dynamic.
  return Math.min(0.12 + Math.max(levelNumber - 1, 0) * 0.06, 0.55);
}

/** Number of questions to generate for a given level (10-13). */
export function getQuestionCountForLevel(levelNumber) {
  const count = 10 + Math.min(Math.max(levelNumber - 1, 0), 3);
  return Math.min(Math.max(count, 10), 13);
}

/** Returns a movement config for a moving platform, or null for static. */
function maybeMoving(levelNumber, rng) {
  if (rng() >= movingPlatformChance(levelNumber)) return null;
  const axis = rng() < 0.5 ? 'x' : 'z';
  return {
    isMoving: true,
    movementAxis: axis,
    movementRange: 2.5 + rng() * 2.5,   // 2.5 – 5 units each way
    movementSpeed: 1.0 + rng() * (levelNumber * 0.25) // faster in later levels
  };
}

/** Seeded PRNG (Mulberry32) so level layouts are deterministic. */
function makePrng(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateLevelCourse(levelNumber = 1) {
  const platforms = [];
  const orbs = [];
  const clouds = [];

  const rng = makePrng(levelNumber * 7919); // different seed per level
  const questionCount = getQuestionCountForLevel(levelNumber);

  // --- START island ---
  platforms.push({
    id: 'platform-start',
    index: 0,
    type: 'START',
    title: 'Origin Platform',
    position: [0, 0, 0],
    size: [6, 1.2, 6],
    color: '#17985d',
    isCheckpoint: false,
    isMoving: false,
    questionTriggered: false
  });

  let platformIndex = 1;
  let currentPos = [0, 0, 0];

  // --- Alternating filler + question platforms ---
  for (let q = 0; q < questionCount; q++) {
    // 4 filler platforms
    for (let f = 0; f < FILLER_PLATFORMS_PER_QUESTION; f++) {
      const deltaX = Math.sin((platformIndex) * 1.1 + levelNumber * 0.5) * 3.5;
      const deltaY = Math.sin((platformIndex) * 0.7) * 0.4 + (platformIndex * 0.15);
      const deltaZ = -(platformIndex * 8);
      const pos = [deltaX, deltaY, deltaZ];
      const mv = maybeMoving(levelNumber, rng);

      platforms.push({
        id: `platform-filler-${platformIndex}`,
        index: platformIndex,
        type: 'NORMAL',
        title: null,
        position: pos,
        size: [3.5, 0.9, 3.5],
        color: '#2d3a30',
        isCheckpoint: false,
        questionTriggered: false,
        ...(mv || { isMoving: false })
      });

      // XP orb between this platform and the last
      orbs.push({
        id: `orb-${platformIndex}`,
        position: [
          (currentPos[0] + pos[0]) / 2,
          Math.max(currentPos[1], pos[1]) + 1.5,
          (currentPos[2] + pos[2]) / 2
        ],
        value: 5,
        collected: false
      });

      currentPos = pos;
      platformIndex++;
    }

    // 1 QUESTION platform
    const qDeltaX = Math.sin((platformIndex) * 1.1 + levelNumber * 0.5) * 3.5;
    const qDeltaY = Math.sin((platformIndex) * 0.7) * 0.4 + (platformIndex * 0.15);
    const qDeltaZ = -(platformIndex * 8);
    const qPos = [qDeltaX, qDeltaY, qDeltaZ];

    platforms.push({
      id: `platform-question-${q + 1}`,
      index: platformIndex,
      type: 'CHECKPOINT',
      title: `Knowledge Gate ${q + 1}`,
      position: qPos,
      size: [5, 1.0, 5],
      color: '#6d6499',
      isCheckpoint: true,
      checkpointNumber: q + 1,
      questionTriggered: false,
      isMoving: false // question platforms are always static
    });

    orbs.push({
      id: `orb-q-${q + 1}`,
      position: [
        (currentPos[0] + qPos[0]) / 2,
        Math.max(currentPos[1], qPos[1]) + 1.5,
        (currentPos[2] + qPos[2]) / 2
      ],
      value: 10,
      collected: false
    });

    currentPos = qPos;
    platformIndex++;
  }

  // --- BOSS platform ---
  const bossDeltaX = 0;
  const bossDeltaY = currentPos[1] + 2.0;
  const bossDeltaZ = currentPos[2] - 12;
  const bossPos = [bossDeltaX, bossDeltaY, bossDeltaZ];

  platforms.push({
    id: 'platform-boss',
    index: platformIndex,
    type: 'BOSS',
    title: 'Boss Arena - Guardian Challenge',
    position: bossPos,
    size: [9, 1.8, 9],
    color: '#dc2626',
    isCheckpoint: true,
    checkpointNumber: questionCount + 1, // boss uses next slot
    questionTriggered: false,
    isMoving: false,
    isBoss: true
  });

  orbs.push({
    id: 'orb-boss',
    position: [
      (currentPos[0] + bossPos[0]) / 2,
      Math.max(currentPos[1], bossPos[1]) + 2,
      (currentPos[2] + bossPos[2]) / 2
    ],
    value: 25,
    collected: false
  });

  platformIndex++;

  // --- FINISH island ---
  const finishPos = [0, bossPos[1] + 1.0, bossPos[2] - 10];

  platforms.push({
    id: 'platform-finish',
    index: platformIndex,
    type: 'FINISH',
    title: 'Mastery Portal',
    position: finishPos,
    size: [7, 1.4, 7],
    color: '#17985d',
    isCheckpoint: false,
    isMoving: false,
    questionTriggered: false
  });

  // --- Ambient clouds ---
  for (let c = 0; c < 14; c++) {
    const angle = (c / 14) * Math.PI * 2;
    const dist = 30 + rng() * 15;
    const spreadZ = -(platformIndex * 8) / 2; // center clouds along the course
    clouds.push({
      id: `cloud-${c}`,
      position: [
        Math.cos(angle) * dist,
        -3 + rng() * 5,
        spreadZ + Math.sin(angle) * dist
      ],
      scale: 1.2 + rng() * 1.2
    });
  }

  return {
    levelNumber,
    questionCount,
    platforms,
    orbs,
    clouds,
    startPosition: [0, 1.5, 0],
    fallThresholdY: -12
  };
}
