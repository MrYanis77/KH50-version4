import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMemorialPersons } from "@/hooks/useDirectus";
import AddVictimeDialog from "@/components/AddVictimeDialog";
import { User, Search, MapPin, Clock, Briefcase, LogIn, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import memorialConcept from "@/assets/memorial-concept.png";
import type { VictimeRow } from "@/integration/directus-types";
import { getAssetUrl } from "@/integration/directus";
import { useAuth } from "@/contexts/AuthContext";

const MemorialWall = () => {
  const { people, loading, error } = useMemorialPersons();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredPerson, setHoveredPerson] = useState<VictimeRow | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const filteredPeople = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return people.filter((p) =>
      `${p.prenom} ${p.nom}`.toLowerCase().includes(q) ||
      p.lieu_naissance?.toLowerCase().includes(q) ||
      p.profession?.toLowerCase().includes(q)
    );
  }, [people, searchQuery]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoverPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative min-h-screen" onMouseMove={handleMouseMove}>
      {/* Immersive Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.35 }}
          transition={{ duration: 1.8 }}
          src={memorialConcept}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      </div>

      <main className="container mx-auto px-4 py-10 relative z-10">

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8 mt-4">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher un nom, lieu, profession…"
              className="pl-10 bg-background/60 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground font-mono">
              {filteredPeople.length} {filteredPeople.length === 1 ? "personne" : "personnes"}
            </span>
            {user ? (
              <>
                <span className="hidden sm:inline text-xs text-muted-foreground border border-border/50 rounded-full px-3 py-1">
                  👤 {user.first_name || user.email}
                </span>
                <AddVictimeDialog onSuccess={() => window.location.reload()} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground hover:text-destructive"
                  onClick={() => signOut()}
                >
                  <LogOut size={14} /> Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-full"
                  onClick={() => navigate("/auth")}
                >
                  <LogIn size={14} /> Se connecter
                </Button>
                <AddVictimeDialog onSuccess={() => window.location.reload()} />
              </>
            )}
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-32">
            <p className="text-muted-foreground animate-pulse font-mono">Chargement du mémorial…</p>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-32">
            <p className="text-destructive">Erreur : {error}</p>
          </div>
        )}

        {/* Memorial Wall — Names */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Stone wall texture background */}
            <div className="rounded-2xl border border-border/30 bg-background/40 backdrop-blur-md p-8 shadow-2xl">
              <div className="text-center mb-6">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono">
                  Mémorial du génocide cambodgien — KH50
                </p>
                <div className="w-16 h-px bg-accent/50 mx-auto mt-2" />
              </div>

              {/* Name columns — Vietnam Memorial style */}
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-0">
                <AnimatePresence>
                  {filteredPeople.map((person, index) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.015 }}
                      className="break-inside-avoid"
                    >
                      <Link
                        to={`/memorial/${person.id}`}
                        onMouseEnter={() => setHoveredPerson(person)}
                        onMouseLeave={() => setHoveredPerson(null)}
                        className={`group relative block px-2 py-1.5 text-sm font-mono tracking-wide transition-all duration-200 cursor-pointer rounded ${
                          person.statut_id === 2
                            ? 'text-yellow-300/80 hover:text-yellow-200 hover:bg-yellow-500/10'
                            : 'text-foreground/80 hover:text-foreground hover:bg-accent/10'
                        }`}
                      >
                        <span className="group-hover:underline underline-offset-2">
                          {person.prenom} <span className="uppercase font-semibold">{person.nom}</span>
                        </span>
                        {person.statut_id === 2 && (
                          <span className="ml-1 text-yellow-400/60 text-[10px]">◌</span>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredPeople.length === 0 && !loading && (
                <div className="text-center py-16 text-muted-foreground font-mono">
                  Aucune personne trouvée pour "{searchQuery}"
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-6 mt-8 pt-4 border-t border-border/30 justify-center flex-wrap">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block w-3 h-3 rounded-full bg-foreground/70" />
                  Information avérée (blanc)
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400/70" />
                  Hypothèse à vérifier (jaune)
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Hover info card */}
      <AnimatePresence>
        {hoveredPerson && (
          <motion.div
            key={hoveredPerson.id}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              left: Math.min(hoverPos.x + 16, window.innerWidth - 300),
              top: Math.min(hoverPos.y + 12, window.innerHeight - 280),
              zIndex: 100,
              pointerEvents: "none",
            }}
            className="w-72 rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Photo banner */}
            <div className="h-24 bg-muted/50 flex items-center justify-center overflow-hidden relative">
              {hoveredPerson.photo_principale ? (
                <img
                  src={getAssetUrl(hoveredPerson.photo_principale, "width=288&height=96&fit=cover")}
                  alt=""
                  className="w-full h-full object-cover opacity-80"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              {hoveredPerson.statut_id === 2 && (
                <span className="absolute top-2 right-2 text-[10px] bg-yellow-400/90 text-yellow-900 px-2 py-0.5 rounded-full font-medium">
                  🟡 Hypothèse
                </span>
              )}
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-display text-base font-semibold text-foreground leading-tight">
                {hoveredPerson.prenom} <span className="uppercase">{hoveredPerson.nom}</span>
              </h3>

              <div className="space-y-1">
                {(hoveredPerson.date_naissance || hoveredPerson.annee_naissance || hoveredPerson.date_deces || hoveredPerson.annee_deces) && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    {hoveredPerson.date_naissance || hoveredPerson.annee_naissance || "?"} — {hoveredPerson.date_deces || hoveredPerson.annee_deces || "?"}
                  </p>
                )}
                {hoveredPerson.lieu_naissance && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {hoveredPerson.lieu_naissance}
                  </p>
                )}
                {hoveredPerson.profession && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Briefcase className="h-3 w-3 flex-shrink-0" />
                    {hoveredPerson.profession}
                  </p>
                )}
                {hoveredPerson.origine_familiale && (
                  <p className="text-xs text-muted-foreground/80 mt-1">
                    Origine : {hoveredPerson.origine_familiale}
                  </p>
                )}
              </div>

              <p className="text-[10px] text-accent/70 pt-1 border-t border-border/30">
                Cliquez pour voir le profil complet →
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MemorialWall;