// =============================================================================
//  MEMORIAL — Directus Types v6.0
//  Aligné sur BDD v3.0 :
//    - mmrl_temoins supprimée
//    - auteur_temoin_id → auteur_user_id: string (CHAR(36) → directus_users)
//    - mmrl_recueil ajoutée (auteur_user_id → directus_users)
//    - directus_users étendu avec telephone
// =============================================================================

export interface DirectusSchema {
  mmrl_qualite_statut: QualiteStatutRow[];
  mmrl_type_fragment: TypeFragmentRow[];
  mmrl_sources_temoignage: SourceTemoignageRow[];
  mmrl_victimes: VictimeRow[];
  mmrl_parcours: ParcoursRow[];
  mmrl_fragments: FragmentRow[];
  mmrl_relations_familiales: RelationFamilialeRow[];
  mmrl_sepultures: SepultureRow[];
  mmrl_recueil: RecueilRow[];
  directus_files: DirectusFilesRow[];
  directus_users: DirectusUsersRow[];
  mmrl_notifications: NotificationRow[];
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

// ── Sources ───────────────────────────────────────────────────────────────────

/** mmrl_sources_temoignage — source d'une info (avec ou sans compte Directus) */
export interface SourceTemoignageRow {
  id: number;
  /** Nullable : une source sans compte Directus a source_user_id = null */
  source_user_id?: string | null;
  prenom: string;
  nom: string;
  email?: string | null;
  telephone?: string | null;
  /** FK → mmrl_qualite_statut.id (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

// ── Core tables ───────────────────────────────────────────────────────────────

/** mmrl_victimes */
export interface VictimeRow {
  id: number;
  /** FK → directus_users.id (CHAR 36) */
  auteur_user_id: string;
  auteur_user?: DirectusUsersRow;
  /** FK → mmrl_sources_temoignage.id */
  source_id: number;
  source?: SourceTemoignageRow;
  prenom: string;
  nom: string;
  /** 0=inconnu, 1=masculin, 2=féminin */
  sexe?: 0 | 1 | 2 | null;
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
  /** FK → mmrl_qualite_statut.id (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
  modifie_par_label?: string | null;
}

/** mmrl_parcours */
export interface ParcoursRow {
  id: number;
  /** FK → mmrl_victimes.id */
  victime_id: number;
  annee_evenement?: number | null;
  date_evenement?: string | null;
  titre?: string | null;
  description?: string | null;
  /** FK → directus_files.id (souvent expand en objet via l’API) */
  fichier_media?: string | DirectusFilesRow | null;
  ordre: number;
  /** FK → mmrl_qualite_statut.id (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/** mmrl_fragments */
export interface FragmentRow {
  id: number;
  /** FK → mmrl_victimes.id */
  victime_id: number;
  /** FK → directus_users.id (CHAR 36) */
  auteur_user_id: string;
  auteur_user?: DirectusUsersRow;
  /** FK → mmrl_sources_temoignage.id (nullable) */
  source_id?: number | null;
  source?: SourceTemoignageRow | null;
  /** FK → mmrl_type_fragment.id (default 1 = temoignage) */
  type_id: number;
  type?: TypeFragmentRow;
  titre?: string | null;
  description: string;
  annee_fragment?: number | null;
  date_fragment?: string | null;
  /** FK → directus_files.id (souvent expand en objet via l’API) */
  fichier_media?: string | DirectusFilesRow | null;
  /** FK → mmrl_qualite_statut.id (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
  modifie_par_label?: string | null;
}

/**
 * mmrl_relations_familiales — liens de parenté (« araignée »)
 * victime_id_b OU nom_relatif_externe doit être renseigné (CHECK SQL)
 */
export interface RelationFamilialeRow {
  id: number;
  /** FK → mmrl_victimes.id */
  victime_id_a: number;
  /** FK → mmrl_victimes.id — null si relatif hors base */
  victime_id_b?: number | null;
  victime_b?: VictimeRow | null;
  /** Renseigné si le relatif n'est pas dans la base */
  nom_relatif_externe?: string | null;
  type_relation: 'conjoint' | 'parent' | 'enfant' | 'frere_soeur' | 'autre';
  description?: string | null;
  /** FK → directus_users.id (CHAR 36, nullable) */
  auteur_user_id?: string | null;
  auteur_user?: DirectusUsersRow | null;
  /** FK → mmrl_qualite_statut.id (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/** mmrl_sepultures — sépulture virtuelle (1 par victime max, UNIQUE victime_id) */
export interface SepultureRow {
  id: number;
  /** FK → mmrl_victimes.id (UNIQUE) */
  victime_id: number;
  /** FK → directus_users.id (CHAR 36, nullable) */
  auteur_user_id?: string | null;
  auteur_user?: DirectusUsersRow | null;
  type_sepulture: 'stupa' | 'autel' | 'jardin';
  epitaphe?: string | null;
  message?: string | null;
  nb_bougies: number;
  /** FK → mmrl_qualite_statut.id (default 2 = a_verifier) */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/** mmrl_recueil — carnet de mémoires personnel d'un utilisateur Directus */
export interface RecueilRow {
  id: number;
  /** FK → directus_users.id (CHAR 36) */
  auteur_user_id: string;
  auteur_user?: DirectusUsersRow;
  /** FK → mmrl_type_fragment.id */
  type_id: number;
  type?: TypeFragmentRow;
  titre?: string | null;
  contenu?: string | null;
  /** FK → directus_files.id (souvent expand en objet via l’API) */
  fichier_media?: string | DirectusFilesRow | null;
  /** true = visible publiquement */
  is_public: boolean;
  /** FK → mmrl_qualite_statut.id */
  statut_id: number;
  statut?: QualiteStatutRow;
  date_creation?: string;
  date_modification?: string;
  deleted_at?: string | null;
}

/**
 * Corps JSON pour createItem — champs scalaires tels qu’attendus par l’API,
 * sans relations expand (`auteur_user`, `statut`, etc.).
 */
export type MmrlVictimeInsert = Omit<
  VictimeRow,
  | "id"
  | "auteur_user"
  | "source"
  | "statut"
  | "date_creation"
  | "date_modification"
  | "deleted_at"
  | "modifie_par_label"
>;

export type MmrlFragmentInsert = Omit<
  FragmentRow,
  | "id"
  | "auteur_user"
  | "source"
  | "type"
  | "statut"
  | "date_creation"
  | "date_modification"
  | "deleted_at"
  | "modifie_par_label"
>;

export type MmrlParcoursInsert = Omit<
  ParcoursRow,
  "id" | "statut" | "date_creation" | "date_modification" | "deleted_at"
>;

export type MmrlSourceTemoignageInsert = Omit<
  SourceTemoignageRow,
  "id" | "statut" | "date_creation" | "date_modification" | "deleted_at"
>;

export type MmrlQualiteStatutInsert = Omit<QualiteStatutRow, "id">;

export type MmrlTypeFragmentInsert = Omit<TypeFragmentRow, "id">;

export type MmrlRelationFamilialeInsert = Omit<
  RelationFamilialeRow,
  | "id"
  | "victime_b"
  | "statut"
  | "auteur_user"
  | "date_creation"
  | "date_modification"
  | "deleted_at"
>;

export type MmrlSepultureInsert = Omit<
  SepultureRow,
  | "id"
  | "auteur_user"
  | "statut"
  | "date_creation"
  | "date_modification"
  | "deleted_at"
>;

export type MmrlRecueilInsert = Omit<
  RecueilRow,
  | "id"
  | "auteur_user"
  | "type"
  | "statut"
  | "date_creation"
  | "date_modification"
  | "deleted_at"
>;

export type MmrlNotificationInsert = Omit<NotificationRow, "id" | "date_creation">;

/** Payload minimal pour `createUser` (SDK Directus) */
export type DirectusUserCreatePayload = {
  email: string;
  password: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
  status?: string;
  telephone?: string | null;
};

/**
 * Collections gérées par l’outil d’ajout groupé admin (schéma Directus — hors fichiers binaires).
 * `directus_files` : préférer l’upload ou l’import.
 */
export type MmrlMultiInsertCollection =
  | "mmrl_qualite_statut"
  | "mmrl_type_fragment"
  | "mmrl_sources_temoignage"
  | "mmrl_victimes"
  | "mmrl_parcours"
  | "mmrl_fragments"
  | "mmrl_relations_familiales"
  | "mmrl_sepultures"
  | "mmrl_recueil"
  | "directus_users"
  | "mmrl_notifications";

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

/**
 * directus_users — étendu avec le champ custom `telephone`
 * À ajouter via : Settings → Data Model → Users → Add Field (String)
 */
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
  /** Champ custom — ajouter via Directus Data Model avant utilisation */
  telephone?: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const STATUT_ID = {
  VERIFIE: 1,
  A_VERIFIER: 2,
  NON_FIABLE: 3,
  MODIFIE_USER: 4,
  MODIFIE_ADMIN: 5,
} as const;

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

// ── Notifications ─────────────────────────────────────────────────────────────

export type NotificationType = 
  | 'ajout_victime' 
  | 'ajout_fragment' 
  | 'ajout_parcours'
  | 'ajout_recueil'
  | 'ajout_relation'
  | 'ajout_sepulture'
  | 'modification' 
  | 'validation' 
  | 'rejet';

export interface NotificationRow {
  id: number;
  destinataire_user_id: string;
  emetteur_user_id?: string | null;
  type: NotificationType;
  collection: string;
  item_id: number;
  item_label: string;
  message: string;
  lu: boolean;
  date_creation?: string;
}