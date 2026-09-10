"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

export interface SceneTransform {
  /** World (viewBox user units) -> container pixels. */
  toScreen(sx: number, sy: number): { left: number; top: number };
  ready: boolean;
}

/**
 * Mirrors the `preserveAspectRatio="xMidYMid meet"` transform the browser
 * applies to the scene SVG, so HTML labels can be positioned in real container
 * pixels.
 *
 * The alternative — putting labels in a foreignObject — makes them scale with
 * the diorama, so type grows on a wide monitor and shrinks on a narrow one.
 * Measuring keeps every label at a constant, designed size.
 */
export function useSceneTransform(
  ref: RefObject<HTMLElement | null>,
  viewBox: string,
): SceneTransform {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const apply = (width: number, height: number) => {
      setSize((current) =>
        current && Math.abs(current.w - width) < 0.5 && Math.abs(current.h - height) < 0.5
          ? current
          : { w: width, h: height },
      );
    };

    const observer = new ResizeObserver((entries) => {
      // Coalesce to one measurement per frame; a resize drag fires constantly.
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const rect = entries[0]?.contentRect;
        if (rect) apply(rect.width, rect.height);
      });
    });
    observer.observe(node);

    const rect = node.getBoundingClientRect();
    apply(rect.width, rect.height);

    return () => {
      observer.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [ref]);

  return useMemo(() => {
    const [minX, minY, vbW, vbH] = viewBox.split(" ").map(Number);
    if (!size || size.w === 0 || size.h === 0) {
      return { ready: false, toScreen: () => ({ left: -9999, top: -9999 }) };
    }
    const scale = Math.min(size.w / vbW, size.h / vbH);
    const offsetX = (size.w - vbW * scale) / 2;
    const offsetY = (size.h - vbH * scale) / 2;
    return {
      ready: true,
      toScreen: (sx: number, sy: number) => ({
        left: offsetX + (sx - minX) * scale,
        top: offsetY + (sy - minY) * scale,
      }),
    };
  }, [size, viewBox]);
}
