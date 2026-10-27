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
  LEVEL_COMPLETED: 'LEVEL_COMPLETED',
  LEVEL_FAILED: 'LEVEL_FAILED',
  PAUSED: 'PAUSED',
  REWARD_SCREEN: 'REWARD_SCREEN',
};

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------
const ALLOWED_TRANSITIONS = {
  [GAME_STATES.MENU]: [GAME_STATES.TOPIC_SELECTION],
  [GAME_STATES.TOPIC_SELECTION]: [GAME_STATES.LOADING_QUESTIONS, GAME_STATES.MENU],
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
  [GAME_STATES.LEVEL_COMPLETED]: [GAME_STATES.TOPIC_SELECTION, GAME_STATES.PLAYING, GAME_STATES.MENU],
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
function generateLevelCourse(levelNumber, platformsCount) {
  levelNumber = levelNumber || 1;
  platformsCount = platformsCount || 5;
  var platforms = [];
  var orbs = [];
  var clouds = [];

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

  var currentPos = [0, 0, 0];
  for (var i = 1; i <= platformsCount; i++) {
    var isFinish = i === platformsCount;
    var deltaX = Math.sin(i * 1.2) * 4;
    var deltaY = Math.sin(i * 0.8) * 0.5 + i * 0.2;
    var deltaZ = -(i * 9);
    var platformPos = [deltaX, deltaY, deltaZ];

    platforms.push({
      id: isFinish ? 'platform-finish' : 'platform-checkpoint-' + i,
      index: i,
      type: isFinish ? 'FINISH' : 'CHECKPOINT',
      title: isFinish ? 'Mastery Portal' : 'Knowledge Beacon ' + i,
      position: platformPos,
      size: isFinish ? [7, 1.4, 7] : [4.5, 1.0, 4.5],
      color: isFinish ? '#10b981' : '#8b5cf6',
      isCheckpoint: !isFinish,
      checkpointNumber: isFinish ? null : i,
      questionTriggered: false
    });

    if (!isFinish) {
      orbs.push({
        id: 'orb-' + i,
        position: [
          (currentPos[0] + platformPos[0]) / 2,
          Math.max(currentPos[1], platformPos[1]) + 1.2,
          (currentPos[2] + platformPos[2]) / 2
        ],
        value: 5,
        collected: false
      });
    }
    currentPos = platformPos;
  }

  for (var c = 0; c < 12; c++) {
    var cloudAngle = (c / 12) * Math.PI * 2;
    var distance = 25 + Math.sin(c) * 10;
    clouds.push({
      id: 'cloud-' + c,
      position: [
        Math.cos(cloudAngle) * distance,
        -2 + Math.sin(c * 2) * 3,
        Math.sin(cloudAngle) * distance - 20
      ],
      scale: 1.5 + Math.cos(c) * 0.8
    });
  }

  return { levelNumber: levelNumber, platforms: platforms, orbs: orbs, clouds: clouds, startPosition: [0, 1.5, 0], fallThresholdY: -10 };
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
  GRAVITY: GRAVITY,
  JUMP_VELOCITY: JUMP_VELOCITY,
  MOVE_SPEED: MOVE_SPEED,
  PLAYER_RADIUS: PLAYER_RADIUS,
  PLAYER_HEIGHT: PLAYER_HEIGHT,
  checkPlatformLanding: checkPlatformLanding,
  checkOrbCollision: checkOrbCollision,
};
