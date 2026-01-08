'use client';

import { useEffect, useRef } from 'react';

type MatrixRainProps = {
  height?: number;
};

/**
 * Matrix-style falling characters animation
 * Subtle, ambient visual during grading wait
 */
export function MatrixRain({ height = 80 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const parent = canvas.parentElement;
    if (!parent) {
      return;
    }

    // Set canvas size
    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = height;

    // Characters - code-like symbols
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789αβγδεζηθικλμνξοπρστυφχψω∑∏∫∂∇√∞≈≠≤≥±×÷';
    const charArray = chars.split('');

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);

    // Initialize drops at random positions
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * canvas.height / fontSize * -1;
    }

    function draw() {
      if (!ctx || !canvas) {
        return;
      }

      // Slower fade for longer trails
      ctx.fillStyle = 'rgba(250, 250, 252, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const charIndex = Math.floor(Math.random() * charArray.length);
        const char = charArray[charIndex];
        const x = i * fontSize;
        const dropY = drops[i] ?? 0;
        const y = dropY * fontSize;

        // Brighter purple/violet with higher opacity
        const alpha = 0.5 + Math.random() * 0.5;
        ctx.fillStyle = `rgba(124, 58, 237, ${alpha})`; // violet-600 (brighter)

        if (char && y > 0) {
          ctx.fillText(char, x, y);
        }

        // Move drop down
        drops[i] = dropY + 0.3 + Math.random() * 0.4;

        // Reset when off screen
        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
      }
    }

    // Start animation
    const interval = setInterval(draw, 45);

    return () => clearInterval(interval);
  }, [height]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{ height, background: 'linear-gradient(to bottom, rgb(250 250 252), rgb(245 245 248))' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
