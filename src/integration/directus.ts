import { createDirectus, rest, staticToken, authentication } from "@directus/sdk";
import type { DirectusSchema, RecueilRow } from "./directus-types";
import { TYPE_FRAGMENT_ID } from "./directus-types";

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string;
const ADMIN_TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN as string;

if (!DIRECTUS_URL) throw new Error("VITE_DIRECTUS_URL is not defined");
if (!ADMIN_TOKEN) throw new Error("VITE_DIRECTUS_TOKEN is not defined");

// Clé de stockage unique pour éviter les collisions
const AUTH_STORAGE_KEY = "mmrl_directus_auth";

// Le SDK Directus v17+ attend { get(): AuthData | null, set(v): void }
// Les méthodes doivent être synchrones.
const authStorage = {
  get() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  },
  set(value: Record<string, unknown> | null) {
    try {
      if (value == null) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
      }
    } catch (e) {
      console.error("[directus] Failed to persist auth data:", e);
    }
  },
};

// ── Client admin (token statique) ─────────────────────────────────────────────
// Utilisé pour : créer des utilisateurs, opérations backoffice, hooks admin
export const directus = createDirectus<DirectusSchema>(DIRECTUS_URL)
  .with(staticToken(ADMIN_TOKEN))
  .with(rest());

// ── Client utilisateur (session JWT) ─────────────────────────────────────────
// Utilisé pour : login, logout, readMe, opérations au nom de l'utilisateur
export const directusAuth = createDirectus<DirectusSchema>(DIRECTUS_URL)
  .with(
    authentication("json", {
      storage: authStorage,
      autoRefresh: true,
      msRefreshBeforeExpires: 60_000, // Rafraîchit 60 s avant expiration
    })
  )
  .with(rest());

// ── Helper pour les assets ────────────────────────────────────────────────────
const DIRECTUS_BASE = DIRECTUS_URL.replace(/\/+$/, "");

function resolveDirectusFileRef(fileRef: unknown): {
  id: string;
  filenameDownload?: string;
} {
  if (!fileRef) return { id: "" };
  if (typeof fileRef === "string") return { id: fileRef };
  if (typeof fileRef !== "object") return { id: "" };
  const o = fileRef as Record<string, unknown>;
  const rawId = o.id ?? o.file;
  const id = typeof rawId === "string" ? rawId : "";
  const fn = o.filename_download;
  const filenameDownload = typeof fn === "string" && fn.length > 0 ? fn : undefined;
  return { id, filenameDownload };
}

/**
 * URL d'origine Directus. Si le fichier est un objet (expand API), ajoute
 * `/<filename_download>` pour le bon Content-Type et une meilleure lecture par `<video>`.
 */
export const getAssetUrl = (fileRef: unknown, params: string = "") => {
  return buildAssetUrl(fileRef, params, ADMIN_TOKEN);
};

/**
 * URL d’asset avec le jeton utilisateur (session) si présent, sinon jeton admin.
 * À utiliser pour le recueil (y compris entrées privées / fichiers aux permissions restreintes).
 */
export const getAssetUrlWithViewerToken = (fileRef: unknown, params: string = "") => {
  const data = authStorage.get() as { access_token?: string } | null;
  const userTok = typeof data?.access_token === "string" && data.access_token.length > 0 ? data.access_token : null;
  return buildAssetUrl(fileRef, params, userTok || ADMIN_TOKEN);
};

function buildAssetUrl(fileRef: unknown, params: string, accessToken: string): string {
  const { id, filenameDownload } = resolveDirectusFileRef(fileRef);
  if (!id) return "";
  const nameSeg = filenameDownload
    ? `/${filenameDownload.split("/").map(encodeURIComponent).join("/")}`
    : "";
  const queryString = params ? `&${params}` : "";
  return `${DIRECTUS_BASE}/assets/${id}${nameSeg}?access_token=${encodeURIComponent(accessToken)}${queryString}`;
}

/** MIME enregistré dans Directus quand `fichier_media` est expand (ex. video/mp4). */
export function getDirectusFileMime(fileRef: unknown): string | undefined {
  if (!fileRef || typeof fileRef !== "object") return undefined;
  const t = (fileRef as Record<string, unknown>).type;
  return typeof t === "string" ? t : undefined;
}

/** MIME pour `<source type="…">` des vidéos (fallback `video/mp4`). */
export function directusVideoMimeHint(fileRef: unknown): string {
  const m = getDirectusFileMime(fileRef);
  return m?.startsWith("video/") ? m : "video/mp4";
}

function normRecueilTypeId(entry: RecueilRow): number {
  const t = entry.type_id;
  if (t == null) return 0;
  if (typeof t === "object" && t !== null && "id" in t) return Number((t as { id: number }).id);
  return Number(t);
}

/** Détecte une vidéo même si `type` n’est pas expansé (type_id + MIME fichier). */
export function recueilEntryIsVideo(entry: RecueilRow): boolean {
  const type = entry.type as { code?: string } | undefined;
  if (type?.code === "video") return true;
  if (normRecueilTypeId(entry) === TYPE_FRAGMENT_ID.VIDEO) return true;
  const m = getDirectusFileMime(entry.fichier_media);
  return Boolean(m?.startsWith("video/"));
}

export function recueilEntryIsAudio(entry: RecueilRow): boolean {
  const type = entry.type as { code?: string } | undefined;
  if (type?.code === "audio") return true;
  if (normRecueilTypeId(entry) === TYPE_FRAGMENT_ID.AUDIO) return true;
  const m = getDirectusFileMime(entry.fichier_media);
  return Boolean(m?.startsWith("audio/"));
}