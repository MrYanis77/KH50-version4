import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import ThemeToggle from "@/components/ThemeToggle";
import { NavLink } from "@/components/NavLink";

const navLinks = [
  { label: "Mémorial #KH50", href: "https://www.fragmentis-vitae.org/presentation/", end: true },
  { label: "Mur Virtuel", href: "/memorial", end: false },
  { label: "Recueil", href: "/recueil", end: false },
  { label: "Archives", href: "/archives", end: false },
  { label: "À propos", href: "/about", end: false },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async () => {
    if (user) {
      try {
        await signOut();
        toast.success("Déconnexion réussie");
        navigate("/");
      } catch {
        toast.error("Erreur lors de la déconnexion");
      }
    } else {
      navigate("/auth");
    }
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://www.fragmentis-vitae.org/images/fragment-rond.svg"
              alt="Fragments KH50 logo"
              width="40"
              height="40"
              className="h-10 w-10 object-contain"
            />
            <span className="font-body text-[24px] font-bold text-foreground leading-none tracking-tight">
              Fragments #KH50
            </span>
          </Link>

          <ThemeToggle />
        </div>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              end={link.end}
              className="text-[15px] font-medium text-foreground/75 transition-colors hover:text-foreground"
              activeClassName="text-foreground underline underline-offset-8"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}

          <button
            onClick={handleAuth}
            className="rounded-full px-6 py-3 text-sm font-semibold transition-colors bg-[#e7c38f] text-[#1f2b22] hover:opacity-90 dark:bg-[#4b5b49] dark:text-white"
          >
            {user ? "Se déconnecter" : "Se connecter"}
          </button>
        </div>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 pb-4 animate-fade-in">
          <nav className="flex flex-col gap-3 pt-4" aria-label="Mobile navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.href}
                end={link.end}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-sm font-medium text-foreground/75 hover:text-foreground"
                activeClassName="text-foreground underline underline-offset-4"
              >
                {link.label}
              </NavLink>
            ))}

            <div className="pt-2">
              <ThemeToggle />
            </div>

            <button
              onClick={handleAuth}
              className="mt-2 w-fit rounded-full px-6 py-3 text-sm font-semibold bg-[#e7c38f] text-[#1f2b22] dark:bg-[#4b5b49] dark:text-white"
            >
              {user ? "Se déconnecter" : "Se connecter"}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;