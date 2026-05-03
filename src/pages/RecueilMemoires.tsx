import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { directusAuth, getAssetUrl } from "@/integration/directus";
import { createItem, updateItem } from "@directus/sdk";
import { usePublicRecueil } from "@/hooks/useDirectus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  BookOpen, Plus, Search, Lock, Globe,
  MessageSquare, Camera, Video, FileText, Mic,
  ChevronRight, Loader2, ArrowRight, Upload
} from "lucide-react";
import type { RecueilRow } from "@/integration/directus-types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const TYPE_OPTIONS = [
  { id: 1, code: "temoignage", label: "Témoignage écrit",  icon: MessageSquare },
  { id: 2, code: "photographie", label: "Photographie",      icon: Camera },
  { id: 3, code: "video",   label: "Vidéo",              icon: Video },
  { id: 4, code: "recit",   label: "Récit",              icon: FileText },
  { id: 7, code: "audio",   label: "Enregistrement audio", icon: Mic },
];

const getTypeIcon = (code: string | undefined) => {
  const t = TYPE_OPTIONS.find(t => t.code === code);
  const Icon = t?.icon || BookOpen;
  return <Icon className="h-4 w-4" />;
};

const getTypeLabel = (code: string | undefined) => {
  return TYPE_OPTIONS.find(t => t.code === code)?.label || "Autre";
};

const isVideo = (code?: string) => code === "video";
const isAudio = (code?: string) => code === "audio";
const isPhoto = (code?: string) => code === "photographie";

// ---------------------------------------------------------------------------
// AddRecueilDialog
// ---------------------------------------------------------------------------
interface AddDialogProps {
  temoinId: number;
  onSuccess: () => void;
}

const AddRecueilDialog = ({ temoinId, onSuccess }: AddDialogProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [typeId, setTypeId] = useState("1");
  const [isPublic, setIsPublic] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contenu.trim() && !mediaFile) {
      toast.error("Veuillez saisir un contenu ou joindre un fichier.");
      return;
    }
    setSaving(true);
    try {
      let fichierMediaId: string | null = null;

      // Upload file if present
      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        const resp = await fetch("/files", {
          method: "POST",
          body: formData,
        }).then(r => r.json());
        fichierMediaId = resp.data?.id || null;
      }

      await directusAuth.request(
        createItem("mmrl_recueil", {
          auteur_temoin_id: temoinId,
          type_id: Number(typeId),
          titre: titre.trim() || null,
          contenu: contenu.trim() || null,
          fichier_media: fichierMediaId,
          is_public: isPublic,
          statut_id: 2, // À vérifier par défaut
        })
      );

      toast.success("Votre entrée a été ajoutée au recueil !");
      setOpen(false);
      setTitre(""); setContenu(""); setTypeId("1"); setIsPublic(true); setMediaFile(null);
      onSuccess();
    } catch (err) {
      toast.error("Erreur lors de la création. Vérifiez vos permissions.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-8 h-12 gap-2">
          <Plus className="h-4 w-4" /> Ajouter au recueil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle entrée au recueil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type de contenu</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <span className="flex items-center gap-2">
                      <t.icon className="h-4 w-4" /> {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Titre */}
          <div className="space-y-1.5">
            <Label htmlFor="rec-titre">Titre (optionnel)</Label>
            <Input id="rec-titre" value={titre} onChange={e => setTitre(e.target.value)} placeholder="Donnez un titre à votre témoignage" />
          </div>

          {/* Contenu texte */}
          <div className="space-y-1.5">
            <Label htmlFor="rec-contenu">Contenu / Description</Label>
            <Textarea
              id="rec-contenu"
              value={contenu}
              onChange={e => setContenu(e.target.value)}
              placeholder="Rédigez votre témoignage, décrivez votre photo ou votre enregistrement..."
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Fichier */}
          <div className="space-y-1.5">
            <Label>Fichier joint (photo, vidéo, audio)</Label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">
                {mediaFile ? mediaFile.name : "Cliquez pour choisir un fichier"}
              </span>
              <input type="file" className="hidden" accept="image/*,video/*,audio/*" onChange={e => setMediaFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          {/* Visibilité */}
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{isPublic ? "Public" : "Privé"}</p>
              <p className="text-xs text-muted-foreground">
                {isPublic
                  ? "Visible par tous les visiteurs du site"
                  : "Visible uniquement par vous dans votre profil"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Globe className="h-4 w-4 text-primary" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// RecueilCard
// ---------------------------------------------------------------------------
const RecueilCard = ({ entry }: { entry: RecueilRow }) => {
  const typeCode = (entry.type as any)?.code || "";
  const typeLabel = (entry.type as any)?.libelle || getTypeLabel(typeCode);

  return (
    <Card className="group h-full border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-primary/5 bg-card/50 backdrop-blur-sm flex flex-col">
      {/* Media preview */}
      {entry.fichier_media && (
        <div className="aspect-video w-full overflow-hidden relative bg-black">
          {isVideo(typeCode) ? (
            <video
              src={getAssetUrl(entry.fichier_media)}
              className="w-full h-full object-cover"
              onMouseOver={e => (e.target as HTMLVideoElement).play()}
              onMouseOut={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
              muted playsInline preload="metadata"
            />
          ) : isAudio(typeCode) ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 gap-3 p-4">
              <Mic className="h-12 w-12 text-primary/40" />
              <audio src={getAssetUrl(entry.fichier_media)} controls className="w-full max-w-xs" />
            </div>
          ) : (
            <img
              src={getAssetUrl(entry.fichier_media, "width=500&height=300&fit=cover")}
              alt={entry.titre || "Média"}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-none gap-1.5 px-2 py-1">
              {getTypeIcon(typeCode)}
              <span className="text-[10px] uppercase font-bold">{typeLabel}</span>
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-6 flex-grow flex flex-col">
        {!entry.fichier_media && (
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none gap-1.5 px-2 py-1">
              {getTypeIcon(typeCode)}
              <span className="text-[10px] uppercase font-bold">{typeLabel}</span>
            </Badge>
          </div>
        )}

        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {entry.titre || "Témoignage sans titre"}
        </h3>

        {entry.contenu && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed flex-grow">
            {entry.contenu}
          </p>
        )}

        <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {entry.date_creation
              ? format(new Date(entry.date_creation), "d MMM yyyy", { locale: fr })
              : "—"}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" /> Public
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const RecueilMemoires = () => {
  const { user, temoin } = useAuth();
  const { entries, loading, refresh } = usePublicRecueil();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = entries.filter(e => {
    const code = (e.type as any)?.code || "";
    const matchSearch =
      (e.titre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (e.contenu?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchTab = activeTab === "all" || code === activeTab;
    return matchSearch && matchTab;
  });

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative py-20 overflow-hidden border-b">
        <div className="absolute inset-0 bg-accent/5 pointer-events-none" />
        <div className="container relative z-10 px-6 mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-3 py-1 uppercase tracking-wider text-[10px] font-bold">
              Transmission &amp; Mémoire
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
              Recueil de mémoires <span className="text-primary">&amp;</span> témoignages
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Un espace dédié à la préservation des récits familiaux. Écrits, photos, enregistrements audio et vidéos — laissez une trace indélébile pour les générations futures.
            </p>
            <div className="flex flex-wrap gap-4">
              {user && temoin ? (
                <AddRecueilDialog temoinId={temoin.id} onSuccess={refresh} />
              ) : (
                <a href="/auth">
                  <Button className="rounded-full px-8 h-12 gap-2">
                    <Plus className="h-4 w-4" /> Contribuer
                  </Button>
                </a>
              )}
              <Button variant="outline" className="rounded-full px-8 h-12 gap-2" onClick={() => document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" })}>
                Explorer <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <main id="explore" className="container px-6 py-16 mx-auto">

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans le recueil..."
              className="pl-10 rounded-full bg-muted/30 border-muted-foreground/20 focus:border-primary/50"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
            <TabsList className="bg-muted/50 rounded-full p-1 flex-wrap">
              <TabsTrigger value="all" className="rounded-full px-4 text-xs">Tous</TabsTrigger>
              <TabsTrigger value="temoignage" className="rounded-full px-4 text-xs gap-1.5"><MessageSquare className="h-3 w-3" /> Témoignages</TabsTrigger>
              <TabsTrigger value="photographie" className="rounded-full px-4 text-xs gap-1.5"><Camera className="h-3 w-3" /> Photos</TabsTrigger>
              <TabsTrigger value="video" className="rounded-full px-4 text-xs gap-1.5"><Video className="h-3 w-3" /> Vidéos</TabsTrigger>
              <TabsTrigger value="audio" className="rounded-full px-4 text-xs gap-1.5"><Mic className="h-3 w-3" /> Audio</TabsTrigger>
              <TabsTrigger value="recit" className="rounded-full px-4 text-xs gap-1.5"><FileText className="h-3 w-3" /> Récits</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <RecueilCard entry={entry} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Aucune entrée trouvée</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Soyez le premier à contribuer à ce recueil ou ajustez vos filtres.
            </p>
            <Button variant="outline" onClick={() => { setSearchTerm(""); setActiveTab("all"); }}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </main>

      {/* CTA */}
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
                {TYPE_OPTIONS.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-sm text-foreground/80">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <t.icon className="h-4 w-4 text-primary" />
                    </div>
                    {t.label}
                  </div>
                ))}
              </div>
              {user && temoin ? (
                <AddRecueilDialog temoinId={temoin.id} onSuccess={refresh} />
              ) : (
                <a href="/auth">
                  <Button className="w-full md:w-auto px-10 h-12 rounded-full">Déposer un témoignage</Button>
                </a>
              )}
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
