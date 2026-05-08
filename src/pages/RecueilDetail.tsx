import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  MessageSquare,
  Camera,
  Video,
  FileText,
  Mic,
  Globe,
  Lock,
  ShieldCheck,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRecueilDetail } from "@/hooks/useDirectus";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAssetUrlWithViewerToken, recueilEntryIsVideo, recueilEntryIsAudio } from "@/integration/directus";
import type { RecueilRow, TypeFragmentCode } from "@/integration/directus-types";
import { STATUT_ID } from "@/integration/directus-types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

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

function statutNum(row: RecueilRow): number {
  const s = row.statut_id;
  if (s == null) return 0;
  if (typeof s === "object" && "id" in s) return Number((s as { id: number }).id);
  return Number(s);
}

function typeCode(row: RecueilRow): string {
  const t = row.type as { code?: string } | undefined;
  return t?.code || "";
}

function typeLabel(row: RecueilRow): string {
  const t = row.type as { libelle?: string; code?: string } | undefined;
  if (t?.libelle) return t.libelle;
  const c = t?.code as TypeFragmentCode | undefined;
  return (c && TYPE_LABEL_FALLBACK[c]) || "Contribution";
}

function TypeIcon({ row }: { row: RecueilRow }) {
  const code = typeCode(row) as TypeFragmentCode | undefined;
  const Icon = (code && TYPE_ICON_BY_CODE[code]) || BookOpen;
  return <Icon className="h-4 w-4" />;
}

const RecueilDetail = () => {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const numericId = useMemo(() => {
    const n = Number(idParam);
    return Number.isFinite(n) ? n : null;
  }, [idParam]);

  const { entry, loading, error } = useRecueilDetail(numericId, user?.id ?? null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Chargement…</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="font-display text-2xl text-foreground">{error || "Entrée introuvable"}</h1>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <Button asChild variant="default">
              <Link to="/recueil">Voir le recueil</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const sid = statutNum(entry);
  const isPendingPublic = entry.is_public && sid === STATUT_ID.A_VERIFIER;
  const isVerifiedPublic = entry.is_public && sid === STATUT_ID.VERIFIE;
  const isVideo = recueilEntryIsVideo(entry);
  const isAudio = recueilEntryIsAudio(entry);
  const mediaUrl = (params = "") => getAssetUrlWithViewerToken(entry.fichier_media, params);
  const author = entry.auteur_user;
  const authorLabel =
    author && typeof author === "object"
      ? [author.first_name, author.last_name].filter(Boolean).join(" ").trim() || null
      : null;

  const title = entry.titre?.trim() || "Contribution au recueil";

  return (
    <div className="min-h-screen bg-background font-body">
      <motion.section
        className="pt-24 pb-8 px-4 border-b border-border/60"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <div className="container mx-auto max-w-4xl">
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-8">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="border-border">
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/recueil">Recueil</Link>
            </Button>
          </motion.div>

          {isVerifiedPublic && (
            <motion.div variants={fadeUp} className="mb-6">
              <Alert className="border-emerald-500/40 bg-emerald-50/70 text-foreground dark:bg-emerald-950/25 dark:border-emerald-500/30">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <AlertTitle className="text-emerald-900 dark:text-emerald-100">Contribution validée</AlertTitle>
                <AlertDescription className="text-emerald-800/90 dark:text-emerald-100/85">
                  Cette entrée a été vérifiée par l&apos;équipe et est publiée dans le recueil.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {isPendingPublic && (
            <motion.div variants={fadeUp} className="mb-6">
              <Alert>
                <AlertTitle>En attente de validation</AlertTitle>
                <AlertDescription>
                  Votre contribution publique sera visible par tous après validation par l&apos;équipe.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {!entry.is_public && (
            <motion.div variants={fadeUp} className="mb-6">
              <Alert className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                <Lock className="h-4 w-4" />
                <AlertTitle>Entrée privée</AlertTitle>
                <AlertDescription>
                  Visible uniquement par vous dans votre profil et sur ce lien lorsque vous êtes connecté.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <TypeIcon row={entry} />
                {typeLabel(entry)}
              </Badge>
              {entry.is_public ? (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <Globe className="h-3 w-3" /> Public
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" /> Privé
                </Badge>
              )}
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">{title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {entry.date_creation && (
                <span>
                  {format(new Date(entry.date_creation), "d MMMM yyyy", { locale: fr })}
                </span>
              )}
              {authorLabel && (
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 shrink-0" />
                  {authorLabel}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {entry.fichier_media && (
        <motion.section
          className="py-10 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2">
              Média
            </motion.h2>
            <motion.div variants={fadeUp} className="rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-black/20 shadow-lg">
              {isVideo ? (
                <video
                  key={mediaUrl()}
                  className="w-full max-h-[70vh]"
                  controls
                  playsInline
                  preload="metadata"
                  src={mediaUrl()}
                />
              ) : isAudio ? (
                <div className="p-8 md:p-12 flex flex-col items-center gap-6 bg-gradient-to-br from-primary/10 to-primary/5">
                  <Mic className="h-16 w-16 text-primary/50" />
                  <audio src={mediaUrl()} controls className="w-full max-w-lg" />
                </div>
              ) : (
                <img
                  src={mediaUrl("width=1200&fit=inside")}
                  alt={title}
                  className="w-full h-auto object-contain max-h-[80vh] mx-auto"
                />
              )}
            </motion.div>
          </div>
        </motion.section>
      )}

      {entry.contenu?.trim() && (
        <motion.section
          className="py-10 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2">
              Texte
            </motion.h2>
            <motion.div
              variants={fadeUp}
              className="max-w-none text-foreground text-lg leading-relaxed whitespace-pre-wrap rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8"
            >
              {entry.contenu}
            </motion.div>
          </div>
        </motion.section>
      )}

      {!entry.contenu?.trim() && !entry.fichier_media && (
        <div className="container mx-auto max-w-4xl px-4 py-12 text-center text-muted-foreground">
          Aucun contenu texte ni média associé à cette entrée.
        </div>
      )}
    </div>
  );
};

export default RecueilDetail;
