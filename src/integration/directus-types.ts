// =============================================================================
//  MEMORIAL — Directus Types v4.2
//  Corrections :
//    • TypeFragmentRow.code : ajout 'audio'
//    • TYPE_FRAGMENT_ID : AUDIO = 7 aligné avec le schéma SQL
// =============================================================================

export interface DirectusSchema {
  mmrl_qualite_statut: QualiteStatutRow[];
  mmrl_type_fragment: TypeFragmentRow[];
  mmrl_temoins: TemoinRow[];
  mmrl_sources_temoignage: SourceTemoignageRow[];
  mmrl_victimes: VictimeRow[];
  mmrl_parcours: ParcoursRow[];
  mmrl_fragments: FragmentRow[];
  mmrl_relations_familiales: RelationFamilialeRow[];
  mmrl_sepultures: SepultureRow[];
  directus_files: DirectusFilesRow[];
  directus_users: DirectusUsersRow[];
}

// ── Lookup tables ─────────────────────────────────────────────────────────────

/** mmrl_qualite_statut — id: 1=verifie, 2=a_verifier, 3=non_fiable */
export interface QualiteStatutRow {
  id: number;
  code: 'verifie' | 'a_verifier' | 'non_fiable';
  libelle: string;
  couleur_hex: string;
  show_on_wall: boolean;
}

/**
 * mmrl_type_fragment
 * id: 1=temoignage, 2=photographie, 3=video, 4=recit, 5=document, 6=lieu, 7=audio
 */
export interface TypeFragmentRow {
  id: number;
  code: 'temoignage' | 'photographie' | 'video' | 'recit' | 'document' | 'lieu' | 'audio';
  libelle: string;
}

// ── Core tables ───────────────────────────────────────────────────────────────

/** mmrl_temoins — utilisateur enregistré (lié à directus_users) */
export interface TemoinRow {
  id: number;
  directus_user_id: string;
  prenom: string;
  nom: string;
  email?: string;
  telephone?: string;
  /** FK → mmrl_qualite_statut.id  (default 2 = a_verifier) */
  statut_id: number;
  /** Joined field (optional, depends on query) */
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/** mmrl_sources_temoignage — source d'un témoignage (peut ou non avoir de compte) */
export interface SourceTemoignageRow {
  id: number;
  /** Nullable : une source sans compte Directus a source_user_id = null */
  source_user_id?: string | null;
  prenom: string;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  /** FK → mmrl_qualite_statut.id  (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/** mmrl_victimes */
export interface VictimeRow {
  id: number;
  /** FK → mmrl_temoins.id  (utilisateur qui a ajouté la fiche) */
  auteur_temoin_id: number;
  /** FK → mmrl_sources_temoignage.id  (source de l'information) */
  source_id: number;
  prenom: string;
  nom: string;
  /** 0=inconnu, 1=masculin, 2=féminin */
  sexe?: number | null;
  annee_naissance?: number | null;
  date_naissance?: string | null;
  lieu_naissance?: string | null;
  annee_deces?: number | null;
  date_deces?: string | null;
  lieu_deces?: string | null;
  profession?: string | null;
  origine_familiale?: string | null;
  /** FK → directus_files.id */
  photo_principale?: string | null;
  /** FK → mmrl_qualite_statut.id  (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/** mmrl_parcours */
export interface ParcoursRow {
  id: number;
  victime_id: number;
  annee_evenement?: number | null;
  date_evenement?: string | null;
  titre?: string | null;
  description?: string | null;
  /** FK → directus_files.id */
  fichier_media?: string | null;
  ordre: number;
  /** FK → mmrl_qualite_statut.id  (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/** mmrl_fragments */
export interface FragmentRow {
  id: number;
  victime_id: number;
  /** FK → mmrl_temoins.id */
  auteur_temoin_id: number;
  /** FK → mmrl_sources_temoignage.id (nullable) */
  source_id?: number | null;
  /** FK → mmrl_type_fragment.id  (default 1 = temoignage) */
  type_id: number;
  type?: TypeFragmentRow;
  titre?: string | null;
  description: string;
  annee_fragment?: number | null;
  date_fragment?: string | null;
  /** FK → directus_files.id */
  fichier_media?: string | null;
  /** FK → mmrl_qualite_statut.id  (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/**
 * mmrl_relations_familiales — liens de parenté entre victimes (« araignée »)
 *
 * Règles :
 *  - `victime_id_a` est toujours renseigné
 *  - Si le relatif figure dans la base → `victime_id_b` non null
 *  - Sinon → `nom_relatif_externe` renseigné
 */
export interface RelationFamilialeRow {
  id: number;
  victime_id_a: number;
  victime_id_b?: number | null;
  nom_relatif_externe?: string | null;
  type_relation: 'conjoint' | 'parent' | 'enfant' | 'frere_soeur' | 'autre';
  description?: string | null;
  /** FK → mmrl_temoins.id */
  auteur_temoin_id?: number | null;
  /** FK → mmrl_qualite_statut.id  (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  /** Champ joint optionnel — la victime liée si victime_id_b non null */
  victime_b?: VictimeRow | null;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/** mmrl_sepultures — sépulture virtuelle d'une victime (unique par victime) */
export interface SepultureRow {
  id: number;
  victime_id: number;
  /** FK → mmrl_temoins.id */
  auteur_temoin_id?: number | null;
  type_sepulture: 'stupa' | 'autel' | 'jardin';
  epitaphe?: string | null;
  message?: string | null;
  nb_bougies: number;
  /** FK → mmrl_qualite_statut.id  (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

// ── Directus system tables ────────────────────────────────────────────────────

export interface DirectusFilesRow {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title?: string;
  type?: string;
  folder?: string;
  uploaded_by?: string;
  uploaded_on?: string;
  modified_by?: string;
  modified_on?: string;
  filesize?: number;
  width?: number;
  height?: number;
  duration?: number;
  description?: string;
  location?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface DirectusUsersRow {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  password?: string;
  location?: string;
  title?: string;
  description?: string;
  tags?: string[];
  avatar?: string;
  language?: string;
  theme?: string;
  tfa_secret?: string;
  status: string;
  role: string;
  token?: string;
  last_access?: string;
  last_page?: string;
  provider: string;
  external_identifier?: string;
  auth_data?: Record<string, unknown>;
  email_notifications?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Statut IDs as constants for convenience */
export const STATUT_ID = {
  VERIFIE: 1,
  A_VERIFIER: 2,
  NON_FIABLE: 3,
} as const;

/** Type fragment IDs as constants — alignés avec mmrl_type_fragment SQL */
export const TYPE_FRAGMENT_ID = {
  TEMOIGNAGE: 1,
  PHOTOGRAPHIE: 2,
  VIDEO: 3,
  RECIT: 4,
  DOCUMENT: 5,
  LIEU: 6,
  AUDIO: 7,
} as const;

export type TypeFragmentCode =
  | 'temoignage'
  | 'photographie'
  | 'video'
  | 'recit'
  | 'document'
  | 'lieu'
  | 'audio';

export type QualiteCode = 'verifie' | 'a_verifier' | 'non_fiable';

export type TypeRelationCode =
  | 'conjoint'
  | 'parent'
  | 'enfant'
  | 'frere_soeur'
  | 'autre';

export const TYPE_RELATION_LABELS: Record<TypeRelationCode, string> = {
  conjoint: 'Conjoint·e',
  parent: 'Parent',
  enfant: 'Enfant',
  frere_soeur: 'Frère / Sœur',
  autre: 'Autre',
};

export type TypeSepulture = 'stupa' | 'autel' | 'jardin';

export const TYPE_SEPULTURE_LABELS: Record<TypeSepulture, string> = {
  stupa: 'Stupa',
  autel: 'Autel',
  jardin: 'Jardin du souvenir',
};