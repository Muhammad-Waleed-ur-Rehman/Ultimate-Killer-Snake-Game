/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CumulativeStats, Achievement } from '../types';
import { Trophy, Clock, Flame, Award, Trash2, TrendingUp, BarChart2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';

interface StatsDashboardProps {
  stats: CumulativeStats;
  achievements: Achievement[];
  onResetStats: () => void;
  onClose: () => void;
}

export default function StatsDashboard({
  stats,
  achievements,
  onResetStats,
  onClose
}: StatsDashboardProps) {

  const formatPlaytime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  const getUnlockedCount = () => {
    return achievements.filter(a => a.unlocked).length;
  };

  // Generate SVG Line chart points for recent 10 scores
  const renderScoreTrendChart = () => {
    const scores = stats.scoreHistory && stats.scoreHistory.length > 0 ? stats.scoreHistory : [0];
    const maxScore = Math.max(...scores, 50);
    const chartHeight = 120;
    const chartWidth = 360;
    const padding = 15;

    const points = scores.map((sc, i) => {
      const x = padding + (i / Math.max(1, scores.length - 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - (sc / maxScore) * (chartHeight - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Score History Trend</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Max: {maxScore} pts</span>
        </div>

        {scores.length === 1 && scores[0] === 0 ? (
          <div className="h-24 flex items-center justify-center text-xs text-slate-500 font-mono">
            No games logged yet. Play a match to seed the trend!
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[280px] h-28 overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#1e293b" strokeWidth="1" />

              {/* Shaded Area */}
              {scores.length > 1 && (
                <path
                  d={`M ${padding},${chartHeight - padding} L ${points} L ${chartWidth - padding},${chartHeight - padding} Z`}
                  fill="url(#chartGrad)"
                />
              )}

              {/* Line */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dot Markers */}
              {scores.map((sc, i) => {
                const x = padding + (i / Math.max(1, scores.length - 1)) * (chartWidth - padding * 2);
                const y = chartHeight - padding - (sc / maxScore) * (chartHeight - padding * 2);
                return (
                  <g key={i} className="hover:scale-125 transition-all">
                    <circle cx={x} cy={y} r="4.5" fill="#1e1b4b" stroke="#10B981" strokeWidth="2.5" />
                    <title>{`Game ${i + 1}: ${sc} pts`}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 select-none animate-fade-in" id="stats-modal-root">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 max-h-[90vh] overflow-y-auto flex flex-col gap-6"
      >
        {/* TITLE PANEL */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/15 border border-indigo-500/25 rounded-2xl">
              <Trophy className="w-6 h-6 text-indigo-400 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white leading-none">ARCADE STATISTICS</h2>
              <p className="text-xs text-slate-400 mt-1">Unlock badges, track improvements, and view cumulative stats.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl text-xs font-bold border border-slate-800 cursor-pointer transition select-none"
          >
            Back Menu
          </button>
        </div>

        {/* STATS GENERAL GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Games Played', value: stats.gamesPlayed, icon: <Flame className="w-4 h-4 text-orange-400" /> },
            { label: 'Total Eaten', value: stats.totalFoodEaten, icon: <Award className="w-4 h-4 text-emerald-400" /> },
            { label: 'Time Invested', value: formatPlaytime(stats.totalPlaytime), icon: <Clock className="w-4 h-4 text-sky-400" /> },
            { label: 'High Record', value: `${stats.highestScore} pts`, icon: <Trophy className="w-4 h-4 text-amber-400" /> }
          ].map((st, idx) => (
            <div key={idx} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex flex-col gap-1 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{st.label}</span>
                {st.icon}
              </div>
              <span className="text-lg font-black text-white font-mono mt-1">{st.value}</span>
            </div>
          ))}
        </div>

        {/* MIDDLE SECTION: CHART + COMPARISONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            {renderScoreTrendChart()}
          </div>
          {/* Average efficiency info card */}
          <div className="bg-gradient-to-tr from-indigo-950/40 to-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3 relative">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">Average Match Efficiency</span>
            <div className="space-y-1">
              <span className="text-3xl font-black text-white font-mono">{stats.averageScore}</span>
              <span className="text-[10px] text-slate-400 block font-sans">Points averaged across all historic runs.</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold">Achievements:</span>
              <span className="font-extrabold text-[#10B981]">{getUnlockedCount()}/{achievements.length} Unlocked</span>
            </div>
          </div>
        </div>

        {/* ACHIEVEMENTS BLOCK GRID */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 px-1">
            <Award className="w-4 h-4 text-pink-400" />
            <span>TROPHY BADGES ({getUnlockedCount()}/{achievements.length})</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((a) => {
              const bgClass = a.unlocked 
                ? 'bg-[#10B981]/5 border-[#10B981]/25 border' 
                : 'bg-slate-950/20 border-slate-850 border opacity-60';
              const iconClass = a.unlocked 
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' 
                : 'bg-slate-900 border-slate-800 text-slate-600';
              
              return (
                <div
                  key={a.id}
                  className={`flex gap-3.5 p-3 rounded-2xl items-center transition-all ${bgClass}`}
                >
                  <div className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center font-bold text-xl ${iconClass}`}>
                    {a.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-white block">{a.title}</span>
                      {a.unlocked && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1 rounded">UNLOCKED</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate mt-0.5">{a.description}</span>
                    <span className="text-[9px] text-indigo-400 font-mono block mt-0.5">{a.requirement}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DANGEROUS RESET SECTION */}
        <div className="pt-4 border-t border-slate-850 flex flex-col sm:flex-row gap-3 justify-between items-center select-none">
          <p className="text-[10px] text-slate-500 text-center sm:text-left">
            Your milestones and stats are stored safely right in your browser's Local Storage sandbox.
          </p>
          <button
            onClick={() => {
              if (confirm('Are you absolutely sure you want to hard reset all achievements and history? This operation cannot be undone.')) {
                onResetStats();
              }
            }}
            className="py-2.5 px-3.5 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 transition flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset History</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
