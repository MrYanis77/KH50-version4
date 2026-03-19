import { motion, useReducedMotion } from "framer-motion";
import stupaImage from "@/assets/stupa-hero.jpg";
import FragmentisCTA from "./FragmentisCTA";

interface HomeHeroStupaProps {
  onEnter: () => void;
  phase: "idle" | "awakening" | "opening" | "moving" | "dissolving" | "done";
}

const HomeHeroStupa = ({ onEnter, phase }: HomeHeroStupaProps) => {
  const prefersReduced = useReducedMotion();
  const isIdle = phase === "idle";
  const isAnimating = !isIdle && phase !== "done";

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

  const getOverlayOpacity = () => {
    switch (phase) {
      case "awakening":
        return 0.15;
      case "opening":
        return 0.1;
      case "moving":
        return 0.05;
      case "dissolving":
      case "done":
        return 0;
      default:
        return 0.25;
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
      className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      aria-label="Sanctuaire mémoriel"
    >
      {/* Background image */}
      <motion.div
        className="absolute inset-0"
        animate={getImageStyle()}
        transition={{ duration: prefersReduced ? 0.5 : 2.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <img
          src={stupaImage}
          alt="Stupa mémoriel sacré"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Mist / atmospheric overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/30"
        animate={{ opacity: getOverlayOpacity() }}
        transition={{ duration: 1.5 }}
      />

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

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none" />

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
