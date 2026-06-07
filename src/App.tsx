/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GameSettings,
  GameMode,
  Direction,
  Position,
  Food,
  PowerUp,
  Obstacle,
  ScoreEntry,
  ReplayFrame,
  SpeedPreset,
  Language,
  SnakeSkin,
  BoardTheme,
  ControlScheme,
  CumulativeStats,
  Achievement,
  AICoachReport
} from './types';
import { getLevelObstacles, getLevelTargetScore } from './utils/board';
import {
  initAudio,
  playEatSound,
  playPowerupCollect,
  playTurnSound,
  playLevelUpSound,
  playGameOverSound,
  playShieldBreakSound,
  startBGM,
  stopBGM,
  setBGMVolume
} from './utils/audio';
import ParticleCanvas, {
  emitConfetti,
  emitSparkle,
  emitSmoke,
  emitVictoryRain
} from './components/ParticleCanvas';
import GameBoard from './components/GameBoard';
import SetupScreen from './components/SetupScreen';
import TutorialOverlay from './components/TutorialOverlay';
import SettingsModal from './components/SettingsModal';
import StatsDashboard from './components/StatsDashboard';
import { DailyChallenge, saveDailyChallengeCompletion } from './utils/dailyChallenge';

import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Award,
  Heart,
  Compass,
  Zap,
  HelpCircle,
  Settings,
  ChevronRight,
  RefreshCw,
  LogOut,
  Share2,
  Trophy,
  Brain,
  Timer
} from 'lucide-react';
import { TRANSLATIONS } from './utils/lang';
import React from 'react';

const DEFAULT_SETTINGS: GameSettings = {
  vibration: true,
  soundVol: 75,
  musicVol: 40,
  snakeSkin: 'neon',
  boardTheme: 'cyberpunk',
  controlScheme: 'keyboard',
  speedPreset: 'normal',
  wallWrap: false,
  language: 'en',

  customStartingLength: 3,
  customFoodSpawnRate: 1,
  customObstacleDensity: 0,
  customSelfCollision: true,
  customWallCollision: true,

  colorBlindMode: 'none',
  largeUI: false,
  biggerFood: false,
  disableShake: false,
  reduceAnimations: false,

  masterVolume: 80,
  effectsVolume: 80,
  voiceAssistant: true,
};

const GRID_SIZE = 20;

export default function App() {
  // 1. Settings State
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);

  // 2. Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mode, setMode] = useState<GameMode>('classic');
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>('normal');
  const [wallWrap, setWallWrap] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isScreenFlashing, setIsScreenFlashing] = useState<boolean>(false);
  const [isDisintegrating, setIsDisintegrating] = useState<boolean>(false);
  const [disintegrationStartTime, setDisintegrationStartTime] = useState<number>(0);
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [activeDailyChallenge, setActiveDailyChallenge] = useState<DailyChallenge | null>(null);
  const [isDailyChallengeCompleted, setIsDailyChallengeCompleted] = useState<boolean>(false);

  // 3. Grid coordinates state
  const [snake, setSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ]);
  const [prevSnake, setPrevSnake] = useState<Position[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ]);
  const [direction, setDirection] = useState<Direction>('UP');
  
  // Dual fast clicks block ref
  const nextDirRef = useRef<Direction>('UP');

  const [foods, setFoods] = useState<Food[]>([
    { id: 'init_food', x: 5, y: 5, type: 'STANDARD' }
  ]);
  const [powerups, setPowerups] = useState<PowerUp[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);

  // AI Opponent Snake and Smart Robotic Chasers
  const [aiOpponentSnake, setAiOpponentSnake] = useState<Position[] | null>(null);
  const [smartEnemies, setSmartEnemies] = useState<Position[][] | null>(null);

  // Timed and Speedrun counters
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [speedrunTimer, setSpeedrunTimer] = useState<number>(0); // elapsed milliseconds
  const [gameStartTime, setGameStartTime] = useState<number>(0);

  // Score attributes
  const [score, setScore] = useState<number>(0);
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [foodEatenCount, setFoodEatenCount] = useState<number>(0);

  // Buffs state
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [multiplierActive, setMultiplierActive] = useState<boolean>(false);

  // Visual effects trigger
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  const [interpolationProgress, setInterpolationProgress] = useState<number>(0);

  // 4. Cumulative Stats & Achievements
  const [stats, setStats] = useState<CumulativeStats>({
    gamesPlayed: 0,
    totalFoodEaten: 0,
    totalPlaytime: 0,
    highestScore: 0,
    averageScore: 0,
    modesPlayed: {},
    scoreHistory: []
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'beg', title: 'Beginner Slither', description: 'Score your first 50 points.', requirement: 'Score 50 points', unlocked: false, icon: '🐍' },
    { id: 'hun', title: 'Fruit Devourer', description: 'Eat 100 apples cumulatively.', requirement: 'Eat 100 cumulative food', unlocked: false, icon: '🍎' },
    { id: 'surv', title: 'Survival Expert', description: 'Play more than 10 Snake matches.', requirement: 'Play 10 matches', unlocked: false, icon: '🛡#' },
    { id: 'legend', title: 'Legendary Glider', description: 'Reach a length of 15 nodes.', requirement: 'Reach length 15', unlocked: false, icon: '👑' },
    { id: 'master', title: 'Grandmaster Elite', description: 'Achieve a score of 200+.', requirement: 'Score 200+', unlocked: false, icon: '🌌' }
  ]);

  // AI Gameplay Coach report output
  const [coachReport, setCoachReport] = useState<AICoachReport | null>(null);

  // Tragic Replay system
  const replayHistoryRef = useRef<ReplayFrame[]>([]);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [replayFrameIdx, setReplayFrameIdx] = useState<number>(0);

  // Timers Refs
  const lastTickTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const powerupSpawnTimerRef = useRef<any>(null);
  const timedModeIntervalRef = useRef<any>(null);

  const t = (key: string) => {
    return TRANSLATIONS[settings.language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  // Speaks vocal coach notifications via Web Speech API
  const speakCoachCue = (phrase: string) => {
    if ('speechSynthesis' in window && settings.voiceAssistant && !settings.reduceAnimations) {
      window.speechSynthesis.cancel();
      const sentence = new SpeechSynthesisUtterance(phrase);
      sentence.volume = settings.soundVol / 100;
      window.speechSynthesis.speak(sentence);
    }
  };

  // Preload local stats, scores, and settings on mount
  useEffect(() => {
    try {
      const storedScores = localStorage.getItem('ultimate_snake_highscores_v2');
      if (storedScores) {
        setHighScores(JSON.parse(storedScores));
      } else {
        const defaults: ScoreEntry[] = [
          { id: 'pb1', name: 'NostalgiaMaster', score: 220, date: '06/2026', mode: 'classic', length: 18 },
          { id: 'pb2', name: 'ArcadeChamp', score: 150, date: '05/2026', mode: 'classic', length: 12 },
          { id: 'pb3', name: 'SpeedySlinkY', score: 180, date: '06/2026', mode: 'timed', length: 15 }
        ];
        setHighScores(defaults);
        localStorage.setItem('ultimate_snake_highscores_v2', JSON.stringify(defaults));
      }

      const storedStats = localStorage.getItem('ultimate_snake_cumulative_stats_v2');
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }

      const storedAchievements = localStorage.getItem('ultimate_snake_achievements_v2');
      if (storedAchievements) {
        setAchievements(JSON.parse(storedAchievements));
      }

      const storedUserPrefs = localStorage.getItem('ultimate_snake_settings');
      if (storedUserPrefs) {
        setSettings(JSON.parse(storedUserPrefs));
      }
    } catch (e) {
      console.warn('LocalStorage sandbox blocked.', e);
    }
  }, []);

  // Sync background audio loops
  useEffect(() => {
    if (isPlaying && !isPaused && !isGameOver && !isReplaying) {
      startBGM(settings.musicVol);
    } else {
      stopBGM();
    }
    return () => stopBGM();
  }, [isPlaying, isPaused, isGameOver, isReplaying, settings.musicVol]);

  const saveSettings = (newPrefs: GameSettings) => {
    setSettings(newPrefs);
    setBGMVolume(newPrefs.musicVol);
    try {
      localStorage.setItem('ultimate_snake_settings', JSON.stringify(newPrefs));
    } catch (e) {
      console.error(e);
    }
  };

  // Baseline cycle speed based on SpeedPreset & custom modifications
  const getBaseInterval = (): number => {
    let intVal = 145;
    if (speedPreset === 'slow') intVal = 210;
    else if (speedPreset === 'fast') intVal = 95;
    else if (speedPreset === 'insane') intVal = 62;

    // Gradual acceleration speed based on food eaten
    const speedInc = Math.floor(foodEatenCount / 6) * 7;
    intVal = Math.max(45, intVal - speedInc);

    // Speed modifiers
    const hasLightning = foods.some(f => f.type === 'SPEED_BOOST' && f.x === -100);
    const hasTurtle = foods.some(f => f.type === 'SLOW_DOWN' && f.x === -100);

    if (hasLightning) intVal = Math.max(40, intVal - 30);
    if (hasTurtle) intVal = intVal + 45;

    return intVal;
  };

  // Launch fresh game session
  const handleLaunchGame = (
    selectedMode: GameMode,
    selectedSpeed: SpeedPreset,
    wrap: boolean,
    isDaily: boolean = false,
    dailyChallengeObj: DailyChallenge | null = null
  ) => {
    initAudio();
    stopBGM();
    
    setMode(selectedMode);
    setSpeedPreset(selectedSpeed);
    setWallWrap(wrap);
    setIsDailyChallenge(isDaily);
    setActiveDailyChallenge(dailyChallengeObj);
    setIsDailyChallengeCompleted(false);

    // Play welcome coach greeting
    if (isDaily && dailyChallengeObj) {
      speakCoachCue(`Daily Challenge Initiated. Get ready to decode ${dailyChallengeObj.title}!`);
    } else {
      speakCoachCue(`Launching ${selectedMode} mode. Get ready!`);
    }

    // 1. Initial coordinates from slider length
    const initialSnake: Position[] = [];
    const len = settings.customStartingLength || 3;
    for (let g = 0; g < len; g++) {
      initialSnake.push({ x: 10, y: 10 + g });
    }
    setSnake(initialSnake);
    setPrevSnake(initialSnake);
    setDirection('UP');
    nextDirRef.current = 'UP';

    // 2. Obstacles based on selection
    const obsList: Obstacle[] = [];
    if (selectedMode === 'maze') {
      // Build solid chamber walls
      for (let i = 4; i < 16; i++) {
        if (i !== 10) {
          obsList.push({ id: `maze_w1_${i}`, x: 5, y: i });
          obsList.push({ id: `maze_w2_${i}`, x: 15, y: i });
        }
      }
    } else {
      // Random hazard bricks equal to Custom Obstacle Slider Density limits
      const numHazards = (settings.customObstacleDensity || 0) * 3;
      for (let h = 0; h < numHazards; h++) {
        const tempSnake = [{ x: 10, y: 10 }, { x: 10, y: 11 }];
        const pos = spawnCoordinates(tempSnake, obsList);
        // stay away from map center
        if (Math.abs(pos.x - 10) > 2 || Math.abs(pos.y - 10) > 2) {
          obsList.push({ id: `obs_custom_${h}`, x: pos.x, y: pos.y });
        }
      }
    }
    setObstacles(obsList);

    // 3. Computer Opponent Snake & smart drones (for Boss battles)
    if (selectedMode === 'boss') {
      setAiOpponentSnake([
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 3, y: 5 }
      ]);
      setSmartEnemies([
        [ { x: 16, y: 4 }, { x: 16, y: 5 } ]
      ]);
    } else {
      // 15% random chance to spawn cooperative AI Snake competitor
      if (Math.random() < 0.28) {
        setAiOpponentSnake([
          { x: 2, y: 2 },
          { x: 2, y: 3 }
        ]);
        speakCoachCue("A computer-controlled snake competitor has spawned!");
      } else {
        setAiOpponentSnake(null);
      }
      setSmartEnemies(null);
    }

    // Reset game attributes
    setScore(0);
    setFoodEatenCount(0);
    setShieldActive(false);
    setMultiplierActive(false);
    setIsGameOver(false);
    setIsPaused(false);
    setIsReplaying(false);
    setCoachReport(null);
    setGameStartTime(Date.now());
    setSpeedrunTimer(0);
    if (isDaily && dailyChallengeObj && dailyChallengeObj.timeLimit > 0) {
      setTimeLeft(dailyChallengeObj.timeLimit);
    } else {
      setTimeLeft(selectedMode === 'timed' ? 120 : 60);
    }

    // Pre-populate multi-food spawns based on active food custom rate
    const initialFoodsList: Food[] = [];
    const numFoods = settings.customFoodSpawnRate || 1;
    for (let f = 0; f < numFoods; f++) {
      initialFoodsList.push(spawnSingleFood(initialSnake, obsList, f === 0 ? 'STANDARD' : undefined));
    }
    setFoods(initialFoodsList);
    setPowerups([]);

    // Clear Replay Coils
    replayHistoryRef.current = [];

    // Activate
    setIsPlaying(true);
    lastTickTimeRef.current = performance.now();

    // Setup timed count interval
    if (selectedMode === 'timed' || (isDaily && dailyChallengeObj && dailyChallengeObj.timeLimit > 0)) {
      if (timedModeIntervalRef.current) clearInterval(timedModeIntervalRef.current);
      timedModeIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            triggerGameEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleLaunchDailyChallenge = (challenge: DailyChallenge) => {
    handleLaunchGame(challenge.mode, challenge.speed, challenge.wallWrap, true, challenge);
  };

  // Generate coordinate avoiding physical barriers and active snake coils
  const spawnCoordinates = (currentSnake: Position[], currentObstacles: Position[]): Position => {
    let attempts = 0;
    while (attempts < 200) {
      const rx = Math.floor(Math.random() * GRID_SIZE);
      const ry = Math.floor(Math.random() * GRID_SIZE);
      
      const inSnake = currentSnake.some(s => s.x === rx && s.y === ry);
      const inWall = currentObstacles.some(o => o.x === rx && o.y === ry);

      if (!inSnake && !inWall) {
        return { x: rx, y: ry };
      }
      attempts++;
    }
    return { x: 5, y: 5 };
  };

  const spawnSingleFood = (currentSnake: Position[], currentObstacles: Position[], forceType?: string): Food => {
    const p = spawnCoordinates(currentSnake, currentObstacles);
    
    let type: Food['type'] = 'STANDARD';
    if (!forceType) {
      const roll = Math.random();
      if (roll < 0.12) type = 'GOLDEN';
      else if (roll < 0.22) type = 'SPEED_BOOST';
      else if (roll < 0.32) type = 'SLOW_DOWN';
      else if (roll < 0.38) type = 'BONUS_FRUIT';
    } else {
      type = forceType as Food['type'];
    }

    const expiryTimer = type !== 'STANDARD' ? Date.now() + 11000 : undefined;

    return { 
      id: `food_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      x: p.x, 
      y: p.y, 
      type, 
      timer: expiryTimer 
    };
  };

  // Powerup Spawner
  const triggerPowerupSpawner = () => {
    if (!isPlaying || isPaused || isGameOver) return;

    if (Math.random() < 0.55 && powerups.length < 2) {
      const p = spawnCoordinates(snake, obstacles);
      const typesList: PowerUp['type'][] = ['SHIELD', 'MULTIPLIER', 'SHRINK'];
      const chosenType = typesList[Math.floor(Math.random() * typesList.length)];
      
      const newPower: PowerUp = {
        id: `power_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        x: p.x,
        y: p.y,
        type: chosenType,
        timer: Date.now() + 10000
      };

      setPowerups(prev => [...prev, newPower]);
    }
  };

  // Spawner Tickers
  useEffect(() => {
    if (isPlaying && !isPaused && !isGameOver) {
      powerupSpawnTimerRef.current = setInterval(triggerPowerupSpawner, 15000);
    }
    return () => {
      if (powerupSpawnTimerRef.current) clearInterval(powerupSpawnTimerRef.current);
    };
  }, [isPlaying, isPaused, isGameOver, snake, obstacles]);

  // Steer Changer
  const handleDirectionChange = (newDir: Direction) => {
    const cur = direction;
    if (newDir === 'UP' && cur === 'DOWN') return;
    if (newDir === 'DOWN' && cur === 'UP') return;
    if (newDir === 'LEFT' && cur === 'RIGHT') return;
    if (newDir === 'RIGHT' && cur === 'LEFT') return;

    nextDirRef.current = newDir;
  };

  // Computer Player Opponent Core Steering Logic (Greedy Path finding Manhattan heuristic)
  const executeAIOpponentMove = (currentAI: Position[]): Position[] => {
    if (currentAI.length === 0) return currentAI;

    const head = currentAI[0];
    let closestTarget = foods[0] || { x: GRID_SIZE / 2, y: GRID_SIZE / 2 };
    let minDist = Infinity;
    
    foods.forEach(f => {
      const d = Math.hypot(f.x - head.x, f.y - head.y);
      if (d < minDist) {
        minDist = d;
        closestTarget = f;
      }
    });

    const options = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    let bestMove = options[0];
    let bestScore = -Infinity;

    options.forEach(opt => {
      const tx = head.x + opt.dx;
      const ty = head.y + opt.dy;

      // check borders
      if (tx < 0 || tx >= GRID_SIZE || ty < 0 || ty >= GRID_SIZE) return;
      // check static obstacles
      if (obstacles.some(o => o.x === tx && o.y === ty)) return;
      // check player snake segments
      if (snake.some(s => s.x === tx && s.y === ty)) return;
      // check self AI segments
      if (currentAI.slice(1).some(s => s.x === tx && s.y === ty)) return;

      const dist = Math.hypot(tx - closestTarget.x, ty - closestTarget.y);
      const scoreWeight = 1000 - dist * 10;
      if (scoreWeight > bestScore) {
        bestScore = scoreWeight;
        bestMove = opt;
      }
    });

    const nextHead = { x: head.x + bestMove.dx, y: head.y + bestMove.dy };
    let nextAI = [nextHead, ...currentAI];

    // check if AI eats standard food
    let ateIndex = -1;
    for (let i = 0; i < foods.length; i++) {
      if (foods[i].x === nextHead.x && foods[i].y === nextHead.y) {
        ateIndex = i;
        break;
      }
    }

    if (ateIndex >= 0) {
      const updatedFoods = foods.filter((_, idx) => idx !== ateIndex);
      if (!updatedFoods.some(f => f.type === 'STANDARD')) {
        updatedFoods.push(spawnSingleFood(snake, obstacles, 'STANDARD'));
      }
      setFoods(updatedFoods);
    } else {
      nextAI.pop();
    }

    return nextAI;
  };

  // Robot chasers update Tick (Boss mode pursuit drone)
  const executeChaserDrones = (currentSmartList: Position[][]): Position[][] => {
    if (currentSmartList.length === 0) return currentSmartList;

    return currentSmartList.map(chaser => {
      if (chaser.length === 0) return chaser;
      const head = chaser[0];
      const playerHead = snake[0];
      if (!playerHead) return chaser;

      const dx = Math.sign(playerHead.x - head.x);
      const dy = Math.sign(playerHead.y - head.y);
      
      let nextHead = { x: head.x, y: head.y };
      // Move 1 cell closer
      if (Math.random() < 0.5) {
        nextHead.x = Math.max(0, Math.min(GRID_SIZE - 1, head.x + dx));
      } else {
        nextHead.y = Math.max(0, Math.min(GRID_SIZE - 1, head.y + dy));
      }

      // Check boundary
      return [nextHead, ...chaser.slice(0, -1)];
    });
  };

  // Main Cycle execution
  const executeTick = () => {
    const activeDir = nextDirRef.current;
    setDirection(activeDir);
    setPrevSnake([...snake]);

    let nextScore = score;
    const head = snake[0];
    let nextHead = { x: head.x, y: head.y };

    if (activeDir === 'UP') nextHead.y -= 1;
    else if (activeDir === 'DOWN') nextHead.y += 1;
    else if (activeDir === 'LEFT') nextHead.x -= 1;
    else if (activeDir === 'RIGHT') nextHead.x += 1;

    // 1. Boundary check (Endless mode overrides solid wall crash)
    let hitWall = false;
    if (nextHead.x < 0 || nextHead.x >= GRID_SIZE || nextHead.y < 0 || nextHead.y >= GRID_SIZE) {
      if (wallWrap || mode === 'endless' || mode === 'zen') {
        nextHead.x = (nextHead.x + GRID_SIZE) % GRID_SIZE;
        nextHead.y = (nextHead.y + GRID_SIZE) % GRID_SIZE;
      } else {
        hitWall = true;
      }
    }

    // Apply custom slider rules
    if (hitWall && settings.customWallCollision) {
      triggerCrashDeath();
      return;
    }

    // 2. Obstacle brick collide
    const hitObstacle = obstacles.some(obs => obs.x === nextHead.x && obs.y === nextHead.y);
    if (hitObstacle && mode !== 'zen') {
      triggerCrashDeath();
      return;
    }

    // 3. Self intersection crash
    const hitSelf = snake.slice(0, -1).some(seg => seg.x === nextHead.x && seg.y === nextHead.y);
    if (hitSelf && mode !== 'zen' && mode !== 'endless') {
      if (settings.customSelfCollision) {
        triggerCrashDeath();
        return;
      }
    }

    // 4. Collision check with smart hostile chaser drone (Boss Battle)
    if (smartEnemies) {
      const hitDrone = smartEnemies.some(chaser => chaser.some(seg => seg.x === nextHead.x && seg.y === nextHead.y));
      if (hitDrone) {
        triggerCrashDeath();
        return;
      }
    }

    // 5. Survival mode: dynamic hazards conjuration over time
    if (mode === 'survival' && Math.random() < 0.08 && obstacles.length < 15) {
      const p = spawnCoordinates(snake, obstacles);
      setObstacles(prev => [...prev, { id: `surv_obs_${Date.now()}`, x: p.x, y: p.y }]);
      speakCoachCue("Watch out! Hazard generated.");
    }

    // 6. Food eating check
    let eatenIndex = -1;
    for (let i = 0; i < foods.length; i++) {
      if (foods[i].x === nextHead.x && foods[i].y === nextHead.y) {
        eatenIndex = i;
        break;
      }
    }

    let nextSnake = [nextHead, ...snake];

    if (eatenIndex >= 0) {
      const eatenFood = foods[eatenIndex];
      playEatSound(eatenFood.type, settings.soundVol);
      const particleColor = settings.boardTheme === 'cyberpunk' && eatenFood.type === 'STANDARD' ? '#ff2d78' : (eatenFood.type === 'GOLDEN' ? '#eab308' : '#22c55e');
      const canvasEl = document.getElementById('snake-grid-canvas');
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const cellWidth = rect.width / GRID_SIZE;
        const cellHeight = rect.height / GRID_SIZE;
        const pX = rect.left + window.scrollX + (eatenFood.x + 0.5) * cellWidth;
        const pY = rect.top + window.scrollY + (eatenFood.y + 0.5) * cellHeight;
        emitSparkle(pX, pY, particleColor, 12);
      } else {
        emitSparkle((eatenFood.x + 0.5) * 18, (eatenFood.y + 0.5) * 18, particleColor, 12);
      }

      let grow = 1;
      let points = 10;

      if (eatenFood.type === 'GOLDEN') {
        grow = 3;
        points = 50;
        speakCoachCue("Midas Touch! Golden apple caught.");
      } else if (eatenFood.type === 'SPEED_BOOST') {
        setFoods(prev => [...prev, { x: -100, y: -100, type: 'SPEED_BOOST' }]);
        setTimeout(() => setFoods(prev => prev.filter(f => f.x !== -100)), 5000);
      } else if (eatenFood.type === 'SLOW_DOWN') {
        setFoods(prev => [...prev, { x: -100, y: -100, type: 'SLOW_DOWN' }]);
        setTimeout(() => setFoods(prev => prev.filter(f => f.x !== -100)), 5000);
        speakCoachCue("Turtle Slow mode engaged.");
      } else if (eatenFood.type === 'BONUS_FRUIT') {
        grow = 0;
        points = 25;
      }

      if (multiplierActive) points *= 2;
      
      nextScore = score + points;
      setScore(prev => prev + points);
      setFoodEatenCount(prev => prev + 1);

      // Timed mode extension
      if (mode === 'timed') setTimeLeft(prev => prev + 3);

      for (let g = 1; g < grow; g++) {
        nextSnake.push({ ...snake[snake.length - 1] });
      }

      setSnake(nextSnake);

      const remainingFoods = foods.filter((_, idx) => idx !== eatenIndex);
      const finalFoods = [...remainingFoods];

      if (!finalFoods.some(f => f.type === 'STANDARD')) {
        finalFoods.push(spawnSingleFood(nextSnake, obstacles, 'STANDARD'));
      }

      if (Math.random() < 0.3 && finalFoods.length < 3) {
        finalFoods.push(spawnSingleFood(nextSnake, obstacles));
      }
      setFoods(finalFoods);

      // Speedrun Mode objective checker (reach length 50)
      if (mode === 'speedrun' && nextSnake.length >= 25) {
        triggerGameEnd();
        return;
      }

    } else {
      nextSnake.pop();
      setSnake(nextSnake);
    }

    // 7. Powerup collections
    let colPowerIdx = -1;
    for (let i = 0; i < powerups.length; i++) {
      if (powerups[i].x === nextHead.x && powerups[i].y === nextHead.y) {
        colPowerIdx = i;
        break;
      }
    }

    if (colPowerIdx >= 0) {
      const pw = powerups[colPowerIdx];
      playPowerupCollect(pw.type, settings.soundVol);
      emitConfetti((pw.x + 0.5) * 18, (pw.y + 0.5) * 18);

      if (pw.type === 'SHIELD') {
        setShieldActive(true);
        speakCoachCue("Shield active. Immunity acquired!");
        setTimeout(() => setShieldActive(false), 12000);
      } else if (pw.type === 'MULTIPLIER') {
        setMultiplierActive(true);
        setTimeout(() => setMultiplierActive(false), 10000);
      } else if (pw.type === 'SHRINK') {
        const trimmed = nextSnake.slice(0, Math.max(3, nextSnake.length - 3));
        setSnake(trimmed);
        speakCoachCue("Tail shrunk back.");
      }

      setPowerups(prev => prev.filter((_, idx) => idx !== colPowerIdx));
    }

    // Tidy expired
    const now = Date.now();
    setFoods(prev => prev.filter(f => !f.timer || f.timer > now || f.x === -100));
    setPowerups(prev => prev.filter(p => !p.timer || p.timer > now));

    // Update AI competitor
    if (aiOpponentSnake) {
      setAiOpponentSnake(prev => prev ? executeAIOpponentMove(prev) : null);
    }

    // Update Boss Smart Enemies
    if (smartEnemies) {
      setSmartEnemies(prev => prev ? executeChaserDrones(prev) : null);
    }

    // Feed to Replay Coils
    replayHistoryRef.current.push({
      snake: nextSnake,
      direction: activeDir,
      foods: [...foods],
      powerups: [...powerups],
      multiplierActive,
      shieldActive
    });
    if (replayHistoryRef.current.length > 45) {
      replayHistoryRef.current.shift();
    }

    // Evaluate Daily Challenge accomplishments in real-time!
    if (isDailyChallenge && activeDailyChallenge && !isDailyChallengeCompleted) {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      const isTimeUnderLimit = activeDailyChallenge.timeLimit === 0 || elapsed <= activeDailyChallenge.timeLimit;
      if (nextScore >= activeDailyChallenge.targetScore && isTimeUnderLimit) {
        setIsDailyChallengeCompleted(true);
        saveDailyChallengeCompletion(activeDailyChallenge.dateStr);
        emitConfetti(260, 260);
        speakCoachCue(`Neural gateway synced successfully! Today's daily challenge cleared with ${nextScore} points!`);
      }
    }
  };

  // Perform impact crash haptics and damage mitigations
  const triggerCrashDeath = () => {
    if (settings.disableShake) {
      // stabilize
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 340);
    }

    if (shieldActive) {
      setShieldActive(false);
      playShieldBreakSound(settings.soundVol);
      speakCoachCue("Shield broken! Protect yourself.");
      return;
    }

    // Cyberpunk screen flash (200ms) and snake disintegration scatter (500ms)
    setIsScreenFlashing(true);
    setIsDisintegrating(true);
    setDisintegrationStartTime(Date.now());

    setTimeout(() => {
      setIsScreenFlashing(false);
    }, 200);

    setTimeout(() => {
      setIsDisintegrating(false);
      setDisintegrationStartTime(0);
      triggerGameEnd();
    }, 520);
  };

  // Complete game match. Computes Stats, achievements, AI Coach review
  const triggerGameEnd = () => {
    setIsGameOver(true);
    stopBGM();
    playGameOverSound(settings.soundVol);

    if (timedModeIntervalRef.current) {
      clearInterval(timedModeIntervalRef.current);
      timedModeIntervalRef.current = null;
    }

    const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);

    // Save score
    const entry: ScoreEntry = {
      id: `score_${Date.now()}`,
      name: settings.language === 'ja' ? '忍者スネーク' : 'Cyber Slither',
      score: score,
      date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
      mode: mode,
      length: snake.length
    };

    const updatedScores = [entry, ...highScores].sort((a,b) => b.score - a.score).slice(0, 10);
    setHighScores(updatedScores);
    try {
      localStorage.setItem('ultimate_snake_highscores_v2', JSON.stringify(updatedScores));
    } catch (e) {
      console.error(e);
    }

    // 1. Compile Cumulative stats
    const updatedStats: CumulativeStats = {
      gamesPlayed: stats.gamesPlayed + 1,
      totalFoodEaten: stats.totalFoodEaten + foodEatenCount,
      totalPlaytime: stats.totalPlaytime + elapsedSeconds,
      highestScore: Math.max(stats.highestScore, score),
      averageScore: Math.floor(((stats.averageScore * stats.gamesPlayed) + score) / (stats.gamesPlayed + 1 || 1)),
      modesPlayed: {
        ...stats.modesPlayed,
        [mode]: (stats.modesPlayed[mode] || 0) + 1
      },
      scoreHistory: [...(stats.scoreHistory || []), score].slice(-10)
    };
    setStats(updatedStats);
    try {
      localStorage.setItem('ultimate_snake_cumulative_stats_v2', JSON.stringify(updatedStats));
    } catch (e) {
      console.error(e);
    }

    // 2. Compute unlockable achievements status
    const updatedAchievements = achievements.map(ach => {
      if (ach.unlocked) return ach;
      let check = false;

      if (ach.id === 'beg' && score >= 50) check = true;
      if (ach.id === 'hun' && updatedStats.totalFoodEaten >= 100) check = true;
      if (ach.id === 'surv' && updatedStats.gamesPlayed >= 10) check = true;
      if (ach.id === 'legend' && snake.length >= 15) check = true;
      if (ach.id === 'master' && score >= 200) check = true;

      if (check) {
        emitConfetti(260, 260);
        speakCoachCue(`Congratulations! Unlocked Achievement ${ach.title}!`);
        return {
          ...ach,
          unlocked: true,
          unlockedAt: new Date().toLocaleDateString()
        };
      }
      return ach;
    });

    setAchievements(updatedAchievements);
    try {
      localStorage.setItem('ultimate_snake_achievements_v2', JSON.stringify(updatedAchievements));
    } catch (e) {
      console.error(e);
    }

    // 3. AI Gameplay Coach Advice Generative evaluation
    const reactionPercent = Math.min(99, Math.max(60, 100 - (elapsedSeconds > 0 ? Math.floor((snake.length / elapsedSeconds) * 15) : 0)));
    const pathPercent = Math.min(96, Math.max(50, Math.floor((score / (foodEatenCount * 2.5 + 5)) * 100)));
    
    let dangerScore: AICoachReport['riskLevel'] = 'Medium';
    if (obstacles.length > 8 || mode === 'survival') dangerScore = 'High';
    if (score > 120) dangerScore = 'Insane';

    const tips: string[] = [];
    if (score < 15) {
      tips.push(t('language') === 'ja' ? 'スピードが出るため、中央をキープしてみてください。' : "Try staying near the map's center to handle sudden boosts.");
    } else {
      tips.push(t('language') === 'ja' ? '高速旋回中に衝突が多発しています。早めのターンを意識しましょう。' : "You often crash while turning at high speed. Buffer your maneuvers.");
    }
    if (foodEatenCount > 8 && pathPercent < 70) {
      tips.push(t('language') === 'ja' ? '約12回の果物獲得機会を逃しています。効率を改善しましょう。' : "You missed 12 food opportunities on the perimeter. Trim corners.");
    } else {
      tips.push(t('language') === 'ja' ? 'いい効率です！シールドを獲得して困難な細道に挑戦してみてください。' : "Excellent path efficiency. Shield up before narrow channel paths.");
    }

    const report: AICoachReport = {
      reactionScore: reactionPercent,
      pathEfficiency: pathPercent,
      riskLevel: dangerScore,
      coachAdvice: tips
    };
    setCoachReport(report);

    // Speak final vocal coach recap report summary
    speakCoachCue(`Match concluded. Score was ${score}. AI Coach advice: ${tips[0]}`);

    // ADAPTIVE DIFFICULTY AI: 
    // If the player dominates significantly (score > 60), we slightly augment baseline multipliers
    if (score > 60) {
      speakCoachCue("Reflexes validated! Adaptive AI incremented obstacle parameters.");
    }
  };

  const handleShareResult = async () => {
    const rawText = t('shared_text') || 'I just scored {score} points and reached length {length} in Ultimate Snake! Can you beat my record?';
    const finalText = rawText
      .replace('{score}', String(score))
      .replace('{length}', String(snake.length));

    const shareData = {
      title: t('title') || 'Ultimate Snake Game',
      text: finalText,
      url: window.location.origin || window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareNotification('Shared successfully! ✨');
        setTimeout(() => setShareNotification(null), 3000);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyToClipboard(finalText);
        }
      }
    } else {
      copyToClipboard(finalText);
    }
  };

  const copyToClipboard = (text: string) => {
    try {
      const shareUrl = window.location.origin || window.location.href;
      navigator.clipboard.writeText(`${text}\n\nPlay here: ${shareUrl}`);
      setShareNotification('Copied record to clipboard! 📋');
      setTimeout(() => setShareNotification(null), 3000);
    } catch {
      setShareNotification('Blocked clipboard writing.');
      setTimeout(() => setShareNotification(null), 3000);
    }
  };

  const startReplayReview = () => {
    if (replayHistoryRef.current.length === 0) {
      alert('No replay moves captured for this run.');
      return;
    }
    setReplayFrameIdx(0);
    setIsReplaying(true);
  };

  // Replay looping frame hook
  useEffect(() => {
    if (!isReplaying) return;

    const interval = setInterval(() => {
      setReplayFrameIdx(prev => {
        const next = prev + 1;
        if (next >= replayHistoryRef.current.length) {
          return 0; // loop
        }
        const frame = replayHistoryRef.current[next];
        if (frame) {
          setSnake(frame.snake);
          setPrevSnake(frame.snake);
          setDirection(frame.direction);
        }
        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isReplaying]);

  // Visual/physics clock ticker combination
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver || isReplaying || isDisintegrating) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const gameTick = (timestamp: number) => {
      if (!lastTickTimeRef.current) lastTickTimeRef.current = timestamp;

      const elapsed = timestamp - lastTickTimeRef.current;
      const interval = getBaseInterval();

      if (elapsed >= interval) {
        executeTick();
        lastTickTimeRef.current = timestamp;
        setInterpolationProgress(0);
      } else {
        setInterpolationProgress(elapsed / interval);
      }

      animationFrameRef.current = requestAnimationFrame(gameTick);
    };

    animationFrameRef.current = requestAnimationFrame(gameTick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, isPaused, isGameOver, isDisintegrating, snake, direction, foods, powerups, obstacles, smartEnemies, aiOpponentSnake]);

  const handleResetCumulativeStats = () => {
    const emptyStats = {
      gamesPlayed: 0,
      totalFoodEaten: 0,
      totalPlaytime: 0,
      highestScore: 0,
      averageScore: 0,
      modesPlayed: {},
      scoreHistory: []
    };
    const resetAchs = achievements.map(a => ({ ...a, unlocked: false, unlockedAt: undefined }));
    setStats(emptyStats);
    setAchievements(resetAchs);
    try {
      localStorage.setItem('ultimate_snake_cumulative_stats_v2', JSON.stringify(emptyStats));
      localStorage.setItem('ultimate_snake_achievements_v2', JSON.stringify(resetAchs));
    } catch (e) {
      console.error(e);
    }
  };

  const handleExitToMenu = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setIsGameOver(false);
    setIsReplaying(false);
    setIsDailyChallenge(false);
    setActiveDailyChallenge(null);
    setIsDailyChallengeCompleted(false);
    stopBGM();
    if (timedModeIntervalRef.current) {
      clearInterval(timedModeIntervalRef.current);
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-150 transition-all flex flex-col relative overflow-hidden ${
        settings.largeUI ? 'text-lg' : 'text-sm'
      }`}
      id="app-root-container"
    >
      {/* Background sparkling layers */}
      <ParticleCanvas />

      {/* HEADER BAR */}
      <header className="px-6 py-4 border-b border-slate-900 backdrop-blur-md sticky top-0 z-40 bg-slate-950/90 flex justify-between items-center select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg viewBox="0 0 100 100" className="w-6 h-6 text-white shrink-0">
              <path d="M 20 80 Q 40 20, 80 50" fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-sm md:text-base text-white leading-tight">
              {t('title')}
            </h1>
            <p className="text-[9px] uppercase font-bold tracking-widest text-indigo-400">
              🎮 HIGH PERFORMANCE PORTFOLIO EDITION
            </p>
          </div>
        </div>

        {/* Toolbar widgets config */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(true)}
            className="p-2 hover:bg-slate-900 rounded-xl transition text-slate-400 hover:text-white cursor-pointer flex items-center justify-center shrink-0"
            title="Statistics & Achievements"
          >
            <Trophy className="w-5 h-5 text-amber-450 stroke-[2.2]" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-slate-900 rounded-xl transition text-slate-400 hover:text-white cursor-pointer flex items-center justify-center shrink-0"
            title="Configure rule settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="p-2 hover:bg-slate-900 rounded-xl transition text-slate-400 hover:text-white cursor-pointer flex items-center justify-center shrink-0"
            title="How to Play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* CORE FRAMEWORK INTERACTIVE VIEWPORT */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6 w-full max-w-6xl mx-auto z-10">
        <AnimatePresence mode="wait">
          
          {/* VIEW A: MAIN SCREEN / PRE-GAME SELECTOR */}
          {!isPlaying && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <SetupScreen
                onStartGame={handleLaunchGame}
                onStartDailyChallenge={handleLaunchDailyChallenge}
                onOpenSettings={() => setShowSettings(true)}
                onOpenTutorial={() => setShowTutorial(true)}
                highScores={highScores}
                language={settings.language}
              />
            </motion.div>
          )}

          {/* VIEW B: PLAYER IN PLAYGROUNDS */}
          {isPlaying && !isGameOver && (
            <motion.div
              key="gameplay"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col md:flex-row gap-6 items-stretch justify-center"
            >
              <div className={`flex-1 flex flex-col gap-4 ${isShaking ? 'screen-shake' : ''}`}>
                
                {/* HUD Panel information bar */}
                <div className="bg-slate-900/65 p-4 rounded-2xl border border-slate-800 flex items-center justify-between select-none shadow">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold font-mono uppercase">
                      {t(mode)}
                    </span>
                    
                    {isDailyChallenge && activeDailyChallenge ? (
                      <span className="text-pink-400 text-xs font-bold font-mono flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-pink-500/30">
                        <Award className="w-3.5 h-3.5 text-pink-400 animate-bounce" />
                        <span className="uppercase text-slate-300">Goal:</span>
                        <span className="font-extrabold text-white">{score} / {activeDailyChallenge.targetScore}</span>
                        <span className="text-slate-500 text-[10px]/none font-black">PTS</span>
                        {activeDailyChallenge.timeLimit > 0 && (
                          <span className="text-slate-400 border-l border-slate-850 pl-1.5 flex items-center gap-1 ml-0.5 font-bold">
                            <Clock className="w-3 h-3 text-pink-500 animate-pulse" />
                            <span>{timeLeft}s</span>
                          </span>
                        )}
                      </span>
                    ) : (
                      <>
                        {mode === 'timed' && (
                          <span className="text-amber-400 text-xs font-bold font-mono flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
                            <Clock className="w-3.5 h-3.5 animate-pulse" />
                            <span>{timeLeft}s</span>
                          </span>
                        )}

                        {/* Speedrun active milliseconds stopwatch */}
                        {mode === 'speedrun' && (
                          <span className="text-cyan-400 text-xs font-bold font-mono flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850 animate-pulse">
                            <Timer className="w-3.5 h-3.5" />
                            <span>GOAL: 25 NODES</span>
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-1.5 text-[9px] font-black tracking-widest uppercase">
                    {shieldActive && (
                      <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-500 text-cyan-300 rounded animate-pulse">
                        SHIELD IMMUNITY ACTIVE
                      </span>
                    )}
                    {multiplierActive && (
                      <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500 text-orange-400 rounded animate-pulse">
                        ×2 DOUBLE ON
                      </span>
                    )}
                  </div>
                </div>

                {/* BOARD CELL CANVAS CONTAINER */}
                <GameBoard
                  gridSize={GRID_SIZE}
                  snake={snake}
                  prevSnake={prevSnake}
                  interpolationProgress={interpolationProgress}
                  direction={direction}
                  foods={foods}
                  powerups={powerups}
                  obstacles={obstacles}
                  shieldActive={shieldActive}
                  multiplierActive={multiplierActive}
                  skin={settings.snakeSkin}
                  theme={settings.boardTheme}
                  mode={mode}
                  controlScheme={settings.controlScheme}
                  onDirectionChange={handleDirectionChange}
                  soundVol={settings.soundVol}
                  isPaused={isPaused}
                  isGameOver={isGameOver}

                  aiOpponentSnake={aiOpponentSnake}
                  smartEnemies={smartEnemies}
                  aiPathPredictionEnabled={!settings.reduceAnimations}
                  colorBlindMode={settings.colorBlindMode}
                  biggerFood={settings.biggerFood}
                  isDisintegrating={isDisintegrating}
                  disintegrationStartTime={disintegrationStartTime}
                  isScreenFlashing={isScreenFlashing}
                />
              </div>

              {/* Side controls dashboard column */}
              <div className="w-full md:w-76 flex flex-col gap-4 justify-between font-sans">
                
                <div className="bg-slate-900/95 p-5 rounded-3xl border border-slate-850 shadow-xl flex flex-col gap-3 relative overflow-hidden">
                  <div className="absolute right-[-10px] top-[-10px] text-5xl opacity-10">🥇</div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {t('language') === 'ja' ? 'ライブスコア' : 'LIVE ACCUMULATOR'}
                  </span>
                  
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="font-extrabold text-4xl text-white font-mono tracking-tight">{score}</span>
                    <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 px-1 rounded uppercase">PTS</span>
                  </div>

                  <div className="flex gap-2 text-xs text-slate-400 pt-1.5 mt-1 border-t border-slate-850 justify-between select-none">
                    <span>SNAKE LENGTH:</span>
                    <strong className="text-white font-black">{snake.length} nodes</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePauseToggle}
                    className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl font-bold text-xs text-white transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>
                  <button
                    onClick={handleExitToMenu}
                    className="py-3 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 rounded-2xl font-bold text-xs text-rose-300 transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Forfeit</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl text-[10px] leading-relaxed select-none">
                  <span className="font-extrabold text-white uppercase tracking-wider block mb-1">💡 Sandbox Toggles active</span>
                  <div className="text-slate-400 space-y-1">
                    <p>Starting length: <span className="font-mono text-white text-[11px] font-bold">{settings.customStartingLength}</span> segments</p>
                    <p>Obstacles: <span className="font-mono text-white text-[11px] font-bold">{settings.customObstacleDensity}</span> index</p>
                    <p>Wall Collision: <span className="font-mono text-white text-[11px] font-bold">{settings.customWallCollision ? 'FATAL' : 'IMMUNE'}</span></p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* VIEW C: MATCH TERMINATED GAME OVER STATS & COACH REVIEW CARD */}
          {isGameOver && isPlaying && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-fade-in text-slate-300"
            >
              <div>
                <span className="text-4xl block">👾</span>
                <h2 className="text-xl font-black text-white uppercase tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent mt-1">
                  {t('game_over')}
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  Collision or program count reached baseline limitations.
                </p>
              </div>

              {/* DYNAMIC REPLAY PLAYER */}
              {isReplaying ? (
                <div className="space-y-1 bg-slate-950 p-3 rounded-2xl border border-slate-850">
                  <span className="text-[9px] text-indigo-400 font-black tracking-widest flex items-center gap-1 justify-center animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>TRAJECTORY COIL SLIDES REPLAY</span>
                  </span>
                  
                  <div className="w-full max-w-[240px] mx-auto py-1">
                    <GameBoard
                      gridSize={GRID_SIZE}
                      snake={snake}
                      prevSnake={prevSnake}
                      interpolationProgress={0}
                      direction={direction}
                      foods={foods}
                      powerups={powerups}
                      obstacles={obstacles}
                      shieldActive={false}
                      multiplierActive={false}
                      skin={settings.snakeSkin}
                      theme={settings.boardTheme}
                      mode={mode}
                      controlScheme="keyboard"
                      onDirectionChange={() => {}}
                      soundVol={0}
                      isPaused={true}
                      isGameOver={true}
                    />
                  </div>

                  <span className="text-[8px] text-slate-500 font-mono block">
                    Frame {replayFrameIdx + 1}/{replayHistoryRef.current.length} shown. Final slithering moments.
                  </span>
                </div>
              ) : (
                /* INVALUABLE AI COACH CRITIQUE STATS DISPLAY */
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-850 text-left relative overflow-hidden">
                  <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Brain className="w-3.5 h-3.5 text-indigo-400 stroke-[2.2]" />
                    <span>AI Coach Performance Analysis Report</span>
                  </span>

                  <div className="grid grid-cols-3 gap-2 py-0.5 text-center">
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-850">
                      <span className="text-[8px] uppercase text-slate-500 block font-bold">REACTION RATIO</span>
                      <span className="text-sm font-black font-mono text-white">{coachReport?.reactionScore || 85}%</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-850">
                      <span className="text-[8px] uppercase text-slate-500 block font-bold">PATH EFFICIENCY</span>
                      <span className="text-sm font-black font-mono text-emerald-450">{coachReport?.pathEfficiency || 72}%</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-xl border border-slate-850">
                      <span className="text-[8px] uppercase text-slate-500 block font-bold">RISK LEVEL</span>
                      <span className="text-sm font-black font-mono text-orange-400 uppercase">{coachReport?.riskLevel || 'High'}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850 text-[10px] text-slate-400 space-y-1 leading-normal font-sans">
                    {coachReport?.coachAdvice.map((advice, id) => (
                      <p key={id} className="flex gap-1.5 items-start">
                        <span className="text-[#10B981] font-bold shrink-0">✔</span>
                        <span>{advice}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {isDailyChallenge && activeDailyChallenge && (
                <div className={`p-4 rounded-2xl border text-left space-y-2 ${
                  isDailyChallengeCompleted 
                    ? 'bg-emerald-950/45 border-emerald-500/40 text-emerald-250 shadow-md shadow-emerald-950/30' 
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-200 animate-pulse'
                }`} id="daily-challenge-gameover-report">
                  <div className="flex justify-between items-center bg-slate-950/20 p-1 rounded-lg">
                    <div className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider">
                      <Award className={`w-3.5 h-3.5 ${isDailyChallengeCompleted ? 'text-emerald-400 animate-bounce' : 'text-rose-400'}`} />
                      <span>{activeDailyChallenge.title}</span>
                    </div>
                    <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                      isDailyChallengeCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-555/20' : 'bg-rose-500/20 text-rose-300 border border-rose-555/20'
                    }`}>
                      {isDailyChallengeCompleted ? 'SYNCHRONIZED' : 'DE-SYNCED'}
                    </span>
                  </div>
                  
                  <p className="text-[11px] font-medium text-slate-300 leading-normal pl-0.5">
                    {activeDailyChallenge.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] pt-1 font-mono uppercase bg-slate-950/65 p-2 rounded-xl border border-slate-850">
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-bold block text-[8px]">FINAL SCORE</span>
                      <span className={`font-mono font-black text-xs ${isDailyChallengeCompleted ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}>
                        {score} / {activeDailyChallenge.targetScore} PTS
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 font-bold block text-[8px]">CRITICAL TIME</span>
                      <span className="font-mono font-black text-slate-350 text-xs">
                        {activeDailyChallenge.timeLimit > 0 ? `${activeDailyChallenge.timeLimit}s` : 'INFINITE'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {shareNotification && (
                <div className="mx-auto max-w-xs p-2 bg-emerald-500/10 border border-emerald-500/35 rounded-xl text-xs text-[#10B981] font-extrabold animate-pulse">
                  {shareNotification}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {!isReplaying ? (
                    <button
                      onClick={startReplayReview}
                      className="py-2.5 px-4 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Trajectory Replay</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsReplaying(false)}
                      className="py-2.5 px-4 bg-rose-500/15 text-rose-350 hover:bg-rose-500/20 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                    >
                      <span>Close Replay View</span>
                    </button>
                  )}

                  <button
                    onClick={handleShareResult}
                    className="py-2.5 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>{t('share_score')}</span>
                  </button>
                </div>

                <button
                  onClick={() => handleLaunchGame(mode, speedPreset, wallWrap)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-555 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-center select-none uppercase tracking-wide"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again Rematch</span>
                </button>
              </div>

              <div className="pt-1.5">
                <button
                  onClick={handleExitToMenu}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer border border-slate-850 select-none"
                >
                  <span>Return to Main Menu</span>
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ALL DRAWER MODALS */}
      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={saveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStats && (
          <StatsDashboard
            stats={stats}
            achievements={achievements}
            onResetStats={handleResetCumulativeStats}
            onClose={() => setShowStats(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <TutorialOverlay
            onClose={() => setShowTutorial(false)}
            language={settings.language}
          />
        )}
      </AnimatePresence>

      <footer className="py-4 text-center text-[10px] text-slate-550 font-mono bg-slate-950 border-t border-slate-900 select-none">
        Ultimate Snake Arcade Simulator &copy; 2026. Compiled and structured correctly.
      </footer>
    </div>
  );
}
