import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Calendar, MapPin, Briefcase, FileText, 
  Clock, Hash, Image as ImageIcon, Video, Mic, 
  Quote, ExternalLink, Trash2, Mail, Phone,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ItemDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'victime' | 'temoin' | 'fragment' | 'parcours' | 'source';
  data: any;
}

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string;

export function ItemDetailDialog({ isOpen, onClose, type, data }: ItemDetailDialogProps) {
  if (!data) return null;

  const getStatusBadge = (statut_id: number) => {
    switch (statut_id) {
      case 1: return <Badge className="bg-green-100 text-green-700 border-green-200">✔ Avéré / Vérifié</Badge>;
      case 3: return <Badge className="bg-red-100 text-red-700 border-red-200">✗ Non fiable</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">🟡 À vérifier</Badge>;
    }
  };

  const renderVictime = (v: any) => (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="w-32 h-32 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center shrink-0 shadow-inner">
          {v.photo_principale ? (
            <img 
              src={`${DIRECTUS_URL}/assets/${v.photo_principale}`} 
              alt={v.nom} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-12 w-12 text-muted-foreground/30" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{v.prenom} <span className="uppercase">{v.nom}</span></h2>
            {getStatusBadge(v.statut_id)}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar size={14} /> 
              <span>Né(e) : {v.date_naissance || v.annee_naissance || "Inconnu"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={14} /> 
              <span>Lieu : {v.lieu_naissance || "Inconnu"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={14} /> 
              <span>Décès : {v.date_deces || v.annee_deces || "Inconnu"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={14} /> 
              <span>Lieu : {v.lieu_deces || "Inconnu"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Briefcase size={14} /> 
              <span>Profession : {v.profession || "Inconnue"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Origine & Détails</h3>
        <p className="text-sm leading-relaxed">
          {v.origine_familiale || "Aucune information complémentaire sur l'origine familiale."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50 text-[10px] text-muted-foreground">
        <div>ID: {v.id}</div>
        <div className="text-right">
          Créé le : {v.date_creation ? format(new Date(v.date_creation), 'PPp', { locale: fr }) : "Inconnu"}
        </div>
      </div>
    </div>
  );

  const renderTemoin = (t: any) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <User className="h-8 w-8 text-primary/60" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{t.prenom} {t.nom}</h2>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(t.statut_id)}
            <Badge variant="outline">Témoin / Auteur</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t.email || "Pas d'email"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t.telephone || "Pas de téléphone"}</span>
        </div>
        <div className="flex items-center gap-3">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono text-xs">User ID: {t.directus_user_id || "N/A"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50 text-[10px] text-muted-foreground">
        <div>ID interne: {t.id}</div>
        <div className="text-right">
          Dernière modif : {t.date_modification ? format(new Date(t.date_modification), 'PPp', { locale: fr }) : "N/A"}
        </div>
      </div>
    </div>
  );

  const renderFragment = (f: any) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {f.type_id === 2 ? <ImageIcon size={20} /> : f.type_id === 3 ? <Video size={20} /> : f.type_id === 7 ? <Mic size={20} /> : <FileText size={20} />}
          </div>
          <div>
            <h2 className="text-xl font-bold">{f.titre || "Fragment sans titre"}</h2>
            <p className="text-xs text-muted-foreground">Type: {f.type?.libelle || "Inconnu"}</p>
          </div>
        </div>
        {getStatusBadge(f.statut_id)}
      </div>

      {f.fichier_media && (
        <div className="rounded-xl overflow-hidden border border-border bg-black/5 flex items-center justify-center min-h-[200px]">
          {f.type_id === 2 ? (
            <img 
              src={`${DIRECTUS_URL}/assets/${f.fichier_media}`} 
              alt={f.titre} 
              className="max-w-full max-h-[400px] object-contain shadow-lg"
            />
          ) : f.type_id === 3 ? (
            <video 
              src={`${DIRECTUS_URL}/assets/${f.fichier_media}`} 
              controls 
              className="max-w-full max-h-[400px]"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-8">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <Button variant="outline" size="sm" asChild>
                <a href={`${DIRECTUS_URL}/assets/${f.fichier_media}`} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} className="mr-2" /> Voir le fichier
                </a>
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Description / Contenu</h3>
        <div className="text-sm leading-relaxed whitespace-pre-wrap p-4 bg-muted/20 rounded-lg border border-border/50">
          {f.description || "Aucune description fournie."}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar size={14} /> 
          <span>Année : {f.annee_fragment || "Non précisée"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock size={14} /> 
          <span>Date : {f.date_fragment || "Non précisée"}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50 text-[10px] text-muted-foreground">
        <div>ID: {f.id} | Victime ID: {f.victime_id}</div>
        <div className="text-right">
          Auteur (Témoin ID): {f.auteur_temoin_id}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            Détails de l'élément
          </DialogTitle>
          <DialogDescription>
            Consultation complète des données enregistrées dans la base de données.
          </DialogDescription>
        </DialogHeader>

        {type === 'victime' && renderVictime(data)}
        {type === 'temoin' && renderTemoin(data)}
        {type === 'fragment' && renderFragment(data)}
        
        <div className="flex justify-end mt-8">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
