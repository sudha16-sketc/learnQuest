import { useState, useEffect } from 'react';

// Global virtual joystick state for touch controls
export const virtualInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false
};

export function setVirtualControl(action, active) {
  if (action in virtualInput) {
    virtualInput[action] = active;
  }
}

export function useControls() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent scrolling on Space / Arrow keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(k => ({ ...k, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys(k => ({ ...k, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(k => ({ ...k, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys(k => ({ ...k, right: true }));
          break;
        case 'Space':
          setKeys(k => ({ ...k, jump: true }));
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys(k => ({ ...k, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys(k => ({ ...k, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys(k => ({ ...k, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys(k => ({ ...k, right: false }));
          break;
        case 'Space':
          setKeys(k => ({ ...k, jump: false }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return {
    forward: keys.forward || virtualInput.forward,
    backward: keys.backward || virtualInput.backward,
    left: keys.left || virtualInput.left,
    right: keys.right || virtualInput.right,
    jump: keys.jump || virtualInput.jump
  };
}
