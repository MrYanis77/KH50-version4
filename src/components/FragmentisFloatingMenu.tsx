import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Se connecter", href: "/auth" },
  { label: "Accueil", href: "https://www.fragmentis-vitae.org/" },
  { label: "À propos", href: "https://www.fragmentis-vitae.org/porteurs-projet/" },
];

const FragmentisFloatingMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed top-6 right-6 z-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 rounded-lg border border-brand-forest bg-background/80 backdrop-blur-sm flex items-center justify-center text-brand-forest hover:bg-brand-forest hover:text-primary-foreground transition-all duration-300"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-16 right-0 bg-background/95 backdrop-blur-md border border-border rounded-lg p-4 min-w-[200px] shadow-lg"
            aria-label="Menu principal"
          >
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="block px-4 py-2.5 text-sm font-medium font-body text-foreground hover:text-brand-sage hover:bg-muted rounded-md transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FragmentisFloatingMenu;
