/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameMode, SpeedPreset } from '../types';

export interface DailyChallenge {
  id: string;
  dateStr: string;
  title: string;
  description: string;
  mode: GameMode;
  speed: SpeedPreset;
  wallWrap: boolean;
  targetScore: number;
  timeLimit: number;
  noWallHit: boolean;
  isCompleted: boolean;
}

function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailyChallenge(targetDate?: Date): DailyChallenge {
  const d = targetDate || new Date();
  
  // Create a UTC date representation so it is consistent and uniform worldwide
  const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  const hash = getHash(dateStr);

  const templates = [
    {
      title: 'NEON GRID INFILTRATION',
      mode: 'classic' as GameMode,
      speed: 'normal' as SpeedPreset,
      wallWrap: false,
      baseScoreToReach: 40,
      baseTimeLimit: 60,
      noWallHit: true,
      description: 'Score {targetScore} points in under {timeLimit} seconds on Classic mode without hitting walls.'
    },
    {
      title: 'CYBER VECTOR RUSH',
      mode: 'endless' as GameMode,
      speed: 'fast' as SpeedPreset,
      wallWrap: true,
      baseScoreToReach: 60,
      baseTimeLimit: 50,
      noWallHit: false,
      description: 'Score {targetScore} points in under {timeLimit} seconds on Fast Endless mode.'
    },
    {
      title: 'TIME-CRITICAL SYNC',
      mode: 'timed' as GameMode,
      speed: 'normal' as SpeedPreset,
      wallWrap: false,
      baseScoreToReach: 35,
      baseTimeLimit: 45,
      noWallHit: true,
      description: 'Score {targetScore} points in under {timeLimit} seconds on Timed mode without hitting walls.'
    },
    {
      title: 'MAZE BREACH CODE',
      mode: 'maze' as GameMode,
      speed: 'normal' as SpeedPreset,
      wallWrap: false,
      baseScoreToReach: 30,
      baseTimeLimit: 65,
      noWallHit: true,
      description: 'Score {targetScore} points on Maze mode under {timeLimit} seconds without hitting active barriers.'
    },
    {
      title: 'INSANE INTENSITY RUN',
      mode: 'classic' as GameMode,
      speed: 'insane' as SpeedPreset,
      wallWrap: true,
      baseScoreToReach: 40,
      baseTimeLimit: 45,
      noWallHit: false,
      description: 'Collect {targetScore} points at INSANE speed with Wall Wrap active in under {timeLimit} seconds.'
    },
    {
      title: 'BIOS THREAT ENGAGEMENT',
      mode: 'survival' as GameMode,
      speed: 'normal' as SpeedPreset,
      wallWrap: false,
      baseScoreToReach: 30,
      baseTimeLimit: 55,
      noWallHit: true,
      description: 'Withstand the hazard fields and score {targetScore} points in under {timeLimit} seconds on Survival mode.'
    },
    {
      title: 'MATRIX BOSS PURSUIT',
      mode: 'boss' as GameMode,
      speed: 'fast' as SpeedPreset,
      wallWrap: false,
      baseScoreToReach: 45,
      baseTimeLimit: 75,
      noWallHit: true,
      description: 'Beat rogue programs to score {targetScore} points on Boss mode in under {timeLimit} seconds without wall crashing.'
    },
    {
      title: 'GRIDRUN TELEMETRY',
      mode: 'speedrun' as GameMode,
      speed: 'insane' as SpeedPreset,
      wallWrap: false,
      baseScoreToReach: 20,
      baseTimeLimit: 40,
      noWallHit: true,
      description: 'Score {targetScore} points (nodes) in under {timeLimit} seconds at INSANE speed without hitting boundaries.'
    }
  ];

  const templateIndex = hash % templates.length;
  const temp = templates[templateIndex];

  // Derive customized targets based on the specific day hash to add variety
  const factor = (hash % 5) + 1; // 1 to 5 multiplier offset
  const scoreOffset = factor * 5;
  const timeOffset = (hash % 3) * 5;

  const targetScore = temp.baseScoreToReach + scoreOffset;
  const timeLimit = temp.baseTimeLimit + timeOffset;

  const description = temp.description
    .replace('{targetScore}', String(targetScore))
    .replace('{timeLimit}', String(timeLimit));

  // Determine completions in localStorage
  let isCompleted = false;
  try {
    const completedChallenges = JSON.parse(localStorage.getItem('ultimate_snake_completed_dailies') || '{}');
    isCompleted = !!completedChallenges[dateStr];
  } catch (e) {
    console.error(e);
  }

  return {
    id: `daily_${dateStr}`,
    dateStr,
    title: temp.title,
    description,
    mode: temp.mode,
    speed: temp.speed,
    wallWrap: temp.wallWrap,
    targetScore,
    timeLimit,
    noWallHit: temp.noWallHit,
    isCompleted
  };
}

export function saveDailyChallengeCompletion(dateStr: string): void {
  try {
    const completedChallenges = JSON.parse(localStorage.getItem('ultimate_snake_completed_dailies') || '{}');
    completedChallenges[dateStr] = true;
    localStorage.setItem('ultimate_snake_completed_dailies', JSON.stringify(completedChallenges));
  } catch (e) {
    console.error(e);
  }
}
