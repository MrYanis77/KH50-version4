import { useState, useEffect } from "react";
import { directusAuth } from "@/integration/directus";
import { createItem, updateItem, readItems } from "@directus/sdk";
import type { ParcoursRow, VictimeRow } from "@/integration/directus-types";
import { STATUT_ID } from "@/integration/directus-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  victimes: VictimeRow[];
  editing: ParcoursRow | null;
  onSaved: () => void;
};

export function ProfileParcoursDialog({ open, onOpenChange, victimes, editing, onSaved }: Props) {
  const [victimeId, setVictimeId] = useState<number | "">("");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [annee, setAnnee] = useState<string>("");
  const [dateEvenement, setDateEvenement] = useState("");
  const [ordre, setOrdre] = useState<string>("0");
  const [fichierMedia, setFichierMedia] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const vid = typeof editing.victime_id === "object" ? (editing.victime_id as { id: number }).id : editing.victime_id;
      setVictimeId(vid ?? "");
      setTitre(editing.titre || "");
      setDescription(editing.description || "");
      setAnnee(editing.annee_evenement != null ? String(editing.annee_evenement) : "");
      setDateEvenement(editing.date_evenement ? String(editing.date_evenement).slice(0, 10) : "");
      setOrdre(String(editing.ordre ?? 0));
      const fm = editing.fichier_media;
      setFichierMedia(typeof fm === "object" && fm && "id" in fm ? String((fm as { id: string }).id) : (fm as string) || "");
    } else {
      setVictimeId(victimes[0]?.id ?? "");
      setTitre("");
      setDescription("");
      setAnnee("");
      setDateEvenement("");
      setOrdre("0");
      setFichierMedia("");
      void resolveNextOrdre(victimes[0]?.id);
    }
  }, [open, editing, victimes]);

  async function resolveNextOrdre(vid: number | undefined) {
    if (!vid || editing) return;
    try {
      const rows = await directusAuth.request(
        readItems("mmrl_parcours", {
          filter: { victime_id: { _eq: vid }, deleted_at: { _null: true } },
          fields: ["ordre"],
          limit: -1,
        })
      );
      const list = rows as { ordre: number }[];
      const max = list.reduce((m, r) => Math.max(m, r.ordre ?? 0), -1);
      setOrdre(String(max + 1));
    } catch {
      setOrdre("0");
    }
  }

  const onVictimeChange = async (v: string) => {
    const id = Number(v);
    setVictimeId(id);
    if (!editing) await resolveNextOrdre(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (victimeId === "") {
      toast.error("Choisissez une fiche personne.");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        victime_id: Number(victimeId),
        titre: titre.trim() || null,
        description: description.trim() || null,
        ordre: ordre === "" ? 0 : Number(ordre),
        statut_id: editing?.statut_id ?? STATUT_ID.A_VERIFIER,
      };
      body.annee_evenement = annee ? Number(annee) : null;
      body.date_evenement = dateEvenement || null;
      body.fichier_media = fichierMedia.trim() || null;

      if (editing?.id) {
        await directusAuth.request(updateItem("mmrl_parcours", editing.id, body));
        toast.success("Parcours mis à jour.");
      } else {
        await directusAuth.request(createItem("mmrl_parcours", body));
        toast.success("Étape de parcours ajoutée.");
      }
      onOpenChange(false);
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier le parcours" : "Nouvelle étape de parcours"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fiche personne</Label>
            <Select value={victimeId === "" ? "" : String(victimeId)} onValueChange={onVictimeChange} disabled={!!editing || !victimes.length}>
              <SelectTrigger>
                <SelectValue placeholder={victimes.length ? "Choisir…" : "Ajoutez d'abord une personne"} />
              </SelectTrigger>
              <SelectContent>
                {victimes.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.prenom} {v.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editing && <p className="text-xs text-muted-foreground">La fiche associée ne peut pas être changée.</p>}
          </div>
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de l'événement" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Année</Label>
              <Input type="number" value={annee} onChange={(e) => setAnnee(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={dateEvenement} onChange={(e) => setDateEvenement(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ordre d'affichage</Label>
            <Input type="number" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>ID fichier média (optionnel)</Label>
            <Input value={fichierMedia} onChange={(e) => setFichierMedia(e.target.value)} className="font-mono text-xs" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !victimes.length}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
