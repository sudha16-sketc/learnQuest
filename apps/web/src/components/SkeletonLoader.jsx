import React from 'react';

export function SkeletonBox({ className = "h-4 w-full" }) {
  return (
    <div
      className={`bg-[#17985d]/10 border border-[#17985d]/20 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 bg-[#0d1410] border border-[#17985d]/30 space-y-3">
      <SkeletonBox className="h-4 w-1/3" />
      <SkeletonBox className="h-6 w-3/4" />
      <SkeletonBox className="h-3 w-full" />
      <SkeletonBox className="h-3 w-5/6" />
      <div className="pt-2 flex justify-between">
        <SkeletonBox className="h-8 w-24" />
        <SkeletonBox className="h-8 w-20" />
      </div>
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map(idx => (
        <div key={idx} className="p-4 bg-[#0d1410] border border-[#17985d]/30 space-y-2">
          <SkeletonBox className="h-3 w-1/2" />
          <SkeletonBox className="h-7 w-2/3" />
          <SkeletonBox className="h-2 w-3/4" />
        </div>
      ))}
    </div>
  );
}
