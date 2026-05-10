import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const archiveFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

export const archiveFadeUpDense = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function ArchivesSectionTitle({
  children,
  icon,
  onViewAll,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onViewAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">{icon}</div>
        <h2 className="font-display text-2xl md:text-3xl text-foreground">{children}</h2>
      </div>
      {onViewAll && (
        <Button variant="ghost" size="sm" onClick={onViewAll} className="text-accent hover:text-foreground gap-1.5">
          Tout voir <ArrowRight size={14} />
        </Button>
      )}
    </div>
  );
}

export function ArchivesContentPlaceholder() {
  return <p className="font-body text-sm text-muted-foreground">Contenu à venir.</p>;
}
