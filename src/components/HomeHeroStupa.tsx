import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import stupaVideo from "@/assets/stupa.mp4";
import FragmentisCTA from "./FragmentisCTA";

interface HomeHeroStupaProps {
  onEnter: () => void;
  phase: "idle" | "awakening" | "opening" | "moving" | "dissolving" | "done";
  /** Called once the video file duration is known (for sequencing). */
  onVideoDurationKnown?: (durationMs: number) => void;
  /** Fires when playback reaches the end of the file (full duration). */
  onVideoEnded?: () => void;
}

const HomeHeroStupa = ({ onEnter, phase, onVideoDurationKnown, onVideoEnded }: HomeHeroStupaProps) => {
  const prefersReduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const isIdle = phase === "idle";
  const isAnimating = !isIdle && phase !== "done";
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (phase === "idle") {
      el.pause();
      el.currentTime = 0;
      return;
    }
    void el.play().catch(() => {});
  }, [phase]);

  // Compute dynamic styles based on phase
  const getImageStyle = () => {
    if (prefersReduced) {
      return phase === "done"
        ? { scale: 1.2, opacity: 0 }
        : { scale: 1, opacity: 1 };
    }

    switch (phase) {
      case "awakening":
        return { scale: 1.02, filter: "brightness(1.1)" };
      case "opening":
        return { scale: 1.05, filter: "brightness(1.15)" };
      case "moving":
        return { scale: 1.4, filter: "brightness(1.3)" };
      case "dissolving":
        return { scale: 1.6, opacity: 0, filter: "brightness(1.5) blur(8px)" };
      case "done":
        return { scale: 1.6, opacity: 0 };
      default:
        return { scale: 1, filter: "brightness(1)" };
    }
  };

  const getGlowOpacity = () => {
    switch (phase) {
      case "awakening":
        return 0.4;
      case "opening":
        return 0.6;
      case "moving":
        return 0.8;
      default:
        return 0;
    }
  };

  return (
    <section
      className="relative flex min-h-[100dvh] w-full max-w-none items-center justify-center overflow-hidden"
      aria-label="Sanctuaire mémoriel"
    >
      {/* Background video */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        animate={{ ...getImageStyle(), opacity: revealed ? (getImageStyle().opacity ?? 1) : 0 }}
        transition={{ duration: prefersReduced ? 0.5 : 2.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <video
          ref={videoRef}
          src={stupaVideo}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover object-[center_15%]"
          muted
          playsInline
          preload="auto"
          aria-hidden
          onLoadedMetadata={(e) => {
            const { duration } = e.currentTarget;
            if (Number.isFinite(duration) && duration > 0) {
              onVideoDurationKnown?.(duration * 1000);
            }
          }}
          onEnded={() => {
            onVideoEnded?.();
          }}
        />
      </motion.div>

      {/* Diagonal Fragmentis motif overlay */}
      <div className="absolute inset-0 fragmentis-diagonal pointer-events-none" />

      {/* Entrance glow effect */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{ opacity: getGlowOpacity() }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      >
        <div className="w-32 h-48 md:w-48 md:h-64 rounded-full bg-gradient-radial from-brand-parchment/60 via-brand-parchment/20 to-transparent blur-3xl" />
      </motion.div>

      {/* Floating particles during animation */}
      {isAnimating && !prefersReduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-brand-parchment/40"
              initial={{
                x: `${30 + Math.random() * 40}%`,
                y: `${60 + Math.random() * 30}%`,
                opacity: 0,
              }}
              animate={{
                y: `${20 + Math.random() * 30}%`,
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: i * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* CTA button */}
      <div className="relative z-10 mt-[30vh]">
        <FragmentisCTA onClick={onEnter} visible={isIdle} />
      </div>

      {/* Subtle brand accent — small radiant icon */}
      <motion.div
        className="absolute top-8 left-8 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1, duration: 1.5 }}
      >
         <img className="logo-hover" src="https://www.fragmentis-vitae.org/images/fragment-rond.svg" alt="fragments KH50 logo" height="64" width="64"/>
         
      </motion.div>
    </section>
  );
};

export default HomeHeroStupa;
