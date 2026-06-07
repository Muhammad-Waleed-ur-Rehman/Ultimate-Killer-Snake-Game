/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FoodType, PowerUpType } from '../types';

let audioCtx: AudioContext | null = null;
let musicGainNode: GainNode | null = null;
let musicIntervalId: any = null;
let currentBeat = 0;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Ensure the context is loaded on an interaction
export function initAudio() {
  getAudioContext();
}

/**
 * 8-bit synthesizer for Snake game actions
 */

export function playEatSound(type: FoodType, volumePercent: number) {
  if (volumePercent === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const gainVal = (volumePercent / 100) * 0.15;
  const now = ctx.currentTime;

  if (type === 'STANDARD') {
    // Quick upward bounce blip
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } else if (type === 'GOLDEN') {
    // Beautiful chiptune sparkle scale
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio (C5, E5, G5, C6)
    const noteTime = 0.05;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * noteTime);

      gain.gain.setValueAtTime(gainVal * 1.5, now + idx * noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * noteTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * noteTime);
      osc.stop(now + idx * noteTime + 0.15);
    });
  } else if (type === 'SPEED_BOOST') {
    // Zeeeewww laser charge sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.25);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);

    gain.gain.setValueAtTime(gainVal * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'SLOW_DOWN') {
    // Deep downward slide
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.3);

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'BONUS_FRUIT') {
    // Ringing star double bell chime
    [0, 0.08].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + offset); // A5

      gain.gain.setValueAtTime(gainVal * 1.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  }
}

export function playPowerupCollect(type: PowerUpType, volumePercent: number) {
  if (volumePercent === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const gainVal = (volumePercent / 100) * 0.15;
  const now = ctx.currentTime;

  if (type === 'SHIELD') {
    // Shimmering bubble shields chord
    const notes = [329.63, 440.00, 554.37, 659.25]; // A Major chords (E4, A4, C#5, E5)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(gainVal * 0.7, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.4);
    });
  } else if (type === 'MULTIPLIER') {
    // Energetic ascending futuristic sweep
    const notes = [440.00, 880.00, 1760.00];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(gainVal * 0.6, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now + idx * 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  } else if (type === 'SHRINK') {
    // Cartoonish squeak or bubble-drop slide down
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    gain.gain.setValueAtTime(gainVal * 1.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export function playTurnSound(volumePercent: number) {
  if (volumePercent === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const gainVal = (volumePercent / 100) * 0.03; // extremely subtle
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(120, now);

  gain.gain.setValueAtTime(gainVal, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.02);
}

export function playLevelUpSound(volumePercent: number) {
  if (volumePercent === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const gainVal = (volumePercent / 100) * 0.12;
  const now = ctx.currentTime;

  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
  const totalDuration = 0.5;
  const noteDur = totalDuration / notes.length;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * noteDur);

    gain.gain.setValueAtTime(gainVal, now + idx * noteDur);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * noteDur);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * noteDur);
    osc.stop(now + (idx + 1) * noteDur);
  });
}

export function playGameOverSound(volumePercent: number) {
  if (volumePercent === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const gainVal = (volumePercent / 100) * 0.12;
  const now = ctx.currentTime;

  // Retro pitch-slide down
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(60, now + 0.8);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, now);

  gain.gain.setValueAtTime(gainVal, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.8);
}

export function playShieldBreakSound(volumePercent: number) {
  if (volumePercent === 0) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const gainVal = (volumePercent / 100) * 0.15;
  const now = ctx.currentTime;

  // Glass shatter (random quick high frequencies)
  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500 + Math.random() * 2000, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);

    gain.gain.setValueAtTime(gainVal * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }
}

/**
 * Procedural Generated Chiptune Background Music (BGM) Sequencer
 */

export function startBGM(volumePercent: number) {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopBGM(); // stop any active first

  // Setup master music volumes
  musicGainNode = ctx.createGain();
  setBGMVolume(volumePercent);
  musicGainNode.connect(ctx.destination);

  // Play beats clock (140BPM = 428ms per beat step, let's play arpeggios on sixteenths or eighths)
  const beatTime = 0.25; // 250ms per step
  currentBeat = 0;

  // Chord progression chords (bass & leading arpeggio)
  // Am, F, C, G
  const baseFreqs = [110.00, 87.31, 130.81, 98.00]; // A2, F2, C3, G2
  const leadScales = [
    [220.00, 261.63, 329.63, 440.00], // Am: A3, C4, E4, A4
    [174.61, 220.00, 261.63, 349.23], // F: F3, A3, C4, F4
    [261.63, 329.63, 392.00, 523.25], // C: C4, E4, G4, C5
    [196.00, 246.94, 293.66, 392.00], // G: G3, B3, D4, G4
  ];

  musicIntervalId = setInterval(() => {
    const context = getAudioContext();
    if (!context || !musicGainNode || context.state === 'suspended') return;

    const tick = currentBeat % 16;
    const chordIndex = Math.floor(currentBeat / 4) % 4; // switches chords every 4 beats
    const scale = leadScales[chordIndex];
    const n = context.currentTime;

    // 1. Gentle continuous bass on beat 0 and 2
    if (tick % 4 === 0) {
      const bassOsc = context.createOscillator();
      const bassGain = context.createGain();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(baseFreqs[chordIndex], n);

      bassGain.gain.setValueAtTime(0.08, n);
      bassGain.gain.exponentialRampToValueAtTime(0.001, n + 0.8);

      bassOsc.connect(bassGain);
      bassGain.connect(musicGainNode);
      bassOsc.start(n);
      bassOsc.stop(n + 0.8);
    }

    // 2. Chiptune arpeg notes (rhythmically bouncy)
    const arpNum = tick % 4;
    const freq = scale[arpNum];

    // Only play some arp notes on beat steps to make it song-like and relaxing
    const pattern = [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0];
    if (pattern[tick] === 1) {
      const arpOsc = context.createOscillator();
      const arpGain = context.createGain();

      arpOsc.type = 'triangle';
      arpOsc.frequency.setValueAtTime(freq, n);

      arpGain.gain.setValueAtTime(0.035, n);
      arpGain.gain.exponentialRampToValueAtTime(0.001, n + 0.22);

      arpOsc.connect(arpGain);
      arpGain.connect(musicGainNode);
      arpOsc.start(n);
      arpOsc.stop(n + 0.22);
    }

    currentBeat++;
  }, 235); // rhythmic beat interval
}

export function stopBGM() {
  if (musicIntervalId) {
    clearInterval(musicIntervalId);
    musicIntervalId = null;
  }
  if (musicGainNode) {
    try {
      musicGainNode.disconnect();
    } catch (e) {}
    musicGainNode = null;
  }
}

export function setBGMVolume(volumePercent: number) {
  if (musicGainNode) {
    const vol = (volumePercent / 100) * 0.4;
    musicGainNode.gain.setValueAtTime(vol, getAudioContext()?.currentTime || 0);
  }
}
