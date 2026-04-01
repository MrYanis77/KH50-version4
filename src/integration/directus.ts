import { createDirectus, rest, staticToken } from "@directus/sdk";
import type { DirectusSchema } from "./directus-types";

const DIRECTUS_URL = import.meta.env.VITE_DIRECTUS_URL as string;
const TOKEN = import.meta.env.VITE_DIRECTUS_TOKEN as string;

// ✅ Le typage générique doit être passé ICI sur createDirectus
export const directus = createDirectus<DirectusSchema>(DIRECTUS_URL)
  .with(staticToken(TOKEN))
  .with(rest());