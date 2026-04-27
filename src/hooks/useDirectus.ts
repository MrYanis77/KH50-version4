import { useState, useEffect } from "react";
import { readItems, readItem, createItem } from "@directus/sdk";
import { directus } from "@/integration/directus";
import type {
  VictimeRow, FragmentRow, TemoinRow, ParcoursRow,
  SourceTemoignageRow, QualiteStatutRow, TypeFragmentRow
} from "@/integration/directus-types";
import { STATUT_ID } from "@/integration/directus-types";

// =============================================================================
// Hook — mur public (victimes avérées uniquement)
// =============================================================================
export function useMemorialPersons() {
  const [people, setPeople] = useState<VictimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    directus
      .request(
        readItems("mmrl_victimes", {
          filter: {
            statut_id: { show_on_wall: { _eq: true } },
            deleted_at: { _null: true },
          },
          limit: -1,
        })
      )
      .then((data) => setPeople(data as unknown as VictimeRow[]))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { people, loading, error };
}

// =============================================================================
// Hook — profil d'une victime et ses données associées
// =============================================================================
export function useMemorialPerson(id: number) {
  const [person, setPerson] = useState<VictimeRow | null>(null);
  const [fragments, setFragments] = useState<FragmentRow[]>([]);
  const [parcours, setParcours] = useState<ParcoursRow[]>([]);
  const [temoin, setTemoin] = useState<TemoinRow | null>(null);
  const [source, setSource] = useState<SourceTemoignageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      directus.request(readItem("mmrl_victimes", id)),
      directus.request(
        readItems("mmrl_fragments", {
          filter: { victime_id: { _eq: id }, deleted_at: { _null: true } },
          fields: ["*.*"]
        })
      ).catch(() => []),
      directus.request(
        readItems("mmrl_parcours", {
          filter: { victime_id: { _eq: id }, deleted_at: { _null: true } },
          sort: ["ordre", "annee_evenement"],
        })
      ).catch(() => []),
    ])
      .then(async ([p, f, pc]) => {
        const personData = p as unknown as VictimeRow;
        setPerson(personData);
        setFragments(f as unknown as FragmentRow[]);
        setParcours(pc as unknown as ParcoursRow[]);

        // Charger l'auteur (témoin)
        if (personData.auteur_temoin_id) {
          try {
            const t = await directus.request(readItem("mmrl_temoins", personData.auteur_temoin_id));
            setTemoin(t as unknown as TemoinRow);
          } catch (_) { /* ignoré */ }
        }

        // Charger la source
        if (personData.source_id) {
          try {
            const s = await directus.request(readItem("mmrl_sources_temoignage", personData.source_id));
            setSource(s as unknown as SourceTemoignageRow);
          } catch (_) { /* ignoré */ }
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { person, fragments, parcours, temoin, source, loading, error };
}

// =============================================================================
// Hook — gestion administrative
// =============================================================================
export function useAdminData() {
  const [victimes, setVictimes] = useState<VictimeRow[]>([]);
  const [temoins, setTemoins] = useState<TemoinRow[]>([]);
  const [sources, setSources] = useState<SourceTemoignageRow[]>([]);
  const [parcours, setParcours] = useState<ParcoursRow[]>([]);
  const [fragments, setFragments] = useState<FragmentRow[]>([]);
  const [qualiteStatuts, setQualiteStatuts] = useState<QualiteStatutRow[]>([]);
  const [typeFragments, setTypeFragments] = useState<TypeFragmentRow[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionErrors, setCollectionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAdminData = async () => {
      const results = await Promise.allSettled([
        directus.request(readItems("mmrl_victimes", { limit: -1, filter: { deleted_at: { _null: true } }, fields: ["*.*"] })),
        directus.request(readItems("mmrl_temoins", { limit: -1, filter: { deleted_at: { _null: true } }, fields: ["*.*"] })),
        directus.request(readItems("mmrl_sources_temoignage", { limit: -1, filter: { deleted_at: { _null: true } }, fields: ["*.*"] })),
        directus.request(readItems("mmrl_parcours", { limit: -1, filter: { deleted_at: { _null: true } }, fields: ["*.*"] })),
        directus.request(readItems("mmrl_fragments", { limit: -1, filter: { deleted_at: { _null: true } }, fields: ["*.*"] })),
        directus.request(readItems("mmrl_qualite_statut", { limit: -1, fields: ["*"] })),
        directus.request(readItems("mmrl_type_fragment", { limit: -1, fields: ["*"] })),
      ]);

      const errors: Record<string, string> = {};

      if (results[0].status === "fulfilled") setVictimes(results[0].value as unknown as VictimeRow[]);
      else errors.victimes = (results[0] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      if (results[1].status === "fulfilled") setTemoins(results[1].value as unknown as TemoinRow[]);
      else errors.temoins = (results[1] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      if (results[2].status === "fulfilled") setSources(results[2].value as unknown as SourceTemoignageRow[]);
      else errors.sources = (results[2] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      if (results[3].status === "fulfilled") setParcours(results[3].value as unknown as ParcoursRow[]);
      else errors.parcours = (results[3] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      if (results[4].status === "fulfilled") setFragments(results[4].value as unknown as FragmentRow[]);
      else errors.fragments = (results[4] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      if (results[5].status === "fulfilled") setQualiteStatuts(results[5].value as unknown as QualiteStatutRow[]);
      if (results[6].status === "fulfilled") setTypeFragments(results[6].value as unknown as TypeFragmentRow[]);

      setCollectionErrors(errors);

      const allRejected = results.slice(0, 5).every(r => r.status === "rejected");
      if (allRejected) {
        setError("Impossible de charger les données. Vérifiez vos permissions Directus.");
      }

      setLoading(false);
    };

    fetchAdminData();
  }, [refreshCount]);

  const refreshAction = () => {
    setRefreshCount(prev => prev + 1);
    setLoading(true);
    setCollectionErrors({});
    setError(null);
  };

  return {
    victimes, temoins, sources, parcours, fragments, qualiteStatuts, typeFragments,
    loading, error, collectionErrors, refreshAction,
    setVictimes, setTemoins, setSources, setParcours, setFragments,
  };
}