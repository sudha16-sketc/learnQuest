export const virtualInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
};

export function setVirtualControl(action, active) {
  if (action in virtualInput) {
    virtualInput[action] = active;
  }
}

export function resetVirtualControls() {
  Object.keys(virtualInput).forEach((action) => {
    virtualInput[action] = false;
  });
}
