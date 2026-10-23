import React from 'react';
import { setVirtualControl } from '../game/useControls';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowBigUp } from 'lucide-react';

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
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5 w-36 h-36 p-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/60 shadow-xl">
        <div />
        <button
          {...bindTouch('forward')}
          className="rounded-full bg-slate-800/80 active:bg-indigo-600 flex items-center justify-center text-slate-200 active:text-white shadow"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div />

        <button
          {...bindTouch('left')}
          className="rounded-full bg-slate-800/80 active:bg-indigo-600 flex items-center justify-center text-slate-200 active:text-white shadow"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="rounded-full bg-slate-950/40" />
        <button
          {...bindTouch('right')}
          className="rounded-full bg-slate-800/80 active:bg-indigo-600 flex items-center justify-center text-slate-200 active:text-white shadow"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        <div />
        <button
          {...bindTouch('backward')}
          className="rounded-full bg-slate-800/80 active:bg-indigo-600 flex items-center justify-center text-slate-200 active:text-white shadow"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <div />
      </div>

      {/* Jump Button */}
      <button
        {...bindTouch('jump')}
        className="pointer-events-auto w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 active:scale-95 text-white flex flex-col items-center justify-center shadow-2xl shadow-indigo-500/40 border border-white/20 transition-transform"
      >
        <ArrowBigUp className="w-7 h-7" />
        <span className="text-[10px] font-extrabold uppercase tracking-wider">JUMP</span>
      </button>
    </div>
  );
}
