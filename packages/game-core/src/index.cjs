// CommonJS re-export for Metro bundler (React Native / Expo)
// Self-contained: does NOT require('@learnquest/shared') to avoid
// symlink resolution issues in monorepo setups.
'use strict';

// ---------------------------------------------------------------------------
// State constants (inlined from @learnquest/shared)
// ---------------------------------------------------------------------------
const GAME_STATES = {
  MENU: 'MENU',
  TOPIC_SELECTION: 'TOPIC_SELECTION',
  LOADING_QUESTIONS: 'LOADING_QUESTIONS',
  PLAYING: 'PLAYING',
  QUESTION_ACTIVE: 'QUESTION_ACTIVE',
  FEEDBACK: 'FEEDBACK',
  LEARNING_EXPLANATION: 'LEARNING_EXPLANATION',
  LEVEL_BRIEFING: 'LEVEL_BRIEFING',
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  LEVEL_FAILED: 'LEVEL_FAILED',
  PAUSED: 'PAUSED',
  REWARD_SCREEN: 'REWARD_SCREEN',
};

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------
const ALLOWED_TRANSITIONS = {
  [GAME_STATES.MENU]: [GAME_STATES.TOPIC_SELECTION, GAME_STATES.LEVEL_BRIEFING],
  [GAME_STATES.TOPIC_SELECTION]: [GAME_STATES.LOADING_QUESTIONS, GAME_STATES.LEVEL_BRIEFING, GAME_STATES.MENU],
  [GAME_STATES.LEVEL_BRIEFING]: [GAME_STATES.LOADING_QUESTIONS, GAME_STATES.TOPIC_SELECTION, GAME_STATES.MENU],
  [GAME_STATES.LOADING_QUESTIONS]: [GAME_STATES.PLAYING, GAME_STATES.TOPIC_SELECTION],
  [GAME_STATES.PLAYING]: [
    GAME_STATES.QUESTION_ACTIVE,
    GAME_STATES.LEVEL_COMPLETED,
    GAME_STATES.LEVEL_FAILED,
    GAME_STATES.PAUSED
  ],
  [GAME_STATES.QUESTION_ACTIVE]: [GAME_STATES.FEEDBACK, GAME_STATES.PAUSED],
  [GAME_STATES.FEEDBACK]: [
    GAME_STATES.PLAYING,
    GAME_STATES.LEARNING_EXPLANATION,
    GAME_STATES.LEVEL_COMPLETED,
    GAME_STATES.LEVEL_FAILED
  ],
  [GAME_STATES.LEARNING_EXPLANATION]: [
    GAME_STATES.QUESTION_ACTIVE,
    GAME_STATES.PLAYING,
    GAME_STATES.LEVEL_FAILED
  ],
  [GAME_STATES.LEVEL_COMPLETED]: [GAME_STATES.TOPIC_SELECTION, GAME_STATES.LEVEL_BRIEFING, GAME_STATES.PLAYING, GAME_STATES.MENU],
  [GAME_STATES.LEVEL_FAILED]: [GAME_STATES.TOPIC_SELECTION, GAME_STATES.PLAYING, GAME_STATES.MENU],
  [GAME_STATES.PAUSED]: [GAME_STATES.PLAYING, GAME_STATES.QUESTION_ACTIVE, GAME_STATES.MENU]
};

class GameStateMachine {
  constructor(initialState, onChange) {
    this.currentState = initialState || GAME_STATES.MENU;
    this.previousState = null;
    this.onChange = onChange || null;
  }
  getState() { return this.currentState; }
  canTransitionTo(nextState) {
    return (ALLOWED_TRANSITIONS[this.currentState] || []).includes(nextState);
  }
  transition(nextState) {
    if (!this.canTransitionTo(nextState)) {
      throw new Error('Invalid state transition from ' + this.currentState + ' to ' + nextState);
    }
    this.previousState = this.currentState;
    this.currentState = nextState;
    if (typeof this.onChange === 'function') this.onChange(this.currentState, this.previousState);
    return this.currentState;
  }
}

// ---------------------------------------------------------------------------
// World generator
// ---------------------------------------------------------------------------
function getQuestionCountForLevel(levelNumber) {
  var count = 10 + Math.min(Math.max((levelNumber || 1) - 1, 0), 3);
  return Math.min(Math.max(count, 10), 13);
}

function movingPlatformChance(levelNumber) {
  return Math.min(0.12 + Math.max((levelNumber || 1) - 1, 0) * 0.06, 0.55);
}

function makePrng(seed) {
  var s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateLevelCourse(levelNumber) {
  levelNumber = levelNumber || 1;
  var platforms = [];
  var orbs = [];
  var clouds = [];
  var rng = makePrng(levelNumber * 7919);
  var questionCount = getQuestionCountForLevel(levelNumber);

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

  var platformIndex = 1;
  var currentPos = [0, 0, 0];

  for (var q = 0; q < questionCount; q++) {
    for (var f = 0; f < 4; f++) {
      var deltaX = Math.sin(platformIndex * 1.1 + levelNumber * 0.5) * 3.5;
      var deltaY = Math.sin(platformIndex * 0.7) * 0.4 + platformIndex * 0.15;
      var deltaZ = -(platformIndex * 8);
      var pos = [deltaX, deltaY, deltaZ];
      var moving = rng() < movingPlatformChance(levelNumber);
      var movement = moving
        ? {
            isMoving: true,
            movementAxis: rng() < 0.5 ? 'x' : 'z',
            movementRange: 2.5 + rng() * 2.5,
            movementSpeed: 1.0 + rng() * (levelNumber * 0.25)
          }
        : { isMoving: false };

      platforms.push(Object.assign({
        id: 'platform-filler-' + platformIndex,
        index: platformIndex,
        type: 'NORMAL',
        title: null,
        position: pos,
        size: [3.5, 0.9, 3.5],
        color: '#2d3a30',
        isCheckpoint: false,
        questionTriggered: false
      }, movement));

      orbs.push({
        id: 'orb-' + platformIndex,
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

    var qDeltaX = Math.sin(platformIndex * 1.1 + levelNumber * 0.5) * 3.5;
    var qDeltaY = Math.sin(platformIndex * 0.7) * 0.4 + platformIndex * 0.15;
    var qDeltaZ = -(platformIndex * 8);
    var qPos = [qDeltaX, qDeltaY, qDeltaZ];

    platforms.push({
      id: 'platform-question-' + (q + 1),
      index: platformIndex,
      type: 'CHECKPOINT',
      title: 'Knowledge Gate ' + (q + 1),
      position: qPos,
      size: [5, 1.0, 5],
      color: '#6d6499',
      isCheckpoint: true,
      checkpointNumber: q + 1,
      questionTriggered: false,
      isMoving: false
    });

    orbs.push({
      id: 'orb-q-' + (q + 1),
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

  var bossPos = [0, currentPos[1] + 2.0, currentPos[2] - 12];

  platforms.push({
    id: 'platform-boss',
    index: platformIndex,
    type: 'BOSS',
    title: 'Boss Arena - Guardian Challenge',
    position: bossPos,
    size: [9, 1.8, 9],
    color: '#dc2626',
    isCheckpoint: true,
    checkpointNumber: questionCount + 1,
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

  var finishPos = [0, bossPos[1] + 1.0, bossPos[2] - 10];
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

  for (var c = 0; c < 14; c++) {
    var cloudAngle = (c / 14) * Math.PI * 2;
    var distance = 30 + rng() * 15;
    var spreadZ = -(platformIndex * 8) / 2;
    clouds.push({
      id: 'cloud-' + c,
      position: [
        Math.cos(cloudAngle) * distance,
        -3 + rng() * 5,
        spreadZ + Math.sin(cloudAngle) * distance
      ],
      scale: 1.2 + rng() * 1.2
    });
  }

  return {
    levelNumber: levelNumber,
    questionCount: questionCount,
    platforms: platforms,
    orbs: orbs,
    clouds: clouds,
    startPosition: [0, 1.5, 0],
    fallThresholdY: -12
  };
}

// ---------------------------------------------------------------------------
// Physics
// ---------------------------------------------------------------------------
var GRAVITY = -24.0;
var JUMP_VELOCITY = 11.0;
var MOVE_SPEED = 7.5;
var PLAYER_RADIUS = 0.5;
var PLAYER_HEIGHT = 1.6;

function checkPlatformLanding(playerPos, playerVelocityY, platform) {
  var px = playerPos[0], py = playerPos[1], pz = playerPos[2];
  var bx = platform.position[0], by = platform.position[1], bz = platform.position[2];
  var halfWidth = platform.size[0] / 2;
  var halfHeight = platform.size[1] / 2;
  var halfDepth = platform.size[2] / 2;
  var topY = by + halfHeight;
  var isWithinBounds =
    px >= bx - halfWidth - 0.2 && px <= bx + halfWidth + 0.2 &&
    pz >= bz - halfDepth - 0.2 && pz <= bz + halfDepth + 0.2;
  var isAtPlatformLevel = py >= topY - 0.3 && py <= topY + 0.5;
  if (isWithinBounds && isAtPlatformLevel && playerVelocityY <= 0) {
    return { landed: true, surfaceY: topY, platform: platform };
  }
  return { landed: false };
}

function checkOrbCollision(playerPos, orb, collectRadius) {
  if (orb.collected) return false;
  collectRadius = collectRadius || 1.0;
  var dx = playerPos[0] - orb.position[0];
  var dy = playerPos[1] - orb.position[1];
  var dz = playerPos[2] - orb.position[2];
  return dx * dx + dy * dy + dz * dz <= collectRadius * collectRadius;
}

module.exports = {
  GAME_STATES: GAME_STATES,
  GameStateMachine: GameStateMachine,
  generateLevelCourse: generateLevelCourse,
  getQuestionCountForLevel: getQuestionCountForLevel,
  GRAVITY: GRAVITY,
  JUMP_VELOCITY: JUMP_VELOCITY,
  MOVE_SPEED: MOVE_SPEED,
  PLAYER_RADIUS: PLAYER_RADIUS,
  PLAYER_HEIGHT: PLAYER_HEIGHT,
  checkPlatformLanding: checkPlatformLanding,
  checkOrbCollision: checkOrbCollision,
};
