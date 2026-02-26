"use client";

import { useState, useEffect } from "react";

export function useAnimatedNumber(value: number, durationMs = 800, enabled = true): number {
  const [display, setDisplay] = useState(enabled ? 0 : value);

  useEffect(() => {
    if (!enabled) {
      setDisplay(value);
      return;
    }
    const start = display;
    const diff = value - start;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value, enabled]);

  useEffect(() => {
    if (!enabled) setDisplay(value);
  }, [enabled, value]);

  return display;
}
