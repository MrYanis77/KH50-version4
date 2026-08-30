import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "@/pages/Auth";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

// Silence framer-motion in jsdom — replace animated wrappers with plain divs
vi.mock("framer-motion", () => {
  const passThrough =
    ({ children, ...rest }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) => {
      // Strip framer-motion-only props so React doesn't warn on DOM elements
      const {
        initial: _i, animate: _a, variants: _v, exit: _e,
        whileInView: _wi, viewport: _vp, whileHover: _wh,
        ...domProps
      } = rest as any;
      return <div {...domProps}>{children}</div>;
    };

  return {
    motion: new Proxy({} as any, { get: () => passThrough }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("@/assets/hero-texture.jpg", () => ({ default: "" }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderAuth() {
  return render(
    <MemoryRouter>
      <Auth />
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Auth page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("default login mode", () => {
    it("shows the 'Connexion' title", () => {
      renderAuth();
      expect(screen.getByText("Connexion")).toBeInTheDocument();
    });

    it("renders the email and password fields", () => {
      renderAuth();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    });

    it("renders a submit button labelled 'Se connecter'", () => {
      renderAuth();
      expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
    });

    it("renders the 'Mot de passe oublié ?' link", () => {
      renderAuth();
      expect(screen.getByText("Mot de passe oublié ?")).toBeInTheDocument();
    });
  });

  describe("switching to signup mode", () => {
    it("shows the 'Créer un compte' title after clicking S'inscrire", () => {
      renderAuth();
      fireEvent.click(screen.getByText("S'inscrire"));
      expect(screen.getByText("Créer un compte")).toBeInTheDocument();
    });

    it("renders the display name and phone fields in signup mode", () => {
      renderAuth();
      fireEvent.click(screen.getByText("S'inscrire"));
      expect(screen.getByLabelText("Nom d'affichage")).toBeInTheDocument();
      expect(screen.getByLabelText(/Téléphone/)).toBeInTheDocument();
    });

    it("renders a submit button labelled 'Créer mon compte'", () => {
      renderAuth();
      fireEvent.click(screen.getByText("S'inscrire"));
      expect(screen.getByRole("button", { name: "Créer mon compte" })).toBeInTheDocument();
    });
  });

  describe("switching to forgot-password mode", () => {
    it("shows the 'Mot de passe oublié' title", () => {
      renderAuth();
      fireEvent.click(screen.getByText("Mot de passe oublié ?"));
      expect(screen.getByText("Mot de passe oublié")).toBeInTheDocument();
    });

    it("hides the password field in forgot mode", () => {
      renderAuth();
      fireEvent.click(screen.getByText("Mot de passe oublié ?"));
      expect(screen.queryByLabelText("Mot de passe")).toBeNull();
    });

    it("renders a submit button labelled 'Envoyer le lien'", () => {
      renderAuth();
      fireEvent.click(screen.getByText("Mot de passe oublié ?"));
      expect(screen.getByRole("button", { name: "Envoyer le lien" })).toBeInTheDocument();
    });

    it("can navigate back to login from forgot mode", () => {
      renderAuth();
      fireEvent.click(screen.getByText("Mot de passe oublié ?"));
      fireEvent.click(screen.getByText("Se connecter"));
      expect(screen.getByText("Connexion")).toBeInTheDocument();
    });
  });

  describe("password visibility toggle", () => {
    it("toggles the password input type", () => {
      renderAuth();
      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toHaveAttribute("type", "password");

      // The eye-toggle button is the only button rendered inside the password wrapper div
      const wrapper = passwordInput.closest("div.relative")!;
      const toggleButton = wrapper.querySelector("button")!;

      fireEvent.click(toggleButton);
      // Re-query after React re-render to avoid stale references
      expect(screen.getByPlaceholderText("••••••••")).toHaveAttribute("type", "text");

      fireEvent.click(toggleButton);
      expect(screen.getByPlaceholderText("••••••••")).toHaveAttribute("type", "password");
    });
  });
});
