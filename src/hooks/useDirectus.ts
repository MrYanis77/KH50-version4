import { useState, useEffect } from "react";
import { readItems, readItem } from "@directus/sdk";
import { directus } from "@/integration/directus";
import type { MemorialPersonRow, MemoryFragmentRow } from "@/integration/directus-types";

export function useMemorialPersons() {
  const [people, setPeople] = useState<MemorialPersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    directus
      .request(
        readItems("memorial_person" as never, {   // ✅ cast "as never" sur le nom
          filter: { status: { _eq: "published" } },
          limit: -1,
        })
      )
      .then((data) => setPeople(data as unknown as MemorialPersonRow[]))  // ✅ double cast
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { people, loading, error };
}

export function useMemorialPerson(id: number) {
  const [person, setPerson] = useState<MemorialPersonRow | null>(null);
  const [fragments, setFragments] = useState<MemoryFragmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      directus.request(
        readItem("memorial_person" as never, id)   // ✅ cast "as never"
      ),
      directus.request(
        readItems("memory_fragment" as never, {    // ✅ cast "as never"
          filter: { memorial_person_id: { _eq: id } },
        })
      ),
    ])
      .then(([p, f]) => {
        setPerson(p as unknown as MemorialPersonRow);           // ✅ double cast
        setFragments(f as unknown as MemoryFragmentRow[]);      // ✅ double cast
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { person, fragments, loading, error };
}