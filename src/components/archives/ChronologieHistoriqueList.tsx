import { motion } from "framer-motion";
import { CHRONOLOGIE_SECTIONS, type ChronologieSection } from "@/data/archivesChronologie";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

type Props = {
  className?: string;
  /** Données depuis Directus ; si vide après chargement, repli sur les sections statiques du dépôt */
  sectionsFromApi?: ChronologieSection[];
  apiLoading?: boolean;
};

/** Frise chronologique partagée entre la page Archives et /archives/chronologie */
export function ChronologieHistoriqueList({ className, sectionsFromApi, apiLoading }: Props) {
  const useApi =
    !apiLoading && Array.isArray(sectionsFromApi) && sectionsFromApi.length > 0;
  const sections: ChronologieSection[] = useApi ? sectionsFromApi! : CHRONOLOGIE_SECTIONS;

  if (apiLoading) {
    return (
      <div className={cn("space-y-10", className)}>
        <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-32 max-w-2xl rounded-lg bg-muted animate-pulse" />
        <div className="h-8 w-56 rounded-md bg-muted animate-pulse" />
        <div className="h-24 max-w-2xl rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  let globalIndex = 0;

  return (
    <div className={className}>
      {sections.map((section) => (
        <div key={section.title} className="mb-12 last:mb-0">
          <h3 className="font-display text-xl md:text-2xl text-foreground mb-6 pb-2 border-b border-border/70">
            {section.title}
          </h3>
          <div className="max-w-2xl">
            {section.entries.map((item) => {
              const i = globalIndex++;
              const key = `${section.title}-${i}-${item.year}`;
              return (
                <motion.div
                  key={key}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative pl-8 pb-10 last:pb-0 group"
                >
                  <div className="absolute left-[11px] top-3 bottom-0 w-px bg-border group-last:hidden" />
                  <div className="absolute left-0 top-2 w-[23px] h-[23px] rounded-full border-2 border-accent bg-background flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-body font-semibold text-brand-burnt tracking-wide">{item.year}</span>
                    <p className="font-body text-sm text-foreground/90 mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
