import { useCallback, useEffect, useRef } from "react";

export type StupaPhase = "idle" | "awakening" | "opening" | "moving" | "dissolving" | "done";

interface UseStupaSequenceOptions {
  onPhaseChange: (phase: StupaPhase) => void;
  reducedMotion?: boolean;
}

/** Reference cinematic length (ms) used to scale phase timings to the real video duration. */
const BASE_FULL_MS = 6200;

/**
 * Custom hook that manages the stupa opening animation sequence.
 * Phases: idle → awakening → opening → moving → dissolving → done
 */
export function useStupaSequence({ onPhaseChange, reducedMotion }: UseStupaSequenceOptions) {
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const start = useCallback(
    (fullSequenceMs?: number) => {
      clearAll();

      if (reducedMotion) {
        // Simplified sequence for reduced motion
        onPhaseChange("awakening");
        const t1 = setTimeout(() => {
          onPhaseChange("done");
        }, 800);
        timeoutsRef.current.push(t1);
        return;
      }

      const D =
        fullSequenceMs !== undefined && Number.isFinite(fullSequenceMs) && fullSequenceMs > 0
          ? fullSequenceMs
          : BASE_FULL_MS;

      const scale = D / BASE_FULL_MS;

      // Full cinematic sequence — intermediate phases stretch with the video length.
      // Transition to "done" is driven by the video `ended` event so the file plays in full.
      onPhaseChange("awakening");

      const t1 = setTimeout(() => {
        onPhaseChange("opening");
      }, Math.round(1200 * scale));

      const t2 = setTimeout(() => {
        onPhaseChange("moving");
      }, Math.round(2800 * scale));

      const t3 = setTimeout(() => {
        onPhaseChange("dissolving");
      }, Math.round(4800 * scale));

      timeoutsRef.current.push(t1, t2, t3);
    },
    [onPhaseChange, reducedMotion, clearAll],
  );

  useEffect(() => {
    return clearAll;
  }, [clearAll]);

  return { start, cancel: clearAll };
}
