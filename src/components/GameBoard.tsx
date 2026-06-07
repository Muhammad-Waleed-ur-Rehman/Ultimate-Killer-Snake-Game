/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Position, 
  Food, 
  PowerUp, 
  Obstacle, 
  Direction, 
  SnakeSkin, 
  BoardTheme, 
  ControlScheme,
  GameMode,
  ColorBlindMode
} from '../types';
import { playTurnSound } from '../utils/audio';

interface GameBoardProps {
  gridSize: number;
  snake: Position[];
  prevSnake: Position[]; // For 60fps visual interpolation
  interpolationProgress: number; // 0 to 1
  direction: Direction;
  foods: Food[];
  powerups: PowerUp[];
  obstacles: Obstacle[];
  shieldActive: boolean;
  multiplierActive: boolean;
  skin: SnakeSkin;
  theme: BoardTheme;
  mode: GameMode;
  controlScheme: ControlScheme;
  onDirectionChange: (dir: Direction) => void;
  soundVol: number;
  isPaused: boolean;
  isGameOver: boolean;

  // Additional Advanced Portfolio Capabilities
  aiOpponentSnake?: Position[] | null;
  smartEnemies?: Position[][] | null;
  aiPathPredictionEnabled?: boolean;
  colorBlindMode?: ColorBlindMode;
  biggerFood?: boolean;
  isDisintegrating?: boolean;
  disintegrationStartTime?: number;
  isScreenFlashing?: boolean;
}

// Quick BFS Pathfinder to render predicted safe route towards closest food item
function findBFSPath(
  start: Position,
  targets: Position[],
  obstacles: Position[],
  snakeSelf: Position[],
  gridSize: number
): Position[] {
  if (targets.length === 0 || !start) return [];

  const targetSet = new Set(targets.map(t => `${t.x},${t.y}`));
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  // Create blockades set (obstacles + tail segments)
  const blockSet = new Set<string>();
  obstacles.forEach(o => blockSet.add(`${o.x},${o.y}`));
  // Exclude head from self collision check
  snakeSelf.slice(1).forEach(s => blockSet.add(`${s.x},${s.y}`));

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const { x, y } = curr.pos;

    if (targetSet.has(`${x},${y}`)) {
      return curr.path;
    }

    // Neighbors
    const neighbors = [
      { x: x, y: y - 1 },
      { x: x, y: y + 1 },
      { x: x - 1, y: y },
      { x: x + 1, y: y }
    ];

    for (const nb of neighbors) {
      if (nb.x >= 0 && nb.x < gridSize && nb.y >= 0 && nb.y < gridSize) {
        const key = `${nb.x},${nb.y}`;
        if (!visited.has(key) && !blockSet.has(key)) {
          visited.add(key);
          queue.push({
            pos: nb,
            path: [...curr.path, nb]
          });
        }
      }
    }
  }

  return [];
}

export default function GameBoard({
  gridSize,
  snake,
  prevSnake,
  interpolationProgress,
  direction,
  foods,
  powerups,
  obstacles,
  shieldActive,
  multiplierActive,
  skin,
  theme,
  mode,
  controlScheme,
  onDirectionChange,
  soundVol,
  isPaused,
  isGameOver,
  aiOpponentSnake = null,
  smartEnemies = null,
  aiPathPredictionEnabled = true,
  colorBlindMode = 'none',
  biggerFood = false,
  isDisintegrating = false,
  disintegrationStartTime = 0,
  isScreenFlashing = false
}: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Handle Touch Swipe state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Fading ghost trail positions for snake's head
  const ghostPositionsRef = useRef<{ x: number; y: number; time: number }[]>([]);

  // Resize observer to maintain perfect visual fit
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      // On mobile, height is constrained — use width as the primary axis for a square canvas
      // On desktop, both dimensions are available, so still cap at 500
      const isMobileLayout = window.innerWidth < 768;
      const size = isMobileLayout
        ? Math.floor(Math.min(width, 500))
        : Math.floor(Math.min(width, height - 10, 500));
      if (size > 50) {
        setDimensions({ width: size, height: size });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Trigger continuous re-renders during active disintegration to draw smooth 60fps animations
  useEffect(() => {
    if (!isDisintegrating) return;
    let frameId: number;
    const tick = () => {
      setDimensions(prev => ({ ...prev })); // force canvas redraw
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isDisintegrating]);

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isGameOver || controlScheme === 'onetap') return;

      let newDir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== 'DOWN') newDir = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== 'UP') newDir = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== 'RIGHT') newDir = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== 'LEFT') newDir = 'RIGHT';
          break;
      }

      if (newDir && newDir !== direction) {
        onDirectionChange(newDir);
        playTurnSound(soundVol);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isPaused, isGameOver, controlScheme, onDirectionChange, soundVol]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPaused || isGameOver) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPaused || isGameOver || !touchStartRef.current || controlScheme !== 'swipe') return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const DEAD_ZONE = 30;

    if (Math.abs(dx) > DEAD_ZONE || Math.abs(dy) > DEAD_ZONE) {
      let newDir: Direction | null = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction !== 'LEFT') newDir = 'RIGHT';
        else if (dx < 0 && direction !== 'RIGHT') newDir = 'LEFT';
      } else {
        if (dy > 0 && direction !== 'UP') newDir = 'DOWN';
        else if (dy < 0 && direction !== 'DOWN') newDir = 'UP';
      }

      if (newDir && newDir !== direction) {
        onDirectionChange(newDir);
        playTurnSound(soundVol);
        if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
          navigator.vibrate(12);
        }
      }
      touchStartRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleOneTapGridClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPaused || isGameOver || controlScheme !== 'onetap') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isRightHalf = x > rect.width / 2;

    const directionsList: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    const currentIdx = directionsList.indexOf(direction);

    let nextIdx = currentIdx;
    if (isRightHalf) {
      nextIdx = (currentIdx + 1) % 4;
    } else {
      nextIdx = (currentIdx - 1 + 4) % 4;
    }

    const newDir = directionsList[nextIdx];
    onDirectionChange(newDir);
    playTurnSound(soundVol);

    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  };

  const handleDpadPress = (d: Direction) => {
    if (isPaused || isGameOver) return;
    
    let opposite: Direction = 'DOWN';
    if (d === 'UP') opposite = 'DOWN';
    else if (d === 'DOWN') opposite = 'UP';
    else if (d === 'LEFT') opposite = 'RIGHT';
    else if (d === 'RIGHT') opposite = 'LEFT';

    if (direction !== opposite) {
      onDirectionChange(d);
      playTurnSound(soundVol);
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(15);
      }
    }
  };

  // Drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    canvas.width = width;
    canvas.height = height;

    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;

    // Draw Background with unique premium styles & extra presets
    const drawBackground = () => {
      ctx.clearRect(0, 0, width, height);

      let gridColor = 'rgba(255, 255, 255, 0.05)';
      let tileColorEven = '#0F172A';
      let tileColorOdd = '#1E293B';

      // Load board configuration styling
      if (theme === 'pastel') {
        tileColorEven = '#FAF5FF';
        tileColorOdd = '#F3E8FF';
        gridColor = 'rgba(168, 85, 247, 0.1)';
      } else if (theme === 'dark') {
        tileColorEven = '#030712';
        tileColorOdd = '#0B0F19';
        gridColor = 'rgba(255, 255, 255, 0.02)';
      } else if (theme === 'retro') {
        tileColorEven = '#000000';
        tileColorOdd = '#050c02';
        gridColor = 'rgba(0, 255, 10, 0.15)';
      } else if (theme === 'high-contrast') {
        tileColorEven = '#FFFFFF';
        tileColorOdd = '#F3F4F6';
        gridColor = '#9CA3AF';
      } else if (theme === 'cyberpunk') {
        // Cyberpunk neon-noir dark void background
        tileColorEven = '#050508';
        tileColorOdd = '#050508';
        gridColor = 'rgba(0, 245, 255, 0.09)';
      } else if (theme === 'space') {
        // Deep space cosmic elements
        tileColorEven = '#02000a';
        tileColorOdd = '#070514';
        gridColor = 'rgba(129, 140, 248, 0.08)';
      } else if (theme === 'jungle') {
        tileColorEven = '#0a1d0f';
        tileColorOdd = '#0e2614';
        gridColor = 'rgba(34, 197, 94, 0.1)';
      } else if (theme === 'ocean') {
        tileColorEven = '#03121d';
        tileColorOdd = '#061d2d';
        gridColor = 'rgba(6, 182, 212, 0.1)';
      } else if (theme === 'desert') {
        tileColorEven = '#241005';
        tileColorOdd = '#2e1507';
        gridColor = 'rgba(249, 115, 22, 0.1)';
      }

      ctx.fillStyle = tileColorEven;
      ctx.fillRect(0, 0, width, height);

      // Alternating grid board spaces
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if ((r + c) % 2 === 1) {
            ctx.fillStyle = tileColorOdd;
            ctx.fillRect(c * cellWidth, r * cellHeight, cellWidth, cellHeight);
          }
        }
      }

      // Draw beautiful extra background decorations
      if (theme === 'space') {
        // Draw little star elements blinking
        ctx.fillStyle = '#ffffff';
        const timeVal = Date.now() * 0.002;
        for (let i = 0; i < 15; i++) {
          const sx = ((i * 1234.5) % width);
          const sy = ((i * 5432.1) % height);
          const starSize = 1.2 + Math.sin(timeVal + i) * 0.6;
          ctx.beginPath();
          ctx.arc(sx, sy, starSize, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (theme === 'ocean') {
        // Draw subtle ripples waves
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
        ctx.lineWidth = 2.5;
        const offset = (Date.now() * 0.02) % 40;
        for (let y = 10; y < height; y += 40) {
          ctx.beginPath();
          ctx.arc(width / 2 + offset, y, width * 0.7, 0, Math.PI);
          ctx.stroke();
        }
      }

      // Draw GRID wires
      if (theme === 'grid' || theme === 'retro' || theme === 'pastel' || theme === 'cyberpunk' || theme === 'space') {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let c = 0; c <= gridSize; c++) {
          ctx.beginPath();
          ctx.moveTo(c * cellWidth, 0);
          ctx.lineTo(c * cellWidth, height);
          ctx.stroke();
        }
        for (let r = 0; r <= gridSize; r++) {
          ctx.beginPath();
          ctx.moveTo(0, r * cellHeight);
          ctx.lineTo(width, r * cellHeight);
          ctx.stroke();
        }

        // Cyberpunk specific faint glowing magenta dot intersections
        if (theme === 'cyberpunk') {
          ctx.fillStyle = 'rgba(255, 45, 120, 0.35)'; // glowing magenta dots
          for (let c = 0; c <= gridSize; c++) {
            for (let r = 0; r <= gridSize; r++) {
              ctx.beginPath();
              ctx.arc(c * cellWidth, r * cellHeight, 1.2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Border outline glows
      if (theme === 'cyberpunk') {
        ctx.strokeStyle = '#EC4899';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#EC4899';
        ctx.strokeRect(0, 0, width, height);
        ctx.shadowBlur = 0; // reset
      } else if (theme === 'space') {
        ctx.strokeStyle = '#6366F1';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#6366F1';
        ctx.strokeRect(0, 0, width, height);
        ctx.shadowBlur = 0;
      } else if (theme === 'retro') {
        ctx.strokeStyle = '#00FF0A';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(0, 0, width, height);
      }
    };

    // Obstacle Drawers
    const drawObstacles = () => {
      obstacles.forEach((obs) => {
        const x = obs.x * cellWidth;
        const y = obs.y * cellHeight;

        ctx.save();
        if (theme === 'retro') {
          ctx.fillStyle = '#00FF0A';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
          ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4);
        } else if (theme === 'cyberpunk') {
          ctx.fillStyle = '#EC4899';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#EC4899';
          ctx.beginPath();
          ctx.roundRect(x + 3, y + 3, cellWidth - 6, cellHeight - 6, 4);
          ctx.fill();
        } else if (theme === 'pastel') {
          ctx.fillStyle = '#AAABBC';
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2, 4);
          ctx.fill();
        } else if (theme === 'high-contrast') {
          ctx.fillStyle = '#000000';
          ctx.strokeStyle = '#000000';
          ctx.fillRect(x, y, cellWidth, cellHeight);
          ctx.strokeRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
        } else {
          // Standard Slate layout
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4, 3);
          ctx.fill();

          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x + 2, y + cellHeight/2);
          ctx.lineTo(x + cellWidth - 2, y + cellHeight/2);
          ctx.stroke();
        }
        ctx.restore();
      });
    };

    // AI PATH PREDICTION RENDERING
    const drawPathPrediction = () => {
      if (!aiPathPredictionEnabled || isGameOver || isPaused || snake.length === 0 || foods.length === 0) return;

      const head = snake[0];
      const targetPositions = foods.map(f => ({ x: f.x, y: f.y }));
      const pathObs = obstacles.map(o => ({ x: o.x, y: o.y }));

      // Compute BFS safe route path
      const predictedPath = findBFSPath(head, targetPositions, pathObs, snake, gridSize);

      if (predictedPath.length > 1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 5]);

        ctx.shadowBlur = 8;
        ctx.shadowColor = '#06B6D4';

        ctx.beginPath();
        predictedPath.forEach((p, idx) => {
          const cx = (p.x + 0.5) * cellWidth;
          const cy = (p.y + 0.5) * cellHeight;
          if (idx === 0) {
            ctx.moveTo(cx, cy);
          } else {
            ctx.lineTo(cx, cy);
          }
        });
        ctx.stroke();

        // Draw destination star target highlight
        const dest = predictedPath[predictedPath.length - 1];
        if (dest) {
          const dcx = (dest.x + 0.5) * cellWidth;
          const dcy = (dest.y + 0.5) * cellHeight;
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(dcx, dcy, cellWidth * 0.5, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    // Food Render
    const drawFoods = () => {
      const timeFactor = Date.now() * 0.005;

      foods.forEach((food) => {
        const cx = (food.x + 0.5) * cellWidth;
        const cy = (food.y + 0.5) * cellHeight;
        const bounce = Math.sin(timeFactor + food.x * 2) * (cellHeight * 0.08);

        // Adjust diameter size for visual accommodations
        const sizeMultiplier = biggerFood ? 1.4 : 1.0;
        const radius = Math.min(cellWidth, cellHeight) * 0.38 * sizeMultiplier;

        ctx.save();

        if (food.type === 'STANDARD') {
          if (theme === 'cyberpunk') {
            // Cyberpunk pulsating magenta orb (#ff2d78) with radiant bloom glow effect
            const pulse = 1.0 + Math.sin(timeFactor * 5) * 0.15;
            const magentaRadius = radius * pulse;

            ctx.shadowBlur = 18 + Math.sin(timeFactor * 5) * 6;
            ctx.shadowColor = '#ff2d78';

            // Radial gradient for bloom effect
            const grad = ctx.createRadialGradient(cx, cy + bounce, magentaRadius * 0.15, cx, cy + bounce, magentaRadius);
            grad.addColorStop(0, '#ffffff'); // super bright neon center core
            grad.addColorStop(0.3, '#ff2d78'); // intense magenta body
            grad.addColorStop(1, 'rgba(255, 45, 120, 0)'); // bloom dissipation

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy + bounce, magentaRadius, 0, Math.PI * 2);
            ctx.fill();

            // Specular highlighting reflection
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(cx - magentaRadius * 0.28, cy + bounce - magentaRadius * 0.28, magentaRadius * 0.16, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Red Apple
            ctx.fillStyle = theme === 'pastel' ? '#F43F5E' : '#EF4444';
            ctx.beginPath();
            ctx.arc(cx, cy + bounce, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#78350F';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - radius + bounce);
            ctx.quadraticCurveTo(cx + 3, cy - radius - 4 + bounce, cx + 5, cy - radius - 5 + bounce);
            ctx.stroke();

            ctx.fillStyle = '#22C55E';
            ctx.beginPath();
            ctx.ellipse(cx + 4, cy - radius - 3 + bounce, 3, 1.5, Math.PI/4, 0, Math.PI*2);
            ctx.fill();
          }

        } else if (food.type === 'GOLDEN') {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#EAB308';
          ctx.fillStyle = '#EAB308';
          ctx.beginPath();
          ctx.arc(cx, cy + bounce, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#D97706';
          ctx.beginPath();
          ctx.moveTo(cx, cy - radius + bounce);
          ctx.lineTo(cx + 2, cy - radius - 5 + bounce);
          ctx.stroke();

        } else if (food.type === 'SPEED_BOOST') {
          ctx.shadowBlur = 9;
          ctx.shadowColor = '#3B82F6';
          ctx.fillStyle = '#3B82F6';

          ctx.beginPath();
          ctx.moveTo(cx + 2, cy - radius + bounce);
          ctx.lineTo(cx - radius + 2, cy + 2 + bounce);
          ctx.lineTo(cx + 1, cy + 2 + bounce);
          ctx.lineTo(cx - 2, cy + radius + bounce);
          ctx.lineTo(cx + radius - 2, cy - 2 + bounce);
          ctx.lineTo(cx - 1, cy - 2 + bounce);
          ctx.closePath();
          ctx.fill();

        } else if (food.type === 'SLOW_DOWN') {
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(cx, cy + bounce + 2, radius, Math.PI, 0, false);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#047857';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy + bounce + 2, radius, Math.PI, 0, false);
          ctx.stroke();

        } else if (food.type === 'BONUS_FRUIT') {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#F59E0B';
          ctx.fillStyle = '#F59E0B';

          ctx.beginPath();
          const rot = Math.PI / 2 * 3;
          let rx = cx;
          let ry = cy + bounce;
          let step = Math.PI / 5;

          for (let i = 0; i < 5; i++) {
            rx = cx + Math.cos(rot + i * step * 2) * radius;
            ry = cy + bounce + Math.sin(rot + i * step * 2) * radius;
            ctx.lineTo(rx, ry);

            rx = cx + Math.cos(rot + i * step * 2 + step) * (radius * 0.4);
            ry = cy + bounce + Math.sin(rot + i * step * 2 + step) * (radius * 0.4);
            ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      });
    };

    // Powerups Render
    const drawPowerups = () => {
      const timeFactor = Date.now() * 0.005;

      powerups.forEach((pu) => {
        const cx = (pu.x + 0.5) * cellWidth;
        const cy = (pu.y + 0.5) * cellHeight;
        const radius = Math.min(cellWidth, cellHeight) * 0.40;
        const pulse = 1 + Math.sin(timeFactor * 3.5) * 0.12;

        ctx.save();
        ctx.scale(pulse, pulse);

        if (pu.type === 'SHIELD') {
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#06B6D4';
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';

          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const px = cx + Math.cos(angle) * (radius / pulse);
            const py = cy + Math.sin(angle) * (radius / pulse);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

        } else if (pu.type === 'MULTIPLIER') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#F97316';
          ctx.strokeStyle = '#F97316';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';

          ctx.beginPath();
          ctx.arc(cx, cy, radius / pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 9px Courier New, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('×2', cx, cy);

        } else if (pu.type === 'SHRINK') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#8B5CF6';
          ctx.strokeStyle = '#8B5CF6';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';

          ctx.beginPath();
          ctx.arc(cx, cy, radius / pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - 3, cy - 3);
          ctx.lineTo(cx + 3, cy + 3);
          ctx.moveTo(cx + 3, cy - 3);
          ctx.lineTo(cx - 3, cy + 3);
          ctx.stroke();
        }

        ctx.restore();
      });
    };

    // Main Snake Renderer
    const drawSnake = () => {
      if (snake.length === 0) return;

      const timeFactor = Date.now() * 0.005;

      let mainColor = '#10B981';
      let secColor = '#059669';
      let glowColor: string | null = null;
      let strokeColor: string | null = '#065F46';

      // Advanced Cosmetic Shaders
      if (skin === 'neon') {
        mainColor = '#06B6D4';
        secColor = '#3B82F6';
        glowColor = '#00F0FF';
        strokeColor = null;
      } else if (skin === 'gradient') {
        mainColor = '#3B82F6';
        secColor = '#8B5CF6';
        glowColor = '#8B5CF6';
        strokeColor = '#1E3A8A';
      } else if (skin === 'rainbow') {
        glowColor = 'rgba(255, 255, 255, 0.5)';
        strokeColor = 'rgba(30,30,30,0.5)';
      } else if (skin === 'outline') {
        mainColor = 'transparent';
        secColor = 'transparent';
        strokeColor = theme === 'high-contrast' ? '#000000' : '#10B981';
        glowColor = null;
      } else if (skin === 'fire') {
        mainColor = '#EF4444';
        secColor = '#F59E0B';
        glowColor = '#EF4444';
        strokeColor = '#7F1D1D';
      } else if (skin === 'ice') {
        mainColor = '#A5F3FC';
        secColor = '#0284C7';
        glowColor = '#A5F3FC';
        strokeColor = '#0369A1';
      } else if (skin === 'robot') {
        mainColor = '#94A3B8';
        secColor = '#00F0FF';
        glowColor = '#00F0FF';
        strokeColor = '#475569';
      } else if (skin === 'dragon') {
        mainColor = '#14532D';
        secColor = '#F59E0B';
        glowColor = '#22C55E';
        strokeColor = '#064E3B';
      }

      ctx.save();

      // Visual progress interpolation
      const renderPoints: Position[] = [];
      for (let i = 0; i < snake.length; i++) {
        const curr = snake[i];
        const prev = prevSnake[i] || curr;
        let rx = prev.x + (curr.x - prev.x) * interpolationProgress;
        let ry = prev.y + (curr.y - prev.y) * interpolationProgress;

        if (Math.abs(curr.x - prev.x) > 2 || Math.abs(curr.y - prev.y) > 2) {
          rx = curr.x;
          ry = curr.y;
        }
        renderPoints.push({ x: rx, y: ry });
      }

      // Draw bubble active outline shields
      if (shieldActive) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00F0FF';
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        renderPoints.forEach((p, idx) => {
          const sx = (p.x + 0.5) * cellWidth;
          const sy = (p.y + 0.5) * cellHeight;
          if (idx === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        });
        ctx.stroke();
        ctx.restore();
      }

      // Draw tail segments back to front
      for (let i = renderPoints.length - 1; i >= 0; i--) {
        const p = renderPoints[i];
        let cx = (p.x + 0.5) * cellWidth;
        let cy = (p.y + 0.5) * cellHeight;
        
        let sizeFactor = 1.0;
        if (skin === 'neon') {
          // Smoothly scale down segments from head (i=0) to tail (i=length-1) for dynamic flow
          const pct = i / Math.max(1, renderPoints.length - 1);
          sizeFactor = 1.15 - pct * 0.52;
        } else if (i > renderPoints.length - 4) {
          sizeFactor = 1.0 - (i - (renderPoints.length - 4)) * 0.15;
        }

        let size = Math.min(cellWidth, cellHeight) * 0.44 * sizeFactor;

        ctx.save();

        if (isDisintegrating && disintegrationStartTime > 0) {
          const t = Math.min(1.0, (Date.now() - disintegrationStartTime) / 500); // 0 to 1
          const angle = (i * 2.3) % (Math.PI * 2);
          const dist = t * 68;
          cx += Math.cos(angle) * dist;
          cy += Math.sin(angle) * dist;
          size *= (1.0 - t);
          ctx.globalAlpha = 1.0 - t;
        }

        if (skin === 'rainbow') {
          const hue = (i * 30 + timeFactor * 100) % 360;
          mainColor = `hsl(${hue}, 85%, 55%)`;
          secColor = `hsl(${(hue + 20) % 360}, 85%, 45%)`;
        } else if (skin === 'neon') {
          // Glowing electric cyan (#00f5ff) to darker teal fading tail gradient
          const pct = i / Math.max(1, renderPoints.length - 1);
          const lightness = 50 - pct * 30; // 50% down to 20%
          mainColor = `hsl(182, 100%, ${lightness}%)`;
          secColor = `hsl(182, 100%, ${lightness - 5}%)`;
          glowColor = `rgba(0, 245, 255, ${1.0 - pct * 0.8})`; // fading outer glow
        }

        if (glowColor) {
          ctx.shadowBlur = i === 0 ? 18 : 6;
          ctx.shadowColor = glowColor;
        }

        ctx.fillStyle = mainColor;
        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 1.5;
        }

        if (i === 0) {
          // Subtle directional pulsing glow on snake head
          if (skin === 'neon') {
            ctx.save();
            const pulse = 1.1 + Math.sin(timeFactor * 6) * 0.25;
            ctx.shadowBlur = 24 * pulse;
            ctx.shadowColor = '#00f5ff';
            
            let auraX = cx;
            let auraY = cy;
            const offsetDist = size * 0.45;
            if (direction === 'UP') auraY -= offsetDist;
            else if (direction === 'DOWN') auraY += offsetDist;
            else if (direction === 'LEFT') auraX -= offsetDist;
            else if (direction === 'RIGHT') auraX += offsetDist;

            ctx.fillStyle = 'rgba(0, 245, 255, 0.25)';
            ctx.beginPath();
            ctx.arc(auraX, auraY, size * 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // SNAKE HEAD DRAW
          ctx.beginPath();
          if (skin === 'dragon') {
            // Draw a polygon diamond-like dragon head
            ctx.moveTo(cx, cy - size * 1.35);
            ctx.lineTo(cx + size * 1.1, cy);
            ctx.lineTo(cx, cy + size * 1.35);
            ctx.lineTo(cx - size * 1.1, cy);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.arc(cx, cy, size * 1.15, 0, Math.PI * 2);
            ctx.fill();
          }

          if (strokeColor) ctx.stroke();

          // Draw active eyes
          ctx.fillStyle = skin === 'dragon' ? '#EAB308' : '#FFFFFF';
          const eyeRadius = size * 0.28;
          const pupilRadius = size * 0.14;

          let eyeLeft = { x: -size * 0.4, y: -size * 0.4 };
          let eyeRight = { x: size * 0.4, y: -size * 0.4 };

          if (direction === 'DOWN') {
            eyeLeft = { x: -size * 0.4, y: size * 0.4 };
            eyeRight = { x: size * 0.4, y: size * 0.4 };
          } else if (direction === 'LEFT') {
            eyeLeft = { x: -size * 0.4, y: -size * 0.4 };
            eyeRight = { x: -size * 0.4, y: size * 0.4 };
          } else if (direction === 'RIGHT') {
            eyeLeft = { x: size * 0.4, y: -size * 0.4 };
            eyeRight = { x: size * 0.4, y: size * 0.4 };
          }

          ctx.beginPath();
          ctx.arc(cx + eyeLeft.x, cy + eyeLeft.y, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(cx + eyeLeft.x, cy + eyeLeft.y, pupilRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = skin === 'dragon' ? '#EAB308' : '#FFFFFF';
          ctx.beginPath();
          ctx.arc(cx + eyeRight.x, cy + eyeRight.y, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(cx + eyeRight.x, cy + eyeRight.y, pupilRadius, 0, Math.PI * 2);
          ctx.fill();

          // Fire emissions spark effect on Fire Snake
          if (skin === 'fire' && Math.random() < 0.4) {
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(cx + (Math.random() - 0.5) * size * 2, cy + (Math.random() - 0.5) * size * 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Red Tongue flicking
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          if (direction === 'UP') {
            ctx.moveTo(cx, cy - size);
            ctx.lineTo(cx, cy - size - 4);
          } else if (direction === 'DOWN') {
            ctx.moveTo(cx, cy + size);
            ctx.lineTo(cx, cy + size + 4);
          } else if (direction === 'LEFT') {
            ctx.moveTo(cx - size, cy);
            ctx.lineTo(cx - size - 4, cy);
          } else {
            ctx.moveTo(cx + size, cy);
            ctx.lineTo(cx + size + 4, cy);
          }
          ctx.stroke();

        } else {
          // SNAKE BODY ELEMENT
          ctx.beginPath();
          if (skin === 'dragon') {
            // Draw scale patterns
            ctx.moveTo(cx, cy - size);
            ctx.quadraticCurveTo(cx + size, cy, cx, cy + size);
            ctx.quadraticCurveTo(cx - size, cy, cx, cy - size);
            ctx.fillStyle = i % 2 === 0 ? mainColor : secColor;
          } else if (i % 2 === 0) {
            ctx.fillStyle = secColor;
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
          } else {
            ctx.arc(cx, cy, size, 0, Math.PI * 2);
          }
          ctx.fill();
          if (strokeColor) ctx.stroke();
        }

        ctx.restore();
      }

      ctx.restore();
    };

    // Draw COMPUTER CONTROLLED AI OPPONENT SNAKE
    const drawAIOpponent = () => {
      if (!aiOpponentSnake || aiOpponentSnake.length === 0) return;

      ctx.save();
      ctx.fillStyle = '#8B5CF6'; // purple cyber skin
      ctx.strokeStyle = '#312E81';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#8B5CF6';

      for (let i = aiOpponentSnake.length - 1; i >= 0; i--) {
        const seg = aiOpponentSnake[i];
        const cx = (seg.x + 0.5) * cellWidth;
        const cy = (seg.y + 0.5) * cellHeight;
        const size = Math.min(cellWidth, cellHeight) * 0.42 * (i > aiOpponentSnake.length - 4 ? 1.0 - (i - (aiOpponentSnake.length - 4)) * 0.15 : 1.0);

        ctx.beginPath();
        if (i === 0) {
          // Purple AI Dragon head
          ctx.fillStyle = '#6366F1';
          ctx.arc(cx, cy, size * 1.15, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Angry yellow robot scanner bar
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(cx - size * 0.5, cy - size * 0.4, size, size * 0.25);
        } else {
          ctx.fillStyle = i % 2 === 0 ? '#8B5CF6' : '#7C3AED';
          ctx.arc(cx, cy, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    // Draw HOSTILE CHASER ROBOT ENEMIES (Boss Mode / Smart Enemy AI)
    const drawSmartEnemies = () => {
      if (!smartEnemies || smartEnemies.length === 0) return;

      ctx.save();
      smartEnemies.forEach((enemy) => {
        if (!enemy || enemy.length === 0) return;

        // Angry dark red body
        ctx.fillStyle = '#DC2626';
        ctx.strokeStyle = '#450A0A';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#EF4444';

        for (let i = enemy.length - 1; i >= 0; i--) {
          const seg = enemy[i];
          const cx = (seg.x + 0.5) * cellWidth;
          const cy = (seg.y + 0.5) * cellHeight;
          const size = Math.min(cellWidth, cellHeight) * 0.45;

          ctx.beginPath();
          if (i === 0) {
            // Hostile spike polygon
            ctx.fillStyle = '#000000';
            ctx.moveTo(cx, cy - size * 1.3);
            ctx.lineTo(cx + size, cy);
            ctx.lineTo(cx, cy + size * 1.3);
            ctx.lineTo(cx - size, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Red glowing pupil eye
            ctx.fillStyle = '#EF4444';
            ctx.beginPath();
            ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = i % 2 === 0 ? '#991B1B' : '#7F1D1D';
            ctx.arc(cx, cy, size * 0.85, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      });
      ctx.restore();
    };

    // Render Execution Flow
    drawBackground();
    drawObstacles();
    drawPathPrediction();
    drawFoods();
    drawPowerups();
    drawSnake();
    drawAIOpponent();
    drawSmartEnemies();

  }, [dimensions, snake, prevSnake, interpolationProgress, direction, foods, powerups, obstacles, shieldActive, multiplierActive, skin, theme, mode, gridSize, aiOpponentSnake, smartEnemies, aiPathPredictionEnabled, biggerFood]);

  return (
    <div className="flex flex-col items-center justify-center w-full relative" ref={containerRef} id="canvas-steer-container">
      {/* Visual canvas */}
      <div className="relative" style={{ width: `${dimensions.width}px`, height: `${dimensions.height}px` }}>
        <canvas
          ref={canvasRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleOneTapGridClick}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'none'
          }}
          className={`rounded-3xl shadow-2xl select-none cursor-pointer border-2 border-slate-800 transition-all ${
            controlScheme === 'onetap' ? 'hover:border-indigo-400' : ''
          }`}
          id="snake-grid-canvas"
        />

        {/* Speed-of-light screen flash red tint overlay */}
        {isScreenFlashing && (
          <div className="absolute inset-0 rounded-3xl bg-red-650/40 border-2 border-red-500 pointer-events-none z-30 animate-pulse duration-100" />
        )}
      </div>

      {/* Tap Scheme Text info */}
      {controlScheme === 'onetap' && !isPaused && !isGameOver && (
        <div className="text-[10px] text-slate-400 mt-2 flex justify-between w-full font-mono max-w-[400px] px-1 select-none pointer-events-none">
          <span>◀ Tap Left: Turn Anticlockwise</span>
          <span>Tap Right: Turn Clockwise ▶</span>
        </div>
      )}

      {/* Tactile D-PAD HUD Overlay */}
      {controlScheme === 'dpad' && !isPaused && !isGameOver && (
        <div className="w-full max-w-[400px] flex justify-center items-center py-4 select-none animate-fade-in">
          <div className="grid grid-cols-3 gap-1.5 w-32 h-32 relative bg-slate-900/60 p-2.5 rounded-full border border-slate-800 shadow-inner">
            <div />
            <button
              onClick={() => handleDpadPress('UP')}
              className="bg-slate-800/80 hover:bg-slate-755 active:bg-indigo-650 text-slate-205 active:text-white rounded-t-xl flex items-center justify-center cursor-pointer"
              title="Steer Up"
            >
              ▲
            </button>
            <div />

            <button
              onClick={() => handleDpadPress('LEFT')}
              className="bg-slate-800/80 hover:bg-slate-755 active:bg-indigo-650 text-slate-205 active:text-white rounded-l-xl flex items-center justify-center cursor-pointer"
              title="Steer Left"
            >
              ◀
            </button>
            <div className="bg-slate-950/90 rounded-full flex items-center justify-center text-[9px] text-indigo-400 font-bold font-mono">
              STEER
            </div>
            <button
              onClick={() => handleDpadPress('RIGHT')}
              className="bg-slate-800/80 hover:bg-slate-755 active:bg-indigo-650 text-slate-205 active:text-white rounded-r-xl flex items-center justify-center cursor-pointer"
              title="Steer Right"
            >
              ▶
            </button>

            <div />
            <button
              onClick={() => handleDpadPress('DOWN')}
              className="bg-slate-800/80 hover:bg-slate-755 active:bg-indigo-650 text-slate-205 active:text-white rounded-b-xl flex items-center justify-center cursor-pointer"
              title="Steer Down"
            >
              ▼
            </button>
            <div />
          </div>
        </div>
      )}
    </div>
  );
}
