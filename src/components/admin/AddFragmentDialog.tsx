import { useState } from "react";
import { directus } from "@/integration/directus";
import { createItem, uploadFiles } from "@directus/sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { STATUT_ID, TYPE_FRAGMENT_ID } from "@/integration/directus-types";

interface AddFragmentDialogProps {
  victimeId: number;
  auteurTemoinId: number;
  onSuccess: () => void;
  qualiteStatuts: any[];
  typeFragments: any[];
}

export function AddFragmentDialog({ victimeId, auteurTemoinId, onSuccess, qualiteStatuts, typeFragments }: AddFragmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    type_id: typeFragments[0]?.id || 1,
    titre: "",
    description: "",
    annee_fragment: "",
    statut_id: qualiteStatuts[0]?.id || 2,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description) return toast.error("Description requise");

    setIsSubmitting(true);
    try {
      let mediaId: string | null = null;
      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        const res = await directus.request(uploadFiles(formData));
        mediaId = (res as any).id;
      }

      await directus.request(createItem("mmrl_fragments" as any, {
        victime_id: victimeId,
        auteur_temoin_id: auteurTemoinId,
        type_id: form.type_id,
        titre: form.titre || null,
        description: form.description,
        annee_fragment: form.annee_fragment ? Number(form.annee_fragment) : null,
        fichier_media: mediaId,
        statut_id: form.statut_id,
      }));

      toast.success("Fragment ajouté avec succès");
      setIsOpen(false);
      setForm({
        type_id: typeFragments[0]?.id || 1,
        titre: "",
        description: "",
        annee_fragment: "",
        statut_id: qualiteStatuts[0]?.id || 2,
      });
      setMediaFile(null);
      onSuccess();
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10">
          <Plus size={14} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un fragment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={String(form.type_id)} onValueChange={v => setForm(p => ({ ...p, type_id: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeFragments.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={String(form.statut_id)} onValueChange={v => setForm(p => ({ ...p, statut_id: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {qualiteStatuts.map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.libelle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Titre</Label>
            <Input value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} placeholder="Optionnel" />
          </div>

          <div className="space-y-2">
            <Label>Année</Label>
            <Input type="number" value={form.annee_fragment} onChange={e => setForm(p => ({ ...p, annee_fragment: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Fichier</Label>
            <Input type="file" onChange={e => setMediaFile(e.target.files?.[0] || null)} />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
