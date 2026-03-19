import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import registerBg from "@/assets/register-bg.jpg";

interface ArchiveRegisterSceneProps {
  visible: boolean;
  onExplore: () => void;
}

const ArchiveRegisterScene = ({ visible, onExplore }: ArchiveRegisterSceneProps) => {
  const prefersReduced = useReducedMotion();
  const navigate = useNavigate();

  if (!visible) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: prefersReduced ? 0.4 : 1.2,
        ease: "easeOut" as const,
        staggerChildren: 0.2,
        delayChildren: prefersReduced ? 0.2 : 0.6,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" as const },
    },
  };

  return (
    <motion.section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      aria-label="Archives mémorielles"
    >
      {/* Register background */}
      <div className="absolute inset-0">
        <img
          src={registerBg}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
        {/* Parchment overlay for blending */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/70" />
        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.6) 100%)",
          }}
        />
      </div>

      {/* Fragmentis diagonal motif */}
      <div className="absolute inset-0 fragmentis-diagonal pointer-events-none" />

      {/* Content overlay */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-20 text-center">
        {/* Fragment decorative accent */}
        <motion.div
          variants={childVariants}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div
            className="w-8 h-px bg-brand-burnt/50"
            style={{ transform: "rotate(30.54deg)" }}
            aria-hidden="true"
          />
          <span className="text-brand-burnt text-sm" aria-hidden="true">✦</span>
          <div
            className="w-8 h-px bg-brand-burnt/50"
            style={{ transform: "rotate(-30.54deg)" }}
            aria-hidden="true"
          />
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={childVariants}
          className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground mb-6 leading-tight"
        >
          Fragments de mémoire
        </motion.h1>

        {/* Intro text */}
        <motion.p
          variants={childVariants}
          className="font-body text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-12 leading-relaxed"
        >
          Entrez dans les archives du souvenir et découvrez les noms, les traces
          et les histoires confiées à notre mémoire collective.
        </motion.p>

        {/* Buttons */}
        <motion.div
          variants={childVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary */}
          <button
            onClick={onExplore}
            className="px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-body font-semibold text-sm tracking-wide shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
            aria-label="Explorer le mur virtuel"
          >
           <Link
  to="/"
  className="font-body text-sm text-muted-foreground hover:text-brand-sage underline underline-offset-4 transition-colors"
>
 Explorer le mur virtuel
</Link> 
          </button>

          {/* Secondary */}
          <button
            onClick={() => navigate("/archives")}
            className="px-8 py-3.5 bg-transparent border border-brand-forest text-brand-forest rounded-xl font-body font-semibold text-sm tracking-wide hover:bg-brand-forest hover:text-primary-foreground transition-all duration-300"
            aria-label="Ouvrir le registre"
          >
            Ouvrir le registre
          </button>
        </motion.div>

        {/* Text link */}
        <motion.div variants={childVariants} className="mt-8">
        <Link
  to="/about"
  className="font-body text-sm text-muted-foreground hover:text-brand-sage underline underline-offset-4 transition-colors"
>
  À propos du projet
</Link>
        </motion.div>

        {/* Bottom decorative fragments */}
        <motion.div
          variants={childVariants}
          className="mt-16 flex items-center justify-center gap-2 opacity-40"
          aria-hidden="true"
        >
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 border border-brand-sage/40 rotate-45"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ArchiveRegisterScene;
