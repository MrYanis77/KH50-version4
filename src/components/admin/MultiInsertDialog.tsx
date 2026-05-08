import { useEffect, useState } from "react";
import { directus } from "@/integration/directus";
import { createItem, createUser, readRoles } from "@directus/sdk";
import {
  STATUT_ID,
  TYPE_FRAGMENT_ID,
  TYPE_RELATION_LABELS,
  TYPE_SEPULTURE_LABELS,
  type MmrlVictimeInsert,
  type MmrlFragmentInsert,
  type MmrlParcoursInsert,
  type MmrlSourceTemoignageInsert,
  type MmrlQualiteStatutInsert,
  type MmrlTypeFragmentInsert,
  type MmrlRelationFamilialeInsert,
  type MmrlSepultureInsert,
  type MmrlRecueilInsert,
  type MmrlNotificationInsert,
  type MmrlMultiInsertCollection,
  type DirectusUserCreatePayload,
  type SourceTemoignageRow,
  type VictimeRow,
  type TypeFragmentRow,
  type QualiteCode,
  type TypeFragmentCode,
  type TypeRelationCode,
  type TypeSepulture,
  type NotificationType,
} from "@/integration/directus-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Check, Loader2, ListPlus } from "lucide-react";

const QUALITE_CODES: QualiteCode[] = ["verifie", "a_verifier", "non_fiable"];

const TYPE_FRAGMENT_CODES: TypeFragmentCode[] = [
  "temoignage",
  "photographie",
  "video",
  "recit",
  "document",
  "lieu",
  "audio",
];

const TYPE_RELATION_KEYS = Object.keys(TYPE_RELATION_LABELS) as TypeRelationCode[];

const TYPE_SEPULTURE_KEYS = Object.keys(TYPE_SEPULTURE_LABELS) as TypeSepulture[];

const NOTIFICATION_TYPES: NotificationType[] = [
  "ajout_victime",
  "ajout_fragment",
  "ajout_parcours",
  "ajout_recueil",
  "ajout_relation",
  "ajout_sepulture",
  "modification",
  "validation",
  "rejet",
];

type FormRow = Record<string, string | number | boolean | null | undefined>;

/** Valeur contrôlée pour `<Input>` (exclut les booléens du FormRow). */
function inputValue(row: FormRow, key: string): string {
  const v = row[key];
  if (v == null || typeof v === "boolean") return "";
  return String(v);
}

interface MultiInsertDialogProps {
  onComplete: () => void;
  sources: SourceTemoignageRow[];
  victimes: VictimeRow[];
  typeFragments: TypeFragmentRow[];
}

const COLLECTION_META: Record<
  MmrlMultiInsertCollection,
  { title: string; emptyHint: string; success: (n: number) => string }
> = {
  mmrl_qualite_statut: {
    title: "mmrl_qualite_statut",
    emptyHint: "Code, libellé et couleur hex (#…) sont obligatoires.",
    success: (n) => `${n} statut(s) qualité créé(s).`,
  },
  mmrl_type_fragment: {
    title: "mmrl_type_fragment",
    emptyHint: "Code et libellé du type sont obligatoires.",
    success: (n) => `${n} type(s) de fragment créé(s).`,
  },
  mmrl_sources_temoignage: {
    title: "mmrl_sources_temoignage",
    emptyHint: "Prénom et nom sont obligatoires par ligne.",
    success: (n) => `${n} source(s) créée(s).`,
  },
  mmrl_victimes: {
    title: "mmrl_victimes",
    emptyHint: "Prénom, nom, contributeur (UUID) et source sont obligatoires.",
    success: (n) => `${n} victime(s) créée(s).`,
  },
  mmrl_parcours: {
    title: "mmrl_parcours",
    emptyHint: "La victime est obligatoire pour chaque ligne.",
    success: (n) => `${n} parcours créé(s).`,
  },
  mmrl_fragments: {
    title: "mmrl_fragments",
    emptyHint: "Victime, contributeur, type et description sont obligatoires.",
    success: (n) => `${n} fragment(s) créé(s).`,
  },
  mmrl_relations_familiales: {
    title: "mmrl_relations_familiales",
    emptyHint: "Victime A, type de lien, et soit une victime B soit un nom externe.",
    success: (n) => `${n} relation(s) créée(s).`,
  },
  mmrl_sepultures: {
    title: "mmrl_sepultures",
    emptyHint: "Victime et type de sépulture sont obligatoires.",
    success: (n) => `${n} sépulture(s) créée(s).`,
  },
  mmrl_recueil: {
    title: "mmrl_recueil",
    emptyHint: "Contributeur (UUID) et type de contenu sont obligatoires.",
    success: (n) => `${n} entrée(s) recueil créée(s).`,
  },
  directus_users: {
    title: "directus_users",
    emptyHint: "Email, mot de passe et rôle sont obligatoires par ligne.",
    success: (n) => `${n} utilisateur(s) créé(s).`,
  },
  mmrl_notifications: {
    title: "mmrl_notifications",
    emptyHint: "Destinataire, type, collection, id item, libellé et message sont obligatoires.",
    success: (n) => `${n} notification(s) créée(s).`,
  },
};

function normalizeStatut(row: FormRow, fallback: number): number {
  const s = row.statut_id;
  if (typeof s === "number" && Number.isFinite(s)) return s;
  if (typeof s === "string" && s !== "" && Number.isFinite(Number(s))) return Number(s);
  return fallback;
}

function toQualiteStatutInsert(row: FormRow): MmrlQualiteStatutInsert | null {
  const code = String(row.code ?? "").trim() as QualiteCode;
  const libelle = String(row.libelle ?? "").trim();
  const couleur_hex = String(row.couleur_hex ?? "").trim();
  if (!libelle || !couleur_hex || !QUALITE_CODES.includes(code)) return null;
  const sw = row.show_on_wall;
  const show_on_wall = sw === true || sw === "true" || String(sw) === "1";
  return { code, libelle, couleur_hex, show_on_wall };
}

function toTypeFragmentInsert(row: FormRow): MmrlTypeFragmentInsert | null {
  const code = String(row.code ?? "").trim() as TypeFragmentCode;
  const libelle = String(row.libelle ?? "").trim();
  if (!libelle || !TYPE_FRAGMENT_CODES.includes(code)) return null;
  return { code, libelle };
}

function toVictimeInsert(row: FormRow): MmrlVictimeInsert | null {
  const prenom = String(row.prenom ?? "").trim();
  const nom = String(row.nom ?? "").trim();
  const auteur_user_id = String(row.auteur_user_id ?? "").trim();
  const sid = row.source_id;
  const source_id = sid != null && sid !== "" ? Number(sid) : NaN;
  if (!prenom || !nom || !auteur_user_id || !Number.isFinite(source_id)) return null;
  return {
    prenom,
    nom,
    auteur_user_id,
    source_id,
    statut_id: normalizeStatut(row, STATUT_ID.A_VERIFIER),
  };
}

function toFragmentInsert(row: FormRow): MmrlFragmentInsert | null {
  const victime_id = Number(row.victime_id);
  const auteur_user_id = String(row.auteur_user_id ?? "").trim();
  const type_id = Number(row.type_id);
  const description = String(row.description ?? "").trim();
  const fm = String(row.fichier_media ?? "").trim();
  const titre = String(row.titre ?? "").trim();

  if (!Number.isFinite(victime_id) || !auteur_user_id || !description) return null;
  if (!Number.isFinite(type_id)) return null;

  const out: MmrlFragmentInsert = {
    victime_id,
    auteur_user_id,
    type_id,
    description,
    statut_id: normalizeStatut(row, STATUT_ID.A_VERIFIER),
  };
  if (fm) out.fichier_media = fm;
  if (titre) out.titre = titre;

  const af = row.annee_fragment;
  if (af != null && af !== "" && Number.isFinite(Number(af))) out.annee_fragment = Number(af);
  const df = String(row.date_fragment ?? "").trim();
  if (df) out.date_fragment = df;

  const src = row.source_id;
  if (src != null && src !== "") {
    const n = Number(src);
    if (Number.isFinite(n)) out.source_id = n;
  }
  return out;
}

function toParcoursInsert(row: FormRow): MmrlParcoursInsert | null {
  const victime_id = Number(row.victime_id);
  if (!Number.isFinite(victime_id)) return null;

  const ae = row.annee_evenement;
  const annee_evenement = ae != null && ae !== "" ? Number(ae) : null;
  const description = String(row.description ?? "").trim() || null;
  const titre = String(row.titre ?? "").trim() || null;
  const ordreRaw = row.ordre;
  const ordre =
    ordreRaw != null && ordreRaw !== "" && Number.isFinite(Number(ordreRaw)) ? Number(ordreRaw) : 0;

  const out: MmrlParcoursInsert = {
    victime_id,
    ordre,
    annee_evenement: annee_evenement != null && Number.isFinite(annee_evenement) ? annee_evenement : null,
    titre,
    description,
    statut_id: normalizeStatut(row, STATUT_ID.A_VERIFIER),
  };

  const de = String(row.date_evenement ?? "").trim();
  if (de) out.date_evenement = de;
  const fm = String(row.fichier_media ?? "").trim();
  if (fm) out.fichier_media = fm;

  return out;
}

function toSourceTemoignageInsert(row: FormRow): MmrlSourceTemoignageInsert | null {
  const prenom = String(row.prenom ?? "").trim();
  const nom = String(row.nom ?? "").trim();
  if (!prenom || !nom) return null;

  const out: MmrlSourceTemoignageInsert = {
    prenom,
    nom,
    statut_id: normalizeStatut(row, STATUT_ID.A_VERIFIER),
  };
  const su = String(row.source_user_id ?? "").trim();
  if (su) out.source_user_id = su;
  const email = String(row.email ?? "").trim();
  if (email) out.email = email;
  const tel = String(row.telephone ?? "").trim();
  if (tel) out.telephone = tel;
  return out;
}

function toRelationInsert(row: FormRow): MmrlRelationFamilialeInsert | null {
  const victime_id_a = Number(row.victime_id_a);
  const type_relation = String(row.type_relation ?? "").trim() as TypeRelationCode;
  if (!Number.isFinite(victime_id_a) || !TYPE_RELATION_KEYS.includes(type_relation)) return null;

  const vidb = row.victime_id_b;
  const victime_id_b =
    vidb != null && vidb !== "" && vidb !== "__none__" && Number.isFinite(Number(vidb)) ? Number(vidb) : null;
  const nom_relatif_externe = String(row.nom_relatif_externe ?? "").trim() || null;

  if (victime_id_b == null && !nom_relatif_externe) return null;

  const out: MmrlRelationFamilialeInsert = {
    victime_id_a,
    type_relation,
    statut_id: normalizeStatut(row, STATUT_ID.A_VERIFIER),
  };
  if (victime_id_b != null) {
    out.victime_id_b = victime_id_b;
  } else if (nom_relatif_externe) {
    out.nom_relatif_externe = nom_relatif_externe;
  }

  const desc = String(row.description ?? "").trim();
  if (desc) out.description = desc;
  const aut = String(row.auteur_user_id ?? "").trim();
  if (aut) out.auteur_user_id = aut;

  return out;
}

function toSepultureInsert(row: FormRow): MmrlSepultureInsert | null {
  const victime_id = Number(row.victime_id);
  const type_sepulture = String(row.type_sepulture ?? "").trim() as TypeSepulture;
  if (!Number.isFinite(victime_id) || !TYPE_SEPULTURE_KEYS.includes(type_sepulture)) return null;

  const nbRaw = row.nb_bougies;
  const nb_bougies =
    nbRaw != null && nbRaw !== "" && Number.isFinite(Number(nbRaw)) ? Number(nbRaw) : 0;

  const out: MmrlSepultureInsert = {
    victime_id,
    type_sepulture,
    nb_bougies,
    statut_id: normalizeStatut(row, STATUT_ID.A_VERIFIER),
  };
  const ep = String(row.epitaphe ?? "").trim();
  if (ep) out.epitaphe = ep;
  const msg = String(row.message ?? "").trim();
  if (msg) out.message = msg;
  const aut = String(row.auteur_user_id ?? "").trim();
  if (aut) out.auteur_user_id = aut;
  return out;
}

function toRecueilInsert(row: FormRow): MmrlRecueilInsert | null {
  const auteur_user_id = String(row.auteur_user_id ?? "").trim();
  const type_id = Number(row.type_id);
  if (!auteur_user_id || !Number.isFinite(type_id)) return null;

  const pub = row.is_public;
  const is_public = pub === true || pub === "true" || String(pub) === "1";

  const defaultStatut = is_public ? STATUT_ID.A_VERIFIER : STATUT_ID.VERIFIE;

  const out: MmrlRecueilInsert = {
    auteur_user_id,
    type_id,
    is_public,
    statut_id: normalizeStatut(row, defaultStatut),
  };
  const titre = String(row.titre ?? "").trim();
  if (titre) out.titre = titre;
  const contenu = String(row.contenu ?? "").trim();
  if (contenu) out.contenu = contenu;
  const fm = String(row.fichier_media ?? "").trim();
  if (fm) out.fichier_media = fm;
  return out;
}

function toNotificationInsert(row: FormRow): MmrlNotificationInsert | null {
  const destinataire_user_id = String(row.destinataire_user_id ?? "").trim();
  const type = String(row.type ?? "").trim() as NotificationType;
  const collection = String(row.collection ?? "").trim();
  const item_id = Number(row.item_id);
  const item_label = String(row.item_label ?? "").trim();
  const message = String(row.message ?? "").trim();

  if (!destinataire_user_id || !NOTIFICATION_TYPES.includes(type)) return null;
  if (!collection || !Number.isFinite(item_id) || !item_label || !message) return null;

  const out: MmrlNotificationInsert = {
    destinataire_user_id,
    type,
    collection,
    item_id,
    item_label,
    message,
    lu: false,
  };
  const em = String(row.emetteur_user_id ?? "").trim();
  if (em) out.emetteur_user_id = em;
  return out;
}

function toDirectusUserCreate(row: FormRow): DirectusUserCreatePayload | null {
  const email = String(row.email ?? "").trim();
  const password = String(row.password ?? "");
  const role = String(row.role ?? "").trim();
  if (!email || !password || !role) return null;
  const out: DirectusUserCreatePayload = {
    email,
    password,
    role,
    status: String(row.status ?? "").trim() || "active",
  };
  const fn = String(row.first_name ?? "").trim();
  if (fn) out.first_name = fn;
  const ln = String(row.last_name ?? "").trim();
  if (ln) out.last_name = ln;
  const tel = String(row.telephone ?? "").trim();
  if (tel) out.telephone = tel;
  return out;
}

function partitionPayloads<T>(formRows: FormRow[], build: (r: FormRow) => T | null): { payloads: T[]; skipped: number } {
  const payloads: T[] = [];
  let skipped = 0;
  for (const row of formRows) {
    const p = build(row);
    if (p) payloads.push(p);
    else skipped++;
  }
  return { payloads, skipped };
}

export const MultiInsertDialog = ({ onComplete, sources, victimes, typeFragments }: MultiInsertDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetCollection, setTargetCollection] = useState<MmrlMultiInsertCollection>("mmrl_sources_temoignage");
  const [rows, setRows] = useState<FormRow[]>([{}]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    directus
      .request(readRoles({ limit: -1 }))
      .then((r) => {
        if (!cancelled) setRoles((r as { id: string; name: string }[]) ?? []);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const orderedTypes =
    typeFragments.length > 0
      ? [...typeFragments].sort((a, b) => a.id - b.id)
      : [
          { id: TYPE_FRAGMENT_ID.TEMOIGNAGE, libelle: "Témoignage", code: "temoignage" as const },
          { id: TYPE_FRAGMENT_ID.PHOTOGRAPHIE, libelle: "Photographie", code: "photographie" as const },
          { id: TYPE_FRAGMENT_ID.VIDEO, libelle: "Vidéo", code: "video" as const },
          { id: TYPE_FRAGMENT_ID.RECIT, libelle: "Récit", code: "recit" as const },
          { id: TYPE_FRAGMENT_ID.DOCUMENT, libelle: "Document", code: "document" as const },
          { id: TYPE_FRAGMENT_ID.LIEU, libelle: "Lieu", code: "lieu" as const },
          { id: TYPE_FRAGMENT_ID.AUDIO, libelle: "Audio", code: "audio" as const },
        ];

  const defaultTypeId = orderedTypes[0]?.id ?? TYPE_FRAGMENT_ID.TEMOIGNAGE;

  const addRow = () => setRows([...rows, {}]);
  const removeRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const updateRow = (index: number, field: string, value: string | number | boolean | null) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    setRows(next);
  };

  const handleSaveAll = async () => {
    const nonEmpty = rows.filter((row) => Object.keys(row).some((k) => row[k] !== "" && row[k] != null));
    if (nonEmpty.length === 0) {
      toast.error("Ajoutez au moins une ligne remplie.");
      return;
    }

    setIsSubmitting(true);
    const meta = COLLECTION_META[targetCollection];
    try {
      if (targetCollection === "directus_users") {
        const { payloads, skipped } = partitionPayloads(nonEmpty, toDirectusUserCreate);
        if (payloads.length === 0) {
          toast.error(meta.emptyHint);
          return;
        }
        await Promise.all(payloads.map((body) => directus.request(createUser(body))));
        if (skipped) toast.info(`${skipped} ligne(s) ignorée(s).`);
        toast.success(meta.success(payloads.length));
      } else {
        const run = async <T,>(build: (r: FormRow) => T | null, table: string) => {
          const { payloads, skipped } = partitionPayloads(nonEmpty, build);
          if (payloads.length === 0) {
            toast.error(meta.emptyHint);
            return false;
          }
          await Promise.all(payloads.map((body) => directus.request(createItem(table as never, body as never))));
          if (skipped) toast.info(`${skipped} ligne(s) ignorée(s).`);
          toast.success(meta.success(payloads.length));
          return true;
        };

        let ok = true;
        switch (targetCollection) {
          case "mmrl_qualite_statut":
            ok = await run(toQualiteStatutInsert, "mmrl_qualite_statut");
            break;
          case "mmrl_type_fragment":
            ok = await run(toTypeFragmentInsert, "mmrl_type_fragment");
            break;
          case "mmrl_sources_temoignage":
            ok = await run(toSourceTemoignageInsert, "mmrl_sources_temoignage");
            break;
          case "mmrl_victimes":
            ok = await run(toVictimeInsert, "mmrl_victimes");
            break;
          case "mmrl_parcours":
            ok = await run(toParcoursInsert, "mmrl_parcours");
            break;
          case "mmrl_fragments":
            ok = await run(toFragmentInsert, "mmrl_fragments");
            break;
          case "mmrl_relations_familiales":
            ok = await run(toRelationInsert, "mmrl_relations_familiales");
            break;
          case "mmrl_sepultures":
            ok = await run(toSepultureInsert, "mmrl_sepultures");
            break;
          case "mmrl_recueil":
            ok = await run(toRecueilInsert, "mmrl_recueil");
            break;
          case "mmrl_notifications":
            ok = await run(toNotificationInsert, "mmrl_notifications");
            break;
          default:
            ok = false;
        }
        if (!ok) return;
      }

      setRows([{}]);
      setIsOpen(false);
      onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur Directus";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFields = (row: FormRow, index: number) => {
    switch (targetCollection) {
      case "mmrl_qualite_statut":
        return (
          <>
            <TableCell>
              <Select value={String(row.code ?? "a_verifier")} onValueChange={(v) => updateRow(index, "code", v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUALITE_CODES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input placeholder="Libellé" value={String(row.libelle ?? "")} onChange={(e) => updateRow(index, "libelle", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="#rrggbb" value={String(row.couleur_hex ?? "")} onChange={(e) => updateRow(index, "couleur_hex", e.target.value)} />
            </TableCell>
            <TableCell>
              <Select
                value={row.show_on_wall === false || row.show_on_wall === "false" ? "false" : "true"}
                onValueChange={(v) => updateRow(index, "show_on_wall", v === "true")}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Oui</SelectItem>
                  <SelectItem value="false">Non</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </>
        );
      case "mmrl_type_fragment":
        return (
          <>
            <TableCell>
              <Select value={String(row.code ?? "temoignage")} onValueChange={(v) => updateRow(index, "code", v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_FRAGMENT_CODES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input placeholder="Libellé" value={String(row.libelle ?? "")} onChange={(e) => updateRow(index, "libelle", e.target.value)} />
            </TableCell>
          </>
        );
      case "mmrl_sources_temoignage":
        return (
          <>
            <TableCell>
              <Input placeholder="Prénom" value={String(row.prenom ?? "")} onChange={(e) => updateRow(index, "prenom", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Nom" value={String(row.nom ?? "")} onChange={(e) => updateRow(index, "nom", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input
                placeholder="UUID compte (optionnel)"
                value={String(row.source_user_id ?? "")}
                onChange={(e) => updateRow(index, "source_user_id", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
            <TableCell>
              <Input placeholder="Email" type="email" value={String(row.email ?? "")} onChange={(e) => updateRow(index, "email", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Tél. (optionnel)" value={String(row.telephone ?? "")} onChange={(e) => updateRow(index, "telephone", e.target.value)} />
            </TableCell>
          </>
        );
      case "mmrl_victimes":
        return (
          <>
            <TableCell>
              <Input placeholder="Prénom" value={String(row.prenom ?? "")} onChange={(e) => updateRow(index, "prenom", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Nom" value={String(row.nom ?? "")} onChange={(e) => updateRow(index, "nom", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input
                placeholder="UUID contributeur"
                value={String(row.auteur_user_id ?? "")}
                onChange={(e) => updateRow(index, "auteur_user_id", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
            <TableCell>
              <Select
                value={row.source_id != null && row.source_id !== "" ? String(row.source_id) : ""}
                onValueChange={(v) => updateRow(index, "source_id", Number(v))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.prenom} {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </>
        );
      case "mmrl_parcours":
        return (
          <>
            <TableCell>
              <Select
                value={row.victime_id != null && row.victime_id !== "" ? String(row.victime_id) : ""}
                onValueChange={(v) => updateRow(index, "victime_id", Number(v))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Victime" />
                </SelectTrigger>
                <SelectContent>
                  {victimes.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.prenom} {v.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input
                type="number"
                placeholder="Année"
                value={inputValue(row, "annee_evenement")}
                onChange={(e) => updateRow(index, "annee_evenement", e.target.value ? Number(e.target.value) : null)}
              />
            </TableCell>
            <TableCell>
              <Input placeholder="date ISO (optionnel)" value={String(row.date_evenement ?? "")} onChange={(e) => updateRow(index, "date_evenement", e.target.value)} className="text-xs" />
            </TableCell>
            <TableCell>
              <Input placeholder="Titre" value={String(row.titre ?? "")} onChange={(e) => updateRow(index, "titre", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Texte" value={String(row.description ?? "")} onChange={(e) => updateRow(index, "description", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                placeholder="Ordre"
                value={inputValue(row, "ordre")}
                onChange={(e) => updateRow(index, "ordre", e.target.value ? Number(e.target.value) : 0)}
              />
            </TableCell>
            <TableCell>
              <Input
                placeholder="UUID fichier (optionnel)"
                value={String(row.fichier_media ?? "")}
                onChange={(e) => updateRow(index, "fichier_media", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
          </>
        );
      case "mmrl_fragments":
        return (
          <>
            <TableCell>
              <Select
                value={row.victime_id != null && row.victime_id !== "" ? String(row.victime_id) : ""}
                onValueChange={(v) => updateRow(index, "victime_id", Number(v))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Victime" />
                </SelectTrigger>
                <SelectContent>
                  {victimes.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.prenom} {v.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input
                placeholder="UUID contributeur"
                value={String(row.auteur_user_id ?? "")}
                onChange={(e) => updateRow(index, "auteur_user_id", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
            <TableCell>
              <Select value={String(row.type_id ?? defaultTypeId)} onValueChange={(v) => updateRow(index, "type_id", Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orderedTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input placeholder="Titre" value={String(row.titre ?? "")} onChange={(e) => updateRow(index, "titre", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Description" value={String(row.description ?? "")} onChange={(e) => updateRow(index, "description", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                placeholder="Année (opt.)"
                value={inputValue(row, "annee_fragment")}
                onChange={(e) => updateRow(index, "annee_fragment", e.target.value ? Number(e.target.value) : undefined)}
              />
            </TableCell>
            <TableCell>
              <Input placeholder="Date fragment (opt.)" value={String(row.date_fragment ?? "")} onChange={(e) => updateRow(index, "date_fragment", e.target.value)} className="text-xs" />
            </TableCell>
            <TableCell>
              <Input
                placeholder="UUID fichier"
                value={String(row.fichier_media ?? "")}
                onChange={(e) => updateRow(index, "fichier_media", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
            <TableCell>
              <Select
                value={row.source_id != null && row.source_id !== "" ? String(row.source_id) : "__none__"}
                onValueChange={(v) => updateRow(index, "source_id", v === "__none__" ? undefined : Number(v))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.prenom} {s.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </>
        );
      case "mmrl_relations_familiales":
        return (
          <>
            <TableCell>
              <Select
                value={row.victime_id_a != null && row.victime_id_a !== "" ? String(row.victime_id_a) : ""}
                onValueChange={(v) => updateRow(index, "victime_id_a", Number(v))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Victime A" />
                </SelectTrigger>
                <SelectContent>
                  {victimes.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.prenom} {v.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Select
                value={row.victime_id_b != null && row.victime_id_b !== "" ? String(row.victime_id_b) : "__none__"}
                onValueChange={(v) => updateRow(index, "victime_id_b", v === "__none__" ? "__none__" : Number(v))}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Victime B" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— externe —</SelectItem>
                  {victimes.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.prenom} {v.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input placeholder="Nom si hors base" value={String(row.nom_relatif_externe ?? "")} onChange={(e) => updateRow(index, "nom_relatif_externe", e.target.value)} />
            </TableCell>
            <TableCell>
              <Select value={String(row.type_relation ?? "parent")} onValueChange={(v) => updateRow(index, "type_relation", v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_RELATION_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {TYPE_RELATION_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input placeholder="Note (opt.)" value={String(row.description ?? "")} onChange={(e) => updateRow(index, "description", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input
                placeholder="UUID auteur (opt.)"
                value={String(row.auteur_user_id ?? "")}
                onChange={(e) => updateRow(index, "auteur_user_id", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
          </>
        );
      case "mmrl_sepultures":
        return (
          <>
            <TableCell>
              <Select
                value={row.victime_id != null && row.victime_id !== "" ? String(row.victime_id) : ""}
                onValueChange={(v) => updateRow(index, "victime_id", Number(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Victime" />
                </SelectTrigger>
                <SelectContent>
                  {victimes.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.prenom} {v.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Select value={String(row.type_sepulture ?? "stupa")} onValueChange={(v) => updateRow(index, "type_sepulture", v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_SEPULTURE_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {TYPE_SEPULTURE_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input type="number" placeholder="Bougies" value={inputValue(row, "nb_bougies")} onChange={(e) => updateRow(index, "nb_bougies", e.target.value ? Number(e.target.value) : 0)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Épitaphe (opt.)" value={String(row.epitaphe ?? "")} onChange={(e) => updateRow(index, "epitaphe", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Message (opt.)" value={String(row.message ?? "")} onChange={(e) => updateRow(index, "message", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input
                placeholder="UUID auteur (opt.)"
                value={String(row.auteur_user_id ?? "")}
                onChange={(e) => updateRow(index, "auteur_user_id", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
          </>
        );
      case "mmrl_recueil":
        return (
          <>
            <TableCell>
              <Input
                placeholder="UUID contributeur"
                value={String(row.auteur_user_id ?? "")}
                onChange={(e) => updateRow(index, "auteur_user_id", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
            <TableCell>
              <Select value={String(row.type_id ?? defaultTypeId)} onValueChange={(v) => updateRow(index, "type_id", Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orderedTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input placeholder="Titre (opt.)" value={String(row.titre ?? "")} onChange={(e) => updateRow(index, "titre", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Contenu (opt.)" value={String(row.contenu ?? "")} onChange={(e) => updateRow(index, "contenu", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="UUID fichier (opt.)" value={String(row.fichier_media ?? "")} onChange={(e) => updateRow(index, "fichier_media", e.target.value)} className="font-mono text-xs" />
            </TableCell>
            <TableCell>
              <Select
                value={row.is_public === true || row.is_public === "true" ? "true" : "false"}
                onValueChange={(v) => updateRow(index, "is_public", v === "true")}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Privé</SelectItem>
                  <SelectItem value="true">Public</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </>
        );
      case "directus_users":
        return (
          <>
            <TableCell>
              <Input placeholder="Email" type="email" value={String(row.email ?? "")} onChange={(e) => updateRow(index, "email", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Mot de passe" type="password" value={String(row.password ?? "")} onChange={(e) => updateRow(index, "password", e.target.value)} />
            </TableCell>
            <TableCell>
              <Select value={String(row.role ?? (roles[0]?.id ?? ""))} onValueChange={(v) => updateRow(index, "role", v)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Select value={String(row.status ?? "active")} onValueChange={(v) => updateRow(index, "status", v)}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="suspended">suspended</SelectItem>
                  <SelectItem value="archived">archived</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input placeholder="Prénom (opt.)" value={String(row.first_name ?? "")} onChange={(e) => updateRow(index, "first_name", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Nom (opt.)" value={String(row.last_name ?? "")} onChange={(e) => updateRow(index, "last_name", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Tél. (opt.)" value={String(row.telephone ?? "")} onChange={(e) => updateRow(index, "telephone", e.target.value)} />
            </TableCell>
          </>
        );
      case "mmrl_notifications":
        return (
          <>
            <TableCell>
              <Input
                placeholder="UUID destinataire"
                value={String(row.destinataire_user_id ?? "")}
                onChange={(e) => updateRow(index, "destinataire_user_id", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
            <TableCell>
              <Input
                placeholder="UUID émetteur (opt.)"
                value={String(row.emetteur_user_id ?? "")}
                onChange={(e) => updateRow(index, "emetteur_user_id", e.target.value)}
                className="font-mono text-xs"
              />
            </TableCell>
            <TableCell>
              <Select value={String(row.type ?? "modification")} onValueChange={(v) => updateRow(index, "type", v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Input placeholder="Collection" value={String(row.collection ?? "")} onChange={(e) => updateRow(index, "collection", e.target.value)} className="text-xs" />
            </TableCell>
            <TableCell>
              <Input type="number" placeholder="ID item" value={inputValue(row, "item_id")} onChange={(e) => updateRow(index, "item_id", e.target.value ? Number(e.target.value) : undefined)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Libellé" value={String(row.item_label ?? "")} onChange={(e) => updateRow(index, "item_label", e.target.value)} />
            </TableCell>
            <TableCell>
              <Input placeholder="Message" value={String(row.message ?? "")} onChange={(e) => updateRow(index, "message", e.target.value)} />
            </TableCell>
          </>
        );
      default:
        return null;
    }
  };

  const renderTableHead = () => {
    switch (targetCollection) {
      case "mmrl_qualite_statut":
        return (
          <>
            <TableHead>code</TableHead>
            <TableHead>libelle</TableHead>
            <TableHead>couleur_hex</TableHead>
            <TableHead>show_on_wall</TableHead>
          </>
        );
      case "mmrl_type_fragment":
        return (
          <>
            <TableHead>code</TableHead>
            <TableHead>libelle</TableHead>
          </>
        );
      case "mmrl_sources_temoignage":
        return (
          <>
            <TableHead>prenom</TableHead>
            <TableHead>nom</TableHead>
            <TableHead>source_user_id</TableHead>
            <TableHead>email</TableHead>
            <TableHead>telephone</TableHead>
          </>
        );
      case "mmrl_victimes":
        return (
          <>
            <TableHead>prenom</TableHead>
            <TableHead>nom</TableHead>
            <TableHead>auteur_user_id</TableHead>
            <TableHead>source_id</TableHead>
          </>
        );
      case "mmrl_parcours":
        return (
          <>
            <TableHead>victime_id</TableHead>
            <TableHead>annee_evenement</TableHead>
            <TableHead>date_evenement</TableHead>
            <TableHead>titre</TableHead>
            <TableHead>description</TableHead>
            <TableHead>ordre</TableHead>
            <TableHead>fichier_media</TableHead>
          </>
        );
      case "mmrl_fragments":
        return (
          <>
            <TableHead>victime_id</TableHead>
            <TableHead>auteur_user_id</TableHead>
            <TableHead>type_id</TableHead>
            <TableHead>titre</TableHead>
            <TableHead>description</TableHead>
            <TableHead>annee_fragment</TableHead>
            <TableHead>date_fragment</TableHead>
            <TableHead>fichier_media</TableHead>
            <TableHead>source_id</TableHead>
          </>
        );
      case "mmrl_relations_familiales":
        return (
          <>
            <TableHead>victime_id_a</TableHead>
            <TableHead>victime_id_b</TableHead>
            <TableHead>nom_relatif_externe</TableHead>
            <TableHead>type_relation</TableHead>
            <TableHead>description</TableHead>
            <TableHead>auteur_user_id</TableHead>
          </>
        );
      case "mmrl_sepultures":
        return (
          <>
            <TableHead>victime_id</TableHead>
            <TableHead>type_sepulture</TableHead>
            <TableHead>nb_bougies</TableHead>
            <TableHead>epitaphe</TableHead>
            <TableHead>message</TableHead>
            <TableHead>auteur_user_id</TableHead>
          </>
        );
      case "mmrl_recueil":
        return (
          <>
            <TableHead>auteur_user_id</TableHead>
            <TableHead>type_id</TableHead>
            <TableHead>titre</TableHead>
            <TableHead>contenu</TableHead>
            <TableHead>fichier_media</TableHead>
            <TableHead>is_public</TableHead>
          </>
        );
      case "directus_users":
        return (
          <>
            <TableHead>email</TableHead>
            <TableHead>password</TableHead>
            <TableHead>role</TableHead>
            <TableHead>status</TableHead>
            <TableHead>first_name</TableHead>
            <TableHead>last_name</TableHead>
            <TableHead>telephone</TableHead>
          </>
        );
      case "mmrl_notifications":
        return (
          <>
            <TableHead>destinataire</TableHead>
            <TableHead>emetteur</TableHead>
            <TableHead>type</TableHead>
            <TableHead>collection</TableHead>
            <TableHead>item_id</TableHead>
            <TableHead>item_label</TableHead>
            <TableHead>message</TableHead>
          </>
        );
      default:
        return null;
    }
  };

  const meta = COLLECTION_META[targetCollection];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <ListPlus size={16} />
          Ajout groupé
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[min(96vw,1200px)] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajout groupé — toutes les tables</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4 pt-2">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <Label className="text-muted-foreground">Table</Label>
            <Select
              value={targetCollection}
              onValueChange={(v) => {
                setTargetCollection(v as MmrlMultiInsertCollection);
                setRows([{}]);
              }}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[min(60vh,360px)]">
                <SelectGroup>
                  <SelectLabel>Référence</SelectLabel>
                  <SelectItem value="mmrl_qualite_statut">{COLLECTION_META.mmrl_qualite_statut.title}</SelectItem>
                  <SelectItem value="mmrl_type_fragment">{COLLECTION_META.mmrl_type_fragment.title}</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Données mémorial</SelectLabel>
                  <SelectItem value="mmrl_sources_temoignage">{COLLECTION_META.mmrl_sources_temoignage.title}</SelectItem>
                  <SelectItem value="mmrl_victimes">{COLLECTION_META.mmrl_victimes.title}</SelectItem>
                  <SelectItem value="mmrl_parcours">{COLLECTION_META.mmrl_parcours.title}</SelectItem>
                  <SelectItem value="mmrl_fragments">{COLLECTION_META.mmrl_fragments.title}</SelectItem>
                  <SelectItem value="mmrl_relations_familiales">{COLLECTION_META.mmrl_relations_familiales.title}</SelectItem>
                  <SelectItem value="mmrl_sepultures">{COLLECTION_META.mmrl_sepultures.title}</SelectItem>
                  <SelectItem value="mmrl_recueil">{COLLECTION_META.mmrl_recueil.title}</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Système</SelectLabel>
                  <SelectItem value="directus_users">{COLLECTION_META.directus_users.title}</SelectItem>
                  <SelectItem value="mmrl_notifications">{COLLECTION_META.mmrl_notifications.title}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground sm:max-w-sm sm:pt-6">
            {meta.title} · statut « à vérifier » où applicable. directus_files : importer ou uploader des fichiers, pas de saisie tableau ici.
          </p>
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {renderTableHead()}
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={index}>
                  {renderFields(row, index)}
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeRow(index)} disabled={rows.length === 1} aria-label="Supprimer la ligne">
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4 flex-wrap gap-3">
          <Button variant="outline" onClick={addRow} className="gap-2" type="button">
            <Plus size={16} /> Ligne
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsOpen(false)} type="button">
              Fermer
            </Button>
            <Button onClick={handleSaveAll} disabled={isSubmitting} className="gap-2" type="button">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
