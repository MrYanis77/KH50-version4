import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { directus, directusAuth } from "@/integration/directus";
import { readMe, createUser, createItem, readItems } from "@directus/sdk";
// IDs des rôles Directus (directus_roles) — exportés pour l'admin (filtres utilisateurs / admins)
export const ROLE_UTILISATEURS = "773081d2-4ca0-4d9c-a149-9b7bb49b7de3";
export const ROLE_ADMINISTRATOR = "af76e557-fb34-4a8b-9900-a6b60121662c";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName?: string, phone?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ role: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate l'état utilisateur depuis un token stocké au montage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // readMe() avec les champs explicites pour éviter les problèmes de permission
        const me = await directusAuth.request(
          readMe({
            fields: ["id", "email", "first_name", "last_name", "role"],
          })
        );

        const userData: AuthUser = {
          id: (me as any).id,
          email: (me as any).email,
          first_name: (me as any).first_name ?? undefined,
          last_name: (me as any).last_name ?? undefined,
          role: (me as any).role,
        };

        setUser(userData);
        setSession(me);
      } catch {
        // Token absent ou expiré — pas une erreur à afficher
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ── signUp ──────────────────────────────────────────────────────────────────
  const signUp = async (email: string, password: string, displayName?: string, phone?: string): Promise<void> => {
    const parts = (displayName ?? "").trim().split(/\s+/);
    const first_name = parts[0] ?? "";
    const last_name = parts.slice(1).join(" ");

    // Création du compte via le client admin (le client utilisateur ne peut pas
    // s'auto-créer avec un rôle spécifique selon la config Directus par défaut)
    const created = await directus.request(
      createUser({
        email,
        password,
        first_name: first_name || undefined,
        last_name: last_name || undefined,
        ...(phone ? { telephone: phone } : {}),
        // ⚠️ role doit être l'UUID de la string, pas l'objet
        role: ROLE_UTILISATEURS,
        status: "active",
      } as any)
    );

    if (!created) throw new Error("Échec de création du compte utilisateur.");

    // Connexion immédiate après inscription
    await signIn(email, password);
  };

  // ── signIn ──────────────────────────────────────────────────────────────────
  const signIn = async (email: string, password: string): Promise<{ role: string }> => {
    // login() stocke le token via authStorage automatiquement
    await directusAuth.login(email, password);

    const me = await directusAuth.request(
      readMe({
        fields: ["id", "email", "first_name", "last_name", "role"],
      })
    );

    const userData: AuthUser = {
      id: (me as any).id,
      email: (me as any).email,
      first_name: (me as any).first_name ?? undefined,
      last_name: (me as any).last_name ?? undefined,
      // role peut être un objet {id, ...} ou directement un string selon le SDK/version
      role: typeof (me as any).role === "object"
        ? (me as any).role?.id
        : (me as any).role,
    };

    setUser(userData);
    setSession(me);

    return { role: userData.role ?? "" };
  };

  // ── signOut ─────────────────────────────────────────────────────────────────
  const signOut = async (): Promise<void> => {
    try {
      await directusAuth.logout();
    } catch {
      // Ignorer les erreurs de logout (token déjà expiré, etc.)
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  // ── resetPassword ────────────────────────────────────────────────────────────
  const resetPassword = async (email: string): Promise<void> => {
    const url = import.meta.env.VITE_DIRECTUS_URL;
    if (!url) throw new Error("VITE_DIRECTUS_URL manquant.");

    const res = await fetch(`${url}/auth/password/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.errors?.[0]?.message ?? "Erreur lors de la demande de réinitialisation.");
    }
  };

  const isAdmin = user?.role === ROLE_ADMINISTRATOR;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
