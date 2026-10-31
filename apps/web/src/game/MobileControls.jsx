import { useRef, useState, useEffect } from 'react';
import { setVirtualControl } from './useControls';

export function MobileControls() {
  const [isTouch, setIsTouch] = useState(false);
  const joyRef = useRef(null);
  const knobRef = useRef(null);
  const activeRef = useRef(false);
  const centerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (!isTouch) return null;

  const reset = () => {
    setVirtualControl('forward', false);
    setVirtualControl('backward', false);
    setVirtualControl('left', false);
    setVirtualControl('right', false);
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px,0px)';
    }
  };

  const handleStart = (e) => {
    const touch = e.touches[0];
    const rect = joyRef.current.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    activeRef.current = true;
    update(touch);
  };

  const update = (touch) => {
    const dx = touch.clientX - centerRef.current.x;
    const dy = touch.clientY - centerRef.current.y;
    const dist = Math.hypot(dx, dy);
    const max = 40;
    const r = Math.min(dist, max);
    const ang = Math.atan2(dy, dx);
    const x = Math.cos(ang) * r;
    const y = Math.sin(ang) * r;
    if (knobRef.current) knobRef.current.style.transform = `translate(${x}px,${y}px)`;
    setVirtualControl('right', dx > 15);
    setVirtualControl('left', dx < -15);
    setVirtualControl('backward', dy > 15);
    setVirtualControl('forward', dy < -15);
  };

  const handleMove = (e) => {
    if (!activeRef.current) return;
    e.preventDefault();
    update(e.touches[0]);
  };

  const handleEnd = () => {
    activeRef.current = false;
    reset();
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div
        ref={joyRef}
        className="absolute bottom-6 left-6 w-28 h-28 rounded-full bg-black/30 border-2 border-white/40 pointer-events-auto touch-none"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
      >
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/60"
        />
      </div>
      <button
        className="absolute bottom-10 right-8 w-20 h-20 rounded-full bg-red-500/70 text-white font-bold text-lg pointer-events-auto touch-none active:scale-95"
        onTouchStart={(e) => { e.preventDefault(); setVirtualControl('jump', true); }}
        onTouchEnd={() => setVirtualControl('jump', false)}
        onTouchCancel={() => setVirtualControl('jump', false)}
      >
        Jump
      </button>
    </div>
  );
}
