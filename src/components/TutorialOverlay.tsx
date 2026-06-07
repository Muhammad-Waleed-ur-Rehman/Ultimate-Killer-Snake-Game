/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Sparkles, Star, Shield, HelpCircle, Gamepad2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../utils/lang';

interface TutorialOverlayProps {
  onClose: () => void;
  language: Language;
}

export default function TutorialOverlay({ onClose, language }: TutorialOverlayProps) {
  const [step, setStep] = useState<number>(1);

  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const steps = [
    {
      title: t('tut_step_1_title') || '1. Swipe or Tap to Steer',
      description: t('tut_step_1_desc') || 'Swipe anywhere, use the on-screen D-Pad, or set One-Tap relative controls in Settings to turn your snake.',
      icon: <Gamepad2 className="w-10 h-10 text-cyan-400" />,
      badge: 'STEER CONTROLS',
    },
    {
      title: t('tut_step_2_title') || '2. Eat to Grow & Bonus Foods',
      description: t('tut_step_2_desc') || 'Eat Red Apples to grow. Collect Golden Apples, Lightning speeds, Turtle slows, or Star double-scores!',
      icon: <Star className="w-10 h-10 text-amber-400 fill-amber-400" />,
      badge: 'FRUIT EATING',
    },
    {
      title: t('tut_step_3_title') || '3. Unleash Shield Power-Ups',
      description: t('tut_step_3_desc') || 'Collect Shields for one-time protection from crashes, ×2 Multipliers, or Shrink tails to shorten length!',
      icon: <Shield className="w-10 h-10 text-blue-400" />,
      badge: 'POWER-UPS',
    },
    {
      title: t('tut_step_4_title') || '4. Avoid Walls and Barriers',
      description: t('tut_step_4_desc') || 'In Advanced mode, navigate around solid obstacles. Crashing terminates the game unless you have a Shield active.',
      icon: <HelpCircle className="w-10 h-10 text-rose-400" />,
      badge: 'AVOID CRASHES',
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 text-center relative overflow-hidden"
      >
        {/* Progress dots bar in header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx + 1 === step ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big visual icon frame */}
        <div className="mb-4 h-24 flex items-center justify-center relative">
          <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800 shadow-inner">
            {currentStep.icon}
          </div>
          <span className="absolute top-0 right-[25%] px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-[9px] font-black tracking-widest text-indigo-400 rounded-full">
            {currentStep.badge}
          </span>
        </div>

        {/* Content body with micro animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 mb-6"
          >
            <h3 className="text-xl font-black text-white px-2">
              {currentStep.title}
            </h3>
            <p className="text-xs text-slate-400 px-3 leading-relaxed">
              {currentStep.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Nav actions footer */}
        <div className="flex justify-between items-center pt-2 select-none">
          <button
            onClick={() => setStep(prev => Math.max(1, prev - 1))}
            disabled={step === 1}
            className="py-2.5 px-4 bg-slate-950 text-slate-400 font-bold text-xs rounded-xl hover:bg-slate-850 hover:text-slate-200 border border-slate-800 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{language === 'ja' ? '前へ' : 'Previous'}</span>
          </button>

          {step < steps.length ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              className="py-2.5 px-4.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1 cursor-pointer"
            >
              <span>{language === 'ja' ? '次へ' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="py-2.5 px-5 bg-gradient-to-r from-emerald-550 to-indigo-600 hover:from-emerald-522 hover:to-indigo-522 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{language === 'ja' ? 'プレイ開始！' : 'Let\'s Play!'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
