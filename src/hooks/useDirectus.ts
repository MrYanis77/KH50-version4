import { useState, useEffect } from "react";
import { readItems, readItem } from "@directus/sdk";
import { directus } from "@/integration/directus";
import type { VictimeRow, FragmentRow, TemoinRow, ParcoursRow } from "@/integration/directus-types";

// Hook pour récupérer toutes les victimes publiées
export function useMemorialPersons() {
  const [people, setPeople] = useState<VictimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    directus
      .request(
        readItems("memorial_victimes", {
          filter: { statut: { _eq: "publie" } },
          limit: -1,
        })
      )
      .then((data) => setPeople(data as unknown as VictimeRow[]))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { people, loading, error };
}

// Hook pour récupérer une victime et ses fragments
export function useMemorialPerson(id: number) {
  const [person, setPerson] = useState<VictimeRow | null>(null);
  const [fragments, setFragments] = useState<FragmentRow[]>([]);
  const [parcours, setParcours] = useState<ParcoursRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      directus.request(readItem("memorial_victimes", id)),
      directus.request(readItems("memorial_fragments", { filter: { victime_id: { _eq: id } } })).catch(() => []),
      directus.request(readItems("memorial_parcours", { filter: { victime_id: { _eq: id }, statut: { _eq: "valide" } }, sort: ["ordre", "annee"] })).catch((err) => {
        console.warn("Erreur chargement parcours (le champ statut manque peut-être ?)", err);
        return [];
      })
    ])
      .then(([p, f, pc]) => {
        setPerson(p as unknown as VictimeRow);
        setFragments(f as unknown as FragmentRow[]);
        setParcours(pc as unknown as ParcoursRow[]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { person, fragments, parcours, loading, error };
}

// Hook pour la gestion administrative (récupère tout le contenu de la BDD)
export function useAdminData() {
  const [victimes, setVictimes] = useState<VictimeRow[]>([]);
  const [temoins, setTemoins] = useState<TemoinRow[]>([]);
  const [parcours, setParcours] = useState<ParcoursRow[]>([]);
  const [fragments, setFragments] = useState<FragmentRow[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectionErrors, setCollectionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAdminData = async () => {
      const results = await Promise.allSettled([
        directus.request(readItems("memorial_victimes", { limit: -1 })),
        directus.request(readItems("memorial_temoins", { limit: -1 })),
        directus.request(readItems("memorial_parcours", { limit: -1 })),
        directus.request(readItems("memorial_fragments", { limit: -1 }))
      ]);

      const errors: Record<string, string> = {};

      if (results[0].status === "fulfilled") setVictimes(results[0].value as unknown as VictimeRow[]);
      else errors.victimes = (results[0] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      if (results[1].status === "fulfilled") setTemoins(results[1].value as unknown as TemoinRow[]);
      else errors.temoins = (results[1] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      if (results[2].status === "fulfilled") setParcours(results[2].value as unknown as ParcoursRow[]);
      else errors.parcours = (results[2] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      if (results[3].status === "fulfilled") setFragments(results[3].value as unknown as FragmentRow[]);
      else errors.fragments = (results[3] as PromiseRejectedResult).reason?.message || "Erreur inconnue";

      setCollectionErrors(errors);

      const allRejected = results.every(r => r.status === "rejected");
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
  };

  return {
    victimes, temoins, parcours, fragments,
    loading, error, collectionErrors, refreshAction,
    setVictimes, setTemoins, setParcours, setFragments
  };
}