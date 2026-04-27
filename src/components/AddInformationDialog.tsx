import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { directus, directusAuth } from "@/integration/directus";
import { createItem, uploadFiles, readItems } from "@directus/sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, PenLine, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { STATUT_ID, TYPE_FRAGMENT_ID } from "@/integration/directus-types";

interface AddInformationDialogProps {
  victimeId: number;
  victimeName: string;
  trigger?: React.ReactNode;
  types?: any[];
  statuses?: any[];
}

export const AddInformationDialog = ({ victimeId, victimeName, trigger, types: initialTypes, statuses: initialStatuses }: AddInformationDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fragmentForm, setFragmentForm] = useState({
    type_id: initialTypes?.[0]?.id || TYPE_FRAGMENT_ID.TEMOIGNAGE,
    titre: "",
    description: "",
    annee_fragment: "",
    date_fragment: "",
    statut_id: initialStatuses?.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
  });

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [types, setTypes] = useState<any[]>(initialTypes || []);
  const [statuses, setStatuses] = useState<any[]>(initialStatuses || []);

  useEffect(() => {
    if (initialTypes && initialStatuses) {
      setTypes(initialTypes);
      setStatuses(initialStatuses);
      return;
    }
    const fetchData = async () => {
      try {
        const [t, s] = await Promise.all([
          directus.request(readItems("mmrl_type_fragment")),
          directus.request(readItems("mmrl_qualite_statut"))
        ]);
        setTypes(t);
        setStatuses(s);
      } catch (err) {
        console.error("Error fetching types/statuses:", err);
      }
    };
    fetchData();
  }, []);

  const handleOpen = (open: boolean) => {
    if (open && !user) {
      navigate("/auth");
      return;
    }
    setIsOpen(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté.");
      navigate("/auth");
      return;
    }
    if (!fragmentForm.description) {
      toast.error("Veuillez remplir la description.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Find or create témoin linked to this user
      let temoinId: number;
      const byUserId = await directusAuth.request(
        readItems("mmrl_temoins", { filter: { directus_user_id: { _eq: user.id }, deleted_at: { _null: true } }, limit: 1 })
      );

      if (byUserId && byUserId.length > 0) {
        temoinId = (byUserId[0] as any).id;
      } else {
        const t = await directusAuth.request(createItem("mmrl_temoins" as any, {
          directus_user_id: user.id,
          prenom: user.first_name || "",
          nom: user.last_name || "",
          email: user.email,
          statut_id: statuses.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
        }));
        temoinId = (t as any).id;
      }

      // 2. Upload media if present
      let uploadedMediaId: string | null = null;
      if (mediaFile) {
        const formData = new FormData();
        formData.append("file", mediaFile);
        const uploadResult = await directusAuth.request(uploadFiles(formData));
        uploadedMediaId = (uploadResult as any).id;
      }

      // 3. Create fragment
      await directusAuth.request(createItem("mmrl_fragments" as any, {
        victime_id: victimeId,
        auteur_temoin_id: temoinId,
        type_id: fragmentForm.type_id,
        titre: fragmentForm.titre || null,
        description: fragmentForm.description,
        annee_fragment: fragmentForm.annee_fragment ? Number(fragmentForm.annee_fragment) : null,
        date_fragment: fragmentForm.date_fragment || null,
        fichier_media: uploadedMediaId,
        statut_id: fragmentForm.statut_id || statuses.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
      }));

      toast.success("Votre information a été soumise. Elle sera publiée après vérification.");
      setIsOpen(false);

      // Reset form properly
      setFragmentForm({
        type_id: types[0]?.id || TYPE_FRAGMENT_ID.TEMOIGNAGE,
        titre: "",
        description: "",
        annee_fragment: "",
        date_fragment: "",
        statut_id: statuses.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
      });
      setMediaFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Une erreur est survenue : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 text-foreground">
            {user ? <PenLine size={16} className="text-primary" /> : <Lock size={16} className="text-primary" />}
            {user ? "Ajouter une information" : "Connexion requise"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-background border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">Contribuer au profil de {victimeName}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {user
              ? `Connecté en tant que ${user.first_name || user.email}. Votre contribution sera examinée avant publication.`
              : "Vous devez être connecté pour contribuer."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form id="add-info-form" onSubmit={handleSubmit} className="space-y-6 mt-2 pb-2">
            <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">L'information à ajouter</h3>

              <div className="space-y-2">
                <Label>Type d'information</Label>
                <Select value={String(fragmentForm.type_id)} onValueChange={(v) => setFragmentForm(p => ({ ...p, type_id: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {types.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.libelle}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Titre (optionnel)</Label>
                <Input
                  value={fragmentForm.titre}
                  onChange={e => setFragmentForm(p => ({ ...p, titre: e.target.value }))}
                  placeholder="Ex: Photo de famille, Récit de l'exode..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Année de l'info</Label>
                  <Input
                    type="number"
                    value={fragmentForm.annee_fragment}
                    onChange={e => setFragmentForm(p => ({ ...p, annee_fragment: e.target.value }))}
                    placeholder="ex: 1976"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date précise</Label>
                  <Input
                    type="date"
                    value={fragmentForm.date_fragment}
                    onChange={e => setFragmentForm(p => ({ ...p, date_fragment: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description détaillée *</Label>
                <Textarea
                  value={fragmentForm.description}
                  onChange={e => setFragmentForm(p => ({ ...p, description: e.target.value }))}
                  required
                  rows={4}
                  placeholder="Décrivez l'information que vous souhaitez apporter..."
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label>Joindre un fichier (Optionnel)</Label>
                <Input type="file" accept="image/*,.pdf,audio/*" onChange={e => setMediaFile(e.target.files?.[0] || null)} />
              </div>

            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4 shrink-0">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="submit" form="add-info-form" className="bg-primary text-primary-foreground" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</>
            ) : (
              "Publier l'information"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
