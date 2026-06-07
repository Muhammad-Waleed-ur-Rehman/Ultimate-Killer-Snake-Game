/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameSettings, SnakeSkin, BoardTheme, ControlScheme, SpeedPreset, Language, ColorBlindMode } from '../types';
import { X, Volume2, ShieldAlert, Sparkles, Sliders, Smartphone, Languages, Compass, Award, Tv, Eye, Gamepad2, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { TRANSLATIONS } from '../utils/lang';
import React from 'react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onClose: () => void;
}

type TabType = 'aesthetics' | 'gameplay' | 'audio_access';

export default function SettingsModal({
  settings,
  onUpdateSettings,
  onClose
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('gameplay');
  
  const updateField = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  const t = (key: string) => {
    return TRANSLATIONS[settings.language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4 select-none animate-fade-in" id="settings-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 max-h-[85vh] overflow-y-auto flex flex-col gap-4"
      >
        {/* Header toolbar */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div>
            <h3 className="font-extrabold text-white text-xl flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-400 stroke-[2.5]" />
              <span>ARCADE CONTROL CENTER</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Refine gameplay rules, accessibility parameters, skins, audio, and visual boards.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-850 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TAB SWITCHERS */}
        <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-850">
          <button
            onClick={() => setActiveTab('gameplay')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'gameplay' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Gameplay Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('aesthetics')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'aesthetics' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Skins & Cosmetics</span>
          </button>
          <button
            onClick={() => setActiveTab('audio_access')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'audio_access' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Audio & Accessibility</span>
          </button>
        </div>

        {/* Configurations fields based on Active Tab */}
        <div className="flex-1 space-y-5 py-2">

          {/* TAB 1: GAMEPLAY CONCURRENCY & PARAMETERS */}
          {activeTab === 'gameplay' && (
            <div className="space-y-4 animate-fade-in">

              {/* 1.1 STEERING CONTROL SCHEME */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direction Control Layout</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'swipe', name: 'Swipe Gestures', icon: '🖐️' },
                    { id: 'dpad', name: 'Virtual D-pad', icon: '🎮' },
                    { id: 'onetap', name: 'One-Tap Turns', icon: '👇' },
                    { id: 'keyboard', name: 'Retro WASD / Arrows', icon: '⌨️' }
                  ].map((ctrl) => (
                    <button
                      key={ctrl.id}
                      onClick={() => updateField('controlScheme', ctrl.id as ControlScheme)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition cursor-pointer select-none ${
                        settings.controlScheme === ctrl.id
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-lg">{ctrl.icon}</span>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white block truncate leading-tight">{ctrl.name}</span>
                        <span className="text-[9px] text-slate-500 font-mono capitalize">{ctrl.id} Layout</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 1.2 DYNAMIC CUSTOM SLIDERS */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                  <span className="text-xs font-black text-white uppercase">Parametric Sliders</span>
                  <span className="text-[10px] text-slate-500">Fine-grain engine multipliers</span>
                </div>

                {/* Snake speed preset controller */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold">Speed Preset (Baseline tick refresh)</span>
                    <span className="font-mono text-indigo-400 font-bold uppercase">{settings.speedPreset}</span>
                  </div>
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {(['slow', 'normal', 'fast', 'insane'] as SpeedPreset[]).map((sp) => (
                      <button
                        key={sp}
                        onClick={() => updateField('speedPreset', sp)}
                        className={`flex-1 py-1 text-[9px] uppercase font-bold rounded-lg transition cursor-pointer ${
                          settings.speedPreset === sp ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom starting snake segments */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Starting Body Length</span>
                    <span className="font-mono text-white text-[11px] font-bold">{settings.customStartingLength} segments</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={settings.customStartingLength}
                    onChange={(e) => updateField('customStartingLength', parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Food Amount multiplier */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Max Active Food Spawns</span>
                    <span className="font-mono text-white text-[11px] font-bold">{settings.customFoodSpawnRate} apples</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={settings.customFoodSpawnRate}
                    onChange={(e) => updateField('customFoodSpawnRate', parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Obstacle Density multiplier */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Hazard Obstacle Density</span>
                    <span className="font-mono text-white text-[11px] font-bold">{settings.customObstacleDensity} level</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={settings.customObstacleDensity}
                    onChange={(e) => updateField('customObstacleDensity', parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* 1.3 INJURY CRASH RULES DEFINITION */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950/20 p-3 rounded-2xl border border-slate-850">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">Self-Collision Damage</span>
                    <span className="text-[9px] text-slate-500 font-mono">Crash if hit tail</span>
                  </div>
                  <button
                    onClick={() => updateField('customSelfCollision', !settings.customSelfCollision)}
                    className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border cursor-pointer ${
                      settings.customSelfCollision ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {settings.customSelfCollision ? 'ACTIVE' : 'IMMUNE'}
                  </button>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">Wall Collision Damage</span>
                    <span className="text-[9px] text-slate-500 font-mono">Damage on boundary impact</span>
                  </div>
                  <button
                    onClick={() => updateField('customWallCollision', !settings.customWallCollision)}
                    className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border cursor-pointer ${
                      settings.customWallCollision ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {settings.customWallCollision ? 'ACTIVE' : 'IMMUNE'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: COSMETIC SKINS & BG THEMES */}
          {activeTab === 'aesthetics' && (
            <div className="space-y-4 animate-fade-in">

              {/* LANGUAGE SELECTOR */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <Languages className="w-4 h-4 text-indigo-400" />
                  <span>Choose UI Localization Language</span>
                </span>
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'es', label: 'Esp' },
                    { id: 'fr', label: 'Fra' },
                    { id: 'de', label: 'Deu' },
                    { id: 'ja', label: '日本語' }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => updateField('language', lang.id as Language)}
                      className={`py-1.5 rounded-xl text-center text-[10px] font-bold border transition cursor-pointer ${
                        settings.language === lang.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SNAKE COSMETIC SKIN */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Unlock Tail Cosmetic Style Skins</span>
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'classic', style: 'bg-emerald-650' },
                    { id: 'neon', style: 'bg-cyan-550' },
                    { id: 'gradient', style: 'bg-violet-600' },
                    { id: 'rainbow', style: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500' },
                    { id: 'outline', style: 'border-white border bg-transparent' },
                    { id: 'fire', style: 'bg-gradient-to-t from-red-600 to-amber-500 text-orange-400' },
                    { id: 'ice', style: 'bg-sky-200 text-cyan-300' },
                    { id: 'robot', style: 'bg-slate-600 border border-[#00ffcc] text-[#00ffcc]' },
                    { id: 'dragon', style: 'bg-emerald-800 border-l border-amber-400 text-amber-500' }
                  ].map((sk) => (
                    <button
                      key={sk.id}
                      onClick={() => updateField('snakeSkin', sk.id as SnakeSkin)}
                      className={`py-2 px-1 rounded-xl text-center text-[10px] font-extrabold border transition cursor-pointer capitalize flex items-center justify-center gap-1 ${
                        settings.snakeSkin === sk.id
                          ? 'bg-pink-650 border-pink-400 text-white'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${sk.style}`} />
                      <span>{sk.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* BOARD THEMES */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Cyberpunk & Classic Board Themes</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'default', label: 'Classic Board' },
                    { id: 'grid', label: 'Grid Wireframe' },
                    { id: 'retro', label: 'Retro Term' },
                    { id: 'dark', label: 'Midnight Black' },
                    { id: 'high-contrast', label: 'High Contrast' },
                    { id: 'pastel', label: 'Cute Pastel' },
                    { id: 'cyberpunk', label: '🤖 Cyber Neon' },
                    { id: 'space', label: '🌌 Black Star' },
                    { id: 'jungle', label: '🌿 Wild Moss' },
                    { id: 'ocean', label: '🌊 Blue Sea' },
                    { id: 'desert', label: '🏜️ Sandy Red' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateField('boardTheme', style.id as BoardTheme)}
                      className={`px-2 py-2 rounded-xl border text-[9px] font-bold text-center transition cursor-pointer leading-snug ${
                        settings.boardTheme === style.id
                          ? 'bg-cyan-600/15 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: AUDIO & ACCESSIBILITY CONTROLS */}
          {activeTab === 'audio_access' && (
            <div className="space-y-4 animate-fade-in">

              {/* HIGH FIDELITY AUDIO ADJUSTMENTS */}
              <div className="space-y-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Audio & Voice Assistant Volumes</span>
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Music Loops</span>
                      <span className="font-mono text-white text-[11px] font-semibold">{settings.musicVol}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.musicVol}
                      onChange={(e) => updateField('musicVol', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Sound Effects</span>
                      <span className="font-mono text-white text-[11px] font-semibold">{settings.soundVol}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.soundVol}
                      onChange={(e) => updateField('soundVol', parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs border-t border-slate-850 pt-2.5 mt-1.5">
                  <div>
                    <span className="font-bold text-white block">Coach Vocal Support</span>
                    <span className="text-[9px] text-slate-500 font-mono">Speaks critical commentary & alarms</span>
                  </div>
                  <button
                    onClick={() => updateField('voiceAssistant', !settings.voiceAssistant)}
                    className={`py-1 px-3 rounded-lg text-[10px] font-bold border cursor-pointer select-none ${
                      settings.voiceAssistant ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {settings.voiceAssistant ? 'ON' : 'MUTED'}
                  </button>
                </div>
              </div>

              {/* GAME ACCESSIBILITY ENGINE */}
              <div className="bg-slate-950/20 p-4 rounded-2xl border border-slate-850 space-y-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Colorblind & Motion Preferences</span>
                </span>

                {/* Color Blind Modes selectors */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">Color Assist Palette</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'protanopia', label: 'Protanopia' },
                      { id: 'deuteranopia', label: 'Deuteranopia' },
                      { id: 'tritanopia', label: 'Tritanopia' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => updateField('colorBlindMode', mode.id as ColorBlindMode)}
                        className={`py-1.5 text-[9px] font-bold rounded-lg uppercase border transition cursor-pointer text-center ${
                          settings.colorBlindMode === mode.id
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle accessibility controls */}
                <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block font-sans">Bigger Apples style</span>
                      <span className="text-[9px] text-slate-500">Easier object tracking</span>
                    </div>
                    <button
                      onClick={() => updateField('biggerFood', !settings.biggerFood)}
                      className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border cursor-pointer ${
                        settings.biggerFood ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]' : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {settings.biggerFood ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block font-sans">Large UI Hud Bars</span>
                      <span className="text-[9px] text-slate-500">Magnified interface size</span>
                    </div>
                    <button
                      onClick={() => updateField('largeUI', !settings.largeUI)}
                      className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border cursor-pointer ${
                        settings.largeUI ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981]' : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {settings.largeUI ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block font-sans">Disable Screen Shake</span>
                      <span className="text-[9px] text-slate-500">Stablize impact animations</span>
                    </div>
                    <button
                      onClick={() => updateField('disableShake', !settings.disableShake)}
                      className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border cursor-pointer ${
                        settings.disableShake ? 'bg-orange-500/15 border-orange-500 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {settings.disableShake ? 'STABLE' : 'SHAKY'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block font-sans">Reduce Animations</span>
                      <span className="text-[9px] text-slate-500">Lower processor overhead</span>
                    </div>
                    <button
                      onClick={() => updateField('reduceAnimations', !settings.reduceAnimations)}
                      className={`py-1 px-2.5 rounded-lg text-[9px] font-bold border cursor-pointer ${
                        settings.reduceAnimations ? 'bg-orange-500/15 border-orange-500 text-orange-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {settings.reduceAnimations ? 'REDUCED' : 'NORMAL'}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-850 justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer select-none text-center"
          >
            Apply Settings Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
