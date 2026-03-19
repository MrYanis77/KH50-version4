import { useCallback, useEffect, useRef } from "react";

export type StupaPhase = "idle" | "awakening" | "opening" | "moving" | "dissolving" | "done";

interface UseStupaSequenceOptions {
  onPhaseChange: (phase: StupaPhase) => void;
  reducedMotion?: boolean;
}

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

  const start = useCallback(() => {
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

    // Full cinematic sequence
    // Step 1: CTA fades (handled by parent removing CTA)
    onPhaseChange("awakening");

    const t1 = setTimeout(() => {
      onPhaseChange("opening");
    }, 1200);

    const t2 = setTimeout(() => {
      onPhaseChange("moving");
    }, 2800);

    const t3 = setTimeout(() => {
      onPhaseChange("dissolving");
    }, 4800);

    const t4 = setTimeout(() => {
      onPhaseChange("done");
    }, 6200);

    timeoutsRef.current.push(t1, t2, t3, t4);
  }, [onPhaseChange, reducedMotion, clearAll]);

  useEffect(() => {
    return clearAll;
  }, [clearAll]);

  return { start };
}
