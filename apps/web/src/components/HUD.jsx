import React from 'react';
import { Compass, HelpCircle, AlertCircle } from 'lucide-react';

export function HUD({
  currentLevel = 1,
  levelTitle = 'Blocks & Cryptography',
  checkpointsCompleted = 0,
  totalCheckpoints = 3,
  respawnAlert = false
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 pt-16">
      {/* Top Banner: Objective & Checkpoints */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="glass-panel px-4 py-2.5 rounded-2xl max-w-md pointer-events-auto shadow-xl">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            <span>Level {currentLevel}: {levelTitle}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-400 font-medium">Checkpoints:</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalCheckpoints }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx < checkpointsCompleted
                      ? 'bg-emerald-400 shadow-md shadow-emerald-400/50 scale-110'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-300 font-bold ml-1">
              {checkpointsCompleted} / {totalCheckpoints}
            </span>
          </div>
        </div>

        {/* Desktop Controls Hint (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3 glass-panel px-3.5 py-2 rounded-xl text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold">W</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold">A</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold">S</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold">D</kbd>
            <span className="ml-1">Move</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold">SPACE</kbd>
            <span className="ml-1">Jump</span>
          </div>
        </div>
      </div>

      {/* Respawn Alert Toast */}
      {respawnAlert && (
        <div className="self-center glass-panel px-4 py-2 rounded-xl border border-amber-500/50 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-bounce shadow-lg shadow-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Fell into the abyss! Respawned back safely onto the island.</span>
        </div>
      )}

      {/* Bottom spacer */}
      <div />
    </div>
  );
}
