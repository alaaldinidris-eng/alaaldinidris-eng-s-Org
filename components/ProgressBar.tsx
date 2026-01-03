
import React from 'react';

interface ProgressBarProps {
  current: number;
  goal: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, goal }) => {
  const percentage = Math.min(Math.round((current / goal) * 100), 100);
  
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-3xl font-bold text-gray-900">{current.toLocaleString()}</span>
          <span className="text-gray-500 font-medium ml-1">trees sponsored</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-green-600 block">{percentage}% of goal reached</span>
          <span className="text-xs text-gray-400">Target: {goal.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <div 
          className="h-full bg-green-600 rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs font-medium text-gray-400">
        <span>Starting forest</span>
        <span>Goal reached</span>
      </div>
    </div>
  );
};
