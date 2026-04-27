import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { directus } from "@/integration/directus";
import { readItems } from "@directus/sdk";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Plus, Search, Filter, Lock, Globe,
  MessageSquare, Camera, Video, FileText, Mic,
  ChevronRight, Calendar, User, ArrowRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import type { FragmentRow, VictimeRow } from "@/integration/directus-types";

const RecueilMemoires = () => {
  const { user } = useAuth();
  const [fragments, setFragments] = useState<FragmentRow[]>([]);
  const [victimes, setVictimes] = useState<VictimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // On utilise allSettled pour ne pas tout bloquer si une collection a un souci
        const results = await Promise.allSettled([
          directus.request(readItems("mmrl_fragments", {
            fields: ["*", "statut_id.*", "type_id.*"],
            filter: {
              statut_id: { _eq: 1 },
              deleted_at: { _null: true }
            },
            sort: ["-date_creation"]
          })),
          directus.request(readItems("mmrl_victimes", {
            fields: ["id", "prenom", "nom"],
            filter: { deleted_at: { _null: true } }
          }))
        ]);

        if (results[0].status === "fulfilled") {
          setFragments(results[0].value as unknown as FragmentRow[]);
        } else {
          console.error("Fragments load failed:", results[0].reason);
        }

        if (results[1].status === "fulfilled") {
          setVictimes(results[1].value as unknown as VictimeRow[]);
        } else {
          console.error("Victimes load failed:", results[1].reason);
        }

      } catch (error: any) {
        console.error("Error fetching memories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getVictimeName = (id: number) => {
    const v = victimes.find(v => v.id === id);
    return v ? `${v.prenom} ${v.nom}` : "Inconnu";
  };

  const getIcon = (typeCode: string) => {
    switch (typeCode) {
      case "temoignage": return <MessageSquare className="h-4 w-4" />;
      case "photographie": return <Camera className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "recit": return <FileText className="h-4 w-4" />;
      case "audio": return <Mic className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const filteredFragments = fragments.filter(f => {
    const matchesSearch = 
      f.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVictimeName(f.victime_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && f.type?.code === activeTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden border-b">
        <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
        <div className="container relative z-10 px-6 mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-3 py-1 uppercase tracking-wider text-[10px] font-bold">
              Transmission & Mémoire
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
              Recueil de mémoires <span className="text-primary">&</span> témoignages
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Un espace dédié à la préservation des récits familiaux. Permettez aux parents de laisser 
              une trace indélébile à leurs enfants et petits-enfants, à travers l'écrit, l'image et le son.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to={user ? "/memorial" : "/auth"}>
                <Button className="rounded-full px-8 h-12 gap-2">
                  <Plus className="h-4 w-4" /> Laisser une trace
                </Button>
              </Link>
              <Button variant="outline" className="rounded-full px-8 h-12 gap-2" onClick={() => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })}>
                Explorer le recueil <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main id="explore" className="container px-6 py-16 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par nom, titre ou contenu..." 
              className="pl-10 rounded-full bg-muted/30 border-muted-foreground/20 focus:border-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 rounded-full p-1">
              <TabsTrigger value="all" className="rounded-full px-5 text-xs">Tous</TabsTrigger>
              <TabsTrigger value="temoignage" className="rounded-full px-5 text-xs gap-1.5">
                <MessageSquare className="h-3 w-3" /> Témoignages
              </TabsTrigger>
              <TabsTrigger value="photographie" className="rounded-full px-5 text-xs gap-1.5">
                <Camera className="h-3 w-3" /> Photos
              </TabsTrigger>
              <TabsTrigger value="video" className="rounded-full px-5 text-xs gap-1.5">
                <Video className="h-3 w-3" /> Vidéos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredFragments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFragments.map((f, idx) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group h-full border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-primary/5 bg-card/50 backdrop-blur-sm flex flex-col">
                  {f.fichier_media && (
                    <div className="aspect-video w-full overflow-hidden relative">
                      <img 
                        src={`${import.meta.env.VITE_DIRECTUS_URL}/assets/${f.fichier_media}?width=500&height=300&fit=cover`} 
                        alt={f.titre || "Média"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-none gap-1.5 px-2 py-1">
                          {getIcon(f.type_id?.code || f.type?.code || "other")}
                          <span className="text-[10px] uppercase font-bold">{f.type_id?.libelle || f.type?.libelle}</span>
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-6 flex-grow flex flex-col">
                    {!f.fichier_media && (
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none gap-1.5 px-2 py-1">
                          {getIcon(f.type_id?.code || f.type?.code || "other")}
                          <span className="text-[10px] uppercase font-bold">{f.type_id?.libelle || f.type?.libelle}</span>
                        </Badge>
                      </div>
                    )}
                    
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {f.titre || "Témoignage sans titre"}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed flex-grow">
                      {f.description}
                    </p>
                    
                    <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                          Mémoire de
                        </span>
                        <Link 
                          to={`/memorial/${f.victime_id}`}
                          className="text-sm font-semibold hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {getVictimeName(f.victime_id)}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-[10px] font-mono">
                          {f.date_fragment ? new Date(f.date_fragment).getFullYear() : f.annee_fragment || "—"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Aucun témoignage trouvé</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Nous n'avons pas trouvé de mémoires correspondant à vos critères de recherche.
            </p>
            <Button variant="outline" onClick={() => { setSearchTerm(""); setActiveTab("all"); }}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </main>

      {/* Submission CTA */}
      <section className="py-20 bg-primary/5">
        <div className="container px-6 mx-auto">
          <div className="max-w-4xl mx-auto bg-card border border-border/50 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-display font-bold mb-4">Contribuer au recueil</h2>
              <p className="text-muted-foreground mb-6">
                Vous possédez des documents, des enregistrements ou des récits ? 
                Aidez-nous à construire ce mémorial vivant pour les générations futures.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                  Audio
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  Photos
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Video className="h-4 w-4 text-primary" />
                  </div>
                  Vidéos
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  Écrits
                </div>
              </div>
              <Link to={user ? "/memorial" : "/auth"}>
                <Button className="w-full md:w-auto px-10 h-12 rounded-full">
                  Déposer un témoignage
                </Button>
              </Link>
            </div>
            <div className="hidden md:block w-64 h-64 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="absolute inset-4 bg-primary/20 rounded-full animate-pulse delay-75" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-background border-2 border-primary/20 rounded-2xl shadow-xl flex items-center justify-center rotate-3">
                  <BookOpen className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border/50 text-center text-sm text-muted-foreground">
        <div className="container px-6 mx-auto">
          <p>© 2026 Fragments #KH50 — Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
};

export default RecueilMemoires;
