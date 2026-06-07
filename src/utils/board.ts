/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Obstacle } from '../types';

/**
 * Generates custom static obstacle (walls) list per level (1 to 20) for the Adventure Mode.
 */
export function getLevelObstacles(level: number, gridSize: number = 20): Obstacle[] {
  const points: { x: number; y: number }[] = [];
  const mid = Math.floor(gridSize / 2);

  // Return level configuration obstacles
  switch (level) {
    case 1:
      // Empty warm-up stage
      return [];

    case 2:
      // Small central square column
      points.push({ x: mid, y: mid });
      points.push({ x: mid - 1, y: mid });
      points.push({ x: mid, y: mid - 1 });
      points.push({ x: mid - 1, y: mid - 1 });
      break;

    case 3:
      // Four small corner block anchors
      points.push({ x: 4, y: 4 });
      points.push({ x: 4, y: gridSize - 5 });
      points.push({ x: gridSize - 5, y: 4 });
      points.push({ x: gridSize - 5, y: gridSize - 5 });
      break;

    case 4:
      // Center Divider line with top/bottom gaps
      for (let i = 4; i < gridSize - 4; i++) {
        points.push({ x: mid, y: i });
      }
      break;

    case 5:
      // Plus "+" cross column in center
      for (let i = mid - 4; i <= mid + 3; i++) {
        points.push({ x: i, y: mid });
        if (i !== mid && i !== mid - 1) {
          points.push({ x: mid, y: i });
        }
      }
      break;

    case 6:
      // Checkered posts
      for (let x = 3; x < gridSize; x += 4) {
        for (let y = 3; y < gridSize; y += 4) {
          points.push({ x, y });
        }
      }
      break;

    case 7:
      // Dual side wings bars
      for (let i = 2; i < gridSize - 2; i++) {
        if (i < 8 || i > 11) {
          points.push({ x: 5, y: i });
          points.push({ x: gridSize - 6, y: i });
        }
      }
      break;

    case 8:
      // Horizontal central splits
      for (let i = 3; i < gridSize - 3; i++) {
        if (Math.abs(i - mid) > 1) {
          points.push({ x: i, y: 5 });
          points.push({ x: i, y: gridSize - 6 });
        }
      }
      break;

    case 9:
      // Inner spiral boundary rings
      for (let i = 3; i < gridSize - 3; i++) {
        points.push({ x: 3, y: i });
        points.push({ x: gridSize - 4, y: i });
      }
      break;

    case 10:
    case 11:
    case 12:
    case 13:
    case 14:
    case 15:
    case 16:
    case 17:
    case 18:
    case 19:
    case 20: {
      // Dynamic procedural pattern based on level difficulty
      const step = Math.max(3, 8 - (level % 4));
      for (let x = 3; x < gridSize - 3; x += step) {
        for (let y = 3; y < gridSize - 3; y += step) {
          if ((x + y) % 2 === 0) {
            points.push({ x, y });
            points.push({ x: x + 1, y });
          }
        }
      }
      break;
    }

    default:
      break;
  }

  // Map coordinate points to Obstacle objects with unique progressive IDs
  return points.map((p, idx) => ({
    id: `obs_${level}_${idx}`,
    x: p.x,
    y: p.y
  }));
}

/**
 * Simple target score setup per level in Adventure mode
 */
export function getLevelTargetScore(level: number): number {
  return 50 + (level - 1) * 20;
}
