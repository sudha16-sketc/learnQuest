import React from 'react';
import { IconBookOpen, IconArrowRight, IconClock } from './Icons';
import { getLevelBriefing } from '@learnquest/shared';

export function LevelBriefingModal({ levelNumber, onStartLevel, onClose }) {
  const briefing = getLevelBriefing(levelNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/95 pointer-events-auto select-none">
      <div className="w-full max-w-2xl bg-[#0d1410] border-2 border-[#17985d] p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto font-mono">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#17985d]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0d1410] border border-[#17985d] text-[#17985d]">
              <IconBookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#ffffff]">
                Learn Before You Play
              </h2>
              <p className="text-xs text-[#d2fcf8]/70">{briefing.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#6d6499]">
            <IconClock className="w-4 h-4" />
            <span>{briefing.estimatedReadingTime}</span>
          </div>
        </div>

        <div className="mb-6 p-4 bg-[#0d1410] border border-[#17985d]/40">
          <p className="text-sm text-[#ffffff] font-bold mb-1">Objective</p>
          <p className="text-xs text-[#d2fcf8]/90 leading-relaxed">{briefing.objective}</p>
        </div>

        <div className="mb-6">
          <p className="text-xs font-bold text-[#17985d] uppercase tracking-wider mb-3">Key Concepts</p>
          <div className="space-y-3">
            {briefing.concepts.map((concept, idx) => (
              <div key={idx} className="p-3 border border-[#17985d]/30 bg-[#0d1410]">
                <p className="text-sm text-[#ffffff] font-bold mb-1">{concept.name}</p>
                <p className="text-xs text-[#d2fcf8] mb-1"><span className="text-[#17985d]">Definition:</span> {concept.definition}</p>
                <p className="text-xs text-[#d2fcf8]/90 mb-1">{concept.explanation}</p>
                <p className="text-xs text-[#6d6499]"><span className="font-bold">Example:</span> {concept.example}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-bold text-[#17985d] uppercase tracking-wider mb-2">Learning Objectives</p>
          <ul className="space-y-1">
            {briefing.learningObjectives.map((obj, idx) => (
              <li key={idx} className="text-xs text-[#d2fcf8]/90 flex items-start gap-2">
                <span className="text-[#17985d] mt-0.5">▸</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#17985d]/30">
          <button
            onClick={onStartLevel}
            className="px-6 py-2.5 bg-[#17985d] text-[#ffffff] font-bold text-xs uppercase tracking-wider hover:bg-[#17985d]/90 flex items-center justify-center gap-2"
          >
            <span>Start Level</span>
            <IconArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
