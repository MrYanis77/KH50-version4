import { motion } from "framer-motion";

interface FragmentisCTAProps {
  onClick: () => void;
  visible: boolean;
}

const FragmentisCTA = ({ onClick, visible }: FragmentisCTAProps) => {
  if (!visible) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
      onClick={onClick}
      className="glass-effect px-8 py-4 rounded-xl text-primary-foreground font-body font-semibold text-base tracking-wide hover:shadow-xl hover:scale-105 transition-all duration-500 cursor-pointer"
      aria-label="Accéder au mur mémoriel"
    >
      Accéder au mur
    </motion.button>
  );
};

export default FragmentisCTA;
