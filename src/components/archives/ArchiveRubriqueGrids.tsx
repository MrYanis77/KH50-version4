import { motion, type Variants } from "framer-motion";
import { Book, Film, Mic, FileText, ExternalLink } from "lucide-react";
import { getAssetUrl } from "@/integration/directus";
import type { ArchivesRubriqueItemRow, ArchivesTypeContenu } from "@/integration/directus-types";
import { archiveFadeUp, archiveFadeUpDense, ArchivesContentPlaceholder } from "@/components/archives/archivePageUi";

function normTypeContenu(v: ArchivesTypeContenu | null | undefined): ArchivesTypeContenu {
  if (v === "video" || v === "podcast") return v;
  return "text";
}

function typeIcon(type: ArchivesTypeContenu) {
  switch (type) {
    case "video":
      return <Film size={14} />;
    case "podcast":
      return <Mic size={14} />;
    default:
      return <Book size={14} />;
  }
}

function typeLabel(type: ArchivesTypeContenu) {
  switch (type) {
    case "video":
      return "Voir";
    case "podcast":
      return "Écouter";
    default:
      return "Lire";
  }
}

function sliceItems<T>(items: T[], maxItems?: number): T[] {
  if (typeof maxItems === "number" && Number.isFinite(maxItems)) return items.slice(0, Math.max(0, maxItems));
  return items;
}

function lieuImageSrc(item: ArchivesRubriqueItemRow): string | null {
  const ref = item.image_couverture;
  if (!ref) return null;
  if (typeof ref === "object" && "id" in ref && typeof (ref as { id?: string }).id === "string") {
    const id = (ref as { id: string }).id;
    if (!id) return null;
    return getAssetUrl(ref, "width=600&q=80");
  }
  if (typeof ref === "string" && ref.length > 0) return getAssetUrl(ref, "width=600&q=80");
  return null;
}

export function ArchiveTemoignagesGrid({ items, maxItems, variants = archiveFadeUp, gridClassName }: {
  items: ArchivesRubriqueItemRow[];
  maxItems?: number;
  variants?: typeof archiveFadeUp;
  gridClassName?: string;
}) {
  const list = sliceItems(items, maxItems);
  if (list.length === 0) return <ArchivesContentPlaceholder />;
  const g = gridClassName ?? "grid sm:grid-cols-2 lg:grid-cols-4 gap-5";
  return (
    <div className={g}>
      {list.map((t, i) => {
        const typ = normTypeContenu(t.type_contenu);
        const href = (t.lien_url || "").trim();
        const ctaInner = (
          <>
            {typeLabel(typ)} <ExternalLink size={12} />
          </>
        );
        return (
          <motion.article
            key={`at-${t.id}`}
            custom={i}
            variants={variants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                {typeIcon(typ)} {typ}
              </span>
              {typeof t.annee === "number" && <span>{t.annee}</span>}
            </div>
            <h3 className="font-display text-base text-foreground mb-2">{t.titre}</h3>
            {t.description && (
              <p className="font-body text-sm text-muted-foreground flex-1 leading-relaxed">{t.description}</p>
            )}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="mt-4 self-start text-sm font-body font-semibold text-accent hover:text-foreground transition-colors flex items-center gap-1"
              >
                {ctaInner}
              </a>
            ) : (
              <span className="mt-4 self-start text-sm font-body font-semibold text-accent flex items-center gap-1">
                {ctaInner}
              </span>
            )}
          </motion.article>
        );
      })}
    </div>
  );
}

export function ArchiveLieuxGrid({ items, maxItems, gridCols }: {
  items: ArchivesRubriqueItemRow[];
  maxItems?: number;
  /** home: lg-cols-3, category lists may use lg:grid-cols-3 same */
  gridCols?: string;
}) {
  const list = sliceItems(items, maxItems);
  const gridCls = gridCols ?? " grid sm:grid-cols-2 lg:grid-cols-3 gap-6";
  if (list.length === 0) return <ArchivesContentPlaceholder />;
  return (
    <div className={gridCls}>
      {list.map((l, i) => {
        const src = lieuImageSrc(l);
        return (
          <motion.article
            key={`al-${l.id}`}
            custom={i}
            variants={archiveFadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              {src ? (
                <img
                  src={src}
                  alt={l.titre}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-4 text-center font-body">
                  Image à définir (admin)
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg text-foreground mb-2">{l.titre}</h3>
              {l.description && (
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">{l.description}</p>
              )}
              {l.lien_url ? (
                <a
                  href={l.lien_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-body font-semibold text-accent hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Explorer <ExternalLink size={12} />
                </a>
              ) : (
                <span className="text-sm font-body font-semibold text-accent flex items-center gap-1">
                  Explorer <ExternalLink size={12} />
                </span>
              )}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

export function ArchiveDocumentsList({ items, maxItems }: { items: ArchivesRubriqueItemRow[]; maxItems?: number }) {
  const list = sliceItems(items, maxItems);
  if (list.length === 0) return <ArchivesContentPlaceholder />;
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {list.map((d, i) => (
        <motion.div
          key={`ad-${d.id}`}
          custom={i}
          variants={archiveFadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center gap-4 bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
            <FileText size={18} className="text-brand-brown" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base text-foreground truncate">{d.titre}</h3>
            <p className="font-body text-xs text-muted-foreground">
              {typeof d.annee === "number" ? `${d.annee}` : "—"}
              {(d.source_attribution || "").trim() ? ` · ${d.source_attribution}` : ""}
            </p>
          </div>
          {(d.lien_url || "").trim() ? (
            <a
              href={d.lien_url!.trim()}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-body font-semibold text-accent hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-1"
            >
              Voir <ExternalLink size={12} />
            </a>
          ) : (
            <span className="text-sm font-body font-semibold text-accent flex items-center gap-1 whitespace-nowrap">
              Voir <ExternalLink size={12} />
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function ArchiveTransmissionGrid({ items, maxItems, columnsClass }: {
  items: ArchivesRubriqueItemRow[];
  maxItems?: number;
  columnsClass?: string;
}) {
  const list = sliceItems(items, maxItems);
  const cls = columnsClass ?? " grid sm:grid-cols-2 lg:grid-cols-4 gap-5";
  if (list.length === 0) return <ArchivesContentPlaceholder />;
  return (
    <div className={cls}>
      {list.map((t, i) => (
        <motion.article
          key={`atr-${t.id}`}
          custom={i}
          variants={archiveFadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <h3 className="font-display text-base text-foreground mb-2">{t.titre}</h3>
          {t.description && <p className="font-body text-sm text-muted-foreground leading-relaxed">{t.description}</p>}
        </motion.article>
      ))}
    </div>
  );
}

export function ArchiveBibliographieList({
  items,
  maxItems,
  variants = archiveFadeUpDense,
}: {
  items: ArchivesRubriqueItemRow[];
  maxItems?: number;
  variants?: Variants;
}) {
  const list = sliceItems(items, maxItems);
  if (list.length === 0) return <ArchivesContentPlaceholder />;
  const linkHref = (u: string | null | undefined) => {
    const s = (u || "").trim();
    return s.length > 0 ? s : "#";
  };
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {list.map((b, i) => (
        <motion.div
          key={`ab-${b.id}`}
          custom={i}
          variants={variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center gap-4 bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
            <Book size={18} className="text-brand-brown" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-base text-foreground truncate">{b.titre}</h3>
            <p className="font-body text-xs text-muted-foreground">
              {(b.auteur_reference || "").trim() || "—"}
              {typeof b.annee === "number" ? ` · ${b.annee}` : ""}
            </p>
          </div>
          <a
            href={linkHref(b.lien_url)}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-body font-semibold text-accent hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-1"
            aria-label={`Voir ${b.titre}`}
          >
            Voir <ExternalLink size={12} />
          </a>
        </motion.div>
      ))}
    </div>
  );
}
