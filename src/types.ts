/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'classic' | 'endless' | 'timed' | 'survival' | 'maze' | 'speedrun' | 'boss';

export type SnakeSkin = 'classic' | 'neon' | 'gradient' | 'rainbow' | 'outline' | 'fire' | 'ice' | 'robot' | 'dragon';

export type BoardTheme = 'default' | 'grid' | 'retro' | 'dark' | 'high-contrast' | 'pastel' | 'cyberpunk' | 'space' | 'jungle' | 'ocean' | 'desert';

export type ControlScheme = 'swipe' | 'dpad' | 'onetap' | 'keyboard';

export type SpeedPreset = 'slow' | 'normal' | 'fast' | 'insane';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type FoodType = 'STANDARD' | 'GOLDEN' | 'SPEED_BOOST' | 'SLOW_DOWN' | 'BONUS_FRUIT';

export type PowerUpType = 'SHIELD' | 'MULTIPLIER' | 'SHRINK';

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface Position {
  x: number;
  y: number;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  type: FoodType;
  timer?: number; // expiry timestamp for temporary foods
  initialDuration?: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  timer?: number; // expiry timestamp
  initialDuration?: number;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  isMoving?: boolean;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  speed?: number; // relative cells per cycle
  dx?: number;
  dy?: number;
}

export interface GameSettings {
  wallWrap: boolean;
  snakeSkin: SnakeSkin;
  boardTheme: BoardTheme;
  controlScheme: ControlScheme;
  speedPreset: SpeedPreset;
  vibration: boolean;
  soundVol: number; // 0 to 100
  musicVol: number; // 0 to 100
  language: Language;
  
  // Advanced Gameplay Customizations
  customStartingLength: number;
  customFoodSpawnRate: number; // 1 to 5
  customObstacleDensity: number; // 0 to 5
  customSelfCollision: boolean;
  customWallCollision: boolean;

  // Accessibility & Visual Settings
  colorBlindMode: ColorBlindMode;
  largeUI: boolean;
  biggerFood: boolean;
  disableShake: boolean;
  reduceAnimations: boolean;

  // Sound Config
  masterVolume: number;
  effectsVolume: number;
  voiceAssistant: boolean;
}

export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  length: number;
  mode: GameMode;
  date: string;
}

export interface ReplayFrame {
  snake: Position[];
  direction: Direction;
  foods: Food[];
  powerups: PowerUp[];
  multiplierActive: boolean;
  shieldActive: boolean;
}

export interface CumulativeStats {
  gamesPlayed: number;
  totalFoodEaten: number;
  totalPlaytime: number; // cumulative in seconds
  highestScore: number;
  averageScore: number;
  modesPlayed: Record<string, number>;
  scoreHistory: number[]; // track recent 10 scores
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  requirement: string;
  unlocked: boolean;
  unlockedAt?: string;
  icon: string;
}

export interface AICoachReport {
  reactionScore: number; // 0-100%
  pathEfficiency: number; // 0-100%
  riskLevel: 'Low' | 'Medium' | 'High' | 'Insane';
  coachAdvice: string[];
}
