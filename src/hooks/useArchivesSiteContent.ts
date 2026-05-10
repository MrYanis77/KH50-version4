import { useCallback, useEffect, useState } from "react";
import { directus } from "@/integration/directus";
import { readItems } from "@directus/sdk";
import type {
  ArchivesChronologieLigneRow,
  ArchivesChronologieSectionRow,
  ArchivesRubriqueItemRow,
} from "@/integration/directus-types";
import type { ChronologieSection } from "@/data/archivesChronologie";

const RUBRIQUE_FIELDS = [
  "*",
  "image_couverture.id",
  "image_couverture.filename_download",
] as const;

function sortRubriqueItems(rows: ArchivesRubriqueItemRow[]): ArchivesRubriqueItemRow[] {
  return [...rows].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);
}

function buildChronologieSections(
  sections: ArchivesChronologieSectionRow[],
  lignes: ArchivesChronologieLigneRow[]
): ChronologieSection[] {
  const secs = [...sections].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);
  const lines = [...lignes].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);
  return secs.map((sec) => ({
    title: sec.titre,
    entries: lines.filter((l) => l.section_id === sec.id).map((l) => ({ year: l.annee_libelle, desc: l.description })),
  }));
}

export function usePublicArchivesRubriqueItems() {
  const [items, setItems] = useState<ArchivesRubriqueItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);

  const refresh = useCallback(() => setRev((r) => r + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    directus
      .request(
        readItems("mmrl_archives_rubrique_item", {
          filter: { status: { _eq: "published" } },
          fields: [...RUBRIQUE_FIELDS],
          sort: ["categorie", "sort", "id"],
          limit: -1,
        })
      )
      .then((rows) => {
        if (!cancelled) {
          setItems(sortRubriqueItems(rows as unknown as ArchivesRubriqueItemRow[]));
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setItems([]);
          setError(e instanceof Error ? e.message : "Erreur chargement contenu archives");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rev]);

  return { items, loading, error, refresh };
}

export function filterRubriqueItems(
  items: ArchivesRubriqueItemRow[],
  categorie: ArchivesRubriqueItemRow["categorie"]
): ArchivesRubriqueItemRow[] {
  return sortRubriqueItems(items.filter((x) => x.categorie === categorie));
}

export function usePublicArchivesChronologie() {
  const [sectionsFlat, setSectionsFlat] = useState<ChronologieSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rev, setRev] = useState(0);

  const refresh = useCallback(() => setRev((r) => r + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      directus.request(
        readItems("mmrl_archives_chronologie_section", {
          filter: { status: { _eq: "published" } },
          fields: ["*"],
          sort: ["sort", "id"],
          limit: -1,
        })
      ),
      directus.request(
        readItems("mmrl_archives_chronologie_ligne", {
          filter: { status: { _eq: "published" } },
          fields: ["*"],
          sort: ["section_id", "sort", "id"],
          limit: -1,
        })
      ),
    ])
      .then(([secRows, lineRows]) => {
        if (cancelled) return;
        const built = buildChronologieSections(
          secRows as unknown as ArchivesChronologieSectionRow[],
          lineRows as unknown as ArchivesChronologieLigneRow[]
        );
        setSectionsFlat(built);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setSectionsFlat([]);
          setError(e instanceof Error ? e.message : "Erreur chargement chronologie");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rev]);

  return { sections: sectionsFlat, loading, error, refresh };
}
