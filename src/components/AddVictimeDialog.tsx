import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { directus, directusAuth } from "@/integration/directus";
import { createItem, updateItem, uploadFiles, readItems } from "@directus/sdk";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, UserPlus, ChevronRight, ChevronLeft, Plus, Trash2, Check, Pencil, Lock } from "lucide-react";
import type { VictimeRow } from "@/integration/directus-types";
import { STATUT_ID } from "@/integration/directus-types";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface ParcoursEntry {
  annee: string;
  titre: string;
  description: string;
  statut_id: number;
}

interface AddVictimeDialogProps {
  onSuccess?: () => void;
  editVictime?: VictimeRow | null;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost";
  statuses?: any[];
}

const STEPS = ["La victime", "Son parcours"];

const AddVictimeDialog = ({ onSuccess, editVictime, triggerLabel, triggerVariant = "default", statuses: initialStatuses }: AddVictimeDialogProps) => {
  const isEdit = !!editVictime;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statuses, setStatuses] = useState<any[]>(initialStatuses || []);

  useEffect(() => {
    if (initialStatuses) {
      setStatuses(initialStatuses);
      return;
    }
    const fetchStatuses = async () => {
      try {
        const s = await directus.request(readItems("mmrl_qualite_statut"));
        setStatuses(s);
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };
    fetchStatuses();
  }, []);

  // — Helpers —
  const getId = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'object' && val.id !== undefined) return Number(val.id);
    return Number(val);
  };

  // — Victime —
  const [victimeForm, setVictimeForm] = useState({
    prenom: editVictime?.prenom || "",
    nom: editVictime?.nom || "",
    sexe: editVictime?.sexe != null ? String(editVictime.sexe) : "",
    annee_naissance: editVictime?.annee_naissance != null ? String(editVictime.annee_naissance) : "",
    date_naissance: editVictime?.date_naissance || "",
    lieu_naissance: editVictime?.lieu_naissance || "",
    annee_deces: editVictime?.annee_deces != null ? String(editVictime.annee_deces) : "",
    date_deces: editVictime?.date_deces || "",
    lieu_deces: editVictime?.lieu_deces || "",
    profession: editVictime?.profession || "",
    origine_familiale: editVictime?.origine_familiale || "",
    statut_id: getId(editVictime?.statut_id) || initialStatuses?.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // — Source du témoignage (qui connaît la victime ?) —
  const [sourceForm, setSourceForm] = useState({
    prenom: user?.first_name || "",
    nom: user?.last_name || "",
    email: user?.email || "",
    telephone: "",
    statut_id: initialStatuses?.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
  });

  // — Parcours entries —
  const [parcoursEntries, setParcoursEntries] = useState<ParcoursEntry[]>([
    { annee: "", titre: "", description: "", statut_id: initialStatuses?.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER }
  ]);

  const addParcoursEntry = () => {
    setParcoursEntries(prev => [...prev, { annee: "", titre: "", description: "", statut_id: STATUT_ID.A_VERIFIER }]);
  };
  const removeParcoursEntry = (i: number) => {
    setParcoursEntries(prev => prev.filter((_, idx) => idx !== i));
  };
  const updateParcoursEntry = (i: number, field: keyof ParcoursEntry, value: string | number) => {
    setParcoursEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  const resetForms = () => {
    const defaultStatutId = statuses.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER;
    setVictimeForm({ prenom: "", nom: "", sexe: "", annee_naissance: "", date_naissance: "", lieu_naissance: "", annee_deces: "", date_deces: "", lieu_deces: "", profession: "", origine_familiale: "", statut_id: defaultStatutId });
    setSourceForm({ prenom: user?.first_name || "", nom: user?.last_name || "", email: user?.email || "", telephone: "", statut_id: defaultStatutId });
    setPhotoFile(null);
    setParcoursEntries([{ annee: "", titre: "", description: "", statut_id: defaultStatutId }]);
    setStep(0);
  };

  const handleOpen = (open: boolean) => {
    if (open && !user) {
      navigate("/auth");
      return;
    }
    setIsOpen(open);
    if (!open) resetForms();
  };

  const validateStep = () => {
    if (step === 0) {
      if (!victimeForm.prenom || !victimeForm.nom) {
        toast.error("Le prénom et le nom de la victime sont obligatoires.");
        return false;
      }
      if (!sourceForm.prenom || !sourceForm.nom) {
        toast.error("Veuillez indiquer votre prénom et nom comme source du témoignage.");
        return false;
      }
      if (!sourceForm.email || !sourceForm.telephone) {
        toast.error("L'email et le téléphone de la source sont obligatoires.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour soumettre une victime.");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    try {
      let victimeId = editVictime?.id;

      if (!isEdit) {
        // ── 1. Trouver ou créer le témoin (auteur) lié au compte ──
        let temoinId: number;

        const byUserId = await directusAuth.request(
          readItems("mmrl_temoins", { filter: { directus_user_id: { _eq: user.id }, deleted_at: { _null: true } }, limit: 1 })
        );

        if (byUserId && byUserId.length > 0) {
          temoinId = (byUserId[0] as any).id;
        } else {
          const byEmail = await directusAuth.request(
            readItems("mmrl_temoins", { filter: { email: { _eq: user.email }, deleted_at: { _null: true } }, limit: 1 })
          );

          if (byEmail && byEmail.length > 0) {
            temoinId = (byEmail[0] as any).id;
          } else {
            const t = await directusAuth.request(createItem("mmrl_temoins", {
              directus_user_id: user.id,
              prenom: user.first_name || "",
              nom: user.last_name || "",
              email: user.email,
              statut_id: statuses.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
            } as any));
            temoinId = (t as any).id;
          }
        }

        // ── 2. Trouver ou créer la source du témoignage ──
        let sourceId: number;

        // Si l'utilisateur est lui-même la source, chercher dans sources_temoignage par source_user_id
        const bySourceUserId = await directusAuth.request(
          readItems("mmrl_sources_temoignage", { filter: { source_user_id: { _eq: user.id }, deleted_at: { _null: true } }, limit: 1 })
        );

        if (bySourceUserId && bySourceUserId.length > 0) {
          sourceId = (bySourceUserId[0] as any).id;
        } else {
          // Créer une nouvelle source avec les infos saisies
          const s = await directusAuth.request(createItem("mmrl_sources_temoignage", {
            source_user_id: user.id,
            prenom: sourceForm.prenom || user.first_name || "",
            nom: sourceForm.nom || user.last_name || "",
            email: sourceForm.email || user.email || "",
            telephone: sourceForm.telephone || "",
            statut_id: sourceForm.statut_id || statuses.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
          } as any));
          sourceId = (s as any).id;
        }

        // ── 3. Upload photo ──
        let photoId: string | null = null;
        if (photoFile) {
          const fd = new FormData();
          fd.append("file", photoFile);
          const up = await directusAuth.request(uploadFiles(fd));
          photoId = (up as any).id;
        }

        // ── 4. Créer la victime ──
        const v = await directusAuth.request(createItem("mmrl_victimes", {
          auteur_temoin_id: temoinId,
          source_id: sourceId,
          prenom: victimeForm.prenom,
          nom: victimeForm.nom,
          sexe: victimeForm.sexe !== "" ? Number(victimeForm.sexe) : null,
          annee_naissance: victimeForm.annee_naissance ? Number(victimeForm.annee_naissance) : null,
          date_naissance: victimeForm.date_naissance || null,
          lieu_naissance: victimeForm.lieu_naissance || null,
          annee_deces: victimeForm.annee_deces ? Number(victimeForm.annee_deces) : null,
          date_deces: victimeForm.date_deces || null,
          lieu_deces: victimeForm.lieu_deces || null,
          profession: victimeForm.profession || null,
          origine_familiale: victimeForm.origine_familiale || null,
          photo_principale: photoId,
          statut_id: victimeForm.statut_id || statuses.find(s => s.code === 'a_verifier')?.id || STATUT_ID.A_VERIFIER,
        } as any));
        victimeId = (v as any).id;

      } else {
        // ── Mode édition ──
        let photoId: string | null | undefined = editVictime?.photo_principale;
        if (photoFile) {
          const fd = new FormData();
          fd.append("file", photoFile);
          const up = await directus.request(uploadFiles(fd));
          photoId = (up as any).id;
        }

        await directusAuth.request(updateItem("mmrl_victimes", editVictime!.id, {
          prenom: victimeForm.prenom,
          nom: victimeForm.nom,
          sexe: victimeForm.sexe !== "" ? Number(victimeForm.sexe) : null,
          annee_naissance: victimeForm.annee_naissance ? Number(victimeForm.annee_naissance) : null,
          date_naissance: victimeForm.date_naissance || null,
          lieu_naissance: victimeForm.lieu_naissance || null,
          annee_deces: victimeForm.annee_deces ? Number(victimeForm.annee_deces) : null,
          date_deces: victimeForm.date_deces || null,
          lieu_deces: victimeForm.lieu_deces || null,
          profession: victimeForm.profession || null,
          origine_familiale: victimeForm.origine_familiale || null,
          photo_principale: photoId || null,
          statut_id: victimeForm.statut_id,
        } as any));
      }

      // ── 5. Créer les entrées de parcours (création seulement) ──
      if (!isEdit && victimeId) {
        const validParcours = parcoursEntries.filter(p => p.annee || p.description);
        await Promise.all(
          validParcours.map((p, idx) =>
            directusAuth.request(createItem("mmrl_parcours", {
              victime_id: victimeId!,
              annee_evenement: p.annee ? Number(p.annee) : null,
              titre: p.titre || null,
              description: p.description || null,
              ordre: idx,
              statut_id: p.statut_id,
            } as any))
          )
        );
      }

      toast.success(isEdit ? "Victime mise à jour avec succès." : "Victime ajoutée ! En attente de validation par l'équipe.");
      setIsOpen(false);
      resetForms();
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatutBadge = ({ statut_id }: { statut_id: number }) => {
    const s = statuses.find(x => x.id === statut_id);
    if (!s) return null;
    const color = s.couleur_hex || '#666';
    return (
      <Badge 
        style={{ 
          backgroundColor: color + '15', 
          color: color,
          borderColor: color + '30'
        }}
        className="border font-medium"
      >
        {s.libelle}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant={triggerVariant} size="sm" className="gap-2">
            <Pencil size={14} />
            {triggerLabel || "Modifier"}
          </Button>
        ) : (
          <Button variant={triggerVariant} className="gap-2 rounded-full px-6 shadow-md hover:shadow-lg transition-all text-primary-foreground">
            {user ? <UserPlus size={18} /> : <Lock size={18} />}
            {triggerLabel || (user ? "Ajouter une personne" : "Connexion requise")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px] bg-background border-border max-h-[92vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-foreground">
            {isEdit ? `Modifier — ${editVictime?.prenom} ${editVictime?.nom}` : "Proposer une personne au mémorial"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEdit
              ? "Modifiez les informations de la victime."
              : user
              ? `Connecté en tant que ${user.first_name || user.email}. Toutes les informations seront vérifiées avant publication.`
              : "Vous devez être connecté pour proposer une victime."}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper (création seulement) */}
        {!isEdit && (
          <div className="flex items-center gap-1 pb-4 pt-1">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : 'bg-muted text-muted-foreground'}`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:block ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-4">

          {/* ── ÉTAPE 0 : VICTIME ── */}
          {(step === 0 || isEdit) && (
            <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Informations sur la victime</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input value={victimeForm.prenom} onChange={e => setVictimeForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Prénom" />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input value={victimeForm.nom} onChange={e => setVictimeForm(p => ({ ...p, nom: e.target.value }))} placeholder="Nom de famille" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sexe</Label>
                  <Select value={victimeForm.sexe} onValueChange={v => setVictimeForm(p => ({ ...p, sexe: v }))}>
                    <SelectTrigger><SelectValue placeholder="Non spécifié" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Inconnu</SelectItem>
                      <SelectItem value="1">Masculin</SelectItem>
                      <SelectItem value="2">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Année de naissance</Label>
                  <Input type="number" value={victimeForm.annee_naissance} onChange={e => setVictimeForm(p => ({ ...p, annee_naissance: e.target.value }))} placeholder="ex: 1955" />
                </div>
                <div className="space-y-2">
                  <Label>Date de naissance (précise)</Label>
                  <Input type="date" value={victimeForm.date_naissance} onChange={e => setVictimeForm(p => ({ ...p, date_naissance: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lieu de naissance</Label>
                <Input value={victimeForm.lieu_naissance} onChange={e => setVictimeForm(p => ({ ...p, lieu_naissance: e.target.value }))} placeholder="Ville ou province" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Année de décès</Label>
                  <Input type="number" value={victimeForm.annee_deces} onChange={e => setVictimeForm(p => ({ ...p, annee_deces: e.target.value }))} placeholder="ex: 1978" />
                </div>
                <div className="space-y-2">
                  <Label>Date de décès (précise)</Label>
                  <Input type="date" value={victimeForm.date_deces} onChange={e => setVictimeForm(p => ({ ...p, date_deces: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lieu de décès</Label>
                <Input value={victimeForm.lieu_deces} onChange={e => setVictimeForm(p => ({ ...p, lieu_deces: e.target.value }))} placeholder="Lieu ou S21, S-21..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Profession</Label>
                  <Input value={victimeForm.profession} onChange={e => setVictimeForm(p => ({ ...p, profession: e.target.value }))} placeholder="Enseignant, médecin..." />
                </div>
                <div className="space-y-2">
                  <Label>Origine familiale / Ethnie</Label>
                  <Input value={victimeForm.origine_familiale} onChange={e => setVictimeForm(p => ({ ...p, origine_familiale: e.target.value }))} placeholder="Khmer, Cham, Sino-Khmer..." />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Photo (optionnel)</Label>
                <Input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                {editVictime?.photo_principale && !photoFile && (
                  <p className="text-xs text-muted-foreground">Une photo est déjà associée. Sélectionnez un nouveau fichier pour la remplacer.</p>
                )}
              </div>

              {/* Source du témoignage (création uniquement) */}
              {!isEdit && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Source du témoignage</h4>
                  <p className="text-xs text-muted-foreground">Comment connaissez-vous ces informations ? (votre identité par défaut)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Prénom *</Label>
                      <Input value={sourceForm.prenom} onChange={e => setSourceForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Prénom" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nom *</Label>
                      <Input value={sourceForm.nom} onChange={e => setSourceForm(p => ({ ...p, nom: e.target.value }))} placeholder="Nom" className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Email *</Label>
                      <Input value={sourceForm.email} onChange={e => setSourceForm(p => ({ ...p, email: e.target.value }))} placeholder="votre@email.com" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Téléphone *</Label>
                      <Input value={sourceForm.telephone} onChange={e => setSourceForm(p => ({ ...p, telephone: e.target.value }))} placeholder="06..." className="h-8 text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 1 : PARCOURS ── */}
          {(step === 1 && !isEdit) && (
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Parcours & Chronologie (optionnel)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addParcoursEntry} className="gap-1">
                  <Plus size={14} /> Ajouter une étape
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Ajoutez les événements clés de la vie de la personne (déplacements, emprisonnements, dates significatives…)</p>

              {parcoursEntries.map((entry, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-3 bg-card">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Étape {i + 1}</span>
                    {parcoursEntries.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeParcoursEntry(i)}>
                        <Trash2 size={12} />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Année</Label>
                      <Input
                        type="number"
                        value={entry.annee}
                        onChange={e => updateParcoursEntry(i, "annee", e.target.value)}
                        placeholder="ex: 1975"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Titre de l'événement</Label>
                    <Input
                      value={entry.titre}
                      onChange={e => updateParcoursEntry(i, "titre", e.target.value)}
                      placeholder="Ex: Arrestation, Déplacement vers..."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description de l'événement</Label>
                    <Textarea
                      value={entry.description}
                      onChange={e => updateParcoursEntry(i, "description", e.target.value)}
                      placeholder="Décrivez cet événement…"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-border mt-2 shrink-0">
          <div>
            {!isEdit && step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
                <ChevronLeft size={16} /> Précédent
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Annuler</Button>
            {!isEdit && step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => { if (validateStep()) setStep(s => s + 1); }} className="gap-2">
                Suivant <ChevronRight size={16} />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Envoi…</> : isEdit ? "Enregistrer les modifications" : "Soumettre au mémorial"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVictimeDialog;
