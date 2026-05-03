import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createItem, readItems } from "@directus/sdk";
import { directus } from "@/integration/directus";
import { useAuth } from "@/contexts/AuthContext";
import { useRelationsFamiliales } from "@/hooks/useDirectus";
import {
  STATUT_ID,
  TYPE_RELATION_LABELS,
  type TypeRelationCode,
  type VictimeRow,
  type RelationFamilialeRow,
} from "@/integration/directus-types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Loader2, Lock, Search } from "lucide-react";
import { toast } from "sonner";

interface FamilySpiderGraphProps {
  victime: VictimeRow;
  onRefresh?: () => void;
}

const RELATION_OPTIONS: { value: TypeRelationCode; label: string }[] = [
  { value: "conjoint", label: TYPE_RELATION_LABELS.conjoint },
  { value: "parent", label: TYPE_RELATION_LABELS.parent },
  { value: "enfant", label: TYPE_RELATION_LABELS.enfant },
  { value: "frere_soeur", label: TYPE_RELATION_LABELS.frere_soeur },
  { value: "autre", label: TYPE_RELATION_LABELS.autre },
];

// ── Graphe SVG ───────────────────────────────────────────────────────────────

const SIZE = 520;
const CENTER = SIZE / 2;
const SATELLITE_RADIUS = 190;
const CENTER_NODE_R = 54;
const SATELLITE_NODE_R = 42;

interface NodeLayout {
  relation: RelationFamilialeRow;
  x: number;
  y: number;
  label: string;
  linkId: number | null;
}

function useSatellitePositions(relations: RelationFamilialeRow[]): NodeLayout[] {
  return useMemo(() => {
    const n = relations.length;
    if (n === 0) return [];
    return relations.map((r, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const x = CENTER + SATELLITE_RADIUS * Math.cos(angle);
      const y = CENTER + SATELLITE_RADIUS * Math.sin(angle);
      const linked = r.victime_b as VictimeRow | null;
      const label = linked
        ? `${linked.prenom} ${linked.nom}`
        : r.nom_relatif_externe || "Inconnu·e";
      return { relation: r, x, y, label, linkId: linked?.id ?? null };
    });
  }, [relations]);
}

// ── Composant principal ─────────────────────────────────────────────────────

export const FamilySpiderGraph = ({ victime, onRefresh }: FamilySpiderGraphProps) => {
  const { user, temoin } = useAuth();
  const navigate = useNavigate();
  const { relations, loading, error, refresh } = useRelationsFamiliales(victime.id);
  const [dialogOpen, setDialogOpen] = useState(false);

  const nodes = useSatellitePositions(relations);

  const handleAddClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    refresh();
    onRefresh?.();
  };

  return (
    <section className="py-10 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-6 border-b border-border pb-2">
          <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Liens de parenté
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddClick}
            className="gap-2"
          >
            {user ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {user ? "Ajouter un lien" : "Connexion requise"}
          </Button>
        </div>

        {loading && (
          <p className="text-muted-foreground text-sm py-8 text-center">Chargement des liens…</p>
        )}

        {error && (
          <p className="text-destructive text-sm py-8 text-center">{error}</p>
        )}

        {!loading && !error && relations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border bg-muted/20">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun lien de parenté enregistré pour le moment.</p>
            {user && (
              <p className="text-xs mt-2">
                Cliquez sur « Ajouter un lien » pour en créer un.
              </p>
            )}
          </div>
        )}

        {!loading && !error && relations.length > 0 && (
          <div className="w-full flex justify-center overflow-x-auto">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="w-full max-w-[560px] h-auto"
              role="img"
              aria-label={`Araignée des liens de parenté de ${victime.prenom} ${victime.nom}`}
            >
              {/* Liens */}
              {nodes.map((node) => (
                <line
                  key={`line-${node.relation.id}`}
                  x1={CENTER}
                  y1={CENTER}
                  x2={node.x}
                  y2={node.y}
                  stroke={node.relation.statut_id === STATUT_ID.VERIFIE ? "hsl(var(--accent))" : "#FACC15"}
                  strokeWidth={node.relation.statut_id === STATUT_ID.VERIFIE ? 2 : 1.5}
                  strokeDasharray={node.relation.statut_id === STATUT_ID.VERIFIE ? undefined : "6 4"}
                  opacity={0.55}
                />
              ))}

              {/* Libellés des relations (sur les liens) */}
              {nodes.map((node) => {
                const midX = (CENTER + node.x) / 2;
                const midY = (CENTER + node.y) / 2;
                return (
                  <g key={`label-${node.relation.id}`}>
                    <rect
                      x={midX - 44}
                      y={midY - 10}
                      width={88}
                      height={20}
                      rx={10}
                      fill="hsl(var(--background))"
                      stroke="hsl(var(--border))"
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fontSize={11}
                      fill="hsl(var(--foreground))"
                      className="font-mono"
                    >
                      {TYPE_RELATION_LABELS[node.relation.type_relation]}
                    </text>
                  </g>
                );
              })}

              {/* Nœud central (victime courante) */}
              <g>
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={CENTER_NODE_R}
                  fill="hsl(var(--accent))"
                  stroke="hsl(var(--background))"
                  strokeWidth={4}
                />
                <text
                  x={CENTER}
                  y={CENTER - 4}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight="bold"
                  fill="hsl(var(--accent-foreground))"
                >
                  {victime.prenom}
                </text>
                <text
                  x={CENTER}
                  y={CENTER + 12}
                  textAnchor="middle"
                  fontSize={11}
                  fill="hsl(var(--accent-foreground))"
                >
                  {victime.nom}
                </text>
              </g>

              {/* Nœuds satellites */}
              {nodes.map((node) => {
                const isYellow = node.relation.statut_id !== STATUT_ID.VERIFIE;
                const clickable = node.linkId != null;
                const handleClick = () => {
                  if (clickable) navigate(`/memorial/${node.linkId}`);
                };
                return (
                  <g
                    key={`node-${node.relation.id}`}
                    onClick={handleClick}
                    style={{ cursor: clickable ? "pointer" : "default" }}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={SATELLITE_NODE_R}
                      fill="hsl(var(--card))"
                      stroke={isYellow ? "#FACC15" : "hsl(var(--accent))"}
                      strokeWidth={2}
                    />
                    <text
                      x={node.x}
                      y={node.y - 4}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight="bold"
                      fill="hsl(var(--foreground))"
                    >
                      {truncate(firstName(node.label), 12)}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 10}
                      textAnchor="middle"
                      fontSize={10}
                      fill="hsl(var(--muted-foreground))"
                    >
                      {truncate(lastName(node.label), 12)}
                    </text>
                    {clickable && (
                      <text
                        x={node.x}
                        y={node.y + 22}
                        textAnchor="middle"
                        fontSize={8}
                        fill="hsl(var(--accent))"
                      >
                        voir →
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Légende */}
        {!loading && relations.length > 0 && (
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-[2px] bg-accent" />
              Avéré
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-[2px] border-t-2 border-yellow-400 border-dashed" />
              Hypothèse
            </span>
          </div>
        )}
      </div>

      <AddRelationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        victime={victime}
        temoinId={temoin?.id ?? null}
        onSuccess={handleSuccess}
      />
    </section>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? "";
}
function lastName(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts.slice(1).join(" ");
}
function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

// ── Dialog d'ajout ──────────────────────────────────────────────────────────

interface AddRelationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  victime: VictimeRow;
  temoinId: number | null;
  onSuccess: () => void;
}

const AddRelationDialog = ({ open, onOpenChange, victime, temoinId, onSuccess }: AddRelationDialogProps) => {
  const [mode, setMode] = useState<"existant" | "externe">("externe");
  const [typeRelation, setTypeRelation] = useState<TypeRelationCode>("parent");
  const [description, setDescription] = useState("");
  const [nomExterne, setNomExterne] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<VictimeRow[]>([]);
  const [selectedVictime, setSelectedVictime] = useState<VictimeRow | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Recherche debounced des victimes existantes
  useEffect(() => {
    if (mode !== "existant" || search.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await directus.request(
          readItems("mmrl_victimes", {
            fields: ["id", "prenom", "nom", "annee_naissance", "annee_deces", "statut_id"],
            filter: {
              _and: [
                { deleted_at: { _null: true } },
                { id: { _neq: victime.id } },
                {
                  _or: [
                    { prenom: { _icontains: search } },
                    { nom: { _icontains: search } },
                  ],
                },
              ],
            },
            limit: 10,
          })
        );
        setResults(data as unknown as VictimeRow[]);
      } catch (e) {
        console.error("[FamilySpider] search error:", e);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, mode, victime.id]);

  const reset = () => {
    setMode("externe");
    setTypeRelation("parent");
    setDescription("");
    setNomExterne("");
    setSearch("");
    setResults([]);
    setSelectedVictime(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "externe" && !nomExterne.trim()) {
      toast.error("Veuillez renseigner le nom du relatif.");
      return;
    }
    if (mode === "existant" && !selectedVictime) {
      toast.error("Veuillez sélectionner une victime existante.");
      return;
    }

    setSubmitting(true);
    try {
      await directus.request(
        createItem("mmrl_relations_familiales" as any, {
          victime_id_a: victime.id,
          victime_id_b: mode === "existant" ? selectedVictime!.id : null,
          nom_relatif_externe: mode === "externe" ? nomExterne.trim() : null,
          type_relation: typeRelation,
          description: description.trim() || null,
          auteur_temoin_id: temoinId,
          statut_id: STATUT_ID.A_VERIFIER,
        } as any)
      );

      toast.success("Lien de parenté ajouté. Il sera publié après vérification.");
      reset();
      onSuccess();
    } catch (err: any) {
      console.error("[FamilySpider] create error:", err);
      const detail = err?.errors?.[0]?.message || err?.message || "Erreur inconnue";
      toast.error(`Erreur : ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-[560px] bg-background border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">
            Ajouter un lien de parenté
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Reliez <strong>{victime.prenom} {victime.nom}</strong> à un·e proche.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
          {/* Sélection du mode */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-full">
            <button
              type="button"
              onClick={() => setMode("externe")}
              className={`flex-1 text-sm rounded-full px-4 py-2 transition-colors ${
                mode === "externe" ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Saisir un nom
            </button>
            <button
              type="button"
              onClick={() => setMode("existant")}
              className={`flex-1 text-sm rounded-full px-4 py-2 transition-colors ${
                mode === "existant" ? "bg-background shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              Victime existante
            </button>
          </div>

          {/* Type de relation */}
          <div className="space-y-2">
            <Label>Type de lien *</Label>
            <Select value={typeRelation} onValueChange={(v) => setTypeRelation(v as TypeRelationCode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATION_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "externe" ? (
            <div className="space-y-2">
              <Label>Nom du relatif *</Label>
              <Input
                value={nomExterne}
                onChange={(e) => setNomExterne(e.target.value)}
                placeholder="Prénom et nom"
                required
              />
              <p className="text-xs text-muted-foreground">
                Utilisez cette option si le relatif ne figure pas encore dans le mémorial.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Rechercher une victime</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setSelectedVictime(null); }}
                  placeholder="Tapez au moins 2 caractères…"
                  className="pl-10"
                />
              </div>
              {searching && (
                <p className="text-xs text-muted-foreground">Recherche…</p>
              )}
              {!searching && search.length >= 2 && results.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucun résultat</p>
              )}
              {results.length > 0 && (
                <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border">
                  {results.map((v) => (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => { setSelectedVictime(v); setSearch(`${v.prenom} ${v.nom}`); setResults([]); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors ${
                        selectedVictime?.id === v.id ? "bg-accent/15" : ""
                      }`}
                    >
                      <span className="font-medium">{v.prenom} {v.nom}</span>
                      {(v.annee_naissance || v.annee_deces) && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({v.annee_naissance ?? "?"} — {v.annee_deces ?? "?"})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedVictime && (
                <Badge variant="secondary" className="mt-2">
                  Sélectionné·e : {selectedVictime.prenom} {selectedVictime.nom}
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisions sur ce lien de parenté…"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : "Ajouter le lien"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FamilySpiderGraph;
