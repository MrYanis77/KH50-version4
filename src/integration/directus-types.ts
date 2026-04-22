export interface DirectusSchema {
  memorial_temoins: TemoinRow[];
  memorial_victimes: VictimeRow[];
  memorial_parcours: ParcoursRow[];
  memorial_fragments: FragmentRow[];
  directus_files: DirectusFilesRow[];
  directus_users: DirectusUsersRow[];
}

export interface TemoinRow {
  id: number;
  directus_user_id?: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  date_creation?: string;
  statut: string;
}

export interface VictimeRow {
  id: number;
  temoin_id: number;
  prenom: string;
  nom: string;
  sexe?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  date_deces?: string;
  lieu_deces?: string;
  profession?: string;
  origine_familiale?: string;
  photo_principale?: string; // ID directus_files
  statut: "brouillon" | "publie" | "archive";
  date_creation?: string;
}

export interface ParcoursRow {
  id: number;
  victime_id: number;
  annee?: string;
  description?: string;
  fichier_media?: string; // ID directus_files
  ordre?: number;
  statut?: 'valide' | 'en_attente';
}

export interface FragmentRow {
  id: number;
  victime_id: number;
  auteur: string;
  date_fragment?: string;
  type_fragment: 'temoignage' | 'photographie' | 'video' | 'recit' | 'document' | 'lieu';
  description: string;
  fichier_media?: string; // ID directus_files
  statut: 'valide' | 'en_attente';
  date_creation?: string;
}

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
  metadata?: any;
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
  auth_data?: any;
  email_notifications?: boolean;
}