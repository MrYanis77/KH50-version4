import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { directus, directusAuth, getAssetUrlWithViewerToken, recueilEntryIsVideo, recueilEntryIsAudio } from "@/integration/directus";
import { createItem, uploadFiles, readItems } from "@directus/sdk";
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
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen, Plus, Search, Lock, Globe,
  MessageSquare, Camera, Video, FileText, Mic,
  Loader2, ArrowRight, Upload
} from "lucide-react";
import type { RecueilRow, TypeFragmentCode, TypeFragmentRow } from "@/integration/directus-types";
import { STATUT_ID } from "@/integration/directus-types";
import { notifyAdminsOnCreate } from "@/services/notificationService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
// Codes autorisés pour le formulaire « recueil » (aligné plan ; pas document/lieu)
const RECUEIL_TYPE_CODES = new Set<TypeFragmentCode>([
  "temoignage",
  "photographie",
  "video",
  "recit",
  "audio",
]);

const RECUEIL_TYPE_ORDER: readonly TypeFragmentCode[] = [
  "temoignage",
  "photographie",
  "video",
  "recit",
  "audio",
];

const TYPE_ICON_BY_CODE: Record<TypeFragmentCode, LucideIcon> = {
  temoignage: MessageSquare,
  photographie: Camera,
  video: Video,
  recit: FileText,
  document: FileText,
  lieu: BookOpen,
  audio: Mic,
};

const TYPE_LABEL_FALLBACK: Partial<Record<TypeFragmentCode, string>> = {
  temoignage: "Témoignage écrit",
  photographie: "Photographie",
  video: "Vidéo",
  recit: "Récit",
  audio: "Enregistrement audio",
};

const getTypeIcon = (code: string | undefined) => {
  const key = code as TypeFragmentCode | undefined;
  const Icon = (key && TYPE_ICON_BY_CODE[key]) || BookOpen;
  return <Icon className="h-4 w-4" />;
};

const getTypeLabel = (code: string | undefined) => {
  const key = code as TypeFragmentCode | undefined;
  return (key && TYPE_LABEL_FALLBACK[key]) || "Autre";
};

// ---------------------------------------------------------------------------
// AddRecueilDialog
// ---------------------------------------------------------------------------
interface AddDialogProps {
  contributor: { id: string; first_name?: string; last_name?: string; role?: string | { id: string } };
  onSuccess: () => void;
}

const AddRecueilDialog = ({ contributor, onSuccess }: AddDialogProps) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [typeId, setTypeId] = useState("");
  const [recueilTypes, setRecueilTypes] = useState<TypeFragmentRow[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setTypesLoading(true);
    setTypesError(null);
    directus
      .request(readItems("mmrl_type_fragment", { limit: -1, fields: ["id", "code", "libelle"] }))
      .then((rows) => {
        if (cancelled) return;
        const filtered = (rows as TypeFragmentRow[])
          .filter((t) => RECUEIL_TYPE_CODES.has(t.code))
          .sort(
            (a, b) =>
              RECUEIL_TYPE_ORDER.indexOf(a.code) - RECUEIL_TYPE_ORDER.indexOf(b.code)
          );
        setRecueilTypes(filtered);
        setTypeId((prev) => {
          if (filtered.length === 0) return "";
          const stillValid = prev && filtered.some((t) => String(t.id) === prev);
          if (stillValid) return prev;
          const def = filtered.find((t) => t.code === "temoignage") ?? filtered[0];
          return String(def.id);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setTypesError("Impossible de charger les types de contenu.");
          setRecueilTypes([]);
          setTypeId("");
        }
      })
      .finally(() => {
        if (!cancelled) setTypesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeId) {
      toast.error(typesError || "Les types ne sont pas encore chargés.");
      return;
    }
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
        
        const resp = await directusAuth.request(uploadFiles(formData));
        fichierMediaId = Array.isArray(resp) ? resp[0].id : resp.id;
      }

      const statut_id = isPublic ? STATUT_ID.A_VERIFIER : STATUT_ID.VERIFIE;

      const payload = {
        auteur_user_id: contributor.id,
        type_id: Number(typeId),
        titre: titre.trim() || null,
        contenu: contenu.trim() || null,
        fichier_media: fichierMediaId,
        is_public: isPublic,
        statut_id,
      };

      console.log("[Recueil] Envoi du payload:", payload);

      const res = await directusAuth.request(createItem("mmrl_recueil", payload));
      const newId = (res as { id: number }).id;
      if (isPublic) {
        await notifyAdminsOnCreate(
          "mmrl_recueil",
          newId,
          titre.trim() || "Nouvelle entrée au recueil",
          contributor as any
        );
      }

      toast.success(
        isPublic
          ? "Votre entrée a été envoyée. Elle sera visible publiquement après validation par l'équipe."
          : "Votre entrée a été enregistrée. Vous la retrouvez dans votre profil."
      );
      setOpen(false);
      setTitre("");
      setContenu("");
      setIsPublic(true);
      setMediaFile(null);
      const def = recueilTypes.find((t) => t.code === "temoignage") ?? recueilTypes[0];
      setTypeId(def ? String(def.id) : "");
      onSuccess();
    } catch (err: any) {
      console.error("[Recueil] Erreur complète:", err);
      if (Array.isArray(err?.errors)) {
        console.error("[Recueil] Détails Directus:", err.errors);
      }
      if (err.response?.data?.errors) {
        console.error("[Recueil] Détails (response.data):", err.response.data.errors);
      }
      toast.error("Erreur lors de la création. Vérifiez les détails dans la console.");
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
            {typesError && (
              <p className="text-sm text-destructive">{typesError}</p>
            )}
            <Select
              value={typeId}
              onValueChange={setTypeId}
              disabled={typesLoading || recueilTypes.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={typesLoading ? "Chargement…" : "Choisir un type"}
                />
              </SelectTrigger>
              <SelectContent>
                {recueilTypes.map((t) => {
                  const Icon = TYPE_ICON_BY_CODE[t.code] ?? BookOpen;
                  return (
                    <SelectItem key={t.id} value={String(t.id)}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" /> {t.libelle}
                      </span>
                    </SelectItem>
                  );
                })}
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
            <Button type="submit" disabled={saving || !typeId || typesLoading}>
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
const RecueilCard = ({ entry, pendingValidation }: { entry: RecueilRow; pendingValidation?: boolean }) => {
  const typeCode = (entry.type as any)?.code || "";
  const typeLabel = (entry.type as any)?.libelle || getTypeLabel(typeCode);

  return (
      <Card className="group h-full border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-primary/5 bg-card/50 backdrop-blur-sm flex flex-col cursor-pointer">
      {/* Media preview */}
      {entry.fichier_media && (
        <div className="aspect-video w-full overflow-hidden relative bg-black">
          {recueilEntryIsVideo(entry) ? (
            <video
              className="w-full h-full object-cover"
              src={getAssetUrlWithViewerToken(entry.fichier_media)}
              onMouseOver={e => (e.target as HTMLVideoElement).play()}
              onMouseOut={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
              muted playsInline preload="metadata"
            />
          ) : recueilEntryIsAudio(entry) ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 gap-3 p-4">
              <Mic className="h-12 w-12 text-primary/40" />
              <audio src={getAssetUrlWithViewerToken(entry.fichier_media)} controls className="w-full max-w-xs" />
            </div>
          ) : (
            <img
              src={getAssetUrlWithViewerToken(entry.fichier_media, "width=500&height=300&fit=cover")}
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

        <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground gap-2 flex-wrap">
          <span>
            {entry.date_creation
              ? format(new Date(entry.date_creation), "d MMM yyyy", { locale: fr })
              : "—"}
          </span>
          <span className="flex items-center gap-1.5 flex-wrap justify-end">
            {pendingValidation && (
              <Badge variant="outline" className="text-amber-800 dark:text-amber-200 border-amber-600/40 text-[10px] font-semibold">
                En attente de validation
              </Badge>
            )}
            {entry.is_public ? (
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" /> Public
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Privé
              </span>
            )}
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
  const { user } = useAuth();
  const { entries, loading, refresh } = usePublicRecueil();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  /** Affichage du flux public (validé + en attente pour l’auteur) ou des entrées privées de l’utilisateur. */
  const [visibilityMode, setVisibilityMode] = useState<"public" | "private">("public");
  const [myPendingPublic, setMyPendingPublic] = useState<RecueilRow[]>([]);
  const [myPrivateEntries, setMyPrivateEntries] = useState<RecueilRow[]>([]);
  const [privateLoading, setPrivateLoading] = useState(false);
  const [pendingRev, setPendingRev] = useState(0);

  const refreshAll = useCallback(() => {
    refresh();
    setPendingRev((r) => r + 1);
  }, [refresh]);

  const recueilListFields = [
    "*",
    "type_id.*",
    "statut_id.*",
    "fichier_media.id",
    "fichier_media.filename_download",
    "fichier_media.type",
  ] as const;

  useEffect(() => {
    if (!user) {
      setMyPendingPublic([]);
      setMyPrivateEntries([]);
      setPrivateLoading(false);
      return;
    }
    let cancelled = false;
    directusAuth
      .request(
        readItems("mmrl_recueil", {
          filter: {
            _and: [
              { auteur_user_id: { _eq: user.id } },
              { is_public: { _eq: true } },
              { statut_id: { _eq: STATUT_ID.A_VERIFIER } },
              { deleted_at: { _null: true } },
            ],
          },
          fields: [...recueilListFields],
          sort: ["-date_creation"],
          limit: 50,
        })
      )
      .then((rows) => {
        if (!cancelled) setMyPendingPublic(rows as unknown as RecueilRow[]);
      })
      .catch(() => {
        if (!cancelled) setMyPendingPublic([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user, pendingRev]);

  useEffect(() => {
    if (!user || visibilityMode !== "private") {
      if (visibilityMode !== "private") setMyPrivateEntries([]);
      setPrivateLoading(false);
      return;
    }
    let cancelled = false;
    setPrivateLoading(true);
    directusAuth
      .request(
        readItems("mmrl_recueil", {
          filter: {
            _and: [
              { auteur_user_id: { _eq: user.id } },
              { is_public: { _eq: false } },
              { deleted_at: { _null: true } },
            ],
          },
          fields: [...recueilListFields],
          sort: ["-date_creation"],
          limit: 100,
        })
      )
      .then((rows) => {
        if (!cancelled) setMyPrivateEntries(rows as unknown as RecueilRow[]);
      })
      .catch(() => {
        if (!cancelled) setMyPrivateEntries([]);
      })
      .finally(() => {
        if (!cancelled) setPrivateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, visibilityMode, pendingRev]);

  const displayEntries = useMemo(() => {
    if (visibilityMode === "private" && user) {
      return myPrivateEntries.map((entry) => ({
        entry,
        pendingValidation: false as const,
      }));
    }

    const map = new Map<number, { entry: RecueilRow; pendingValidation: boolean }>();
    for (const e of entries) {
      map.set(e.id, { entry: e, pendingValidation: false });
    }
    for (const p of myPendingPublic) {
      if (!map.has(p.id)) {
        map.set(p.id, { entry: p, pendingValidation: true });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const da = a.entry.date_creation ? new Date(a.entry.date_creation).getTime() : 0;
      const db = b.entry.date_creation ? new Date(b.entry.date_creation).getTime() : 0;
      return db - da;
    });
  }, [visibilityMode, user, myPrivateEntries, entries, myPendingPublic]);

  useEffect(() => {
    if (!user && visibilityMode === "private") {
      setVisibilityMode("public");
    }
  }, [user, visibilityMode]);

  const listLoading = visibilityMode === "private" ? privateLoading : loading;

  const filtered = displayEntries.filter(({ entry: e }) => {
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
              {user ? (
                <AddRecueilDialog contributor={user} onSuccess={refreshAll} />
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

        <div className="flex flex-col gap-6 mb-12">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
            <div className="inline-flex rounded-full border border-border bg-muted/40 p-1 w-fit">
              <Button
                type="button"
                size="sm"
                variant={visibilityMode === "public" ? "default" : "ghost"}
                className="rounded-full gap-1.5"
                onClick={() => setVisibilityMode("public")}
              >
                <Globe className="h-4 w-4" />
                Public
              </Button>
              <Button
                type="button"
                size="sm"
                variant={visibilityMode === "private" ? "default" : "ghost"}
                className="rounded-full gap-1.5"
                disabled={!user}
                title={!user ? "Connectez-vous pour voir vos entrées privées" : undefined}
                onClick={() => user && setVisibilityMode("private")}
              >
                <Lock className="h-4 w-4" />
                Mes entrées privées
              </Button>
            </div>
            {user && visibilityMode === "private" && (
              <p className="text-sm text-muted-foreground max-w-xl">
                Seules vos contributions marquées comme <span className="font-medium text-foreground">privées</span> apparaissent ici. Elles ne sont pas publiées sur le recueil public.
              </p>
            )}
            {!user && (
              <p className="text-sm text-muted-foreground">
                <a href="/auth" className="text-primary underline-offset-4 hover:underline">Connectez-vous</a>
                {" "}pour afficher vos entrées privées.
              </p>
            )}
          </div>

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
        </div>

        {/* Grid */}
        {listLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(({ entry, pendingValidation }, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/recueil/${entry.id}`}
                  className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <RecueilCard entry={entry} pendingValidation={pendingValidation} />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Aucune entrée trouvée</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {visibilityMode === "private"
                ? "Vous n’avez pas encore d’entrée privée dans le recueil, ou adaptez les filtres par type."
                : "Soyez le premier à contribuer à ce recueil ou ajustez vos filtres."}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setActiveTab("all");
                setVisibilityMode("public");
              }}
            >
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
                {RECUEIL_TYPE_ORDER.map((code) => {
                  const Icon = TYPE_ICON_BY_CODE[code];
                  const label = TYPE_LABEL_FALLBACK[code] ?? code;
                  return (
                  <div key={code} className="flex items-center gap-2 text-sm text-foreground/80">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    {label}
                  </div>
                  );
                })}
              </div>
              {user ? (
                <AddRecueilDialog contributor={user} onSuccess={refreshAll} />
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
