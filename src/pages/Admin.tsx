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
import { Shield, Plus, Pencil, Trash2, User, Users, Image as ImageIcon, Check, Loader2, MessageSquare, History, GalleryVertical, Puzzle, RefreshCcw, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { VictimeRow, TemoinRow, ParcoursRow, FragmentRow } from "@/integration/directus-types";

const Admin = () => {
  const { 
    victimes, temoins, parcours, fragments, 
    loading, error, collectionErrors, refreshAction,
    setVictimes, setTemoins, setParcours, setFragments 
  } = useAdminData();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVictime, setEditingVictime] = useState<Partial<VictimeRow> | null>(null);
  const [editingTemoin, setEditingTemoin] = useState<Partial<TemoinRow> | null>(null);
  const [editingFragment, setEditingFragment] = useState<Partial<FragmentRow> | null>(null);
  const [editingParcours, setEditingParcours] = useState<Partial<ParcoursRow> | null>(null);
  
  const [isVictimeDialogOpen, setIsVictimeDialogOpen] = useState(false);
  const [isTemoinDialogOpen, setIsTemoinDialogOpen] = useState(false);
  const [isFragmentDialogOpen, setIsFragmentDialogOpen] = useState(false);
  const [isParcoursDialogOpen, setIsParcoursDialogOpen] = useState(false);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (error) return <div className="p-8 text-destructive text-center">Erreur: {error}</div>;

  const getVictimeName = (id: number) => {
    const v = victimes.find(v => v.id === id);
    return v ? `${v.prenom} ${v.nom}` : `ID: ${id}`;
  };

  const getTemoinNameForVictime = (victimeId: number) => {
    const v = victimes.find(v => v.id === victimeId);
    if (!v) return "-";
    const t = temoins.find(t => t.id === v.temoin_id);
    return t ? `${t.prenom} ${t.nom}` : `Témoin ID: ${v.temoin_id}`;
  };

  // --- ACTIONS ---
  const handleSaveVictime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVictime) return;
    
    if (!editingVictime.prenom || !editingVictime.nom || !editingVictime.temoin_id) {
      toast.error("Le prénom, le nom et le témoin source sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingVictime.id) {
        const result = await directus.request(updateItem("memorial_victimes", editingVictime.id, editingVictime));
        setVictimes(prev => prev.map(v => v.id === editingVictime.id ? (result as unknown as VictimeRow) : v));
        toast.success("Victime mise à jour");
      } else {
        const result = await directus.request(createItem("memorial_victimes", editingVictime as any));
        setVictimes(prev => [...prev, result as unknown as VictimeRow]);
        toast.success("Victime créée");
      }
      setIsVictimeDialogOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setIsSubmitting(false); }
  };

  const handleSaveTemoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemoin) return;
    setIsSubmitting(true);
    try {
      if (editingTemoin.id) {
        const result = await directus.request(updateItem("memorial_temoins", editingTemoin.id, editingTemoin));
        setTemoins(prev => prev.map(t => t.id === editingTemoin.id ? (result as unknown as TemoinRow) : t));
        toast.success("Témoin mis à jour");
      } else {
        const result = await directus.request(createItem("memorial_temoins", editingTemoin as any));
        setTemoins(prev => [...prev, result as unknown as TemoinRow]);
        toast.success("Témoin ajouté");
      }
      setIsTemoinDialogOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setIsSubmitting(false); }
  };

  const handleSaveFragment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFragment) return;
    
    // Validation
    if (!editingFragment.victime_id || !editingFragment.auteur || !editingFragment.description) {
      toast.error("Veuillez remplir la victime, l'auteur et la description.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure defaults for type and status if new
      const dataToSave = {
        ...editingFragment,
        type_fragment: editingFragment.type_fragment || "temoignage",
        statut: editingFragment.statut || "en_attente"
      };

      if (editingFragment.id) {
        const result = await directus.request(updateItem("memorial_fragments", editingFragment.id, dataToSave));
        setFragments(prev => prev.map(f => f.id === editingFragment.id ? (result as unknown as FragmentRow) : f));
        toast.success("Fragment mis à jour");
      } else {
        const result = await directus.request(createItem("memorial_fragments", dataToSave as any));
        setFragments(prev => [...prev, result as unknown as FragmentRow]);
        toast.success("Fragment ajouté");
      }
      setIsFragmentDialogOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setIsSubmitting(false); }
  };

  const handleSaveParcours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParcours) return;
    setIsSubmitting(true);
    try {
      if (editingParcours.id) {
        const result = await directus.request(updateItem("memorial_parcours", editingParcours.id, editingParcours));
        setParcours(prev => prev.map(p => p.id === editingParcours.id ? (result as unknown as ParcoursRow) : p));
        toast.success("Parcours mis à jour");
      } else {
        const result = await directus.request(createItem("memorial_parcours", editingParcours as any));
        setParcours(prev => [...prev, result as unknown as ParcoursRow]);
        toast.success("Parcours ajouté");
      }
      setIsParcoursDialogOpen(false);
    } catch (err: any) { toast.error(err.message); } finally { setIsSubmitting(false); }
  };

  const handleValidateVictime = async (v: VictimeRow) => {
    try {
      const result = await directus.request(updateItem("memorial_victimes", v.id, { statut: 'publie' }));
      setVictimes(prev => prev.map(item => item.id === v.id ? (result as unknown as VictimeRow) : item));
      toast.success(`${v.prenom} ${v.nom} a été publié sur le mur`);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleValidateFragment = async (f: FragmentRow) => {
    try {
      const result = await directus.request(updateItem("memorial_fragments", f.id, { statut: 'valide' }));
      setFragments(prev => prev.map(item => item.id === f.id ? (result as unknown as FragmentRow) : item));
      toast.success("Fragment validé");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleValidateParcours = async (p: ParcoursRow) => {
    try {
      const result = await directus.request(updateItem("memorial_parcours", p.id, { statut: 'valide' }));
      setParcours(prev => prev.map(item => item.id === p.id ? (result as unknown as ParcoursRow) : item));
      toast.success("Étape de parcours validée");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleBulkValidate = async (type: 'victimes' | 'fragments' | 'parcours') => {
    const list = type === 'victimes' ? victimes.filter(v => v.statut === 'brouillon') : type === 'fragments' ? fragments.filter(f => f.statut === 'en_attente') : parcours.filter(p => p.statut === 'en_attente');
    if (list.length === 0) {
      toast.info(`Aucun élément en attente à valider.`);
      return;
    }
    if (!confirm(`Valider et publier ${list.length} éléments ?`)) return;

    setIsSubmitting(true);
    try {
      const targetStatus = type === 'victimes' ? 'publie' : 'valide';
      const collection = type === 'victimes' ? 'memorial_victimes' : type === 'fragments' ? 'memorial_fragments' : 'memorial_parcours';
      
      const results = await Promise.all(
        list.map(item => directus.request(updateItem(collection as any, item.id, { statut: targetStatus })))
      );
      
      if (type === 'victimes') {
        const updatedVictimes = results as unknown as VictimeRow[];
        setVictimes(prev => prev.map(v => {
          const updated = updatedVictimes.find(u => u.id === v.id);
          return updated ? updated : v;
        }));
      } else if (type === 'fragments') {
        const updatedFragments = results as unknown as FragmentRow[];
        setFragments(prev => prev.map(f => {
          const updated = updatedFragments.find(u => u.id === f.id);
          return updated ? updated : f;
        }));
      } else if (type === 'parcours') {
        const updatedParcours = results as unknown as ParcoursRow[];
        setParcours(prev => prev.map(p => {
          const updated = updatedParcours.find(u => u.id === p.id);
          return updated ? updated : p;
        }));
      }
      toast.success(`${list.length} éléments validés avec succès`);
    } catch (err: any) { 
      toast.error("Erreur lors de la validation: " + err.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDelete = async (collection: string, id: number, setter: (fn: (prev: any[]) => any[]) => void) => {
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      await directus.request(deleteItem(collection as any, id));
      setter(prev => prev.filter(item => item.id !== id));
      toast.success("Supprimé avec succès");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'victime' | 'fragment') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await directus.request(uploadFiles(formData));
      const fileId = (result as any).id;
      
      if (target === 'victime') {
        setEditingVictime(prev => ({ ...prev!, photo_principale: fileId }));
      } else if (target === 'fragment') {
        setEditingFragment(prev => ({ ...prev!, fichier_media: fileId }));
      }
      
      toast.success("Fichier téléchargé");
    } catch (err: any) { toast.error("Erreur d'upload"); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display text-foreground">Explorateur de Données</h1>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAction} disabled={loading} className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <Tabs defaultValue="victimes" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 p-1 bg-muted/50 mb-8 overflow-x-auto justify-start">
            <TabsTrigger value="victimes" className="gap-2"><User size={16} /> Victimes</TabsTrigger>
            <TabsTrigger value="temoins" className="gap-2"><Users size={16} /> Témoins</TabsTrigger>
            <TabsTrigger value="parcours" className="gap-2"><History size={16} /> Parcours</TabsTrigger>
            <TabsTrigger value="fragments" className="gap-2"><Puzzle size={16} /> Fragments</TabsTrigger>
          </TabsList>

          {/* VICTIMES */}
          <TabsContent value="victimes">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Victimes ({victimes.length})</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleBulkValidate('victimes')} disabled={isSubmitting || loading}>
                  <Check className="mr-2 h-4 w-4" /> Tout Publier
                </Button>
                <Button onClick={() => { setEditingVictime({ statut: 'brouillon' }); setIsVictimeDialogOpen(true); }}>
                  <Plus size={18} className="mr-2" /> Ajouter
                </Button>
              </div>
            </div>
            {collectionErrors.victimes && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur de chargement</AlertTitle>
                <AlertDescription>{collectionErrors.victimes}</AlertDescription>
              </Alert>
            )}
            <Card className="overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Identité</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Témoin Rapporteur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {victimes.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {v.photo_principale && <img src={`${import.meta.env.VITE_DIRECTUS_URL}/assets/${v.photo_principale}?width=40&height=40`} alt="" />}
                        </div>
                        {v.prenom} {v.nom}
                      </TableCell>
                      <TableCell><span className={`text-xs px-2 py-1 rounded-full ${v.statut === 'publie' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{v.statut}</span></TableCell>
                      <TableCell>{getTemoinNameForVictime(v.id)}</TableCell>
                      <TableCell className="text-right"><div className="flex justify-end gap-2">
                        {v.statut === 'brouillon' && (
                          <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleValidateVictime(v)} title="Publier sur le mur">
                            <Check size={16} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { setEditingVictime(v); setIsVictimeDialogOpen(true); }}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete("memorial_victimes", v.id, setVictimes)}><Trash2 size={16} /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>


          {/* TEMOINS */}
          <TabsContent value="temoins">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Témoins ({temoins.length})</h2>
              <Button onClick={() => { setEditingTemoin({ statut: 'actif' }); setIsTemoinDialogOpen(true); }}>
                <Plus size={18} className="mr-2" /> Ajouter
              </Button>
            </div>
            {collectionErrors.temoins && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur de chargement</AlertTitle>
                <AlertDescription>{collectionErrors.temoins}</AlertDescription>
              </Alert>
            )}
            <Card className="overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Identité</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {temoins.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.prenom} {t.nom}</TableCell>
                      <TableCell>{t.email}</TableCell>
                      <TableCell>{t.telephone || "-"}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-1 rounded-full ${t.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{t.statut}</span></TableCell>
                      <TableCell className="text-right"><div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingTemoin(t); setIsTemoinDialogOpen(true); }}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete("memorial_temoins", t.id, setTemoins)}><Trash2 size={16} /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* PARCOURS */}
          <TabsContent value="parcours">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Lignes de Temps ({parcours.length})</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleBulkValidate('parcours')} disabled={isSubmitting || loading}>
                  <Check className="mr-2 h-4 w-4" /> Tout Valider
                </Button>
                <Button onClick={() => { setEditingParcours({ ordre: 0, statut: 'valide' }); setIsParcoursDialogOpen(true); }}>
                  <Plus size={18} className="mr-2" /> Ajouter
                </Button>
              </div>
            </div>
            {collectionErrors.parcours && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur de chargement</AlertTitle>
                <AlertDescription>{collectionErrors.parcours}</AlertDescription>
              </Alert>
            )}
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Victime</TableHead>
                  <TableHead>Année</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {parcours.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{getVictimeName(p.victime_id)}</TableCell>
                      <TableCell className="text-accent font-bold">{p.annee}</TableCell>
                      <TableCell className="max-w-md truncate">{p.description}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-1 rounded-full ${(p.statut || 'valide') === 'valide' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{p.statut || 'valide'}</span></TableCell>
                      <TableCell className="text-right"><div className="flex justify-end gap-2">
                        {(p.statut === 'en_attente') && (
                          <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleValidateParcours(p)} title="Valider">
                            <Check size={16} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { setEditingParcours(p); setIsParcoursDialogOpen(true); }}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete("memorial_parcours", p.id, setParcours)}><Trash2 size={16} /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>


          {/* FRAGMENTS */}
          <TabsContent value="fragments">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Fragments de Mémoire ({fragments.length})</h2>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => handleBulkValidate('fragments')} disabled={isSubmitting || loading}>
                    <Check className="mr-2 h-4 w-4" /> Tout Valider
                  </Button>
                  <Button onClick={() => { setEditingFragment({ statut: 'en_attente', type_fragment: 'temoignage' }); setIsFragmentDialogOpen(true); }}>
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
                  <TableHead>Auteur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Victime</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {fragments.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.auteur}</TableCell>
                      <TableCell className="capitalize">{f.type_fragment}</TableCell>
                      <TableCell>{getVictimeName(f.victime_id)}</TableCell>
                      <TableCell><span className={`text-xs px-2 py-0.5 rounded ${f.statut === 'valide' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{f.statut}</span></TableCell>
                      <TableCell className="text-right"><div className="flex justify-end gap-2">
                        {f.statut === 'en_attente' && (
                          <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleValidateFragment(f)} title="Valider">
                            <Check size={16} />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => { setEditingFragment(f); setIsFragmentDialogOpen(true); }}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete("memorial_fragments", f.id, setFragments)}><Trash2 size={16} /></Button>
                      </div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG VICTIME (simplified here for brevity, reuse logic from previous Admin) */}
      <Dialog open={isVictimeDialogOpen} onOpenChange={setIsVictimeDialogOpen}>
          <DialogContent className="max-w-2xl">
             <DialogHeader><DialogTitle>Gestion Victime</DialogTitle></DialogHeader>
             <form onSubmit={handleSaveVictime} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input value={editingVictime?.prenom || ""} onChange={e => setEditingVictime(p => ({...p!, prenom: e.target.value}))} placeholder="Prénom" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <Input value={editingVictime?.nom || ""} onChange={e => setEditingVictime(p => ({...p!, nom: e.target.value}))} placeholder="Nom" required />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sexe</Label>
                    <Select value={editingVictime?.sexe || ""} onValueChange={v => setEditingVictime(p => ({...p!, sexe: v}))}>
                      <SelectTrigger><SelectValue placeholder="Sexe" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculin</SelectItem>
                        <SelectItem value="F">Féminin</SelectItem>
                        <SelectItem value="Inconnu">Inconnu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={editingVictime?.statut || "brouillon"} onValueChange={v => setEditingVictime(p => ({...p!, statut: v as any}))}>
                      <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="publie">Publié</SelectItem>
                        <SelectItem value="archive">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de naissance</Label>
                    <Input type="date" value={editingVictime?.date_naissance || ""} onChange={e => setEditingVictime(p => ({...p!, date_naissance: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lieu de naissance</Label>
                    <Input value={editingVictime?.lieu_naissance || ""} onChange={e => setEditingVictime(p => ({...p!, lieu_naissance: e.target.value}))} placeholder="Lieu" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date de décès</Label>
                    <Input type="date" value={editingVictime?.date_deces || ""} onChange={e => setEditingVictime(p => ({...p!, date_deces: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lieu de décès</Label>
                    <Input value={editingVictime?.lieu_deces || ""} onChange={e => setEditingVictime(p => ({...p!, lieu_deces: e.target.value}))} placeholder="Lieu" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Profession</Label>
                  <Input value={editingVictime?.profession || ""} onChange={e => setEditingVictime(p => ({...p!, profession: e.target.value}))} placeholder="Profession" />
                </div>

                <div className="space-y-2">
                  <Label>Origine Familiale</Label>
                  <Input value={editingVictime?.origine_familiale || ""} onChange={e => setEditingVictime(p => ({...p!, origine_familiale: e.target.value}))} placeholder="Origine" />
                </div>

                <div className="space-y-2">
                  <Label>Source (Témoin)</Label>
                  <Select value={String(editingVictime?.temoin_id || "")} onValueChange={v => setEditingVictime(p => ({...p!, temoin_id: Number(v)}))}>
                      <SelectTrigger><SelectValue placeholder="Choisir un témoin" /></SelectTrigger>
                      <SelectContent>
                          {temoins.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.prenom} {t.nom} ({t.email})</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Photo principale (Directus File ID)</Label>
                  <div className="flex gap-2 items-center">
                      <Input value={editingVictime?.photo_principale || ""} onChange={e => setEditingVictime(p => ({...p!, photo_principale: e.target.value}))} placeholder="ID du fichier" />
                      <div className="relative">
                        <Button type="button" variant="outline" size="icon" className="shrink-0">
                          <ImageIcon size={18} />
                          <Input type="file" onChange={(e) => handleFileUpload(e, 'victime')} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                        </Button>
                      </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-background pb-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsVictimeDialogOpen(false)}>Annuler</Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Check size={18} className="mr-2" />}
                    Enregistrer les modifications
                  </Button>
                </div>
             </form>
          </DialogContent>
      </Dialog>

      {/* DIALOG TEMOIN */}
      <Dialog open={isTemoinDialogOpen} onOpenChange={setIsTemoinDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTemoin?.id ? "Modifier" : "Ajouter"} un témoin</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveTemoin} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={editingTemoin?.prenom || ""} onChange={e => setEditingTemoin(p => ({...p!, prenom: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={editingTemoin?.nom || ""} onChange={e => setEditingTemoin(p => ({...p!, nom: e.target.value}))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editingTemoin?.email || ""} onChange={e => setEditingTemoin(p => ({...p!, email: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={editingTemoin?.telephone || ""} onChange={e => setEditingTemoin(p => ({...p!, telephone: e.target.value}))} />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={editingTemoin?.statut || "actif"} onValueChange={v => setEditingTemoin(p => ({...p!, statut: v}))}>
                <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTemoinDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG FRAGMENT */}
      <Dialog open={isFragmentDialogOpen} onOpenChange={setIsFragmentDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingFragment?.id ? "Modifier" : "Ajouter"} un fragment</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveFragment} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Victime</Label>
              <Select value={String(editingFragment?.victime_id || "")} onValueChange={v => setEditingFragment(p => ({...p!, victime_id: Number(v)}))}>
                <SelectTrigger><SelectValue placeholder="Choisir une victime" /></SelectTrigger>
                <SelectContent>
                  {victimes.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.prenom} {v.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Auteur</Label>
                <Input value={editingFragment?.auteur || ""} onChange={e => setEditingFragment(p => ({...p!, auteur: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={editingFragment?.type_fragment || "temoignage"} onValueChange={v => setEditingFragment(p => ({...p!, type_fragment: v as any}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temoignage">Témoignage</SelectItem>
                    <SelectItem value="photographie">Photo</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                    <SelectItem value="recit">Récit</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="lieu">Lieu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description / Contenu</Label>
              <Textarea value={editingFragment?.description || ""} onChange={e => setEditingFragment(p => ({...p!, description: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label>Média (Optionnel)</Label>
              <div className="flex gap-2 items-center">
                <Input value={editingFragment?.fichier_media || ""} onChange={e => setEditingFragment(p => ({...p!, fichier_media: e.target.value}))} placeholder="ID du fichier" />
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

      {/* DIALOG PARCOURS */}
      <Dialog open={isParcoursDialogOpen} onOpenChange={setIsParcoursDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingParcours?.id ? "Modifier" : "Ajouter"} un élément de parcours</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveParcours} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Victime</Label>
              <Select value={String(editingParcours?.victime_id || "")} onValueChange={v => setEditingParcours(p => ({...p!, victime_id: Number(v)}))}>
                <SelectTrigger><SelectValue placeholder="Choisir une victime" /></SelectTrigger>
                <SelectContent>
                  {victimes.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.prenom} {v.nom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Année / Période</Label>
              <Input value={editingParcours?.annee || ""} onChange={e => setEditingParcours(p => ({...p!, annee: e.target.value}))} placeholder="ex: 1970 - 1975" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingParcours?.description || ""} onChange={e => setEditingParcours(p => ({...p!, description: e.target.value}))} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsParcoursDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
