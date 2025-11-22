import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { ScoreRange, RiskLevel } from '../types';

interface DashboardProps {
  totalScore: number;
  currentRange: ScoreRange;
}

export const Dashboard: React.FC<DashboardProps> = ({ totalScore, currentRange }) => {
  const data = [
    {
      name: 'Score',
      value: totalScore,
      fill: currentRange.color,
    },
  ];

  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center sticky top-6">
      <h2 className="text-xl font-bold text-slate-100 mb-2 font-mono tracking-wider border-b border-slate-700 pb-2 w-full text-center">THREAT LEVEL</h2>
      
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            innerRadius="70%" 
            outerRadius="100%" 
            barSize={20} 
            data={data} 
            startAngle={180} 
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: '#1e293b' }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
            <span className="text-5xl font-bold font-mono" style={{ color: currentRange.color }}>
                {totalScore}
            </span>
            <span className="text-xs text-slate-500 font-mono uppercase">Total Score</span>
        </div>
      </div>

      <div className="text-center mt-[-40px]">
        <h3 className={`text-lg font-bold mb-2`} style={{ color: currentRange.color }}>
          {currentRange.level === RiskLevel.LOW && "LOW PROBABILITY"}
          {currentRange.level === RiskLevel.MODERATE && "MODERATE PROBABILITY"}
          {currentRange.level === RiskLevel.HIGH && "HIGH PROBABILITY"}
          {currentRange.level === RiskLevel.EXTREME && "PSYOP CONFIRMED"}
        </h3>
        <p className="text-sm text-slate-400">{currentRange.level}</p>
      </div>

      <div className="mt-6 w-full">
        <div className="grid grid-cols-4 text-[10px] text-slate-500 font-mono text-center gap-1">
            <div className="bg-emerald-900/20 p-1 rounded border border-emerald-900/30">0-25<br/>LOW</div>
            <div className="bg-amber-900/20 p-1 rounded border border-amber-900/30">26-50<br/>MOD</div>
            <div className="bg-orange-900/20 p-1 rounded border border-orange-900/30">51-75<br/>HIGH</div>
            <div className="bg-red-900/20 p-1 rounded border border-red-900/30">76+<br/>EXT</div>
        </div>
      </div>
    </div>
  );
};