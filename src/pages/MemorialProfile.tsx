import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Clock, MapPin, User, Briefcase, Heart, X, Eye, FileText, Video, Camera, BookOpen, MapPinned } from "lucide-react";
import Navbar from "@/components/Navbar";
import { getPersonById, type MemoryFragment } from "@/data/memorialData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const fragmentTypeLabels: Record<MemoryFragment["type"], string> = {
  testimony: "Témoignage",
  photograph: "Photographie",
  video: "Vidéo",
  story: "Récit",
  document: "Document",
  place: "Lieu / Objet",
};

const fragmentTypeIcons: Record<MemoryFragment["type"], React.ReactNode> = {
  testimony: <BookOpen className="h-4 w-4" />,
  photograph: <Camera className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  story: <FileText className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  place: <MapPinned className="h-4 w-4" />,
};

const MemorialProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const person = getPersonById(Number(id));
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showContributeForm, setShowContributeForm] = useState(false);

  if (!person) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-display text-2xl text-foreground">Personne introuvable</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />

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
            <Button size="sm" onClick={() => setShowContributeForm(true)} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Ajouter un fragment
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center sm:items-end gap-8">
            <div className="w-40 h-52 rounded-lg overflow-hidden shadow-lg border-2 border-secondary flex-shrink-0">
              <img src={person.imageSrc} alt={`Portrait de ${person.firstName} ${person.lastName}`} className="w-full h-full object-cover" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
                {person.firstName} <span className="uppercase">{person.lastName}</span>
              </h1>
              {person.birthDate && person.deathDate && (
                <p className="text-muted-foreground mt-1 text-lg">{person.birthDate} — {person.deathDate}</p>
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
              { icon: <User className="h-4 w-4" />, label: "Sexe", value: person.sex },
              { icon: <MapPin className="h-4 w-4" />, label: "Lieu de naissance", value: person.birthPlace },
              { icon: <Clock className="h-4 w-4" />, label: "Date de naissance", value: person.birthDate },
              { icon: <MapPin className="h-4 w-4" />, label: "Lieu de décès", value: person.deathPlace },
              { icon: <Clock className="h-4 w-4" />, label: "Date de décès", value: person.deathDate },
              { icon: <Briefcase className="h-4 w-4" />, label: "Profession", value: person.profession },
              { icon: <Heart className="h-4 w-4" />, label: "Origine familiale", value: person.familyOrigin },
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

      {/* Témoignages */}
      {person.testimonies && person.testimonies.length > 0 && (
        <motion.section
          className="py-10 px-4 bg-card/50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2">
              Témoignages
            </motion.h2>
            <div className="space-y-6">
              {person.testimonies.map((text, i) => (
                <motion.blockquote
                  key={i}
                  variants={fadeUp}
                  className="border-l-4 border-accent pl-6 py-2 text-card-foreground/90 italic leading-relaxed text-base"
                >
                  « {text} »
                </motion.blockquote>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Parcours / Timeline */}
      {person.timeline && person.timeline.length > 0 && (
        <motion.section
          className="py-10 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-8 border-b border-border pb-2">
              Parcours
            </motion.h2>
            <div className="relative pl-8 border-l-2 border-accent/40 space-y-8">
              {person.timeline.map((evt, i) => (
                <motion.div key={i} variants={fadeUp} className="relative">
                  <span className="absolute -left-[calc(2rem+5px)] top-1 w-3 h-3 rounded-full bg-accent border-2 border-background" />
                  <p className="text-sm font-semibold text-accent tracking-wide">{evt.year}</p>
                  <p className="text-foreground mt-1">{evt.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Galerie mémoire */}
      {person.gallery && person.gallery.length > 0 && (
        <motion.section
          className="py-10 px-4 bg-card/50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2">
              Galerie mémoire
            </motion.h2>
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {person.gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxImg(src)}
                  className="aspect-square rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={`Voir photo ${i + 1}`}
                >
                  <img src={src} alt={`Archive ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/80 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImg(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightboxImg(null)}
                className="absolute -top-3 -right-3 bg-background rounded-full p-1.5 shadow-md text-foreground hover:bg-muted transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
              <img src={lightboxImg} alt="Vue agrandie" className="rounded-lg max-h-[80vh] object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fragments de mémoire */}
      {person.fragments && person.fragments.length > 0 && (
        <motion.section
          className="py-10 px-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <div className="container mx-auto max-w-4xl">
            <motion.h2 variants={fadeUp} className="font-display text-2xl text-foreground mb-6 border-b border-border pb-2">
              Fragments de mémoire
            </motion.h2>
            <div className="space-y-4">
              {person.fragments.map((frag) => (
                <motion.div
                  key={frag.id}
                  variants={fadeUp}
                  className={`rounded-lg border p-5 transition-all ${
                    frag.status === "pending"
                      ? "border-border/50 bg-muted/40 blur-[1px] opacity-60"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-accent">{fragmentTypeIcons[frag.type]}</span>
                    <Badge variant={frag.status === "pending" ? "secondary" : "default"} className="text-xs">
                      {frag.status === "pending" ? "En attente de validation" : fragmentTypeLabels[frag.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">{frag.date}</span>
                  </div>
                  <p className="text-foreground leading-relaxed">{frag.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">— {frag.author}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Contribute dialog */}
      <Dialog open={showContributeForm} onOpenChange={setShowContributeForm}>
        <DialogContent className="bg-background border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Ajouter un fragment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Partagez un souvenir, un document ou un témoignage lié à {person.firstName} {person.lastName}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-2"
            onSubmit={(e) => {
              e.preventDefault();
              setShowContributeForm(false);
            }}
          >
            <div className="space-y-2">
              <Label className="text-foreground">Type de contenu</Label>
              <Select>
                <SelectTrigger className="border-border"><SelectValue placeholder="Choisir un type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="testimony">Témoignage</SelectItem>
                  <SelectItem value="photograph">Photographie</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="story">Récit</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="place">Lieu / Objet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Description</Label>
              <Textarea placeholder="Décrivez ce fragment de mémoire…" className="border-border min-h-[100px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Auteur</Label>
                <Input placeholder="Votre nom" className="border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Date</Label>
                <Input type="date" className="border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Fichier (optionnel)</Label>
              <Input type="file" className="border-border" accept="image/*,video/*,.pdf,.doc,.docx" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowContributeForm(false)}>Annuler</Button>
              <Button type="submit" className="bg-primary text-primary-foreground">Soumettre</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-muted-foreground border-t border-border mt-10">
        © 2023 Fragmentis Vitae Asia
      </footer>
    </div>
  );
};

export default MemorialProfile;
