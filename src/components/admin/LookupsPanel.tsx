import { useState } from "react";
import { directus } from "@/integration/directus";
import { createItem, updateItem, deleteItem } from "@directus/sdk";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Settings2, Hash } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { QualiteStatutRow, TypeFragmentRow } from "@/integration/directus-types";

interface LookupsPanelProps {
  qualiteStatuts: QualiteStatutRow[];
  typeFragments: TypeFragmentRow[];
  onRefresh: () => void;
}

export const LookupsPanel = ({ qualiteStatuts, typeFragments, onRefresh }: LookupsPanelProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for Status CRUD
  const [editingStatut, setEditingStatut] = useState<Partial<QualiteStatutRow> | null>(null);
  const [isStatutDialogOpen, setIsStatutDialogOpen] = useState(false);

  // State for Type CRUD
  const [editingType, setEditingType] = useState<Partial<TypeFragmentRow> | null>(null);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);

  const handleSaveStatut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatut?.code || !editingStatut?.libelle || !editingStatut?.couleur_hex) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStatut.id) {
        await directus.request(updateItem("mmrl_qualite_statut" as any, editingStatut.id, editingStatut));
        toast.success("Statut mis à jour");
      } else {
        await directus.request(createItem("mmrl_qualite_statut" as any, editingStatut as any));
        toast.success("Statut ajouté");
      }
      setIsStatutDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType?.code || !editingType?.libelle) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingType.id) {
        await directus.request(updateItem("mmrl_type_fragment" as any, editingType.id, editingType));
        toast.success("Type mis à jour");
      } else {
        await directus.request(createItem("mmrl_type_fragment" as any, editingType as any));
        toast.success("Type ajouté");
      }
      setIsTypeDialogOpen(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (collection: string, id: number) => {
    if (!confirm("Supprimer cet élément ? Cela peut casser les données liées.")) return;
    try {
      await directus.request(deleteItem(collection as any, id));
      toast.success("Supprimé");
      onRefresh();
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ─── QUALITE STATUT ─── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            États de Validation (Statuts)
          </CardTitle>
          <Button size="sm" onClick={() => { setEditingStatut({ couleur_hex: "#3b82f6" }); setIsStatutDialogOpen(true); }}>
            <Plus size={16} className="mr-2" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Couleur</TableHead>
                <TableHead>Mur Public</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {qualiteStatuts.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="text-muted-foreground">{q.id}</TableCell>
                  <TableCell className="font-medium">{q.libelle}</TableCell>
                  <TableCell><code className="bg-muted px-1 rounded text-xs">{q.code}</code></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: q.couleur_hex }} />
                      <span className="text-xs font-mono uppercase">{q.couleur_hex}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {q.show_on_wall ? (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Oui</span>
                    ) : (
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">Non</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingStatut(q); setIsStatutDialogOpen(true); }}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete("mmrl_qualite_statut", q.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── TYPE FRAGMENT ─── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Types de Fragments
          </CardTitle>
          <Button size="sm" onClick={() => { setEditingType({}); setIsTypeDialogOpen(true); }}>
            <Plus size={16} className="mr-2" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typeFragments.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="text-muted-foreground">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.libelle}</TableCell>
                  <TableCell><code className="bg-muted px-1 rounded text-xs">{t.code}</code></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingType(t); setIsTypeDialogOpen(true); }}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete("mmrl_type_fragment", t.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── DIALOG STATUT ─── */}
      <Dialog open={isStatutDialogOpen} onOpenChange={setIsStatutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatut?.id ? "Modifier" : "Ajouter"} un statut</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveStatut} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code (unique, technique)</Label>
              <Input 
                value={editingStatut?.code || ""} 
                onChange={e => setEditingStatut(p => ({...p!, code: e.target.value}))} 
                placeholder="ex: a_valider"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Libellé (Affichage)</Label>
              <Input 
                value={editingStatut?.libelle || ""} 
                onChange={e => setEditingStatut(p => ({...p!, libelle: e.target.value}))} 
                placeholder="ex: À valider"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur Hexadécimale</Label>
              <div className="flex gap-3">
                <Input 
                  type="color" 
                  className="w-12 h-10 p-1 bg-transparent"
                  value={editingStatut?.couleur_hex || "#3b82f6"} 
                  onChange={e => setEditingStatut(p => ({...p!, couleur_hex: e.target.value}))} 
                />
                <Input 
                  value={editingStatut?.couleur_hex || ""} 
                  onChange={e => setEditingStatut(p => ({...p!, couleur_hex: e.target.value}))} 
                  placeholder="#000000"
                  className="font-mono"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="show_on_wall" className="text-sm font-medium cursor-pointer">Visibilité mur public</Label>
                <p className="text-[10px] text-muted-foreground">Afficher les fiches ayant ce statut sur le mur virtuel.</p>
              </div>
              <Switch 
                id="show_on_wall"
                checked={editingStatut?.show_on_wall || false} 
                onCheckedChange={checked => setEditingStatut(p => ({...p!, show_on_wall: checked}))} 
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsStatutDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DIALOG TYPE ─── */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType?.id ? "Modifier" : "Ajouter"} un type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveType} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code (unique, technique)</Label>
              <Input 
                value={editingType?.code || ""} 
                onChange={e => setEditingType(p => ({...p!, code: e.target.value}))} 
                placeholder="ex: archives_audio"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Libellé (Affichage)</Label>
              <Input 
                value={editingType?.libelle || ""} 
                onChange={e => setEditingType(p => ({...p!, libelle: e.target.value}))} 
                placeholder="ex: Archives Audio"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTypeDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
