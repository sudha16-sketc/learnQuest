import React from 'react';
import { setVirtualControl } from '../game/useControls';
import { IconArrowUp, IconArrowDown, IconArrowLeft, IconArrowRight } from './Icons';

export function MobileControls() {
  const bindTouch = (action) => ({
    onTouchStart: (e) => {
      e.preventDefault();
      setVirtualControl(action, true);
    },
    onTouchEnd: (e) => {
      e.preventDefault();
      setVirtualControl(action, false);
    },
    onMouseDown: (e) => {
      e.preventDefault();
      setVirtualControl(action, true);
    },
    onMouseUp: (e) => {
      e.preventDefault();
      setVirtualControl(action, false);
    }
  });

  return (
    <div className="absolute inset-x-0 bottom-6 px-6 pointer-events-none z-30 flex items-end justify-between sm:hidden select-none">
      {/* Directional Pad */}
      <div className="pointer-events-auto grid grid-cols-3 gap-1 w-36 h-36 p-1 bg-[#0d1410] border-2 border-[#17985d]">
        <div />
        <button
          {...bindTouch('forward')}
          className="bg-[#0d1410] border border-[#17985d] active:bg-[#17985d] active:text-[#0d1410] flex items-center justify-center text-[#d2fcf8]"
        >
          <IconArrowUp className="w-5 h-5" />
        </button>
        <div />

        <button
          {...bindTouch('left')}
          className="bg-[#0d1410] border border-[#17985d] active:bg-[#17985d] active:text-[#0d1410] flex items-center justify-center text-[#d2fcf8]"
        >
          <IconArrowLeft className="w-5 h-5" />
        </button>
        <div className="bg-[#0d1410] border border-[#17985d]/30" />
        <button
          {...bindTouch('right')}
          className="bg-[#0d1410] border border-[#17985d] active:bg-[#17985d] active:text-[#0d1410] flex items-center justify-center text-[#d2fcf8]"
        >
          <IconArrowRight className="w-5 h-5" />
        </button>

        <div />
        <button
          {...bindTouch('backward')}
          className="bg-[#0d1410] border border-[#17985d] active:bg-[#17985d] active:text-[#0d1410] flex items-center justify-center text-[#d2fcf8]"
        >
          <IconArrowDown className="w-5 h-5" />
        </button>
        <div />
      </div>

      {/* Jump Button */}
      <button
        {...bindTouch('jump')}
        className="pointer-events-auto w-20 h-20 bg-[#17985d] text-[#ffffff] flex flex-col items-center justify-center border-2 border-[#ffffff] font-mono"
      >
        <IconArrowUp className="w-6 h-6" />
        <span className="text-[10px] font-extrabold uppercase tracking-wider">JUMP</span>
      </button>
    </div>
  );
}
