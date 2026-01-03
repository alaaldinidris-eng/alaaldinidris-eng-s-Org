import React from 'react';

interface ProgressBarProps {
  current: number;
  goal: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, goal }) => {
  const percentage = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;
  
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-baseline">
        <div>
          <span className="text-4xl font-black text-gray-800">{current.toLocaleString()}</span>
          <span className="text-gray-500 font-semibold ml-1.5">Trees Funded</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-500">{goal.toLocaleString()} Tree Goal</span>
        </div>
      </div>
      
      <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200/50 shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out flex items-center justify-end"
          style={{ width: `${percentage}%` }}
        >
          <span className="text-white font-black text-xs pr-2">{percentage}%</span>
        </div>
      </div>
    </div>
  );
};