import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, X, Clock, MessageSquare, Image, FileText, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

interface Contribution {
  id: string;
  user_id: string;
  memorial_person_id: number;
  type: string;
  title: string;
  content: string | null;
  media_url: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  testimony: <MessageSquare className="h-4 w-4" />,
  photograph: <Image className="h-4 w-4" />,
  video: <FileText className="h-4 w-4" />,
  story: <MessageSquare className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  place: <FileText className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  testimony: "Témoignage",
  photograph: "Photographie",
  video: "Vidéo",
  story: "Récit",
  document: "Document",
  place: "Lieu",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  approved: { label: "Approuvé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingContribs, setLoadingContribs] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Check admin role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        navigate("/");
        toast.error("Accès réservé aux administrateurs");
      } else {
        setIsAdmin(true);
      }
      setCheckingRole(false);
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  // Fetch contributions
  useEffect(() => {
    if (!isAdmin) return;

    const fetchContributions = async () => {
      setLoadingContribs(true);
      let query = supabase
        .from("contributions")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) {
        toast.error("Erreur lors du chargement des contributions");
        console.error(error);
      } else {
        setContributions((data as unknown as Contribution[]) || []);
      }
      setLoadingContribs(false);
    };

    fetchContributions();
  }, [isAdmin, filter]);

  const handleModerate = async (id: string, status: "approved" | "rejected") => {
    setProcessingId(id);
    const { error } = await supabase
      .from("contributions")
      .update({
        status,
        reviewer_id: user!.id,
        reviewed_at: new Date().toISOString(),
        review_note: reviewNotes[id] || null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la modération");
      console.error(error);
    } else {
      toast.success(status === "approved" ? "Contribution approuvée" : "Contribution rejetée");
      setContributions((prev) => prev.map((c) => (c.id === id ? { ...c, status, review_note: reviewNotes[id] || null } : c)));
    }
    setProcessingId(null);
  };

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Vérification des droits…</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const counts = {
    all: contributions.length,
    pending: contributions.filter((c) => c.status === "pending").length,
    approved: contributions.filter((c) => c.status === "approved").length,
    rejected: contributions.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Shield className="h-6 w-6 text-accent" />
          <div>
            <h1 className="text-2xl text-foreground">Administration</h1>
            <p className="text-sm text-muted-foreground">Modération des contributions</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["pending", "all", "approved", "rejected"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="rounded-full"
            >
              {f === "pending" && <Clock className="h-3.5 w-3.5 mr-1" />}
              {f === "approved" && <Check className="h-3.5 w-3.5 mr-1" />}
              {f === "rejected" && <X className="h-3.5 w-3.5 mr-1" />}
              {f === "all" ? "Toutes" : statusConfig[f].label}
            </Button>
          ))}
        </div>

        {/* Contributions list */}
        {loadingContribs ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : contributions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucune contribution {filter !== "all" ? statusConfig[filter]?.label.toLowerCase() : ""} trouvée.
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {contributions.map((contrib) => (
                <motion.div
                  key={contrib.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Card className="overflow-hidden">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedId(expandedId === contrib.id ? null : contrib.id)}
                    >
                      <CardHeader className="py-4 px-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-accent">{typeIcons[contrib.type]}</span>
                            <div className="min-w-0">
                              <CardTitle className="text-base truncate">{contrib.title}</CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Par {(contrib.profiles as any)?.display_name || "Anonyme"} · Mémorial #{contrib.memorial_person_id} · {typeLabels[contrib.type]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={statusConfig[contrib.status]?.variant || "outline"}>
                              {statusConfig[contrib.status]?.label || contrib.status}
                            </Badge>
                            {expandedId === contrib.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                      </CardHeader>
                    </button>

                    <AnimatePresence>
                      {expandedId === contrib.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <CardContent className="pt-0 pb-5 px-5 space-y-4">
                            {/* Content */}
                            {contrib.content && (
                              <div className="bg-muted/50 rounded-lg p-4 text-sm text-card-foreground">
                                {contrib.content}
                              </div>
                            )}

                            {/* Media */}
                            {contrib.media_url && (
                              <div>
                                {contrib.type === "photograph" ? (
                                  <img
                                    src={contrib.media_url}
                                    alt={contrib.title}
                                    className="rounded-lg max-h-64 object-cover"
                                  />
                                ) : (
                                  <a
                                    href={contrib.media_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent underline text-sm"
                                  >
                                    Voir le fichier
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Date */}
                            <p className="text-xs text-muted-foreground">
                              Soumis le {new Date(contrib.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>

                            {/* Moderation actions */}
                            {contrib.status === "pending" && (
                              <div className="space-y-3 pt-2 border-t border-border">
                                <Textarea
                                  placeholder="Note de modération (optionnel)…"
                                  value={reviewNotes[contrib.id] || ""}
                                  onChange={(e) => setReviewNotes((prev) => ({ ...prev, [contrib.id]: e.target.value }))}
                                  className="text-sm"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleModerate(contrib.id, "approved")}
                                    disabled={processingId === contrib.id}
                                    className="rounded-full"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleModerate(contrib.id, "rejected")}
                                    disabled={processingId === contrib.id}
                                    className="rounded-full"
                                  >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    Rejeter
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Review note */}
                            {contrib.review_note && contrib.status !== "pending" && (
                              <div className="text-xs text-muted-foreground italic border-t border-border pt-2">
                                Note : {contrib.review_note}
                              </div>
                            )}
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Admin;
