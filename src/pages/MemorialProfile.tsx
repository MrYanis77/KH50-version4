import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Clock, MapPin, User, Briefcase, Heart, X, BookOpen, Camera, Video, FileText, MapPinned, Pencil, Loader2 } from "lucide-react";
import { useMemorialPerson } from "@/hooks/useDirectus";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { directus, getAssetUrl } from "@/integration/directus";
import { createItem, uploadFiles } from "@directus/sdk";
import { TYPE_FRAGMENT_ID } from "@/integration/directus-types";
import { toast } from "sonner";
import { AddInformationDialog } from "@/components/AddInformationDialog";
import FamilySpiderGraph from "@/components/FamilySpiderGraph";
import SepultureVirtuelle from "@/components/SepultureVirtuelle";


const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const fragmentTypeLabels: Record<string, string> = {
  testimony: "Témoignage",
  photograph: "Photographie",
  video: "Vidéo",
  story: "Récit",
  document: "Document",
  place: "Lieu / Objet",
};

const fragmentTypeIcons: Record<string, React.ReactNode> = {
  temoignage: <BookOpen className="h-4 w-4" />,
  photographie: <Camera className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  recit: <FileText className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  lieu: <MapPinned className="h-4 w-4" />,
};

const MemorialProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { person, fragments, parcours, isVerified, loading, error } = useMemorialPerson(Number(id));
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'video' | 'image' | 'pdf' } | null>(null);
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [showParcoursForm, setShowParcoursForm] = useState(false);
  const [fragmentFile, setFragmentFile] = useState<File | null>(null);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parcoursForm, setParcoursForm] = useState({
    annee: "",
    description: "",
  });
  const [parcoursFile, setParcoursFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'fragment' | 'parcours') => {
    if (e.target.files?.[0]) {
      if (type === 'fragment') setFragmentFile(e.target.files[0]);
      else setParcoursFile(e.target.files[0]);
    }
  };

  // Fragments are now handled by AddInformationDialog component


  const handleSubmitParcours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parcoursForm.annee || !parcoursForm.description) {
      toast.error("Veuillez remplir l'année et la description.");
      return;
    }

    setIsSubmitting(true);
    try {
      let mediaId: string | null = null;
      if (parcoursFile) {
        const formData = new FormData();
        formData.append("file", parcoursFile);
        const uploadResult = await directus.request(uploadFiles(formData));
        mediaId = (uploadResult as any).id;
      }

      await directus.request(
        createItem("mmrl_parcours" as any, {
          victime_id: Number(id),
          annee_evenement: parcoursForm.annee ? Number(parcoursForm.annee) : null,
          description: parcoursForm.description,
          fichier_media: mediaId,
          ordre: 0,
          statut_id: 2, // a_verifier
        })
      );

      toast.success("L'étape de parcours a été envoyée et sera validée prochainement.");
      setShowParcoursForm(false);
      setParcoursForm({ annee: "", description: "" });
      setParcoursFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Une erreur est survenue : " + (err.message || "Erreur inconnue"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement du profil…</div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-display text-2xl text-foreground">{error || "Personne introuvable"}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-lg p-8 border border-border rounded-xl bg-card shadow-sm">
          <p className="font-display text-2xl text-foreground">En cours de validation</p>
          <p className="text-muted-foreground font-body leading-relaxed">Le profil de <strong>{person.prenom} {person.nom}</strong> a bien été reçu. Il est actuellement en cours d'examen par notre équipe et sera publié sur le mémorial très prochainement.</p>
          <Button variant="default" onClick={() => navigate("/memorial")} className="mt-4 shadow-sm">Retour au mémorial</Button>
        </div>
      </div>
    );
  }

  const imageSrc = getAssetUrl(person.photo_principale);

  return (
    <div className="min-h-screen bg-background font-body">
      

      {/* Header */}
      <motion.section
        className="pt-24 pb-12 px-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
      >
        <div className="container mx-auto max-w-4xl">
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-8">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="border-border text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="bg-primary text-primary-foreground gap-2">
                    <Pencil className="h-4 w-4" /> Éditer
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-background border-border">
                  <AddInformationDialog 
                    victimeId={person.id} 
                    victimeName={`${person.prenom} ${person.nom}`} 
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 cursor-pointer font-medium">
                        <Plus className="h-4 w-4" /> Ajouter un fragment
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem onClick={() => setShowParcoursForm(true)} className="gap-2 cursor-pointer font-medium mt-1">
                    <Plus className="h-4 w-4" /> Ajouter au parcours
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground gap-2">
                <Pencil className="h-4 w-4" /> Éditer
              </Button>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center sm:items-end gap-8">
            <div className="w-40 h-52 rounded-lg overflow-hidden shadow-lg border-2 border-secondary flex-shrink-0 bg-muted">
              {person.photo_principale ? (
                <img src={imageSrc} alt={`Portrait de ${person.prenom} ${person.nom}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
                {person.prenom} <span className="uppercase">{person.nom}</span>
              </h1>
              {(person.annee_naissance || person.annee_deces || person.date_naissance || person.date_deces) && (
                <p className="text-muted-foreground mt-1 text-lg">
                  {person.date_naissance || person.annee_naissance || '?'} — {person.date_deces || person.annee_deces || '?'}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* État civil */}
      <motion.section
        className="py-10 px-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <div className="container mx-auto max-w-4xl">
          <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2">
            État civil
          </motion.h2>
          <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <User className="h-4 w-4" />, label: "Sexe", value: person.sexe != null ? (person.sexe === 1 ? 'Masculin' : person.sexe === 2 ? 'Féminin' : 'Inconnu') : null },
              { icon: <MapPin className="h-4 w-4" />, label: "Lieu de naissance", value: person.lieu_naissance },
              { icon: <Clock className="h-4 w-4" />, label: "Date de naissance", value: person.date_naissance || (person.annee_naissance ? String(person.annee_naissance) : null) },
              { icon: <MapPin className="h-4 w-4" />, label: "Lieu de décès", value: person.lieu_deces },
              { icon: <Clock className="h-4 w-4" />, label: "Date de décès", value: person.date_deces || (person.annee_deces ? String(person.annee_deces) : null) },
              { icon: <Briefcase className="h-4 w-4" />, label: "Profession", value: person.profession },
              { icon: <Heart className="h-4 w-4" />, label: "Origine familiale", value: person.origine_familiale },
            ]
              .filter((f) => f.value)
              .map((field) => (
                <div key={field.label} className="flex items-start gap-3 bg-card rounded-lg p-4 border border-border">
                  <span className="text-accent mt-0.5">{field.icon}</span>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{field.label}</p>
                    <p className="text-foreground font-medium">{field.value}</p>
                  </div>
                </div>
              ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Liens de parenté (araignée généalogique) */}
      <FamilySpiderGraph victime={person} />

      {/* Fragments de mémoire */}
      {fragments && fragments.length > 0 && (
        <motion.section
          className="py-10 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2">
              Récits & Témoignages
            </motion.h2>
            <div className="space-y-8 mb-12">
              {fragments.filter(f => {
                const code = f.type?.code || '';
                const id = f.type_id;
                return ['temoignage', 'recit', 'document'].includes(code) || 
                       [TYPE_FRAGMENT_ID.TEMOIGNAGE, TYPE_FRAGMENT_ID.RECIT, TYPE_FRAGMENT_ID.DOCUMENT].includes(id);
              }).map((frag) => (
                <motion.div key={frag.id} variants={fadeUp} className={`bg-card rounded-2xl p-8 border shadow-sm italic text-lg leading-relaxed relative quote-card transition-all ${
                  frag.statut_id === 2
                    ? 'border-yellow-400 bg-yellow-50/60 dark:bg-yellow-900/10'
                    : 'border-border'
                }`}>
                   {frag.statut_id === 2 && (
                     <Badge className="absolute top-2 right-4 text-xs z-20 bg-yellow-100 text-yellow-800 border border-yellow-300">🟡 Hypothèse - À vérifier</Badge>
                   )}
                   <div className="text-accent/20 absolute top-4 left-4 font-serif text-6xl">"</div>
                   <p className="relative z-10 text-foreground/90 px-4 whitespace-pre-wrap">{frag.description}</p>
                   <p className="relative z-10 text-sm text-muted-foreground mt-4 text-right">— <span className="opacity-60 text-xs ml-2">{frag.date_fragment || (frag.annee_fragment ? String(frag.annee_fragment) : '')}</span></p>
                </motion.div>
              ))}
            </div>

            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2">
              Autres Mémoires
            </motion.h2>
            <div className="space-y-4">
              {fragments.filter(f => {
                const code = f.type?.code || '';
                const id = f.type_id;
                const isTextType = ['temoignage', 'recit', 'document'].includes(code) || 
                                  [TYPE_FRAGMENT_ID.TEMOIGNAGE, TYPE_FRAGMENT_ID.RECIT, TYPE_FRAGMENT_ID.DOCUMENT].includes(id);
                return !isTextType;
              }).map((frag) => (
                <motion.div
                  key={frag.id}
                  variants={fadeUp}
                  className={`rounded-lg border p-5 transition-all ${
                    frag.statut_id === 2
                      ? "border-yellow-400 bg-yellow-50/60 dark:bg-yellow-900/10"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {frag.statut_id === 2 ? (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 border border-yellow-300">🟡 Hypothèse</Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">{frag.type?.libelle || 'Mémoire'}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{frag.date_fragment || (frag.annee_fragment ? String(frag.annee_fragment) : '')}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{frag.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">— Source : {frag.auteur_temoin_id ? 'Témoin' : 'Anonyme'}</p>
                  {frag.fichier_media && (
                    <div className="mt-4">
                      {frag.type?.code === 'video' || frag.type_id === 3 ? (
                        <video 
                          src={getAssetUrl(frag.fichier_media)} 
                          controls 
                          preload="metadata"
                          playsInline
                          className="max-h-96 w-full rounded-lg bg-black"
                        />
                      ) : frag.type?.code === 'audio' || frag.type_id === 7 ? (
                        <audio 
                          src={getAssetUrl(frag.fichier_media)} 
                          controls 
                          preload="metadata"
                          className="w-full"
                        />
                      ) : (
                        <img 
                            src={getAssetUrl(frag.fichier_media)} 
                            alt="Archive" 
                            className="max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxMedia({ 
                              url: getAssetUrl(frag.fichier_media), 
                              type: frag.type?.code === 'document' ? 'pdf' : 'image' 
                            })}
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Parcours / Ligne de temps */}
      {parcours && parcours.length > 0 && (
        <motion.section
          className="py-10 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-10 border-b border-border pb-2">
              Ligne de temps
            </motion.h2>
            <div className="relative pl-8 border-l-2 border-accent/30 space-y-12 pb-4 ml-4">
              {parcours.map((item, idx) => (
                <motion.div key={item.id} variants={fadeUp} className="relative">
                  <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-accent border-4 border-background" />
                  <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                    <div className="flex-shrink-0">
                      <span className="text-xl font-display text-accent font-bold">{item.annee_evenement || item.date_evenement?.slice(0,4)}</span>
                    </div>
                    <div className="flex-grow bg-card rounded-xl p-5 border border-border shadow-sm">
                      <p className="text-foreground leading-relaxed">{item.description}</p>
                      {item.fichier_media && (
                        <div className="mt-4 rounded-lg overflow-hidden border border-border max-w-sm">
                          <img 
                            src={getAssetUrl(item.fichier_media)} 
                            alt="Document de parcours" 
                            className="w-full h-auto cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setLightboxMedia({ 
                              url: getAssetUrl(item.fichier_media), 
                              type: 'image' // On suppose que c'est une image ici, ou pdf si on veut
                            })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Galerie de photos (issue des fragments) */}
      {fragments && fragments.filter(f => {
        const code = f.type?.code || '';
        const id = f.type_id;
        return ['photographie', 'video'].includes(code) || 
               [TYPE_FRAGMENT_ID.PHOTOGRAPHIE, TYPE_FRAGMENT_ID.VIDEO].includes(id);
      }).length > 0 && (
        <motion.section
          className="py-12 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-8 border-b border-border pb-2">
              Galerie Mémoire
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {fragments.filter(f => {
                const code = f.type?.code || '';
                const id = f.type_id;
                const isGalleryType = ['photographie', 'video'].includes(code) || 
                                     [TYPE_FRAGMENT_ID.PHOTOGRAPHIE, TYPE_FRAGMENT_ID.VIDEO].includes(id);
                return isGalleryType && f.fichier_media;
              }).map((frag) => (
                <motion.div 
                  key={frag.id} 
                  variants={fadeUp}
                  whileHover={{ scale: 1.02 }}
                  className={`aspect-square rounded-xl overflow-hidden border bg-muted cursor-pointer shadow-sm hover:shadow-md transition-all relative group ${
                    frag.statut_id === 2 ? 'border-yellow-400' : 'border-border'
                  }`}
                  onClick={() => setLightboxMedia({ 
                    url: getAssetUrl(frag.fichier_media), 
                    type: frag.type?.code === 'video' ? 'video' : 'image' 
                  })}
                >
                  {frag.statut_id === 2 && (
                     <Badge className="absolute top-2 left-2 text-[10px] z-20 bg-yellow-100 text-yellow-800">🟡</Badge>
                  )}
                  {frag.type?.code === 'video' ? (
                    <div className="w-full h-full relative">
                      <video 
                        src={getAssetUrl(frag.fichier_media)} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <Video className="w-12 h-12 text-white/80" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={getAssetUrl(frag.fichier_media, "width=400&height=400&fit=cover")} 
                      alt="Photo d'archive" 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <p className="text-white text-sm">{frag.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxMedia && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/90 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-5xl w-full flex items-center justify-center h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxMedia(null)}
                className="absolute top-4 right-4 bg-background/20 backdrop-blur-md rounded-full p-2 text-white hover:bg-white/20 transition-colors z-50"
              >
                <X className="h-6 w-6" />
              </button>
              
              {lightboxMedia.type === 'video' ? (
                <video src={lightboxMedia.url} controls autoPlay preload="auto" playsInline className="rounded-lg max-w-full max-h-[90vh] shadow-2xl" />
              ) : lightboxMedia.type === 'pdf' ? (
                <div className="w-full h-full flex flex-col gap-4">
                  <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-2xl">
                    <iframe src={`${lightboxMedia.url}#toolbar=0`} className="w-full h-full border-none" title="Document Preview" />
                  </div>
                  <div className="flex justify-center pb-4">
                    <Button variant="secondary" asChild>
                      <a href={lightboxMedia.url} target="_blank" rel="noreferrer">Ouvrir dans un nouvel onglet</a>
                    </Button>
                  </div>
                </div>
              ) : (
                <img src={lightboxMedia.url} alt="Vue agrandie" className="rounded-lg max-w-full max-h-[90vh] object-contain shadow-2xl" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fragments are now handled by AddInformationDialog component */}

      {/* Parcours dialog */}
      <Dialog open={showParcoursForm} onOpenChange={setShowParcoursForm}>
        <DialogContent className="bg-background border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Ajouter une étape au parcours</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Proposez une nouvelle ligne de temps historique pour le parcours de {person.prenom} {person.nom}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-2"
            onSubmit={handleSubmitParcours}
          >
            <div className="space-y-2">
              <Label className="text-foreground">Année / Période *</Label>
              <Input 
                placeholder="ex: 1975 - 1979" 
                className="border-border" 
                value={parcoursForm.annee}
                onChange={(e) => setParcoursForm(p => ({...p, annee: e.target.value}))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Description *</Label>
              <Textarea 
                placeholder="Décrivez l'événement…" 
                className="border-border min-h-[100px]" 
                value={parcoursForm.description}
                onChange={(e) => setParcoursForm(p => ({...p, description: e.target.value}))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Fichier / Preuve (optionnel)</Label>
              <Input type="file" className="border-border" accept="image/*,video/*,.pdf,.doc,.docx" onChange={e => handleFileChange(e, 'parcours')} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowParcoursForm(false)}>Annuler</Button>
              <Button type="submit" className="bg-primary text-primary-foreground" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  "Soumettre l'étape"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sépulture virtuelle */}
      <SepultureVirtuelle victime={person} />

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground border-t border-border mt-10">
        © 2026 Fragmentis Vitae Asia
      </footer>
    </div>
  );
};

export default MemorialProfile;
