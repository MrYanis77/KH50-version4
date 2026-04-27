import { createDirectus, rest, staticToken, authentication } from "@directus/sdk";
import type { DirectusSchema } from "./directus-types";

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