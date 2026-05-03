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
import { Search, UserCheck, Trash2, Eye, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import AddVictimeDialog from "@/components/AddVictimeDialog";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { TemoinDashboard } from "./TemoinDashboard";
import type {
  VictimeRow, TemoinRow, ParcoursRow, FragmentRow,
  SourceTemoignageRow,
} from "@/integration/directus-types";
import { STATUT_ID } from "@/integration/directus-types";

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
  qualiteStatuts: any[];
  typeFragments: any[];
}

const getId = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === 'object' && val.id !== undefined) return Number(val.id);
  return Number(val);
};

export function StatutSelect({
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

export function DossiersPanel({
  victimes, temoins, sources, parcours, fragments,
  setVictimes, setTemoins, setSources, setParcours, setFragments,
  onRefresh, qualiteStatuts, typeFragments,
}: DossiersPanelProps) {
  const [search, setSearch] = useState("");
  const [selectedTemoinId, setSelectedTemoinId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm("Archiver ce témoin/contributeur ?")) return;
    try {
      await directus.request(updateItem("mmrl_temoins" as any, id, { deleted_at: new Date().toISOString() }));
      toast.success("Archivé avec succès");
      onRefresh();
    } catch (err: any) {
      toast.error(`Erreur suppression : ${err?.message}`);
    }
  };

  const handleArchiveItem = async (collection: string, id: number) => {
    if (!confirm("Voulez-vous vraiment archiver cet élément ? Il sera déplacé dans la corbeille.")) return;
    try {
      await directus.request(updateItem(collection as any, id, { deleted_at: new Date().toISOString() }));
      toast.success("Élément archivé avec succès");
      onRefresh();
    } catch (err: any) {
      toast.error(`Erreur d'archivage : ${err?.message}`);
    }
  };

  const handleStatus = async (col: string, id: number, val: number) => {
    try {
      await directus.request(updateItem(col as any, id, { statut_id: val }));

      if (col === "mmrl_victimes") {
        setVictimes((p) => p.map((vv) => (vv.id === id ? { ...vv, statut_id: val } : vv)));
      } else if (col === "mmrl_temoins") {
        setTemoins((p) => p.map((t) => (t.id === id ? { ...t, statut_id: val } : t)));
      } else if (col === "mmrl_parcours") {
        setParcours((p) => p.map((e) => (e.id === id ? { ...e, statut_id: val } : e)));
      } else if (col === "mmrl_fragments") {
        setFragments((p) => p.map((f) => (f.id === id ? { ...f, statut_id: val } : f)));
      }

      toast.success("Statut mis à jour");
    } catch (err: any) {
      console.error("handleStatus error:", err);
      toast.error(`Erreur : ${err?.message ?? "Vérifiez vos permissions"}`);
    }
  };

  const getStatutBadge = (statut_id: any) => {
    const sid = getId(statut_id);
    const qs = qualiteStatuts.find(q => q.id === sid);
    const color = qs?.couleur_hex || '#aaa';
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium" style={{ borderColor: color + '50', color: color, backgroundColor: color + '15' }}>
        {qs?.libelle || `Statut #${statut_id}`}
      </span>
    );
  };

  // ── Render ──
  const selectedTemoin = temoins.find(t => t.id === selectedTemoinId);

  if (selectedTemoin) {
    return (
      <TemoinDashboard
        temoin={selectedTemoin}
        victimes={victimes}
        fragments={fragments}
        parcours={parcours}
        qualiteStatuts={qualiteStatuts}
        onBack={() => setSelectedTemoinId(null)}
        onStatusChange={handleStatus}
        onDelete={handleArchiveItem}
      />
    );
  }

  const q = search.toLowerCase();
  const filteredTemoins = temoins.filter(t => {
    return `${t.prenom} ${t.nom} ${t.email ?? ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-3 items-center justify-between pb-2 border-b border-border">
        <div className="flex gap-3 flex-1 flex-wrap items-center">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un contributeur..."
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground mr-2">
            {filteredTemoins.length} contributeur(s)
          </span>
          <AddVictimeDialog onSuccess={onRefresh} />
        </div>
      </div>

      {/* ── Contributeurs Table ── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contributeur (Témoin)</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Dossiers rattachés</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemoins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    Aucun contributeur trouvé.
                  </TableCell>
                </TableRow>
              )}
              {filteredTemoins.map((t) => {
                const myVictimesCount = victimes.filter((v) => getId(v.auteur_temoin_id) === t.id).length;
                return (
                  <TableRow key={t.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setSelectedTemoinId(t.id)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary" />
                        {t.prenom} {t.nom}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.email || "—"}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {myVictimesCount} victime(s)
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatutSelect
                        value={getId(t.statut_id)}
                        options={qualiteStatuts.map(s => ({ value: s.id, label: s.libelle }))}
                        onChange={(val) => handleStatus("mmrl_temoins", t.id, val)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedTemoinId(t.id)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(t.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}