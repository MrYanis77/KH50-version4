import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import heroTexture from "@/assets/hero-texture.jpg";
import { Link } from "react-router-dom";

type AuthMode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { role } = await signIn(email, password);
        toast.success("Connexion réussie !");
        // Admins → /admin, regular users → /memorial
        const isAdminRole = role === "af76e557-fb34-4a8b-9900-a6b60121662c";
        navigate(isAdminRole ? "/admin" : "/memorial");
      } else if (mode === "signup") {
        await signUp(email, password, displayName);
        toast.success("Compte créé ! Bienvenue sur Fragmentis.");
        navigate("/memorial");
      } else {
        await resetPassword(email);
        toast.success("Un email de réinitialisation a été envoyé.");
        setMode("login");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroTexture})` }}
      />
      <div className="absolute inset-0 bg-background/80" />

      {/* Diagonal motif */}
      <div className="absolute inset-0 fragmentis-diagonal pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="flex flex-col items-center justify-center text-center gap-3">
            <img
              src="https://www.fragmentis-vitae.org/images/fragment-rond.svg"
              alt="Fragments KH50 logo"
              width="80"
              height="80"
              className="h-14 w-14 object-contain"
            />

            <div className="flex flex-col items-center text-center">
              <span className="font-body text-[24px] font-bold text-foreground leading-none tracking-tight">
                Fragments #KH50
              </span>

              <span className="mt-2 text-sm text-muted-foreground">
                Mémorial numérique du génocide cambodgien
              </span>
            </div>
          </Link>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-card-foreground">
              {mode === "login" && "Connexion"}
              {mode === "signup" && "Créer un compte"}
              {mode === "forgot" && "Mot de passe oublié"}
            </CardTitle>
            <CardDescription>
              {mode === "login" && "Accédez à votre espace mémorial"}
              {mode === "signup" && "Rejoignez la communauté de mémoire"}
              {mode === "forgot" && "Entrez votre email pour réinitialiser"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-card-foreground">
                    Nom d'affichage
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Votre nom"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10"
                      maxLength={100}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    maxLength={255}
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-card-foreground">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10"
                    // minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-accent hover:text-foreground transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              )}

              <Button
                type="submit"
                className="w-full rounded-full"
                disabled={loading}
              >
                {loading
                  ? "Chargement..."
                  : mode === "login"
                    ? "Se connecter"
                    : mode === "signup"
                      ? "Créer mon compte"
                      : "Envoyer le lien"}
              </Button>
            </form>


            <div className="mt-6 text-center text-sm">
              {mode === "login" ? (
                <p className="text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-accent hover:text-foreground font-medium transition-colors"
                  >
                    S'inscrire
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Déjà un compte ?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-accent hover:text-foreground font-medium transition-colors"
                  >
                    Se connecter
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 Fragmentis Vitae Asia
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
