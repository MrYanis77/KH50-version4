import { useParams, useNavigate } from "react-router-dom";
import { Book, FileText, MapPin, Users, Mic, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChronologieHistoriqueList } from "@/components/archives/ChronologieHistoriqueList";
import {
  ArchiveBibliographieList,
  ArchiveDocumentsList,
  ArchiveLieuxGrid,
  ArchiveTransmissionGrid,
  ArchiveTemoignagesGrid,
} from "@/components/archives/ArchiveRubriqueGrids";
import {
  filterRubriqueItems,
  usePublicArchivesChronologie,
  usePublicArchivesRubriqueItems,
} from "@/hooks/useArchivesSiteContent";

type CategoryKey = "temoignages" | "chronologie" | "lieux" | "documents" | "transmission" | "bibliographie";

const categoryConfig: Record<CategoryKey, { label: string; desc: string; icon: React.ReactNode }> = {
  temoignages: { label: "Témoignages", desc: "Récits de survivants, mémoires transmises et voix préservées.", icon: <Mic size={22} /> },
  chronologie: { label: "Chronologie historique", desc: "De la colonisation à la mémoire diasporique : jalons historiques.", icon: <Book size={22} /> },
  lieux: { label: "Lieux de mémoire", desc: "Lieux historiques liés au génocide et à la mémoire collective.", icon: <MapPin size={22} /> },
  documents: { label: "Archives et documents", desc: "Documents historiques, registres et photographies d'archives.", icon: <FileText size={22} /> },
  transmission: { label: "Transmission et mémoire", desc: "Projets et initiatives dédiés à la préservation de la mémoire.", icon: <Users size={22} /> },
  bibliographie: { label: "Bibliographie et ressources", desc: "Ouvrages, films et travaux académiques recommandés.", icon: <Book size={22} /> },
};

function CategoryContentSkeleton() {
  return <div className="min-h-[200px] rounded-xl bg-muted/50 animate-pulse" />;
}

const ArchiveCategory = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const key = category as CategoryKey;
  const config = categoryConfig[key];

  const { items, loading: rubLoading } = usePublicArchivesRubriqueItems();
  const chronoHook = usePublicArchivesChronologie();

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Catégorie introuvable</h1>
          <Button variant="outline" onClick={() => navigate("/archives")} className="gap-2">
            <ArrowLeft size={16} /> Retour aux archives
          </Button>
        </div>
      </div>
    );
  }

  const renderBody = () => {
    if (key === "chronologie") {
      return (
        <ChronologieHistoriqueList sectionsFromApi={chronoHook.sections} apiLoading={chronoHook.loading} />
      );
    }
    if (rubLoading) return <CategoryContentSkeleton />;

    switch (key) {
      case "temoignages":
        return (
          <ArchiveTemoignagesGrid items={filterRubriqueItems(items, "temoignages")} gridClassName="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" />
        );
      case "lieux":
        return <ArchiveLieuxGrid items={filterRubriqueItems(items, "lieux")} />;
      case "documents":
        return <ArchiveDocumentsList items={filterRubriqueItems(items, "documents")} />;
      case "transmission":
        return <ArchiveTransmissionGrid items={filterRubriqueItems(items, "transmission")} />;
      case "bibliographie":
        return <ArchiveBibliographieList items={filterRubriqueItems(items, "bibliographie")} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 fragmentis-diagonal pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <Button variant="ghost" onClick={() => navigate("/archives")} className="gap-2 mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Retour aux archives
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">{config.icon}</div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground">{config.label}</h1>
          </div>
          <p className="font-body text-lg text-muted-foreground max-w-2xl leading-relaxed">{config.desc}</p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-24">
        {renderBody()}
      </div>

      <footer className="border-t border-border py-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-6 h-px bg-brand-burnt/40" style={{ transform: "rotate(30.54deg)" }} aria-hidden="true" />
          <span className="text-brand-burnt text-xs" aria-hidden="true">✦</span>
          <div className="w-6 h-px bg-brand-burnt/40" style={{ transform: "rotate(-30.54deg)" }} aria-hidden="true" />
        </div>
        <p className="font-body text-sm text-muted-foreground">Fragmentis Vitae Asia · Mémoire collective</p>
      </footer>
    </div>
  );
};

export default ArchiveCategory;
