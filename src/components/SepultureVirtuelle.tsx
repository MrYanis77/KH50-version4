import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createItem, updateItem } from "@directus/sdk";
import { directus } from "@/integration/directus";
import { useAuth } from "@/contexts/AuthContext";
import { useSepulture } from "@/hooks/useDirectus";
import {
  STATUT_ID,
  TYPE_SEPULTURE_LABELS,
  type TypeSepulture,
  type VictimeRow,
} from "@/integration/directus-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Flame, Loader2, Plus, Lock, Heart } from "lucide-react";
import { toast } from "sonner";

interface SepultureVirtuelleProps {
  victime: VictimeRow;
}

const SEPULTURE_OPTIONS: { value: TypeSepulture; label: string; emoji: string }[] = [
  { value: "stupa", label: TYPE_SEPULTURE_LABELS.stupa, emoji: "🛕" },
  { value: "autel", label: TYPE_SEPULTURE_LABELS.autel, emoji: "🕯️" },
  { value: "jardin", label: TYPE_SEPULTURE_LABELS.jardin, emoji: "🌸" },
];

export const SepultureVirtuelle = ({ victime }: SepultureVirtuelleProps) => {
  const { user, temoin } = useAuth();
  const navigate = useNavigate();
  const { sepulture, loading, error, refresh } = useSepulture(victime.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [lightingCandle, setLightingCandle] = useState(false);

  const handleCreateClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCreateOpen(true);
  };

  const handleLightCandle = async () => {
    if (!sepulture) return;
    setLightingCandle(true);
    try {
      await directus.request(
        updateItem("mmrl_sepultures" as any, sepulture.id, {
          nb_bougies: (sepulture.nb_bougies ?? 0) + 1,
        } as any)
      );
      toast.success("Une bougie a été allumée en mémoire de " + victime.prenom + " " + victime.nom);
      refresh();
    } catch (err: any) {
      console.error("[Sepulture] light candle error:", err);
      toast.error("Impossible d'allumer la bougie pour le moment.");
    } finally {
      setLightingCandle(false);
    }
  };

  if (loading) {
    return (
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-muted-foreground text-sm text-center py-8">Chargement de la sépulture…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-destructive text-sm text-center py-8">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 px-4">
      <div className="container mx-auto max-w-4xl">
        <h2 className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2 flex items-center gap-2">
          <Heart className="h-5 w-5 text-accent" />
          Sépulture virtuelle
        </h2>

        {!sepulture ? (
          <EmptySepulture onCreate={handleCreateClick} connected={!!user} />
        ) : (
          <SepultureView
            sepulture={sepulture}
            victime={victime}
            onLightCandle={handleLightCandle}
            lighting={lightingCandle}
          />
        )}
      </div>

      <CreateSepultureDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        victime={victime}
        temoinId={temoin?.id ?? null}
        onSuccess={() => { setCreateOpen(false); refresh(); }}
      />
    </section>
  );
};

// ── Vue « pas encore de sépulture » ─────────────────────────────────────────

const EmptySepulture = ({ onCreate, connected }: { onCreate: () => void; connected: boolean }) => (
  <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/20">
    <div className="text-5xl mb-4 opacity-40">🛕</div>
    <p className="text-muted-foreground mb-4">Aucune sépulture virtuelle n'a encore été créée.</p>
    <Button onClick={onCreate} className="gap-2">
      {connected ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      {connected ? "Créer une sépulture virtuelle" : "Connexion requise"}
    </Button>
  </div>
);

// ── Vue d'une sépulture existante ──────────────────────────────────────────

interface SepultureViewProps {
  sepulture: ReturnType<typeof useSepulture>["sepulture"];
  victime: VictimeRow;
  onLightCandle: () => void;
  lighting: boolean;
}

const SepultureView = ({ sepulture, victime, onLightCandle, lighting }: SepultureViewProps) => {
  if (!sepulture) return null;

  const typeConf = SEPULTURE_OPTIONS.find((o) => o.value === sepulture.type_sepulture) ?? SEPULTURE_OPTIONS[0];
  const isHypothese = sepulture.statut_id !== STATUT_ID.VERIFIE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`rounded-3xl border shadow-sm overflow-hidden ${
        isHypothese ? "border-yellow-400 bg-yellow-50/60 dark:bg-yellow-900/10" : "border-border bg-card"
      }`}
    >
      {/* Zone cérémonielle (dégradé selon le type) */}
      <div
        className={`py-12 px-6 text-center ${
          sepulture.type_sepulture === "stupa"
            ? "bg-gradient-to-b from-amber-100/60 via-orange-50/40 to-transparent dark:from-amber-900/30 dark:via-orange-900/20"
            : sepulture.type_sepulture === "autel"
            ? "bg-gradient-to-b from-rose-100/60 via-red-50/40 to-transparent dark:from-rose-900/30 dark:via-red-900/20"
            : "bg-gradient-to-b from-emerald-100/60 via-green-50/40 to-transparent dark:from-emerald-900/30 dark:via-green-900/20"
        }`}
      >
        <div className="text-6xl mb-4">{typeConf.emoji}</div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-mono mb-2">
          {typeConf.label}
        </p>
        <h3 className="font-display text-2xl text-foreground">
          En mémoire de {victime.prenom} <span className="uppercase">{victime.nom}</span>
        </h3>
        {sepulture.epitaphe && (
          <p className="mt-4 text-foreground/80 italic font-serif text-lg max-w-xl mx-auto leading-relaxed">
            « {sepulture.epitaphe} »
          </p>
        )}
      </div>

      {/* Corps */}
      <div className="p-6 space-y-6">
        {sepulture.message && (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Message</p>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{sepulture.message}</p>
          </div>
        )}

        {/* Bougies */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Flame className="h-8 w-8 text-amber-500" />
              <div className="absolute inset-0 blur-md bg-amber-400/40 rounded-full animate-pulse pointer-events-none" />
            </div>
            <div>
              <p className="text-2xl font-display font-semibold text-foreground">
                {sepulture.nb_bougies ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {(sepulture.nb_bougies ?? 0) <= 1 ? "bougie allumée" : "bougies allumées"}
              </p>
            </div>
          </div>
          <Button onClick={onLightCandle} disabled={lighting} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white">
            {lighting ? <><Loader2 className="h-4 w-4 animate-spin" /> …</> : <><Flame className="h-4 w-4" /> Allumer une bougie</>}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Dialog de création ─────────────────────────────────────────────────────

interface CreateSepultureDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  victime: VictimeRow;
  temoinId: number | null;
  onSuccess: () => void;
}

const CreateSepultureDialog = ({ open, onOpenChange, victime, temoinId, onSuccess }: CreateSepultureDialogProps) => {
  const [typeSepulture, setTypeSepulture] = useState<TypeSepulture>("stupa");
  const [epitaphe, setEpitaphe] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTypeSepulture("stupa");
    setEpitaphe("");
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await directus.request(
        createItem("mmrl_sepultures" as any, {
          victime_id: victime.id,
          auteur_temoin_id: temoinId,
          type_sepulture: typeSepulture,
          epitaphe: epitaphe.trim() || null,
          message: message.trim() || null,
          nb_bougies: 0,
          statut_id: STATUT_ID.A_VERIFIER,
        } as any)
      );
      toast.success("La sépulture virtuelle a été créée. Elle sera publiée après vérification.");
      reset();
      onSuccess();
    } catch (err: any) {
      console.error("[Sepulture] create error:", err);
      const detail = err?.errors?.[0]?.message || err?.message || "Erreur inconnue";
      if (typeof detail === "string" && detail.toLowerCase().includes("unique")) {
        toast.error("Une sépulture existe déjà pour cette personne.");
      } else {
        toast.error(`Erreur : ${detail}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[560px] bg-background border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">
            Créer une sépulture virtuelle
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pour <strong>{victime.prenom} {victime.nom}</strong>. Vous pouvez choisir un type de sépulture, laisser une épitaphe et un message.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Type de sépulture</Label>
            <Select value={typeSepulture} onValueChange={(v) => setTypeSepulture(v as TypeSepulture)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEPULTURE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.emoji} {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Épitaphe (optionnel)</Label>
            <Textarea
              value={epitaphe}
              onChange={(e) => setEpitaphe(e.target.value)}
              placeholder="Une phrase courte à la mémoire de la personne…"
              rows={2}
              maxLength={280}
            />
            <p className="text-xs text-muted-foreground text-right">{epitaphe.length}/280</p>
          </div>

          <div className="space-y-2">
            <Label>Message (optionnel)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Un message plus long, une dédicace, un souvenir…"
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Création…</> : "Créer la sépulture"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SepultureVirtuelle;
