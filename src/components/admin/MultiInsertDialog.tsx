import { useState } from "react";
import { directus } from "@/integration/directus";
import { createItem } from "@directus/sdk";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Check, Loader2, ListPlus } from "lucide-react";
import { STATUT_ID, TYPE_FRAGMENT_ID } from "@/integration/directus-types";

interface MultiInsertDialogProps {
  onComplete: () => void;
  temoins: any[];
  sources: any[];
  victimes: any[];
}

export const MultiInsertDialog = ({ onComplete, temoins, sources, victimes }: MultiInsertDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetCollection, setTargetCollection] = useState<string>("mmrl_victimes");
  const [rows, setRows] = useState<any[]>([{}]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRow = () => setRows([...rows, {}]);
  const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const updateRow = (index: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handleSaveAll = async () => {
    const validRows = rows.filter(row => Object.keys(row).length > 0);
    if (validRows.length === 0) {
      toast.error("Veuillez remplir au moins une ligne");
      return;
    }

    // Inject default statut_id
    const enrichedRows = validRows.map(row => ({
      ...row,
      statut_id: row.statut_id || STATUT_ID.A_VERIFIER,
    }));

    setIsSubmitting(true);
    try {
      await Promise.all(
        enrichedRows.map(row => directus.request(createItem(targetCollection as any, row)))
      );
      toast.success(`${enrichedRows.length} éléments créés avec succès`);
      setRows([{}]);
      setIsOpen(false);
      onComplete();
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = (row: any, index: number) => {
    if (targetCollection === "mmrl_victimes") {
      return (
        <>
          <TableCell><Input placeholder="Prénom" value={row.prenom || ""} onChange={e => updateRow(index, "prenom", e.target.value)} /></TableCell>
          <TableCell><Input placeholder="Nom" value={row.nom || ""} onChange={e => updateRow(index, "nom", e.target.value)} /></TableCell>
          <TableCell>
            <Select value={String(row.auteur_temoin_id || "")} onValueChange={v => updateRow(index, "auteur_temoin_id", Number(v))}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Témoin auteur" /></SelectTrigger>
              <SelectContent>
                {temoins.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.prenom} {t.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <Select value={String(row.source_id || "")} onValueChange={v => updateRow(index, "source_id", Number(v))}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                {sources.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.prenom} {s.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </TableCell>
        </>
      );
    }
    if (targetCollection === "mmrl_temoins") {
      return (
        <>
          <TableCell><Input placeholder="Prénom" value={row.prenom || ""} onChange={e => updateRow(index, "prenom", e.target.value)} /></TableCell>
          <TableCell><Input placeholder="Nom" value={row.nom || ""} onChange={e => updateRow(index, "nom", e.target.value)} /></TableCell>
          <TableCell><Input placeholder="Email" type="email" value={row.email || ""} onChange={e => updateRow(index, "email", e.target.value)} /></TableCell>
        </>
      );
    }
    if (targetCollection === "mmrl_sources_temoignage") {
      return (
        <>
          <TableCell><Input placeholder="Prénom" value={row.prenom || ""} onChange={e => updateRow(index, "prenom", e.target.value)} /></TableCell>
          <TableCell><Input placeholder="Nom" value={row.nom || ""} onChange={e => updateRow(index, "nom", e.target.value)} /></TableCell>
        </>
      );
    }
    if (targetCollection === "mmrl_parcours") {
      return (
        <>
          <TableCell>
            <Select value={String(row.victime_id || "")} onValueChange={v => updateRow(index, "victime_id", Number(v))}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Victime" /></SelectTrigger>
              <SelectContent>
                {victimes.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.prenom} {v.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell><Input type="number" placeholder="Année" value={row.annee_evenement || ""} onChange={e => updateRow(index, "annee_evenement", e.target.value ? Number(e.target.value) : null)} /></TableCell>
          <TableCell><Input placeholder="Description" value={row.description || ""} onChange={e => updateRow(index, "description", e.target.value)} /></TableCell>
        </>
      );
    }
    if (targetCollection === "mmrl_fragments") {
      return (
        <>
          <TableCell>
            <Select value={String(row.victime_id || "")} onValueChange={v => updateRow(index, "victime_id", Number(v))}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Victime" /></SelectTrigger>
              <SelectContent>
                {victimes.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.prenom} {v.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <Select value={String(row.auteur_temoin_id || "")} onValueChange={v => updateRow(index, "auteur_temoin_id", Number(v))}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Témoin" /></SelectTrigger>
              <SelectContent>
                {temoins.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.prenom} {t.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell>
            <Select value={String(row.type_id || TYPE_FRAGMENT_ID.TEMOIGNAGE)} onValueChange={v => updateRow(index, "type_id", Number(v))}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={String(TYPE_FRAGMENT_ID.TEMOIGNAGE)}>Témoignage</SelectItem>
                <SelectItem value={String(TYPE_FRAGMENT_ID.PHOTOGRAPHIE)}>Photo</SelectItem>
                <SelectItem value={String(TYPE_FRAGMENT_ID.VIDEO)}>Vidéo</SelectItem>
                <SelectItem value={String(TYPE_FRAGMENT_ID.AUDIO)}>Audio</SelectItem>
                <SelectItem value={String(TYPE_FRAGMENT_ID.RECIT)}>Récit</SelectItem>
                <SelectItem value={String(TYPE_FRAGMENT_ID.DOCUMENT)}>Document</SelectItem>
              </SelectContent>
            </Select>
          </TableCell>
          <TableCell><Input placeholder="Description" value={row.description || ""} onChange={e => updateRow(index, "description", e.target.value)} /></TableCell>
          <TableCell><Input placeholder="Fichier ID" value={row.fichier_media || ""} onChange={e => updateRow(index, "fichier_media", e.target.value)} className="font-mono text-[10px]" /></TableCell>
        </>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <ListPlus size={16} />
          Multi-Ajout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajout multiple de données</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 items-center mb-4 pt-4">
          <Label>Type de données :</Label>
          <Select value={targetCollection} onValueChange={(v) => { setTargetCollection(v); setRows([{}]); }}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mmrl_victimes">Victimes</SelectItem>
              <SelectItem value="mmrl_temoins">Témoins</SelectItem>
              <SelectItem value="mmrl_sources_temoignage">Sources de témoignage</SelectItem>
              <SelectItem value="mmrl_parcours">Parcours</SelectItem>
              <SelectItem value="mmrl_fragments">Fragments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {targetCollection === "mmrl_victimes" && (
                  <>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Témoin auteur</TableHead>
                    <TableHead>Source</TableHead>
                  </>
                )}
                {targetCollection === "mmrl_temoins" && (
                  <>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                  </>
                )}
                {targetCollection === "mmrl_sources_temoignage" && (
                  <>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Nom</TableHead>
                  </>
                )}
                {targetCollection === "mmrl_parcours" && (
                  <>
                    <TableHead>Victime</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Description</TableHead>
                  </>
                )}
                {targetCollection === "mmrl_fragments" && (
                  <>
                    <TableHead>Victime</TableHead>
                    <TableHead>Témoin</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Média ID</TableHead>
                  </>
                )}
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {renderFields(row, index)}
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeRow(index)} disabled={rows.length === 1}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" onClick={addRow} className="gap-2">
            <Plus size={16} /> Ajouter une ligne
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveAll} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Enregistrer tout ({rows.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
