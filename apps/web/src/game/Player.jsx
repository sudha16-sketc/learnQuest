import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  GRAVITY,
  JUMP_VELOCITY,
  MOVE_SPEED,
  checkPlatformLanding,
  checkOrbCollision
} from '@learnquest/game-core';
import { useControls } from './useControls';

const MODEL_URL = '/learnQuest.glb';
const MODEL_TARGET_HEIGHT = 1.75;
const ANIMATION_FADE = 0.2;
const ANIMATION_STATES = ['idle', 'walk', 'jump'];
const STATE_ALIASES = {
  idle: ['idle', 'stand', 'rest', 'pose'],
  walk: ['walk', 'walking', 'run', 'running', 'move'],
  jump: ['jump', 'jumping', 'air', 'leap']
};

function normalizeClipName(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Match animation clips by their real (normalized) names instead of assuming
 * exact capitalization or suffixes such as "jump.001" or "Armature|Idle".
 */
function findAnimationClip(clips, state) {
  const aliases = STATE_ALIASES[state];
  const normalized = clips.map((clip) => ({ clip, name: normalizeClipName(clip.name) }));

  for (const alias of aliases) {
    const exact = normalized.find((entry) => entry.name === alias);
    if (exact) return exact.clip;
  }
  for (const alias of aliases) {
    const prefixed = normalized.find((entry) => entry.name.startsWith(alias));
    if (prefixed) return prefixed.clip;
  }
  for (const alias of aliases) {
    const contained = normalized.find((entry) => entry.name.includes(alias));
    if (contained) return contained.clip;
  }
  return null;
}

/**
 * Drop tracks that do not target the cloned model (e.g. tracks belonging to a
 * second armature in the source file) so the mixer only drives visible bones.
 */
function filterClipForRoot(clip, root) {
  if (!clip || !clip.tracks || clip.tracks.length === 0) return null;

  const nodeNames = new Set();
  root.traverse((object) => {
    if (object.name) nodeNames.add(object.name);
  });

  const tracks = clip.tracks.filter((track) => {
    const parsed = THREE.PropertyBinding.parseTrackName(track.name);
    return nodeNames.has(parsed.nodeName);
  });

  if (tracks.length === 0) return null;
  return new THREE.AnimationClip(clip.name, clip.duration, tracks, clip.blendMode);
}

const PROCEDURAL_BONE_FRAGMENTS = {
  leftUpLeg: 'LeftUpLeg',
  rightUpLeg: 'RightUpLeg',
  leftLeg: 'LeftLeg',
  rightLeg: 'RightLeg',
  leftArm: 'LeftArm',
  rightArm: 'RightArm',
  leftForeArm: 'LeftForeArm',
  rightForeArm: 'RightForeArm',
  spine: 'Spine',
  spine1: 'Spine1',
  head: 'Head'
};

const AXIS_VECTORS = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1)
};

function findBone(model, fragment) {
  const target = fragment.toLowerCase();
  let match = null;
  model.traverse((object) => {
    if (!match && object.isBone && object.name.toLowerCase().endsWith(target)) {
      match = object;
    }
  });
  return match;
}

function getProceduralBones(model) {
  const bones = {};
  for (const [key, fragment] of Object.entries(PROCEDURAL_BONE_FRAGMENTS)) {
    bones[key] = findBone(model, fragment);
  }
  return bones;
}

function getPrimarySkeletonBones(model) {
  let skeletonBones = null;
  model.traverse((object) => {
    if (
      !skeletonBones &&
      object.isSkinnedMesh &&
      object.skeleton &&
      object.skeleton.bones.length > 0
    ) {
      skeletonBones = object.skeleton.bones;
    }
  });
  return skeletonBones || Object.values(getProceduralBones(model)).filter(Boolean);
}

/**
 * Build a per-bone local pose from the first keyframe of a real clip. The
 * skeleton's bind pose is a T-pose, so procedural fallbacks must start from a
 * natural authored pose (the jump clip starts with arms lowered).
 */
function createPoseFromClip(clip, model) {
  const pose = new Map();
  const tracksByBone = new Map();

  if (clip) {
    for (const track of clip.tracks) {
      const parsed = THREE.PropertyBinding.parseTrackName(track.name);
      if (!parsed.nodeName) continue;
      let entry = tracksByBone.get(parsed.nodeName);
      if (!entry) {
        entry = {};
        tracksByBone.set(parsed.nodeName, entry);
      }
      if (
        parsed.propertyName === 'position' ||
        parsed.propertyName === 'quaternion' ||
        parsed.propertyName === 'scale'
      ) {
        entry[parsed.propertyName] = track;
      }
    }
  }

  for (const bone of getPrimarySkeletonBones(model)) {
    const tracks = tracksByBone.get(bone.name) || {};
    const position =
      tracks.position && tracks.position.values.length >= 3
        ? new THREE.Vector3(
            tracks.position.values[0],
            tracks.position.values[1],
            tracks.position.values[2]
          )
        : bone.position.clone();
    const quaternion =
      tracks.quaternion && tracks.quaternion.values.length >= 4
        ? new THREE.Quaternion(
            tracks.quaternion.values[0],
            tracks.quaternion.values[1],
            tracks.quaternion.values[2],
            tracks.quaternion.values[3]
          ).normalize()
        : bone.quaternion.clone();
    const scale =
      tracks.scale && tracks.scale.values.length >= 3
        ? new THREE.Vector3(
            tracks.scale.values[0],
            tracks.scale.values[1],
            tracks.scale.values[2]
          )
        : bone.scale.clone();

    pose.set(bone.name, { position, quaternion, scale });
  }

  return pose;
}

function getBaseTransform(bone, basePose) {
  return (
    basePose?.get(bone.name) || {
      position: bone.position,
      quaternion: bone.quaternion,
      scale: bone.scale,
    }
  );
}

function createConstantVectorTrack(bone, property, times, vector) {
  const values = [];
  for (let i = 0; i < times.length; i += 1) {
    values.push(vector.x, vector.y, vector.z);
  }
  return new THREE.VectorKeyframeTrack(`${bone.name}.${property}`, times, values);
}

function createConstantPositionTrack(bone, times, basePose) {
  return createConstantVectorTrack(
    bone,
    'position',
    times,
    getBaseTransform(bone, basePose).position
  );
}

function createConstantScaleTrack(bone, times, basePose) {
  return createConstantVectorTrack(
    bone,
    'scale',
    times,
    getBaseTransform(bone, basePose).scale
  );
}

function createConstantQuaternionTrack(bone, times, basePose) {
  const base = getBaseTransform(bone, basePose).quaternion;
  const values = [];
  for (let i = 0; i < times.length; i += 1) {
    values.push(base.x, base.y, base.z, base.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values);
}

function createSwingQuaternionTrack(bone, times, axis, angleAt, basePose) {
  const axisVector = AXIS_VECTORS[axis];
  const delta = new THREE.Quaternion();
  const rest = getBaseTransform(bone, basePose).quaternion.clone();
  const values = [];

  for (let i = 0; i < times.length; i += 1) {
    delta.setFromAxisAngle(axisVector, angleAt(times[i]));
    const rotation = rest.clone().multiply(delta);
    values.push(rotation.x, rotation.y, rotation.z, rotation.w);
  }

  return new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values);
}

function addRestTracksForUnanimatedBones(
  tracks,
  allBones,
  times,
  animatedBoneNames,
  basePose
) {
  const addedNames = new Set(animatedBoneNames);
  for (const bone of allBones) {
    if (!bone || addedNames.has(bone.name)) continue;
    addedNames.add(bone.name);
    tracks.push(
      createConstantPositionTrack(bone, times, basePose),
      createConstantQuaternionTrack(bone, times, basePose),
      createConstantScaleTrack(bone, times, basePose)
    );
  }
}

/**
 * The supplied GLB only exports jump.001 even though its scene contains idle,
 * jump and walk skeleton roots. These procedural fallbacks keep Idle/Walk
 * functional until the GLB is re-exported with all three real clips.
 */
function createProceduralIdleClip(model, basePose) {
  const bones = getProceduralBones(model);
  const allBones = getPrimarySkeletonBones(model);
  const duration = 2.4;
  const times = [0, 0.6, 1.2, 1.8, 2.4];
  const phase = (time) => (time / duration) * Math.PI * 2;
  const tracks = [];
  const animatedNames = new Set();

  const addSway = (bone, axis, amplitude) => {
    if (!bone) return;
    tracks.push(
      createConstantPositionTrack(bone, times, basePose),
      createConstantScaleTrack(bone, times, basePose),
      createSwingQuaternionTrack(
        bone,
        times,
        axis,
        (time) => Math.sin(phase(time)) * amplitude,
        basePose
      )
    );
    animatedNames.add(bone.name);
  };

  addSway(bones.spine, 'x', 0.02);
  addSway(bones.spine1, 'x', 0.012);
  addSway(bones.head, 'z', 0.015);
  addRestTracksForUnanimatedBones(tracks, allBones, times, animatedNames, basePose);

  if (tracks.length === 0) return null;
  return new THREE.AnimationClip('Idle__procedural', duration, tracks);
}

function createProceduralWalkClip(model, basePose) {
  const bones = getProceduralBones(model);
  if (!bones.leftUpLeg || !bones.rightUpLeg || !bones.leftArm || !bones.rightArm) {
    return null;
  }

  const allBones = getPrimarySkeletonBones(model);
  const duration = 1;
  const times = [0, 0.25, 0.5, 0.75, 1];
  const phase = (time) => (time / duration) * Math.PI * 2;
  const tracks = [];
  const animatedNames = new Set();

  const addSwing = (bone, axis, amplitude, offset = 0) => {
    tracks.push(
      createConstantPositionTrack(bone, times, basePose),
      createConstantScaleTrack(bone, times, basePose),
      createSwingQuaternionTrack(
        bone,
        times,
        axis,
        (time) => Math.sin(phase(time) + offset) * amplitude,
        basePose
      )
    );
    animatedNames.add(bone.name);
  };

  addSwing(bones.leftUpLeg, 'x', 0.4);
  addSwing(bones.rightUpLeg, 'x', 0.4, Math.PI);
  addSwing(bones.leftArm, 'z', -0.3);
  addSwing(bones.rightArm, 'z', -0.3);
  addRestTracksForUnanimatedBones(tracks, allBones, times, animatedNames, basePose);

  if (tracks.length === 0) return null;
  return new THREE.AnimationClip('Walk__procedural', duration, tracks);
}

/**
 * Clone the cached GLTF scene (never mutate the shared asset), normalize it to
 * the player height, and shift it so its feet sit at the controller origin.
 */
function buildPlayerModel(sourceScene) {
  const modelRoot = cloneSkeleton(sourceScene);
  modelRoot.updateMatrixWorld(true);

  let bounds = new THREE.Box3().setFromObject(modelRoot);
  if (!bounds.isEmpty()) {
    const height = bounds.getSize(new THREE.Vector3()).y;
    if (height > 0.0001) {
      modelRoot.scale.multiplyScalar(MODEL_TARGET_HEIGHT / height);
    }
  }

  modelRoot.updateMatrixWorld(true);
  bounds = new THREE.Box3().setFromObject(modelRoot);

  const container = new THREE.Group();
  container.name = 'LearnQuestPlayerModel';
  container.add(modelRoot);

  if (!bounds.isEmpty()) {
    const center = bounds.getCenter(new THREE.Vector3());
    container.position.set(-center.x, -bounds.min.y, -center.z);
  }

  modelRoot.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      // Skinned bounds change while animating; avoid premature culling.
      object.frustumCulled = false;
    }
  });

  return container;
}

/**
 * Builds the animation state machine. Actions are created once per model so
 * React renders never restart clips. Existing Idle/Walk/Jump clips are used
 * when present; missing clips degrade gracefully to procedural fallbacks or a
 * paused rest pose.
 */
function createAnimationController(mixer, animations, model) {
  const availableClips = (animations || []).filter(
    (clip) => clip && clip.tracks && clip.tracks.length > 0
  );

  const clipsByState = {};
  const missing = [];
  for (const state of ANIMATION_STATES) {
    const clip = findAnimationClip(availableClips, state);
    if (clip) {
      clipsByState[state] = clip;
    } else {
      missing.push(state);
    }
  }

  const stateActions = {};
  for (const state of ANIMATION_STATES) {
    const clip = clipsByState[state];
    if (!clip) continue;

    const filtered = filterClipForRoot(clip, model);
    if (!filtered) {
      if (!missing.includes(state)) missing.push(state);
      continue;
    }

    stateActions[state] = mixer.clipAction(filtered);
  }

  const basePoseSource =
    clipsByState.idle || clipsByState.jump || clipsByState.walk || availableClips[0] || null;
  const basePose = basePoseSource ? createPoseFromClip(basePoseSource, model) : null;
  const proceduralFallbacks = [];

  if (!stateActions.idle) {
    const idleClip = createProceduralIdleClip(model, basePose);
    if (idleClip) {
      stateActions.idle = mixer.clipAction(idleClip);
      proceduralFallbacks.push('idle');
    }
  }

  if (!stateActions.walk) {
    const walkClip = createProceduralWalkClip(model, basePose);
    if (walkClip) {
      stateActions.walk = mixer.clipAction(walkClip);
      proceduralFallbacks.push('walk');
    }
  }

  const jumpAction = stateActions.jump || null;

  // Last resort if no usable Idle clip or bone-based fallback is available:
  // hold the first frame of another clip as a static rest pose.
  let staticIdleAction = null;
  let staticIdleSource = null;
  if (!stateActions.idle && availableClips.length > 0) {
    const fallbackSource = clipsByState.jump || clipsByState.walk || availableClips[0];
    const filtered = filterClipForRoot(fallbackSource, model);
    if (filtered) {
      const restClip = filtered.clone();
      restClip.name = `${fallbackSource.name || 'animation'}__restPose`;
      staticIdleAction = mixer.clipAction(restClip);
      staticIdleAction.setLoop(THREE.LoopRepeat, Infinity);
      staticIdleAction.clampWhenFinished = false;
      staticIdleAction.play();
      staticIdleAction.time = 0;
      staticIdleAction.paused = true;
      staticIdleAction.setEffectiveWeight(1);
      staticIdleSource = fallbackSource.name;
    }
  }

  const actions = {
    idle: stateActions.idle || staticIdleAction || null,
    walk: stateActions.walk || stateActions.idle || staticIdleAction || null,
    jump: stateActions.jump || stateActions.idle || staticIdleAction || stateActions.walk || null
  };

  if (missing.length > 0) {
    const detectedNames = availableClips.map((clip) => clip.name).join(', ') || 'none';
    const fallbackParts = [];
    if (proceduralFallbacks.length > 0) {
      fallbackParts.push(`Using procedural fallback for: ${proceduralFallbacks.join(', ')}.`);
    }
    if (staticIdleAction) {
      fallbackParts.push(`Idle/Walk fall back to a paused rest frame from "${staticIdleSource}".`);
    }
    const fallbackNote = fallbackParts.length > 0 ? ` ${fallbackParts.join(' ')}` : '';
    console.warn(
      `[LearnQuest Player] ${MODEL_URL} is missing clip(s): ${missing.join(', ')}. ` +
      `Detected clip(s): ${detectedNames}.${fallbackNote}`
    );
  }

  let currentState = null;
  let currentAction = null;

  function applyAction(nextState, nextAction, fadeDuration) {
    if (nextAction === currentAction) {
      currentState = nextState;
      return;
    }

    const previousAction = currentAction;
    currentAction = nextAction;
    currentState = nextState;

    if (previousAction && previousAction !== nextAction) {
      if (fadeDuration > 0) {
        previousAction.fadeOut(fadeDuration);
      } else {
        previousAction.stop();
      }
    }

    if (!nextAction) return;

    const isStaticIdle = nextAction === staticIdleAction;
    const isJump = nextAction === jumpAction;

    nextAction.reset();
    nextAction.enabled = true;
    nextAction.paused = false;
    nextAction.setEffectiveTimeScale(1);
    nextAction.setEffectiveWeight(1);

    if (isJump) {
      nextAction.setLoop(THREE.LoopOnce, 1);
      nextAction.clampWhenFinished = true;
    } else {
      nextAction.setLoop(THREE.LoopRepeat, Infinity);
      nextAction.clampWhenFinished = false;
    }

    if (isStaticIdle) {
      nextAction.time = 0;
      nextAction.paused = true;
    }

    nextAction.play();
    if (fadeDuration > 0) {
      nextAction.fadeIn(fadeDuration);
    } else {
      nextAction.setEffectiveWeight(1);
    }

    if (isStaticIdle) {
      nextAction.paused = true;
    }
  }

  return {
    setState(nextState, fadeDuration = ANIMATION_FADE) {
      if (nextState === currentState) return;
      applyAction(nextState, actions[nextState] || null, fadeDuration);
    },
    update(delta) {
      mixer.update(delta);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    }
  };
}

const PlayerModel = React.memo(function PlayerModel({ animationApiRef }) {
  const { scene, animations } = useGLTF(MODEL_URL);
  const model = useMemo(() => buildPlayerModel(scene), [scene]);

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(model);
    const controller = createAnimationController(mixer, animations, model);
    controller.setState('idle', 0);
    animationApiRef.current = controller;

    return () => {
      if (animationApiRef.current === controller) {
        animationApiRef.current = null;
      }
      controller.dispose();
    };
  }, [model, animations, animationApiRef]);

  return <primitive object={model} dispose={null} />;
});

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
  const animationApiRef = useRef(null);
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

    // Character rotation towards actual horizontal movement direction.
    const isMoving = dx !== 0 || dz !== 0;
    if (isMoving) {
      const currentRotation = meshRef.current.rotation.y;
      const targetRotation = Math.atan2(dx, dz);
      let rotationDelta = ((targetRotation - currentRotation + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (rotationDelta < -Math.PI) rotationDelta += Math.PI * 2;
      const smoothFactor = 1 - Math.exp(-12 * clampedDelta);
      meshRef.current.rotation.y = currentRotation + rotationDelta * smoothFactor;
    }

    // Animation state comes from physics (airborne / grounded + displacement),
    // not from keyboard input alone. Jump takes priority over Walk and Idle.
    if (animationApiRef.current) {
      animationApiRef.current.setState(
        !isGrounded.current ? 'jump' : isMoving ? 'walk' : 'idle'
      );
      animationApiRef.current.update(clampedDelta);
    }

    // Animate accessories
    if (auraRef.current) {
      auraRef.current.rotation.y += delta * 1.5;
      auraRef.current.rotation.x += delta * 0.8;
      const pulse = 1 + Math.sin(animationTime.current * 4) * 0.08;
      auraRef.current.scale.set(pulse, pulse, pulse);
    }

    if (hatRef.current) {
      hatRef.current.position.y = 2.0 + Math.sin(animationTime.current * 3) * 0.05;
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
      <Suspense fallback={null}>
        <PlayerModel animationApiRef={animationApiRef} />
      </Suspense>

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
        <group ref={hatRef} position={[0, 2.0, 0]}>
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
