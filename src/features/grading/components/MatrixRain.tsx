'use client';

import { useEffect, useRef } from 'react';

type MatrixRainProps = {
  height?: number;
};

/**
 * Matrix-style falling characters animation
 * Subtle, ambient visual during grading wait
 * Supports both light and dark modes
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

    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Theme-aware colors
    const fadeColor = isDarkMode
      ? 'rgba(23, 23, 23, 0.08)' // Dark mode: near-black fade
      : 'rgba(250, 250, 252, 0.08)'; // Light mode: off-white fade

    const charColor = isDarkMode
      ? { r: 167, g: 139, b: 250 } // Dark mode: violet-400 (lighter purple)
      : { r: 124, g: 58, b: 237 }; // Light mode: violet-600

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
      ctx.fillStyle = fadeColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const charIndex = Math.floor(Math.random() * charArray.length);
        const char = charArray[charIndex];
        const x = i * fontSize;
        const dropY = drops[i] ?? 0;
        const y = dropY * fontSize;

        // Purple/violet with variable opacity
        const alpha = 0.5 + Math.random() * 0.5;
        ctx.fillStyle = `rgba(${charColor.r}, ${charColor.g}, ${charColor.b}, ${alpha})`;

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
      className="relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800"
      style={{ height }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
