import React from 'react';
import { IconCompass, IconAlertCircle } from './Icons';

export function HUD({
  currentLevel = 1,
  levelTitle = 'Blocks and Cryptography',
  checkpointsCompleted = 0,
  totalCheckpoints = 3,
  respawnAlert = false
}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 pt-16">
      {/* Top Banner: Objective & Checkpoints */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="bg-[#0d1410] border-2 border-[#17985d] px-4 py-2.5 max-w-md pointer-events-auto">
          <div className="flex items-center gap-2 text-[#17985d] text-xs font-mono font-bold uppercase tracking-wider">
            <IconCompass className="w-3.5 h-3.5" />
            <span>Level {currentLevel}: {levelTitle}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 font-mono">
            <span className="text-xs text-[#d2fcf8]/70">Checkpoints:</span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalCheckpoints }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 border ${
                    idx < checkpointsCompleted
                      ? 'bg-[#17985d] border-[#17985d]'
                      : 'bg-[#0d1410] border-[#17985d]/40'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#ffffff] font-bold ml-1">
              {checkpointsCompleted} / {totalCheckpoints}
            </span>
          </div>
        </div>

        {/* Desktop Controls (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3 bg-[#0d1410] border border-[#17985d]/60 px-3.5 py-2 text-[11px] font-mono text-[#d2fcf8]">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-[#0d1410] border border-[#17985d] text-[#ffffff] font-bold">W</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#0d1410] border border-[#17985d] text-[#ffffff] font-bold">A</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#0d1410] border border-[#17985d] text-[#ffffff] font-bold">S</kbd>
            <kbd className="px-1.5 py-0.5 bg-[#0d1410] border border-[#17985d] text-[#ffffff] font-bold">D</kbd>
            <span className="ml-1 text-[#6d6499]">Move</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 bg-[#0d1410] border border-[#17985d] text-[#ffffff] font-bold">SPACE</kbd>
            <span className="ml-1 text-[#6d6499]">Jump</span>
          </div>
        </div>
      </div>

      {/* Respawn Alert Toast */}
      {respawnAlert && (
        <div className="self-center bg-[#0d1410] border-2 border-[#6d6499] px-4 py-2 text-[#d2fcf8] text-xs font-mono font-bold flex items-center gap-2">
          <IconAlertCircle className="w-4 h-4 text-[#6d6499]" />
          <span>Fell into the abyss. Respawned back safely onto the island.</span>
        </div>
      )}

      {/* Bottom spacer */}
      <div />
    </div>
  );
}
