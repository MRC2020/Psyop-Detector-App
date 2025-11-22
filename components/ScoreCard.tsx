import React from 'react';
import { ScoringCriteria } from '../types';

interface ScoreCardProps {
  criteria: ScoringCriteria;
  score: number;
  reasoning?: string;
  onChange: (id: number, val: number) => void;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ criteria, score, reasoning, onChange }) => {
  // Determine color intensity based on score
  const getBarColor = (val: number) => {
    if (val === 1) return 'bg-emerald-500/20 border-emerald-500/50';
    if (val === 2) return 'bg-emerald-400/20 border-emerald-400/50';
    if (val === 3) return 'bg-yellow-500/20 border-yellow-500/50';
    if (val === 4) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  const getTextColor = (val: number) => {
    if (val <= 2) return 'text-emerald-400';
    if (val === 3) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="mb-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-slate-500">#{criteria.id.toString().padStart(2, '0')}</span>
            <h3 className="font-bold text-slate-200">{criteria.category}</h3>
          </div>
          <p className="text-sm text-slate-300 mb-2 font-medium">{criteria.question}</p>
          <p className="text-xs text-slate-500 italic">Ex: {criteria.example}</p>
          
          {reasoning && (
            <div className="mt-3 p-2 bg-slate-900/50 border-l-2 border-indigo-500 rounded-r text-xs text-indigo-200 font-mono">
              AI NOTE: {reasoning}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center min-w-[140px]">
          <div className="flex justify-between w-full text-xs font-mono text-slate-500 mb-1">
             <span>1</span><span>5</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={score}
            onChange={(e) => onChange(criteria.id, parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className={`mt-2 px-3 py-1 rounded border font-mono text-sm font-bold ${getBarColor(score)} ${getTextColor(score)}`}>
            Score: {score}
          </div>
        </div>
      </div>
    </div>
  );
};