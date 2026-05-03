import { useState } from "react";
import { directus } from "@/integration/directus";
import { createItem, updateItem, deleteItem, uploadFiles } from "@directus/sdk";
import { useAdminData } from "@/hooks/useDirectus";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Shield, Plus, Pencil, Trash2, Image as ImageIcon,
  Check, Loader2, GalleryVertical, Puzzle, RefreshCcw,
  AlertTriangle, Eye, Settings2, Users
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { VictimeRow, TemoinRow, ParcoursRow, FragmentRow, SourceTemoignageRow } from "@/integration/directus-types";
import { STATUT_ID, TYPE_FRAGMENT_ID } from "@/integration/directus-types";
import { CsvImporter } from "@/components/admin/CsvImporter";
import { MultiInsertDialog } from "@/components/admin/MultiInsertDialog";
import AddVictimeDialog from "@/components/AddVictimeDialog";
import { DossiersPanel } from "@/components/admin/DossiersPanel";
import { LookupsPanel } from "@/components/admin/LookupsPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { ArchivePanel } from "@/components/admin/ArchivePanel";
import { ItemDetailDialog } from "@/components/admin/ItemDetailDialog";

const Admin = () => {
  const {
    victimes, temoins, sources, parcours, fragments, qualiteStatuts, typeFragments,
    loading, error, collectionErrors, refreshAction,
    setVictimes, setTemoins, setSources, setParcours, setFragments,
  } = useAdminData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("dossiers");
  const [editingFragment, setEditingFragment] = useState<Partial<FragmentRow> | null>(null);
  const [isFragmentDialogOpen, setIsFragmentDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<{ type: string; data: any } | null>(null);

  const handleOpenItem = (type: string, id: number) => {
    let collection: any[] = [];
    if (type === 'victime') collection = victimes;
    else if (type === 'temoin') collection = temoins;
    else if (type === 'fragment') collection = fragments;
    else if (type === 'parcours') collection = parcours;
    else if (type === 'source') collection = sources;

    const item = collection.find(x => x.id === id);
    if (item) {
      setViewingItem({ type, data: item });
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (error) return <div className="p-8 text-destructive text-center">Erreur: {error}</div>;

  // ── Helpers ──
  const getId = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'object' && val.id !== undefined) return Number(val.id);
    return Number(val);
  };

  const getVictimeName = (id: any) => {
    const vid = getId(id);
    const v = victimes.find(v => v.id === vid);
    return v ? `${v.prenom} ${v.nom}` : `ID: ${vid}`;
  };

  const getTemoinName = (id: any) => {
    const tid = getId(id);
    const t = temoins.find(t => t.id === tid);
    return t ? `${t.prenom} ${t.nom}` : `Témoin #${tid}`;
  };

  const getSourceName = (id?: any) => {
    const sid = getId(id);
    if (!sid) return "—";
    const s = sources.find(s => s.id === sid);
    return s ? `${s.prenom} ${s.nom}` : `Source #${sid}`;
  };

  const getTypeName = (type_id: any) => {
    const tid = getId(type_id);
    const t = typeFragments.find(t => t.id === tid);
    return t ? t.libelle : `Type #${tid}`;
  };

  const getStatutBadge = (statut_id: any) => {
    const sid = getId(statut_id);
    const qs = qualiteStatuts.find(q => q.id === sid);
    const color = qs?.couleur_hex || '#aaa';
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium border"
        style={{ borderColor: color, color, backgroundColor: color + '22' }}
      >
        {qs?.libelle || `Statut #${statut_id}`}
      </span>
    );
  };

  // ── Inline status change ──
  const handleQuickStatus = async (
    collection: 'mmrl_victimes' | 'mmrl_temoins' | 'mmrl_parcours' | 'mmrl_fragments',
    id: number,
    newStatutId: number
  ) => {
    console.log(`Updating ${collection}#${id} status to ${newStatutId}`);
    try {
      // 1. Mise à jour de l'élément cible
      await directus.request(updateItem(collection as any, id, { statut_id: newStatutId }));
      
      // 2. Propagation
      if (collection === 'mmrl_victimes') {
        const v = victimes.find(x => x.id === id);
        const temoinId = v ? getId(v.auteur_temoin_id) : 0;
        if (temoinId) {
          await directus.request(updateItem('mmrl_temoins', temoinId, { statut_id: newStatutId }));
          setTemoins(prev => prev.map(t => t.id === temoinId ? { ...t, statut_id: newStatutId } : t));
        }
        setVictimes(prev => prev.map(v => v.id === id ? { ...v, statut_id: newStatutId } : v));
      } 
      else if (collection === 'mmrl_temoins') {
        const linkedVictimes = victimes.filter(v => getId(v.auteur_temoin_id) === id);
        for (const v of linkedVictimes) {
          await directus.request(updateItem('mmrl_victimes', v.id, { statut_id: newStatutId }));
        }
        setVictimes(prev => prev.map(v => getId(v.auteur_temoin_id) === id ? { ...v, statut_id: newStatutId } : v));
        setTemoins(prev => prev.map(t => t.id === id ? { ...t, statut_id: newStatutId } : t));
      }
      else if (collection === 'mmrl_parcours') {
        setParcours(prev => prev.map(p => p.id === id ? { ...p, statut_id: newStatutId } : p));
      }
      else if (collection === 'mmrl_fragments') {
        setFragments(prev => prev.map(f => f.id === id ? { ...f, statut_id: newStatutId } : f));
      }
      
      toast.success("Statut mis à jour et propagé avec succès");
    } catch (err: any) { 
      console.error("Update failed:", err);
      toast.error(`Erreur mise à jour : ${err.message || "Problème de permissions"}`); 
    }
  };

  const handleDelete = async (collection: string, id: number, setter: (fn: (prev: any[]) => any[]) => void) => {
    if (!confirm("Archiver cet élément ?")) return;
    try {
      await directus.request(updateItem(collection as any, id, { deleted_at: new Date().toISOString() }));
      setter(prev => prev.filter(item => item.id !== id));
      toast.success("Archivé avec succès");
    } catch (err: any) { 
      console.error("Archive failed:", err);
      toast.error(`Erreur archivage : ${err.message}`); 
    }
  };

  // ── Fragment CRUD ──
  const handleSaveFragment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFragment) return;

    if (!editingFragment.victime_id || !editingFragment.auteur_temoin_id || !editingFragment.description) {
      toast.error("Veuillez remplir la victime, l'auteur (témoin) et la description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSave = {
        ...editingFragment,
        type_id: editingFragment.type_id || TYPE_FRAGMENT_ID.TEMOIGNAGE,
        statut_id: editingFragment.statut_id || STATUT_ID.A_VERIFIER,
      };

      if (editingFragment.id) {
        const result = await directus.request(updateItem("mmrl_fragments" as any, editingFragment.id, dataToSave));
        setFragments(prev => prev.map(f => f.id === editingFragment.id ? (result as unknown as FragmentRow) : f));
        toast.success("Fragment mis à jour");
      } else {
        const result = await directus.request(createItem("mmrl_fragments" as any, dataToSave as any));
        setFragments(prev => [...prev, result as unknown as FragmentRow]);
        toast.success("Fragment ajouté");
      }
      setIsFragmentDialogOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setIsSubmitting(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'fragment') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await directus.request(uploadFiles(formData));
      const fileId = (result as any).id;
      if (target === 'fragment') {
        setEditingFragment(prev => ({ ...prev!, fichier_media: fileId }));
      }
      toast.success("Fichier téléchargé");
    } catch (err: any) { toast.error("Erreur d'upload"); } finally { setIsSubmitting(false); }
  };

  const handleBulkValidate = async (type: 'fragments') => {
    const list = fragments.filter(f => f.statut_id === STATUT_ID.A_VERIFIER);
    if (list.length === 0) { toast.info("Aucun élément à vérifier."); return; }
    if (!confirm(`Passer ${list.length} fragments en "Avéré/Vérifié" ?`)) return;

    setIsSubmitting(true);
    try {
      const results = await Promise.all(
        list.map(item => directus.request(updateItem("mmrl_fragments" as any, item.id, { statut_id: STATUT_ID.VERIFIE })))
      );
      const updated = results as unknown as FragmentRow[];
      setFragments(prev => prev.map(f => {
        const u = updated.find(u => u.id === f.id);
        return u ? u : f;
      }));
      toast.success(`${list.length} fragments validés`);
    } catch (err: any) {
      toast.error("Erreur lors de la validation: " + err.message);
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display text-foreground">Explorateur de Données</h1>
          </div>
          <div className="flex gap-2">
            <MultiInsertDialog onComplete={refreshAction} temoins={temoins} sources={sources} victimes={victimes} />
            <CsvImporter onImportComplete={refreshAction} />
            <Button variant="outline" size="sm" onClick={refreshAction} disabled={loading} className="gap-2">
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Gestion Données</p>
              <nav className="flex flex-col gap-1">
                <button 
                  onClick={() => setActiveTab("dossiers")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "dossiers" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Users size={18} /> <span>Contributeurs</span>
                </button>
                <button 
                  onClick={() => setActiveTab("fragments")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "fragments" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Puzzle size={18} /> <span>Fragments</span>
                </button>
              </nav>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Gestion Système</p>
              <nav className="flex flex-col gap-1">
                <button 
                  onClick={() => setActiveTab("lookups")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "lookups" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Settings2 size={18} /> <span>Configuration</span>
                </button>
                <button 
                  onClick={() => setActiveTab("users")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "users" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Shield size={18} /> <span>Comptes Membres</span>
                </button>
                <button 
                  onClick={() => setActiveTab("archives")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-orange-600 ${activeTab === "archives" ? "bg-orange-100 dark:bg-orange-900/30 font-medium" : "hover:bg-muted"}`}
                >
                  <Trash2 size={18} /> <span>Archives & Corbeille</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <Tabs value={activeTab} className="w-full mt-0">
              {/* TabsContent are hidden if value doesn't match activeTab */}
              
              {/* ─── DOSSIERS ─── */}
              <TabsContent value="dossiers" className="mt-0">
                  <DossiersPanel
                    victimes={victimes}
                    temoins={temoins}
                    sources={sources}
                    parcours={parcours}
                    fragments={fragments}
                    setVictimes={setVictimes}
                    setTemoins={setTemoins}
                    setSources={setSources}
                    setParcours={setParcours}
                    setFragments={setFragments}
                    onRefresh={refreshAction}
                    qualiteStatuts={qualiteStatuts}
                    typeFragments={typeFragments}
                  />
              </TabsContent>

              {/* ─── FRAGMENTS ─── */}
              <TabsContent value="fragments" className="mt-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Fragments de Mémoire ({fragments.length})</h2>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleBulkValidate('fragments')} disabled={isSubmitting || loading}>
                      <Check className="mr-2 h-4 w-4" /> Tout Marquer Avéré
                    </Button>
                    <Button onClick={() => { setEditingFragment({ statut_id: STATUT_ID.A_VERIFIER, type_id: TYPE_FRAGMENT_ID.TEMOIGNAGE }); setIsFragmentDialogOpen(true); }}>
                      <Plus size={18} className="mr-2" /> Ajouter
                    </Button>
                  </div>
                </div>
                {collectionErrors.fragments && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de chargement</AlertTitle>
                    <AlertDescription>{collectionErrors.fragments}</AlertDescription>
                  </Alert>
                )}
                <Card>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Titre / Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Victime</TableHead>
                      <TableHead>Auteur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {fragments.map(f => (
                        <TableRow key={f.id}>
                          <TableCell className="max-w-[200px]">
                            <div className="font-semibold truncate">{f.titre || "Sans titre"}</div>
                            <div className="text-xs text-muted-foreground truncate">{f.description}</div>
                          </TableCell>
                          <TableCell className="capitalize text-xs">{getTypeName(f.type_id)}</TableCell>
                          <TableCell className="text-sm font-medium">{getVictimeName(f.victime_id)}</TableCell>
                          <TableCell className="text-xs">
                            {getTemoinName(f.auteur_temoin_id)}
                            {f.source_id && <div className="text-[10px] text-muted-foreground">Source: {getSourceName(f.source_id)}</div>}
                          </TableCell>
                          <TableCell>{getStatutBadge(f.statut_id)}</TableCell>
                          <TableCell className="text-right"><div className="flex justify-end gap-2">
                            <Select value={String(f.statut_id)} onValueChange={s => handleQuickStatus('mmrl_fragments', f.id, Number(s))}>
                              <SelectTrigger className="h-7 text-xs w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {qualiteStatuts.map(q => (
                                  <SelectItem key={q.id} value={String(q.id)}>{q.libelle}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => setViewingItem({ type: 'fragment', data: f })} title="Voir les détails"><Eye size={16} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingFragment(f); setIsFragmentDialogOpen(true); }}><Pencil size={16} /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete("mmrl_fragments", f.id, setFragments)}><Trash2 size={16} /></Button>
                          </div></TableCell>
                        </TableRow>
                      ))}
                      {fragments.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">Aucun fragment enregistré.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* ─── CONFIGURATION ─── */}
              <TabsContent value="lookups" className="mt-0">
                <LookupsPanel 
                  qualiteStatuts={qualiteStatuts}
                  typeFragments={typeFragments}
                  onRefresh={refreshAction}
                />
              </TabsContent>

              {/* ─── UTILISATEURS ─── */}
              <TabsContent value="users" className="mt-0">
                <UsersPanel />
              </TabsContent>

              {/* ─── ARCHIVES ─── */}
              <TabsContent value="archives" className="mt-0">
                <ArchivePanel />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>

      {/* ─── DIALOG FRAGMENT ─── */}
      <Dialog open={isFragmentDialogOpen} onOpenChange={setIsFragmentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingFragment?.id ? "Modifier" : "Ajouter"} un fragment</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveFragment} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Victime</Label>
              <Select value={String(editingFragment?.victime_id || "")} onValueChange={v => setEditingFragment(p => ({ ...p!, victime_id: Number(v) }))}>
                <SelectTrigger><SelectValue placeholder="Choisir une victime" /></SelectTrigger>
                <SelectContent>
                  {victimes.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.prenom} {v.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auteur (Témoin)</Label>
                <Select value={String(editingFragment?.auteur_temoin_id || "")} onValueChange={v => setEditingFragment(p => ({ ...p!, auteur_temoin_id: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un témoin" /></SelectTrigger>
                  <SelectContent>
                    {temoins.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.prenom} {t.nom}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={String(editingFragment?.type_id || TYPE_FRAGMENT_ID.TEMOIGNAGE)} onValueChange={v => setEditingFragment(p => ({ ...p!, type_id: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {typeFragments.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.libelle}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Source (optionnel)</Label>
              <Select value={String(editingFragment?.source_id || "")} onValueChange={v => setEditingFragment(p => ({ ...p!, source_id: v ? Number(v) : null }))}>
                <SelectTrigger><SelectValue placeholder="Aucune source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune source</SelectItem>
                  {sources.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.prenom} {s.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titre (optionnel)</Label>
              <Input value={editingFragment?.titre || ""} onChange={e => setEditingFragment(p => ({ ...p!, titre: e.target.value }))} placeholder="Titre du fragment" />
            </div>
            <div className="space-y-2">
              <Label>Description / Contenu *</Label>
              <Textarea value={editingFragment?.description || ""} onChange={e => setEditingFragment(p => ({ ...p!, description: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Année du fragment</Label>
                <Input type="number" value={editingFragment?.annee_fragment || ""} onChange={e => setEditingFragment(p => ({ ...p!, annee_fragment: e.target.value ? Number(e.target.value) : null }))} placeholder="ex: 1975" />
              </div>
              <div className="space-y-2">
                <Label>Date précise</Label>
                <Input type="date" value={editingFragment?.date_fragment || ""} onChange={e => setEditingFragment(p => ({ ...p!, date_fragment: e.target.value || null }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={String(editingFragment?.statut_id || STATUT_ID.A_VERIFIER)} onValueChange={v => setEditingFragment(p => ({ ...p!, statut_id: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {qualiteStatuts.map(q => <SelectItem key={q.id} value={String(q.id)}>{q.libelle}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Média (Optionnel)</Label>
              <div className="flex gap-2 items-center">
                <Input value={editingFragment?.fichier_media || ""} onChange={e => setEditingFragment(p => ({ ...p!, fichier_media: e.target.value }))} placeholder="ID du fichier" />
                <div className="relative">
                  <Button type="button" variant="outline" size="icon" className="shrink-0">
                    <ImageIcon size={18} />
                    <Input type="file" onChange={(e) => handleFileUpload(e, 'fragment')} accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsFragmentDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ItemDetailDialog 
        isOpen={!!viewingItem} 
        onClose={() => setViewingItem(null)} 
        type={viewingItem?.type as any} 
        data={viewingItem?.data} 
        qualiteStatuts={qualiteStatuts}
      />
    </div>
  );
};

export default Admin;
