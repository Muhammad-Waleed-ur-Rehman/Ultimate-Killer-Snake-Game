/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GameMode, SpeedPreset, Language, ScoreEntry } from '../types';
import { Play, Trophy, Settings, Download, Volume2, Shield, Flame, Star, Compass, AlertOctagon, Award, Clock, Target, Calendar, CheckSquare } from 'lucide-react';
import { TRANSLATIONS } from '../utils/lang';
import { getDailyChallenge, DailyChallenge } from '../utils/dailyChallenge';
import React from 'react';

interface SetupScreenProps {
  onStartGame: (mode: GameMode, speed: SpeedPreset, wrap: boolean) => void;
  onStartDailyChallenge: (challenge: DailyChallenge) => void;
  onOpenSettings: () => void;
  onOpenTutorial: () => void;
  highScores: ScoreEntry[];
  language: Language;
}

export default function SetupScreen({
  onStartGame,
  onStartDailyChallenge,
  onOpenSettings,
  onOpenTutorial,
  highScores,
  language
}: SetupScreenProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [selectedSpeed, setSelectedSpeed] = useState<SpeedPreset>('normal');
  const [wallWrap, setWallWrap] = useState<boolean>(false);
  const [dailyCh, setDailyCh] = useState<DailyChallenge | null>(null);

  useEffect(() => {
    setDailyCh(getDailyChallenge());
  }, []);

  // PWA installation prompt helpers
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check standalone PWA container
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePwaInstall = async () => {
    if (!pwaPrompt) {
      alert('PWA installation is either already complete or not supported in this browser. You can install it via the browser address bar option!');
      return;
    }
    pwaPrompt.prompt();
    const result = await pwaPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setPwaPrompt(null);
    }
  };

  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  // Get PB specifically for the selected game mode
  const modeScores = highScores.filter(s => s.mode === selectedMode).sort((a,b) => b.score - a.score);
  const personalBest = modeScores[0]?.score || 0;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 items-stretch select-none py-2 animate-fade-in" id="main-menu-container">
      
      {/* LEFT COLUMN: CORE GAME MODES SELECTION & LAUNCH BUTTONS */}
      <div className="flex-1 bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-2xl flex flex-col justify-between gap-6 relative overflow-hidden">
        {/* Glow graphics */}
        <div className="absolute top-[-80px] left-[-85px] w-48 h-48 bg-indigo-550/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[-85px] w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* LOGO */}
        <div className="flex flex-col items-center text-center gap-1.5 relative z-10">
          <div className="w-16 h-16 relative flex items-center justify-center bg-slate-950/70 p-2 rounded-full border border-slate-850 shadow-inner">
            <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse">
              <path
                d="M 20 50 C 20 20, 80 20, 80 50 C 80 80, 50 80, 50 50 C 50 40, 20 40, 31 65"
                fill="none"
                stroke="url(#snakeGrad1)"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="snakeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.85" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="7.5" fill="#EF4444" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent uppercase">
            {t('title')}
          </h1>
          <p className="text-[10px] uppercase font-mono tracking-widest text-slate-550 mt-1 flex items-center gap-1">
            <span>📡 ARCADE ENGINE V2.5</span>
            <span className="text-emerald-500">● ONLINE BUILD</span>
          </p>
        </div>

        {/* 7 GAMEPLAY PLAYGROUNDS LIST GRIDS */}
        <div className="space-y-2 relative z-10">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
            Select Arcade Simulation Program:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {[
              { id: 'classic', icon: '🍎', border: 'border-emerald-500/20 hover:border-emerald-500/50' },
              { id: 'endless', icon: '♾️', border: 'border-indigo-500/20 hover:border-indigo-500/50' },
              { id: 'timed', icon: '⏱️', border: 'border-amber-500/20 hover:border-amber-500/50' },
              { id: 'survival', icon: '🔥', border: 'border-red-500/20 hover:border-red-500/50' },
              { id: 'maze', icon: '🧱', border: 'border-blue-500/20 hover:border-blue-500/50' },
              { id: 'speedrun', icon: '🏎️', border: 'border-cyan-500/20 hover:border-cyan-500/50' },
              { id: 'boss', icon: '👾', border: 'border-pink-500/20 hover:border-pink-500/50' }
            ].map((modeItem) => (
              <button
                key={modeItem.id}
                onClick={() => setSelectedMode(modeItem.id as GameMode)}
                className={`flex flex-col text-left p-3 rounded-xl border bg-slate-950/45 transition-all text-xs cursor-pointer ${modeItem.border} ${
                  selectedMode === modeItem.id ? 'ring-2 ring-indigo-500/50 border-indigo-500 bg-indigo-900/10' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <span>{modeItem.icon}</span>
                    <span>{t(modeItem.id)}</span>
                  </span>
                  {selectedMode === modeItem.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </div>
                <span className="text-[9px] text-slate-400 leading-normal line-clamp-2">
                  {t(`${modeItem.id}_desc`)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* DIFFICULTY & WRAP CONTROLS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10 bg-slate-950/50 p-3 rounded-2xl border border-slate-850">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">
              {t('game_speed')}
            </span>
            <div className="flex gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              {(['slow', 'normal', 'fast', 'insane'] as SpeedPreset[]).map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSelectedSpeed(sp)}
                  className={`flex-1 py-1 text-[9px] uppercase font-bold rounded transition cursor-pointer ${
                    selectedSpeed === sp ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-slate-205'
                  }`}
                >
                  {t(`speed_${sp}`).split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">
              {t('wall_wrap')}
            </span>
            <button
              onClick={() => setWallWrap(!wallWrap)}
              className={`w-full py-1.5 rounded-lg text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                wallWrap ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wallWrap ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{wallWrap ? t('wall_wrap_on') : t('wall_wrap_off')}</span>
            </button>
          </div>
        </div>

        {/* CORE BIG LAUNCH BUTTON */}
        <div className="relative z-10">
          <button
            onClick={() => onStartGame(selectedMode, selectedSpeed, wallWrap)}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-550 to-indigo-600 hover:from-emerald-405 hover:to-indigo-505 text-white font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            <span>Launch Simulation ({t(selectedMode)})</span>
          </button>
        </div>

        {/* PWA INSTALL ACTION */}
        {!isInstalled && pwaPrompt && (
          <button
            onClick={handlePwaInstall}
            className="w-full py-2 bg-indigo-505/10 hover:bg-indigo-505/20 text-indigo-305 border border-indigo-555 text-[10px] font-bold tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('install_app')}</span>
          </button>
        )}
      </div>

      {/* RIGHT COLUMN: TROPHIES & SAVED HIGHLIGHT COILS */}
      <div className="w-full lg:w-72 flex flex-col gap-6 items-stretch select-none shrink-0">
        
        {/* DAILY CHALLENGE DISPATCH CARD */}
        {dailyCh && (
          <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden flex flex-col justify-between gap-4 text-xs ${
            dailyCh.isCompleted 
              ? 'bg-gradient-to-br from-emerald-950/70 to-slate-900 border-emerald-500/35 text-slate-300' 
              : 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-pink-500/35 text-slate-300'
          }`} id="daily-challenge-sidebar-card">
            <div className="absolute right-[-15px] bottom-[-15px] text-7xl opacity-10 rotate-12 pointer-events-none">⚡</div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-slate-400">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${dailyCh.isCompleted ? 'bg-emerald-400' : 'bg-pink-500 animate-pulse'}`} />
                  Daily Dispatch Sync
                </span>
                <span className="text-slate-500 font-mono flex items-center gap-0.5">
                  <Calendar className="w-2.5 h-2.5" /> {dailyCh.dateStr}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-black text-white">
                <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent uppercase font-black max-w-[160px] truncate">
                  {dailyCh.title}
                </span>
                {dailyCh.isCompleted ? (
                  <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-black font-mono">
                    DONE
                  </span>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded font-black font-mono animate-pulse">
                    OPEN
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] font-medium text-slate-350 leading-normal border-l-2 border-indigo-500/40 pl-2.5">
              {dailyCh.description}
            </p>

            {/* Quick Metrics Badge row */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-mono uppercase bg-slate-950/50 p-2 rounded-xl border border-slate-850">
              <div className="flex flex-col">
                <span className="text-slate-500 font-bold">MODE</span>
                <span className="text-indigo-305 font-extrabold truncate">{dailyCh.mode}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-bold">SPEED</span>
                <span className="text-amber-405 font-extrabold">{dailyCh.speed}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-500 font-bold">WRAP</span>
                <span className={dailyCh.wallWrap ? 'text-emerald-405 font-extrabold' : 'text-rose-405 font-extrabold'}>
                  {dailyCh.wallWrap ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onStartDailyChallenge(dailyCh)}
              className={`w-full py-2 px-4 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer uppercase ${
                dailyCh.isCompleted
                  ? 'bg-slate-950/80 hover:bg-slate-850 text-emerald-405 border border-emerald-500/20 hover:border-emerald-500/50'
                  : 'bg-gradient-to-r from-pink-550 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-950/30'
              }`}
              id="start-daily-challenge-btn"
            >
              <Award className="w-3.5 h-3.5 fill-none" />
              <span>{dailyCh.isCompleted ? 'Replay Challenge' : 'Engage Gateway Run'}</span>
            </button>
          </div>
        )}

        {/* PERSONAL COILS PB HIGHLIGHTS */}
        <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white p-5 rounded-3xl shadow-xl border border-indigo-600/35 relative overflow-hidden flex flex-col justify-between gap-3 text-xs">
          <div className="absolute right-[-10px] bottom-[-10px] text-6xl opacity-15 rotate-12 pointer-events-none">✨</div>
          
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-200 block">Personal Best Highlight</span>
            <div className="flex justify-between items-center text-sm font-extrabold text-white">
              <span className="capitalize">{selectedMode} Mode Record</span>
              <Star className="w-4 h-4 text-amber-305 fill-amber-305" />
            </div>
          </div>

          <div className="bg-indigo-950/60 p-3 rounded-2xl border border-indigo-800/40 flex justify-between items-center bg-slate-950/30">
            <div>
              <span className="text-[9px] uppercase text-indigo-200 font-bold block">HighScore</span>
              <span className="font-extrabold text-xl text-white font-mono leading-none">
                {personalBest} <span className="text-[10px] font-normal opacity-70">pts</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-indigo-200 block font-bold leading-none uppercase">Length</span>
              <span className="font-mono font-black text-white text-sm">
                {modeScores[0]?.length || 2} <span className="text-[9px] font-normal">nodes</span>
              </span>
            </div>
          </div>

          <button
            onClick={onOpenTutorial}
            className="w-full py-1.5 bg-white hover:bg-slate-100 text-indigo-900 text-[10px] font-black rounded-lg transition shadow cursor-pointer text-center select-none"
          >
            Play How-to-Play Guide
          </button>
        </div>

        {/* HIGH SCORES TABLE */}
        <div className="bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 border border-slate-800 shadow-xl flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs font-bold text-white uppercase. pb-2 border-b border-slate-850">
            <h3 className="flex items-center gap-1.5 text-xs font-black">
              <Trophy className="w-3.5 h-3.5 text-amber-450" />
              <span>{t('high_scores')}</span>
            </h3>
            <span className="text-[8px] font-bold uppercase py-0.5 px-2 bg-slate-950 border border-slate-800 rounded">
              {selectedMode}
            </span>
          </div>

          {modeScores.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-slate-400">
              <span className="text-2xl mb-1">🏁</span>
              <p className="text-[10px] font-semibold">
                No high scores stored. Be the first to rule!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
              {modeScores.slice(0, 4).map((score, idx) => (
                <div
                  key={score.id || idx}
                  className="flex items-center justify-between p-2 bg-slate-950/65 rounded-lg border border-slate-850 text-[11px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-indigo-400 font-mono w-3.5">#{idx + 1}</span>
                    <span className="text-white font-semibold truncate max-w-[80px]">{score.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-white font-bold block">{score.score} <span className="opacity-50 text-[9px]">pts</span></span>
                    <span className="text-[8px] text-slate-500 font-mono">{score.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <hr className="border-slate-850" />

          {/* QUICK BUTTONS */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <button
              onClick={onOpenSettings}
              className="py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-1 cursor-pointer select-none"
            >
              <Settings className="w-3 h-3 text-slate-400" />
              <span>Config Center</span>
            </button>
            <button
              onClick={() => window.open('https://ko-fi.com', '_blank')}
              className="py-1.5 bg-slate-955 hover:bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-300 hover:text-indigo-200 transition flex items-center justify-center gap-1 cursor-pointer select-none"
            >
              <span>💝 Support</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
