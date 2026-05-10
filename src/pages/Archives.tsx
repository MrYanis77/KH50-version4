import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Book, Mic, FileText, MapPin, Users } from "lucide-react";
import { ChronologieHistoriqueList } from "@/components/archives/ChronologieHistoriqueList";
import {
  ArchivesSectionTitle,
} from "@/components/archives/archivePageUi";
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

const HOME_LIMITS = {
  temoignages: 4,
  lieux: 3,
  documents: 4,
  transmission: 4,
  bibliographie: 4,
} as const;

function SectionSkeleton() {
  return <div className="h-48 rounded-xl bg-muted/50 animate-pulse" />;
}

const Archives = () => {
  const navigate = useNavigate();
  const { items, loading: rubLoading } = usePublicArchivesRubriqueItems();
  const chronoHook = usePublicArchivesChronologie();

  const temoignagesItems = filterRubriqueItems(items, "temoignages");
  const lieuxItems = filterRubriqueItems(items, "lieux");
  const documentsItems = filterRubriqueItems(items, "documents");
  const transmissionItems = filterRubriqueItems(items, "transmission");
  const bibliographieItems = filterRubriqueItems(items, "bibliographie");

  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 fragmentis-diagonal pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-8 h-px bg-brand-burnt/50" style={{ transform: "rotate(30.54deg)" }} aria-hidden="true" />
            <span className="text-brand-burnt text-sm" aria-hidden="true">✦</span>
            <div className="w-8 h-px bg-brand-burnt/50" style={{ transform: "rotate(-30.54deg)" }} aria-hidden="true" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6"
          >
            Archives de mémoire
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Explorer les témoignages, documents et traces historiques liés au génocide cambodgien et à la mémoire des vies disparues.
          </motion.p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-24 space-y-20">

        <section>
          <ArchivesSectionTitle icon={<Mic size={20} />} onViewAll={() => navigate("/archives/temoignages")}>
            Témoignages
          </ArchivesSectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Récits de survivants, mémoires transmises et voix préservées.
          </p>
          {rubLoading ? (
            <SectionSkeleton />
          ) : (
            <ArchiveTemoignagesGrid items={temoignagesItems} maxItems={HOME_LIMITS.temoignages} />
          )}
        </section>

        <section>
          <ArchivesSectionTitle icon={<Book size={20} />} onViewAll={() => navigate("/archives/chronologie")}>
            Chronologie historique
          </ArchivesSectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-2xl">
            De la colonisation à la mémoire diasporique : périodes clés, génocide, exil et transmission.
          </p>
          <ChronologieHistoriqueList
            sectionsFromApi={chronoHook.sections}
            apiLoading={chronoHook.loading}
          />
        </section>

        <section>
          <ArchivesSectionTitle icon={<MapPin size={20} />} onViewAll={() => navigate("/archives/lieux")}>
            Lieux de mémoire
          </ArchivesSectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Lieux historiques liés au génocide et à la mémoire collective.
          </p>
          {rubLoading ? <SectionSkeleton /> : <ArchiveLieuxGrid items={lieuxItems} maxItems={HOME_LIMITS.lieux} />}
        </section>

        <section>
          <ArchivesSectionTitle icon={<FileText size={20} />} onViewAll={() => navigate("/archives/documents")}>
            Archives et documents
          </ArchivesSectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Documents historiques, registres et photographies d'archives.
          </p>
          {rubLoading ? <SectionSkeleton /> : <ArchiveDocumentsList items={documentsItems} maxItems={HOME_LIMITS.documents} />}
        </section>

        <section>
          <ArchivesSectionTitle icon={<Users size={20} />} onViewAll={() => navigate("/archives/transmission")}>
            Transmission et mémoire
          </ArchivesSectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Projets et initiatives dédiés à la préservation de la mémoire.
          </p>
          {rubLoading ? (
            <SectionSkeleton />
          ) : (
            <ArchiveTransmissionGrid items={transmissionItems} maxItems={HOME_LIMITS.transmission} />
          )}
        </section>

        <section>
          <ArchivesSectionTitle icon={<Book size={20} />} onViewAll={() => navigate("/archives/bibliographie")}>
            Bibliographie et ressources
          </ArchivesSectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Ouvrages, films et travaux académiques recommandés.
          </p>
          {rubLoading ? (
            <SectionSkeleton />
          ) : (
            <ArchiveBibliographieList items={bibliographieItems} maxItems={HOME_LIMITS.bibliographie} />
          )}
        </section>

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

export default Archives;
