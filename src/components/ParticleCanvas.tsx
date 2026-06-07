/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'confetti' | 'sparkle' | 'smoke';
  shape?: 'circle' | 'square' | 'star';
  rotation?: number;
  rotationSpeed?: number;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 1;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Apply velocities
        p.x += p.vx;
        p.y += p.vy;

        // Apply environmental gravity or drag
        if (p.type === 'confetti') {
          p.vy += 0.08; // gravity
          p.vx *= 0.99; // air resistance
          if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
            p.rotation += p.rotationSpeed;
          }
        } else if (p.type === 'smoke') {
          p.vy -= 0.02; // smoke rises
          p.vx *= 0.96; // quick friction
          p.size += 0.3; // expands
        } else if (p.type === 'sparkle') {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        // Draw particle
        ctx.save();
        ctx.globalAlpha = p.alpha * (p.life / p.maxLife);
        ctx.translate(p.x, p.y);

        if (p.type === 'confetti') {
          ctx.rotate(p.rotation || 0);
          ctx.fillStyle = p.color;
          if (p.shape === 'square') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          } else if (p.shape === 'star') {
            // Draw regular 5-point star
            ctx.beginPath();
            for (let j = 0; j < 5; j++) {
              ctx.lineTo(Math.cos(((18 + j * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + j * 72) * Math.PI) / 180) * p.size);
              ctx.lineTo(Math.cos(((54 + j * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + j * 72) * Math.PI) / 180) * (p.size / 2));
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (p.type === 'smoke') {
          // Cloud round gradients
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          grad.addColorStop(0, 'rgba(100, 100, 100, 0.4)');
          grad.addColorStop(0.5, 'rgba(130, 130, 130, 0.2)');
          grad.addColorStop(1, 'rgba(200, 200, 200, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sparkle star burst
          ctx.fillStyle = p.color;
          ctx.shadowBlur = p.size;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          // 4-point diamond sparkle
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size / 4, -p.size / 4);
          ctx.lineTo(p.size, 0);
          ctx.lineTo(p.size / 4, p.size / 4);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size / 4, p.size / 4);
          ctx.lineTo(-p.size, 0);
          ctx.lineTo(-p.size / 4, -p.size / 4);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);

    // Event listener endpoints
    const triggerConfetti = (e: CustomEvent<{ x: number; y: number }>) => {
      const { x, y } = e.detail;
      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849'];
      const shapes: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star'];
      
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 8;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2, // blow upwards
          size: 4 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 80 + Math.floor(Math.random() * 60),
          maxLife: 140,
          type: 'confetti',
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
        });
      }
    };

    const triggerSparkle = (e: CustomEvent<{ x: number; y: number; color: string; count?: number }>) => {
      const { x, y, color, count = 12 } = e.detail;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + Math.random() * 6,
          color,
          alpha: 1,
          life: 30 + Math.floor(Math.random() * 20),
          maxLife: 50,
          type: 'sparkle',
        });
      }
    };

    const triggerSmoke = (e: CustomEvent<{ x: number; y: number; count?: number }>) => {
      const { x, y, count = 15 } = e.detail;
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 2;
        const vy = (Math.random() - 0.5) * 2 - 0.8; // tend upwards
        particlesRef.current.push({
          x,
          y,
          vx,
          vy,
          size: 8 + Math.random() * 12,
          color: 'rgba(100,100,100,0.5)',
          alpha: 0.8,
          life: 40 + Math.floor(Math.random() * 20),
          maxLife: 60,
          type: 'smoke',
        });
      }
    };

    const triggerConfettiRain = () => {
      // Stream from left & right sides of screen
      const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849'];
      const shapes: ('circle' | 'square' | 'star')[] = ['circle', 'square', 'star'];
      
      const count = 10;
      for (let i = 0; i < count; i++) {
        // left screen
        particlesRef.current.push({
          x: 0,
          y: Math.random() * canvas.height * 0.4,
          vx: 5 + Math.random() * 8,
          vy: -2 - Math.random() * 4,
          size: 6 + Math.random() * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 100 + Math.floor(Math.random() * 60),
          maxLife: 160,
          type: 'confetti',
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
        });

        // right screen
        particlesRef.current.push({
          x: canvas.width,
          y: Math.random() * canvas.height * 0.4,
          vx: -5 - Math.random() * 8,
          vy: -2 - Math.random() * 4,
          size: 6 + Math.random() * 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          life: 100 + Math.floor(Math.random() * 60),
          maxLife: 160,
          type: 'confetti',
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          rotation: Math.random() * Math.PI,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
        });
      }
    };

    window.addEventListener('game-particles:confetti', triggerConfetti as EventListener);
    window.addEventListener('game-particles:sparkle', triggerSparkle as EventListener);
    window.addEventListener('game-particles:smoke', triggerSmoke as EventListener);
    window.addEventListener('game-particles:victory-rain', triggerConfettiRain as EventListener);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('game-particles:confetti', triggerConfetti as EventListener);
      window.removeEventListener('game-particles:sparkle', triggerSparkle as EventListener);
      window.removeEventListener('game-particles:smoke', triggerSmoke as EventListener);
      window.removeEventListener('game-particles:victory-rain', triggerConfettiRain as EventListener);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-50"
      id="particle-canvas"
    />
  );
}

/**
 * Utility functions to easily dispatch particle events from any file!
 */
export function emitConfetti(x: number, y: number) {
  window.dispatchEvent(
    new CustomEvent('game-particles:confetti', { detail: { x, y } })
  );
}

export function emitSparkle(x: number, y: number, color: string, count?: number) {
  window.dispatchEvent(
    new CustomEvent('game-particles:sparkle', { detail: { x, y, color, count } })
  );
}

export function emitSmoke(x: number, y: number, count?: number) {
  window.dispatchEvent(
    new CustomEvent('game-particles:smoke', { detail: { x, y, count } })
  );
}

export function emitVictoryRain() {
  window.dispatchEvent(new CustomEvent('game-particles:victory-rain'));
}
