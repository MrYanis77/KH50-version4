import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Users, Puzzle, History, Eye, ChevronDown, ChevronRight, CalendarDays, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TemoinRow, VictimeRow, FragmentRow, ParcoursRow } from "@/integration/directus-types";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { StatutSelect } from "./DossiersPanel";

interface Props {
  temoin: TemoinRow;
  victimes: VictimeRow[];
  fragments: FragmentRow[];
  parcours: ParcoursRow[];
  qualiteStatuts: any[];
  onBack: () => void;
  onStatusChange: (collection: string, id: number, statutId: number) => void;
  onDelete: (collection: string, id: number) => void;
}

const getId = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === 'object' && val.id !== undefined) return Number(val.id);
  return Number(val);
};

export function TemoinDashboard({ temoin, victimes, fragments, parcours, qualiteStatuts, onBack, onStatusChange, onDelete }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailType, setDetailType] = useState<'victime' | 'fragment' | 'parcours'>('victime');
  const [detailData, setDetailData] = useState<any>(null);
  
  // State for expanded rows
  const [expandedVictime, setExpandedVictime] = useState<number | null>(null);

  const handleOpenDetail = (type: 'victime' | 'fragment' | 'parcours', data: any) => {
    setDetailType(type);
    setDetailData(data);
    setDetailOpen(true);
  };

  const getStatutBadge = (statut_id: any) => {
    const sid = getId(statut_id);
    const qs = qualiteStatuts.find(q => q.id === sid);
    const color = qs?.couleur_hex || '#aaa';
    return (
      <Badge variant="outline" style={{ borderColor: color, color, backgroundColor: color + '22' }}>
        {qs?.libelle || `Statut #${statut_id}`}
      </Badge>
    );
  };

  const myVictimes = victimes.filter(v => getId(v.auteur_temoin_id) === temoin.id);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* ── HEADER ── */}
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 text-muted-foreground hover:text-foreground">
          ← Retour à la liste
        </Button>
        <div className="flex flex-col md:flex-row md:items-start gap-6 justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <User className="h-8 w-8 text-primary" />
              {temoin.prenom} {temoin.nom}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-3">
              <span className="flex items-center gap-1.5"><Mail size={16}/> {temoin.email || "Aucun email"}</span>
              <span className="flex items-center gap-1.5"><CalendarDays size={16}/> Inscrit le : {temoin.date_creation ? new Date(temoin.date_creation).toLocaleDateString('fr-FR') : "Inconnue"}</span>
              <span className="flex items-center gap-1.5 font-medium text-foreground"><Users size={16} className="text-primary"/> {myVictimes.length} victime(s) ajoutée(s)</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Statut du contributeur</span>
            <StatutSelect
              value={getId(temoin.statut_id)}
              options={qualiteStatuts.map(s => ({ value: s.id, label: s.libelle }))}
              onChange={(val) => onStatusChange("mmrl_temoins", temoin.id, val)}
            />
          </div>
        </div>
      </div>

      {/* ── VICTIMES & ACCORDION ── */}
      <Card>
        <CardHeader className="bg-muted/20 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Victimes documentées par ce contributeur
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead className="w-10"></TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Lieu de naissance</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myVictimes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    Aucune victime rattachée à ce contributeur.
                  </TableCell>
                </TableRow>
              )}
              {myVictimes.map(v => {
                const isExpanded = expandedVictime === v.id;
                const vicFragments = fragments.filter(f => getId(f.victime_id) === v.id);
                const vicParcours = parcours.filter(p => getId(p.victime_id) === v.id);

                return (
                  <React.Fragment key={v.id}>
                    {/* Main Row */}
                    <TableRow 
                      className={`cursor-pointer hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}
                      onClick={() => setExpandedVictime(isExpanded ? null : v.id)}
                    >
                      <TableCell>
                        {isExpanded ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-muted-foreground" />}
                      </TableCell>
                      <TableCell className="font-semibold text-base">{v.prenom} <span className="uppercase">{v.nom}</span></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{v.annee_naissance || "?"} - {v.annee_deces || "?"}</TableCell>
                      <TableCell className="text-sm">{v.lieu_naissance || "—"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StatutSelect
                          value={getId(v.statut_id)}
                          options={qualiteStatuts.map(s => ({ value: s.id, label: s.libelle }))}
                          onChange={(val) => onStatusChange("mmrl_victimes", v.id, val)}
                        />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDetail('victime', v)}>
                            <Eye size={16} className="text-muted-foreground hover:text-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete("mmrl_victimes", v.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <TableRow className="bg-muted/5 hover:bg-muted/5 border-b-2 border-primary/20">
                        <TableCell colSpan={6} className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                            
                            {/* Fragments */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b pb-2 text-primary">
                                <Puzzle size={14} /> Fragments ({vicFragments.length})
                              </h4>
                              {vicFragments.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Aucun fragment rattaché.</p>
                              ) : (
                                <div className="space-y-2">
                                  {vicFragments.map(f => (
                                    <div key={f.id} className="flex justify-between items-start gap-3 bg-card p-3 rounded-md border shadow-sm">
                                      <div className="flex-1 min-w-0">
                                        <Badge variant="secondary" className="text-[10px] mb-1">{f.type?.libelle || "Fragment"}</Badge>
                                        <p className="text-xs truncate" title={f.titre || f.description}>{f.titre || f.description}</p>
                                      </div>
                                      <div className="flex flex-col gap-1 shrink-0">
                                        <StatutSelect value={getId(f.statut_id)} options={qualiteStatuts.map(s => ({ value: s.id, label: s.libelle }))} onChange={(val) => onStatusChange("mmrl_fragments", f.id, val)} />
                                        <div className="flex gap-1 mt-1">
                                          <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]" onClick={() => handleOpenDetail('fragment', f)}><Eye size={12} className="mr-1"/> Voir</Button>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete("mmrl_fragments", f.id)}><Trash2 size={12} /></Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Parcours */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b pb-2 text-primary">
                                <History size={14} /> Parcours ({vicParcours.length})
                              </h4>
                              {vicParcours.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Aucun événement de parcours.</p>
                              ) : (
                                <div className="space-y-2">
                                  {vicParcours.map(p => (
                                    <div key={p.id} className="flex justify-between items-start gap-3 bg-card p-3 rounded-md border shadow-sm">
                                      <div className="flex-1 min-w-0">
                                        <span className="text-[10px] font-bold text-muted-foreground block mb-1">{p.date_evenement || p.annee_evenement || "Date inconnue"}</span>
                                        <p className="text-xs truncate" title={p.titre || p.description}>{p.titre || p.description}</p>
                                      </div>
                                      <div className="flex flex-col gap-1 shrink-0">
                                        <StatutSelect value={getId(p.statut_id)} options={qualiteStatuts.map(s => ({ value: s.id, label: s.libelle }))} onChange={(val) => onStatusChange("mmrl_parcours", p.id, val)} />
                                        <div className="flex gap-1 mt-1">
                                          <Button variant="ghost" size="sm" className="h-6 flex-1 text-[10px]" onClick={() => handleOpenDetail('parcours', p)}><Eye size={12} className="mr-1"/> Voir</Button>
                                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete("mmrl_parcours", p.id)}><Trash2 size={12} /></Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Sépultures */}
                            <div className="space-y-3">
                              <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 border-b pb-2 text-primary">
                                Sépultures (0)
                              </h4>
                              <p className="text-xs text-muted-foreground italic">Aucune sépulture renseignée.</p>
                            </div>

                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ItemDetailDialog 
        isOpen={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        type={detailType} 
        data={detailData} 
        qualiteStatuts={qualiteStatuts}
        victimes={victimes}
      />
    </div>
  );
}
