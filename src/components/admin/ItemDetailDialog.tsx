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
  qualiteStatuts?: any[];
  victimes?: any[];
  temoins?: any[];
  sources?: any[];
}

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string;

export function ItemDetailDialog({ isOpen, onClose, type, data, qualiteStatuts, victimes, temoins, sources }: ItemDetailDialogProps) {
  if (!data) return null;

  const getStatusBadge = (statut_id: number) => {
    if (qualiteStatuts) {
      const s = qualiteStatuts.find(x => x.id === statut_id);
      if (s) {
        return (
          <Badge 
            style={{ 
              backgroundColor: (s.couleur_hex || '#aaa') + '20', 
              color: s.couleur_hex || '#666',
              borderColor: (s.couleur_hex || '#aaa') + '40'
            }}
            className="border"
          >
            {s.libelle}
          </Badge>
        );
      }
    }
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

      {renderRawData(v)}
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

      {renderRawData(t)}
    </div>
  );

  const renderFragment = (f: any) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shadow-sm">
            {f.type_id === 2 ? <ImageIcon size={24} /> : 
             f.type_id === 3 ? <Video size={24} /> : 
             f.type_id === 7 ? <Mic size={24} /> : 
             <FileText size={24} />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{f.titre || "Fragment de mémoire"}</h2>
            <p className="text-sm font-medium text-primary">
              {f.type?.libelle || (f.type_id === 2 ? "Photographie" : f.type_id === 3 ? "Vidéo" : f.type_id === 7 ? "Audio" : "Document / Récit")}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(f.statut_id)}
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">ID #{f.id}</span>
        </div>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <Calendar size={10} /> Temporel
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground mr-1">Année :</span> 
            <span className="font-medium">{f.annee_fragment || "—"}</span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground mr-1">Date :</span> 
            <span className="font-medium">{f.date_fragment || "—"}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <User size={10} /> Attributions
          </p>
          <div className="text-sm flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Victime :</span>
              <span className="font-medium truncate">
                {victimes?.find(v => v.id === f.victime_id) 
                  ? `${victimes.find(v => v.id === f.victime_id).prenom} ${victimes.find(v => v.id === f.victime_id).nom}`
                  : `ID #${f.victime_id}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Auteur :</span>
              <span className="font-medium truncate">
                {temoins?.find(t => t.id === f.auteur_temoin_id)
                  ? `${temoins.find(t => t.id === f.auteur_temoin_id).prenom} ${temoins.find(t => t.id === f.auteur_temoin_id).nom}`
                  : `ID #${f.auteur_temoin_id}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {f.source_id && (
        <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Source du témoignage</span>
          </div>
          <p className="text-sm font-medium">
            {sources?.find(s => s.id === f.source_id)
              ? `${sources.find(s => s.id === f.source_id).prenom} ${sources.find(s => s.id === f.source_id).nom}`
              : `Source ID #${f.source_id}`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <span className="font-semibold">Victime :</span> 
            {victimes?.find(v => v.id === data.victime_id) 
              ? `${victimes.find(v => v.id === data.victime_id).prenom} ${victimes.find(v => v.id === data.victime_id).nom}`
              : `ID #${data.victime_id}`}
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">Auteur :</span>
            {temoins?.find(t => t.id === data.auteur_temoin_id)
              ? `${temoins.find(t => t.id === data.auteur_temoin_id).prenom} ${temoins.find(t => t.id === data.auteur_temoin_id).nom}`
              : `ID #${data.auteur_temoin_id}`}
          </div>
        </div>
        <div className="space-y-1 text-right">
          {data.source_id && (
            <div className="flex items-center justify-end gap-1">
              <span className="font-semibold">Source :</span>
              {sources?.find(s => s.id === data.source_id)
                ? `${sources.find(s => s.id === data.source_id).prenom} ${sources.find(s => s.id === data.source_id).nom}`
                : `ID #${data.source_id}`}
            </div>
          )}
          <div>Fragment ID: {data.id}</div>
        </div>
      </div>

      {renderRawData(f)}
    </div>
  );

  const renderParcours = (p: any) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-orange-100 text-orange-600 shadow-sm">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{p.titre || "Étape de parcours"}</h2>
            <p className="text-sm font-medium text-orange-600">Ligne de temps historique</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {getStatusBadge(p.statut_id)}
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">ID #{p.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5 mb-2">
            <Calendar size={10} /> Période
          </p>
          <p className="text-sm font-medium">{p.annee_evenement || "Année non précisée"}</p>
          {p.date_evenement && <p className="text-xs text-muted-foreground mt-1">{p.date_evenement}</p>}
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5 mb-2">
            <User size={10} /> Dossier lié
          </p>
          <p className="text-sm font-medium">
            {victimes?.find(v => v.id === p.victime_id) 
              ? `${victimes.find(v => v.id === p.victime_id).prenom} ${victimes.find(v => v.id === p.victime_id).nom}`
              : `Victime ID #${p.victime_id}`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Description de l'événement</h3>
        <div className="text-sm leading-relaxed p-4 bg-muted/20 rounded-lg border border-border/50 italic">
          {p.description || "Aucune description fournie."}
        </div>
      </div>

      {p.fichier_media && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1">Document joint</h3>
          <div className="rounded-xl overflow-hidden border border-border bg-black/5 flex items-center justify-center min-h-[150px]">
             <img 
               src={`${DIRECTUS_URL}/assets/${p.fichier_media}`} 
               alt="Preuve parcours" 
               className="max-w-full max-h-[300px] object-contain"
             />
          </div>
        </div>
      )}

      {renderRawData(p)}
    </div>
  );

  const renderSource = (s: any) => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{s.prenom} {s.nom}</h2>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(s.statut_id)}
            <Badge variant="outline">Source de l'information</Badge>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="text-sm font-medium">{s.email || "—"}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">Téléphone</p>
          <p className="text-sm font-medium">{s.telephone || "—"}</p>
        </div>
      </div>
      {renderRawData(s)}
    </div>
  );

  const renderRawData = (obj: any) => (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Hash size={10} /> Métadonnées & Données brutes
        </h3>
        <Badge variant="outline" className="text-[9px] font-mono opacity-50 uppercase tracking-tighter">Raw Output</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/10 p-3 rounded-lg border border-border/40">
        {Object.entries(obj)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => {
            if (value === null || value === undefined) return null;
            if (Array.isArray(value)) return null;
            
            let displayValue = "";
            if (typeof value === 'object') {
              displayValue = (value as any).libelle || (value as any).id || "[Object]";
            } else {
              displayValue = String(value);
            }

            if (displayValue.length > 250) return null; // Skip long content already shown

            return (
              <div key={key} className="flex flex-col p-2 rounded bg-background/40 border border-border/20 group hover:border-primary/20 transition-colors">
                <span className="text-[9px] font-mono text-muted-foreground uppercase mb-0.5 opacity-70">{key}</span>
                <span className="text-xs font-medium text-foreground/90 truncate" title={displayValue}>{displayValue}</span>
              </div>
            );
          })}
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
        {type === 'parcours' && renderParcours(data)}
        {type === 'source' && renderSource(data)}
        
        <div className="flex justify-end mt-8">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
