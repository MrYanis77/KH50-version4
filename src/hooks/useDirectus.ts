import { useState, useEffect, useCallback } from "react";
import { readItems, readItem, createItem } from "@directus/sdk";
import { directus } from "@/integration/directus";
import type {
  VictimeRow, FragmentRow, TemoinRow, ParcoursRow,
  SourceTemoignageRow, QualiteStatutRow, TypeFragmentRow,
  RelationFamilialeRow, SepultureRow
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
    Promise.all([
      directus.request(readItems("mmrl_victimes", { filter: { deleted_at: { _null: true } }, limit: -1 })),
      directus.request(readItems("mmrl_qualite_statut", { limit: -1 }))
    ])
      .then(([victimesData, statutsData]) => {
        const validStatutIds = (statutsData as QualiteStatutRow[]).filter(s => s.show_on_wall).map(s => s.id);
        
        const filteredVictims = (victimesData as unknown as VictimeRow[]).filter(v => {
          const sid = typeof v.statut_id === 'object' ? (v.statut_id as any)?.id : v.statut_id;
          return validStatutIds.includes(Number(sid));
        });
        
        setPeople(filteredVictims);
      })
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
  const [isVerified, setIsVerified] = useState<boolean>(true);
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
      directus.request(readItems("mmrl_qualite_statut", { limit: -1 })).catch(() => [])
    ])
      .then(async ([p, f, pc, statutsData]) => {
        const validStatutIds = (statutsData as QualiteStatutRow[]).filter(s => s.show_on_wall).map(s => s.id);

        const personData = p as unknown as VictimeRow;
        setPerson(personData);
        
        const personSid = typeof personData.statut_id === 'object' ? (personData.statut_id as any)?.id : personData.statut_id;
        setIsVerified(validStatutIds.includes(Number(personSid)));
        
        const filteredFragments = (f as unknown as FragmentRow[]).filter(frag => {
          const sid = typeof frag.statut_id === 'object' ? (frag.statut_id as any)?.id : frag.statut_id;
          return validStatutIds.includes(Number(sid));
        });
        setFragments(filteredFragments);

        const filteredParcours = (pc as unknown as ParcoursRow[]).filter(parc => {
          const sid = typeof parc.statut_id === 'object' ? (parc.statut_id as any)?.id : parc.statut_id;
          return validStatutIds.includes(Number(sid));
        });
        setParcours(filteredParcours);

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

  return { person, fragments, parcours, temoin, source, isVerified, loading, error };
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

// =============================================================================
// Hook — liens de parenté (« araignée ») d'une victime
// =============================================================================
export function useRelationsFamiliales(victimeId: number | null | undefined) {
  const [relations, setRelations] = useState<RelationFamilialeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!victimeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    directus
      .request(
        readItems("mmrl_relations_familiales", {
          filter: {
            _and: [
              { deleted_at: { _null: true } },
              {
                _or: [
                  { victime_id_a: { _eq: victimeId } },
                  { victime_id_b: { _eq: victimeId } },
                ],
              },
            ],
          },
          fields: ["*", "victime_id_b.id", "victime_id_b.prenom", "victime_id_b.nom", "victime_id_b.photo_principale", "victime_id_b.statut_id", "victime_id_a.id", "victime_id_a.prenom", "victime_id_a.nom", "victime_id_a.photo_principale", "victime_id_a.statut_id"],
          limit: -1,
        })
      )
      .then((data) => {
        const rows = data as unknown as RelationFamilialeRow[];
        // Normalise : victime_b représente toujours « l'autre » vis-à-vis de victimeId
        const normalised = rows.map((r: any) => {
          const aId = typeof r.victime_id_a === 'object' ? r.victime_id_a?.id : r.victime_id_a;
          const bId = typeof r.victime_id_b === 'object' ? r.victime_id_b?.id : r.victime_id_b;
          const otherIsA = Number(aId) !== Number(victimeId) && Number(bId) === Number(victimeId);
          const autre = otherIsA ? r.victime_id_a : r.victime_id_b;
          return {
            ...r,
            victime_id_a: typeof r.victime_id_a === 'object' ? r.victime_id_a?.id : r.victime_id_a,
            victime_id_b: typeof r.victime_id_b === 'object' ? r.victime_id_b?.id : r.victime_id_b,
            victime_b: autre && typeof autre === 'object' ? autre : null,
          } as RelationFamilialeRow;
        });
        setRelations(normalised);
        setError(null);
      })
      .catch((e: any) => setError(e.message || "Erreur inconnue"))
      .finally(() => setLoading(false));
  }, [victimeId, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { relations, loading, error, refresh };
}

// =============================================================================
// Hook — sépulture virtuelle d'une victime
// =============================================================================
export function useSepulture(victimeId: number | null | undefined) {
  const [sepulture, setSepulture] = useState<SepultureRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!victimeId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    directus
      .request(
        readItems("mmrl_sepultures", {
          filter: {
            victime_id: { _eq: victimeId },
            deleted_at: { _null: true },
          },
          limit: 1,
        })
      )
      .then((data) => {
        const arr = data as unknown as SepultureRow[];
        setSepulture(arr.length > 0 ? arr[0] : null);
        setError(null);
      })
      .catch((e: any) => setError(e.message || "Erreur inconnue"))
      .finally(() => setLoading(false));
  }, [victimeId, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { sepulture, loading, error, refresh };
}