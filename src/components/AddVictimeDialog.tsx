import { useState } from "react";
import { directus } from "@/integration/directus";
import { createItem, uploadFiles, readItems } from "@directus/sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, UserPlus } from "lucide-react";

const AddVictimeDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Témoin (celui qui soumet)
  const [temoinForm, setTemoinForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: ""
  });

  // Victime
  const [victimeForm, setVictimeForm] = useState({
    prenom: "",
    nom: "",
    sexe: "",
    date_naissance: "",
    lieu_naissance: "",
    date_deces: "",
    lieu_deces: "",
    profession: "",
    origine_familiale: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temoinForm.prenom || !temoinForm.nom || !temoinForm.email || !victimeForm.prenom || !victimeForm.nom) {
      toast.error("Veuillez remplir les champs obligatoires (Noms, Prénoms, Email).");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Chercher si le témoin existe déjà (car l'email est UNIQUE dans la BDD)
      let temoinId: string | number | null = null;
      const existingTemoins = await directus.request(
        readItems("memorial_temoins", {
          filter: { email: { _eq: temoinForm.email } },
          limit: 1
        })
      );

      if (existingTemoins && existingTemoins.length > 0) {
        temoinId = (existingTemoins[0] as any).id;
      } else {
        const temoinResult = await directus.request(
          createItem("memorial_temoins", {
            prenom: temoinForm.prenom,
            nom: temoinForm.nom,
            email: temoinForm.email,
            telephone: temoinForm.telephone,
            statut: "actif"
          })
        );
        temoinId = (temoinResult as any).id;
      }

      // 2. Upload photo si présente
      let mediaId: string | null = null;
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadResult = await directus.request(uploadFiles(formData));
        mediaId = (uploadResult as any).id;
      }

      // 3. Créer la victime liée au témoin
      await directus.request(
        createItem("memorial_victimes", {
          temoin_id: Number(temoinId),
          prenom: victimeForm.prenom,
          nom: victimeForm.nom,
          sexe: victimeForm.sexe || null,
          date_naissance: victimeForm.date_naissance || null,
          lieu_naissance: victimeForm.lieu_naissance || null,
          date_deces: victimeForm.date_deces || null,
          lieu_deces: victimeForm.lieu_deces || null,
          profession: victimeForm.profession || null,
          origine_familiale: victimeForm.origine_familiale || null,
          photo_principale: mediaId,
          statut: "brouillon", // en attente de validation par l'admin
        })
      );

      toast.success("La personne a été proposée et sera validée prochainement.");
      setIsOpen(false);
      
      // Reset forms
      setTemoinForm({ prenom: "", nom: "", email: "", telephone: "" });
      setVictimeForm({ prenom: "", nom: "", sexe: "", date_naissance: "", lieu_naissance: "", date_deces: "", lieu_deces: "", profession: "", origine_familiale: "" });
      setPhotoFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Une erreur est survenue : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 rounded-full px-6 shadow-md hover:shadow-lg transition-all text-primary-foreground">
          <UserPlus size={18} />
          Ajouter une personne
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-background border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">Proposer une personne au mémorial</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Contribuez à la mémoire collective en ajoutant une personne disparue. Ses informations seront vérifiées avant publication.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <form id="add-victime-form" onSubmit={handleSubmit} className="space-y-6 mt-2 pb-2">
            
            {/* Section Témoin */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                1. Vos coordonnées (Source)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Votre Prénom *</Label>
                  <Input value={temoinForm.prenom} onChange={e => setTemoinForm(p => ({...p, prenom: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label>Votre Nom *</Label>
                  <Input value={temoinForm.nom} onChange={e => setTemoinForm(p => ({...p, nom: e.target.value}))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={temoinForm.email} onChange={e => setTemoinForm(p => ({...p, email: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone (optionnel)</Label>
                  <Input value={temoinForm.telephone} onChange={e => setTemoinForm(p => ({...p, telephone: e.target.value}))} />
                </div>
              </div>
            </div>

            {/* Section Victime */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                2. Informations sur la victime
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input value={victimeForm.prenom} onChange={e => setVictimeForm(p => ({...p, prenom: e.target.value}))} required />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input value={victimeForm.nom} onChange={e => setVictimeForm(p => ({...p, nom: e.target.value}))} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sexe</Label>
                <Select value={victimeForm.sexe} onValueChange={(v) => setVictimeForm(p => ({...p, sexe: v}))}>
                  <SelectTrigger><SelectValue placeholder="Non spécifié" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                    <SelectItem value="Inconnu">Inconnu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <Input type="date" value={victimeForm.date_naissance} onChange={e => setVictimeForm(p => ({...p, date_naissance: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Lieu de naissance</Label>
                  <Input value={victimeForm.lieu_naissance} onChange={e => setVictimeForm(p => ({...p, lieu_naissance: e.target.value}))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de décès</Label>
                  <Input type="date" value={victimeForm.date_deces} onChange={e => setVictimeForm(p => ({...p, date_deces: e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Lieu de décès</Label>
                  <Input value={victimeForm.lieu_deces} onChange={e => setVictimeForm(p => ({...p, lieu_deces: e.target.value}))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profession</Label>
                <Input value={victimeForm.profession} onChange={e => setVictimeForm(p => ({...p, profession: e.target.value}))} />
              </div>

              <div className="space-y-2">
                <Label>Origine familiale / Ethnie</Label>
                <Input value={victimeForm.origine_familiale} onChange={e => setVictimeForm(p => ({...p, origine_familiale: e.target.value}))} placeholder="ex: Khmer, Cham, Sino-Khmer..." />
              </div>

              <div className="space-y-2 pt-2">
                <Label>Photo (optionnel)</Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} />
              </div>

            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4 shrink-0">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button type="submit" form="add-victime-form" className="bg-primary text-primary-foreground" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...</>
            ) : (
              "Soumettre"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVictimeDialog;
