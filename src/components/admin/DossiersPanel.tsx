import { useState } from "react";
import { directus } from "@/integration/directus";
import { updateItem } from "@directus/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, User, Trash2, ChevronDown, ChevronRight,
  History, Clock, MapPin, Briefcase, Mail, Phone,
  Users, UserCheck, Puzzle, FileText, Camera, Video,
  Quote, Mic, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AddVictimeDialog from "@/components/AddVictimeDialog";
import type {
  VictimeRow, TemoinRow, ParcoursRow, FragmentRow,
  SourceTemoignageRow,
} from "@/integration/directus-types";
import { STATUT_ID, TYPE_FRAGMENT_ID } from "@/integration/directus-types";

// =============================================================================
// Types
// =============================================================================
interface DossiersPanelProps {
  victimes: VictimeRow[];
  temoins: TemoinRow[];
  sources: SourceTemoignageRow[];
  parcours: ParcoursRow[];
  fragments: FragmentRow[];
  setVictimes: (fn: (prev: VictimeRow[]) => VictimeRow[]) => void;
  setTemoins: (fn: (prev: TemoinRow[]) => TemoinRow[]) => void;
  setSources: (fn: (prev: SourceTemoignageRow[]) => SourceTemoignageRow[]) => void;
  setParcours: (fn: (prev: ParcoursRow[]) => ParcoursRow[]) => void;
  setFragments: (fn: (prev: FragmentRow[]) => FragmentRow[]) => void;
  onRefresh: () => void;
}

type StatutFilter = "tous" | "verifie" | "a_verifier" | "non_fiable";

type DirectusCollection =
  | "mmrl_victimes"
  | "mmrl_temoins"
  | "mmrl_parcours"
  | "mmrl_fragments"
  | "mmrl_sources_temoignage";

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string;

const DEFAULT_STATUT = STATUT_ID.A_VERIFIER;

/** Helper to get ID from a potentially expanded relation object */
const getId = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === 'object' && val.id !== undefined) return Number(val.id);
  return Number(val);
};

function normalizeStatutId(raw: any): number {
  const id = getId(raw);
  return id === 0 ? DEFAULT_STATUT : id;
}

// =============================================================================
// Sub-components
// =============================================================================

/** Inline coloured status badge */
function StatutBadge({
  statut_id,
  type = "victime",
}: {
  statut_id: number;
  type?: "victime" | "temoin";
}) {
  if (type === "temoin") {
    if (statut_id === STATUT_ID.VERIFIE)
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">
          ✔ Vérifié
        </span>
      );
    if (statut_id === STATUT_ID.NON_FIABLE)
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">
          ✗ Non fiable
        </span>
      );
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300 font-medium">
        🟡 À vérifier
      </span>
    );
  }

  if (statut_id === STATUT_ID.VERIFIE)
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-gray-700 border border-gray-200 font-medium dark:bg-zinc-800 dark:text-gray-300">
        ✔ Avéré
      </span>
    );
  if (statut_id === STATUT_ID.NON_FIABLE)
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">
        ✗ Non fiable
      </span>
    );
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300 font-medium">
      🟡 À vérifier
    </span>
  );
}

const VICTIME_OPTIONS = [
  { value: STATUT_ID.A_VERIFIER, label: "🟡 À vérifier" },
  { value: STATUT_ID.VERIFIE, label: "✔ Avéré" },
  { value: STATUT_ID.NON_FIABLE, label: "✗ Non fiable" },
];

const TEMOIN_OPTIONS = [
  { value: STATUT_ID.A_VERIFIER, label: "🟡 À vérifier" },
  { value: STATUT_ID.VERIFIE, label: "✔ Vérifié" },
  { value: STATUT_ID.NON_FIABLE, label: "✗ Non fiable" },
];

const GENERIC_OPTIONS = VICTIME_OPTIONS;

// FIX : un seul composant StatutSelect (le doublon causait l'erreur de compilation)
function StatutSelect({
  value,
  options,
  onChange,
}: {
  value: number;
  options: { value: number; label: string }[];
  onChange: (val: number) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="h-7 w-[115px] text-[10px] px-2 bg-background/50 border-muted-foreground/20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={String(opt.value)}
            className="text-[10px]"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Icon for a fragment type_id */
function FragmentTypeIcon({ type_id }: { type_id: number }) {
  switch (type_id) {
    case TYPE_FRAGMENT_ID.TEMOIGNAGE: return <Quote className="h-2 w-2 mr-1" />;
    case TYPE_FRAGMENT_ID.PHOTOGRAPHIE: return <Camera className="h-2 w-2 mr-1" />;
    case TYPE_FRAGMENT_ID.VIDEO: return <Video className="h-2 w-2 mr-1" />;
    case TYPE_FRAGMENT_ID.AUDIO: return <Mic className="h-2 w-2 mr-1" />;
    default: return <FileText className="h-2 w-2 mr-1" />;
  }
}

// =============================================================================
// Main component
// =============================================================================
export function DossiersPanel({
  victimes,
  temoins,
  sources,
  parcours,
  fragments,
  setVictimes,
  setTemoins,
  setSources,
  setParcours,
  setFragments,
  onRefresh,
}: DossiersPanelProps) {
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<StatutFilter>("tous");
  const [expandedTemoins, setExpandedTemoins] = useState<Set<number>>(new Set());
  const [expandedVictimes, setExpandedVictimes] = useState<Set<number>>(new Set());
  const [viewingItem, setViewingItem] = useState<{ type: string; data: any } | null>(null);

  const toggleTemoin = (id: number) =>
    setExpandedTemoins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleVictime = (id: number) =>
    setExpandedVictimes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleOpenItem = (type: string, id: number) => {
    // Detail view removed per user request
  };

  // ---------------------------------------------------------------------------
  // Status update with propagation
  // ---------------------------------------------------------------------------
  const handleStatus = async (
    col: DirectusCollection,
    id: number,
    val: number
  ) => {
    try {
      await directus.request(updateItem(col as any, id, { statut_id: val }));

      if (col === "mmrl_victimes") {
        const v = victimes.find((x) => x.id === id);
        const temoinId = v ? getId(v.auteur_temoin_id) : 0;
        
        if (temoinId) {
          await directus.request(
            updateItem("mmrl_temoins" as any, temoinId, { statut_id: val })
          );
          setTemoins((p) =>
            p.map((t) => (t.id === temoinId ? { ...t, statut_id: val } : t))
          );
        }
        setVictimes((p) =>
          p.map((vv) => (vv.id === id ? { ...vv, statut_id: val } : vv))
        );
      } else if (col === "mmrl_temoins") {
        const linked = victimes.filter((v) => getId(v.auteur_temoin_id) === id);
        for (const v of linked) {
          await directus.request(
            updateItem("mmrl_victimes" as any, v.id, { statut_id: val })
          );
        }
        setVictimes((p) =>
          p.map((v) =>
            getId(v.auteur_temoin_id) === id ? { ...v, statut_id: val } : v
          )
        );
        setTemoins((p) =>
          p.map((t) => (t.id === id ? { ...t, statut_id: val } : t))
        );
      } else if (col === "mmrl_sources_temoignage") {
        setSources((p) =>
          p.map((s) => (s.id === id ? { ...s, statut_id: val } : s))
        );
      } else if (col === "mmrl_parcours") {
        setParcours((p) =>
          p.map((e) => (e.id === id ? { ...e, statut_id: val } : e))
        );
      } else if (col === "mmrl_fragments") {
        setFragments((p) =>
          p.map((f) => (f.id === id ? { ...f, statut_id: val } : f))
        );
      }

      toast.success("Statut mis à jour");
    } catch (err: any) {
      console.error("handleStatus error:", err);
      toast.error(`Erreur : ${err?.message ?? "Vérifiez vos permissions"}`);
    }
  };

  // ---------------------------------------------------------------------------
  // Soft-delete
  // ---------------------------------------------------------------------------
  const handleDelete = async (col: DirectusCollection, id: number, setter: any) => {
    if (!confirm("Archiver cet élément ?")) return;
    try {
      await directus.request(
        updateItem(col as any, id, { deleted_at: new Date().toISOString() })
      );
      toast.success("Archivé avec succès");
      onRefresh();
    } catch (err: any) {
      console.error("handleDelete error:", err);
      toast.error(`Erreur suppression : ${err?.message ?? "inconnue"}`);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const getSourceName = (id: number) => {
    const s = sources.find((src) => src.id === id);
    return s ? `${s.prenom} ${s.nom}` : `Source #${id}`;
  };

  // ---------------------------------------------------------------------------
  // Filtered list
  // ---------------------------------------------------------------------------
  const q = search.toLowerCase();

  const filteredTemoins = temoins.filter((t) => {
    const myVictimes = victimes.filter((v) => getId(v.auteur_temoin_id) === t.id);
    const matchTemoin = `${t.prenom} ${t.nom} ${t.email ?? ""}`.toLowerCase().includes(q);
    const matchVictime = myVictimes.some((v) =>
      `${v.prenom} ${v.nom}`.toLowerCase().includes(q)
    );
    const matchStatut =
      filterStatut === "tous" ||
      myVictimes.some((v) => {
        const sid = normalizeStatutId(v.statut_id);
        if (filterStatut === "verifie") return sid === STATUT_ID.VERIFIE;
        if (filterStatut === "non_fiable") return sid === STATUT_ID.NON_FIABLE;
        return sid === STATUT_ID.A_VERIFIER;
      });
    return (matchTemoin || matchVictime) && matchStatut;
  });

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-3">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between pb-2 border-b border-border">
        <div className="flex gap-3 flex-1 flex-wrap items-center">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, email, lieu…"
              className="pl-9 h-8 text-sm"
            />
          </div>
          <Select
            value={filterStatut}
            onValueChange={(v) => setFilterStatut(v as StatutFilter)}
          >
            <SelectTrigger className="h-8 w-44 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les statuts</SelectItem>
              <SelectItem value="a_verifier">🟡 À vérifier</SelectItem>
              <SelectItem value="verifie">✔ Avéré</SelectItem>
              <SelectItem value="non_fiable">✗ Non fiable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">
            {victimes.length} victime{victimes.length > 1 ? "s" : ""} ·{" "}
            {temoins.length} témoin{temoins.length > 1 ? "s" : ""}
          </span>
          <AddVictimeDialog onSuccess={onRefresh} />
        </div>
      </div>

      {/* ── Empty state ── */}
      {filteredTemoins.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>Aucun dossier trouvé.</p>
        </div>
      )}

      {/* ── Témoin rows ── */}
      {filteredTemoins.map((t) => {
        const myVictimes = victimes.filter(
          (v) => getId(v.auteur_temoin_id) === t.id
        );
        const temoinExpanded = expandedTemoins.has(t.id);

        return (
          <div
            key={t.id}
            className="border border-border rounded-xl overflow-hidden bg-card shadow-sm"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors select-none"
              onClick={() => toggleTemoin(t.id)}
            >
              <span className="text-muted-foreground shrink-0">
                {temoinExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </span>
              <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                <UserCheck className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">
                    {t.prenom} {t.nom}
                  </span>
                  <StatutBadge statut_id={normalizeStatutId(t.statut_id)} type="temoin" />
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {myVictimes.length} victime{myVictimes.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <StatutSelect
                  value={normalizeStatutId(t.statut_id)}
                  options={TEMOIN_OPTIONS}
                  onChange={(val) => handleStatus("mmrl_temoins", t.id, val)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleDelete("mmrl_temoins", t.id, setTemoins)}
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            </div>

            {temoinExpanded && (
              <div className="divide-y divide-border/40">
                {myVictimes.map((v) => {
                  const vicParcours = parcours.filter((p) => getId(p.victime_id) === v.id).sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
                  const vicFragments = fragments.filter((f) => getId(f.victime_id) === v.id);
                  const vicExpanded = expandedVictimes.has(v.id);
                  const hasChildren = vicParcours.length > 0 || vicFragments.length > 0;

                  return (
                    <div key={v.id} className="bg-background">
                      <div
                        className="flex items-center gap-3 px-4 py-3 pl-10 cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => hasChildren && toggleVictime(v.id)}
                      >
                        <span className="text-muted-foreground shrink-0">
                          {hasChildren ? (vicExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <span className="w-3.5" />}
                        </span>
                        <div className="flex-1 font-semibold text-sm">
                          {v.prenom} <span className="uppercase">{v.nom}</span>
                          <StatutBadge statut_id={normalizeStatutId(v.statut_id)} />
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <StatutSelect
                            value={normalizeStatutId(v.statut_id)}
                            options={VICTIME_OPTIONS}
                            onChange={(val) => handleStatus("mmrl_victimes", v.id, val)}
                          />
                          <AddVictimeDialog editVictime={v} onSuccess={onRefresh} triggerVariant="ghost" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete("mmrl_victimes", v.id, setVictimes)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>

                      {vicExpanded && (
                        <div className="pl-24 pr-4 pb-4 space-y-6">
                          {vicParcours.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <History size={10} /> Parcours
                              </p>
                              {vicParcours.map((p) => (
                                <div 
                                  key={p.id} 
                                  className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/50"
                                >
                                  <span className="text-xs">{p.titre || p.description}</span>
                                  <div className="flex items-center gap-2">
                                    <StatutSelect
                                      value={normalizeStatutId(p.statut_id)}
                                      options={GENERIC_OPTIONS}
                                      onChange={(val) => handleStatus("mmrl_parcours", p.id, val)}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive"
                                      onClick={() => handleDelete("mmrl_parcours", p.id, setParcours)}
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
                              <Puzzle size={10} /> Fragments
                            </p>
                            {vicFragments.map((f) => (
                              <div 
                                key={f.id} 
                                className="flex items-center justify-between p-2 rounded-md bg-muted/20 border border-border/50"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="text-[9px] h-4 uppercase">
                                    {f.type?.libelle || "Fragment"}
                                  </Badge>
                                  <span className="text-xs truncate max-w-[200px]">{f.titre || f.description}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <StatutSelect
                                    value={normalizeStatutId(f.statut_id)}
                                    options={GENERIC_OPTIONS}
                                    onChange={(val) => handleStatus("mmrl_fragments", f.id, val)}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => handleDelete("mmrl_fragments", f.id, setFragments)}
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Detail view removed */}
    </div>
  );
}