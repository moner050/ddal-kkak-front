import React from 'react';

interface ColorLegendProps {
  className?: string;
}

export default function ColorLegend({ className = '' }: ColorLegendProps) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs ${className}`}>
      <span className="text-gray-500 font-medium">색상 의미:</span>
      <div className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        <span className="text-emerald-700 font-medium">좋음</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
        <span className="text-gray-700 font-medium">보통</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
        <span className="text-red-700 font-medium">주의</span>
      </div>
    </div>
  );
}
