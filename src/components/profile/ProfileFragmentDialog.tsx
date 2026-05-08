import { useState, useEffect } from "react";
import { directusAuth } from "@/integration/directus";
import { createItem, updateItem } from "@directus/sdk";
import type { FragmentRow, TypeFragmentRow, VictimeRow } from "@/integration/directus-types";
import { STATUT_ID, TYPE_FRAGMENT_ID } from "@/integration/directus-types";
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
  userId: string;
  victimes: VictimeRow[];
  typeFragments: TypeFragmentRow[];
  editing: FragmentRow | null;
  onSaved: () => void;
};

export function ProfileFragmentDialog({
  open,
  onOpenChange,
  userId,
  victimes,
  typeFragments,
  editing,
  onSaved,
}: Props) {
  const [victimeId, setVictimeId] = useState<number | "">("");
  const [typeId, setTypeId] = useState<number>(TYPE_FRAGMENT_ID.TEMOIGNAGE);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [anneeFragment, setAnneeFragment] = useState<string>("");
  const [dateFragment, setDateFragment] = useState("");
  const [fichierMedia, setFichierMedia] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const vid = typeof editing.victime_id === "object" ? (editing.victime_id as { id: number }).id : editing.victime_id;
      setVictimeId(vid ?? "");
      setTypeId(editing.type_id || TYPE_FRAGMENT_ID.TEMOIGNAGE);
      setTitre(editing.titre || "");
      setDescription(editing.description || "");
      setAnneeFragment(editing.annee_fragment != null ? String(editing.annee_fragment) : "");
      setDateFragment(editing.date_fragment ? String(editing.date_fragment).slice(0, 10) : "");
      const fm = editing.fichier_media;
      setFichierMedia(typeof fm === "object" && fm && "id" in fm ? String((fm as { id: string }).id) : (fm as string) || "");
    } else {
      setVictimeId(victimes[0]?.id ?? "");
      setTypeId(typeFragments[0]?.id ?? TYPE_FRAGMENT_ID.TEMOIGNAGE);
      setTitre("");
      setDescription("");
      setAnneeFragment("");
      setDateFragment("");
      setFichierMedia("");
    }
  }, [open, editing, victimes, typeFragments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("La description est obligatoire.");
      return;
    }
    if (victimeId === "") {
      toast.error("Choisissez une fiche personne.");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        victime_id: Number(victimeId),
        auteur_user_id: userId,
        type_id: typeId,
        titre: titre.trim() || null,
        description: description.trim(),
        statut_id: editing?.statut_id ?? STATUT_ID.A_VERIFIER,
      };
      if (anneeFragment) body.annee_fragment = Number(anneeFragment);
      else body.annee_fragment = null;
      body.date_fragment = dateFragment || null;
      body.fichier_media = fichierMedia.trim() || null;

      if (editing?.id) {
        await directusAuth.request(updateItem("mmrl_fragments", editing.id, body));
        toast.success("Fragment mis à jour.");
      } else {
        await directusAuth.request(createItem("mmrl_fragments", body));
        toast.success("Fragment ajouté.");
      }
      onOpenChange(false);
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const types = typeFragments.length ? typeFragments : [{ id: TYPE_FRAGMENT_ID.TEMOIGNAGE, libelle: "Témoignage", code: "temoignage" as const }];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier le fragment" : "Nouveau fragment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fiche personne (victime)</Label>
            <Select value={victimeId === "" ? "" : String(victimeId)} onValueChange={(v) => setVictimeId(Number(v))} disabled={!victimes.length}>
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
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={String(typeId)} onValueChange={(v) => setTypeId(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Titre (optionnel)</Label>
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre court" />
          </div>
          <div className="space-y-2">
            <Label>Description / contenu *</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Année (optionnel)</Label>
              <Input type="number" value={anneeFragment} onChange={(e) => setAnneeFragment(e.target.value)} placeholder="ex. 1975" />
            </div>
            <div className="space-y-2">
              <Label>Date (optionnel)</Label>
              <Input type="date" value={dateFragment} onChange={(e) => setDateFragment(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>ID fichier média (optionnel)</Label>
            <Input value={fichierMedia} onChange={(e) => setFichierMedia(e.target.value)} className="font-mono text-xs" placeholder="UUID Directus" />
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
