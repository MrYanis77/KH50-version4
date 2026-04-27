import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { directus, directusAuth } from "@/integration/directus";
import { updateMe, readItems, updateItem } from "@directus/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, MessageSquare, Settings, LogOut, Loader2, Clock, CheckCircle, AlertCircle, Lock } from "lucide-react";
import type { FragmentRow, QualiteStatutRow } from "@/integration/directus-types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Profile = () => {
  const { user, temoin, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fragments, setFragments] = useState<FragmentRow[]>([]);
  const [statuts, setStatuts] = useState<QualiteStatutRow[]>([]);
  const [fetchingFragments, setFetchingFragments] = useState(true);

  // Form states
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");

  // Password states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchUserContent = async () => {
      // Attendre que les données d'authentification soient prêtes
      if (!user || !temoin) {
        return;
      }
      
      try {
        setFetchingFragments(true);
        
        // 1. Récupérer les fragments (on utilise l'API admin pour contourner d'éventuels blocages de permissions)
        const fragmentsData = await directus.request(
          readItems("mmrl_fragments", {
            filter: {
              auteur_temoin_id: { _eq: Number(temoin.id) },
              deleted_at: { _null: true }
            },
            sort: ["-date_creation"],
            fields: ["*", "statut_id.*"]
          })
        );
        
        setFragments(fragmentsData as unknown as FragmentRow[]);

        // 2. Récupérer les statuts pour la correspondance des badges
        const statutsData = await directus.request(
          readItems("mmrl_qualite_statut", { limit: -1 })
        );
        setStatuts(statutsData as unknown as QualiteStatutRow[]);
      } catch (error) {
        console.error("[Profile] Error fetching content:", error);
        toast.error("Impossible de charger vos témoignages");
      } finally {
        setFetchingFragments(false);
      }
    };

    fetchUserContent();
  }, [temoin?.id, user?.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await directusAuth.request(
        updateMe({
          first_name: firstName,
          last_name: lastName,
        })
      );
      
      // Also update the temoin record to keep it in sync
      if (temoin) {
        await directus.request(
          // @ts-ignore
          updateItem("mmrl_temoins", temoin.id, {
            prenom: firstName,
            nom: lastName,
          })
        );
      }

      toast.success("Profil mis à jour avec succès");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Veuillez saisir un nouveau mot de passe");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      toast.error("Le mot de passe doit faire au moins 8 caractères");
      return;
    }

    setUpdatingPassword(true);
    try {
      await directusAuth.request(
        updateMe({
          password: password,
        })
      );
      toast.success("Mot de passe modifié avec succès");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Erreur lors de la modification du mot de passe");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const getStatusBadge = (statutId: any) => {
    // statutId might be an object if fields: ["statut_id.*"] was used
    const s = typeof statutId === 'object' ? statutId : statuts.find(st => st.id === statutId);
    
    if (!s) return null;

    const Icon = s.code === 'verifie' ? CheckCircle : s.code === 'a_verifier' ? Clock : AlertCircle;

    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
        style={{ 
          backgroundColor: `${s.couleur_hex}15`, 
          color: s.couleur_hex,
          borderColor: `${s.couleur_hex}30`
        }}
      >
        <Icon size={12} />
        {s.libelle}
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      
      
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mon Espace Personnel</h1>
            <p className="mt-2 text-muted-foreground">Gérez vos informations et suivez vos contributions.</p>
          </div>
          <Button variant="outline" onClick={() => signOut()} className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut size={16} />
            Se déconnecter
          </Button>
        </div>

        <Tabs defaultValue="testimonials" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="testimonials" className="gap-2">
              <MessageSquare size={16} />
              Mes Témoignages
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings size={16} />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informations Personnelles
                </CardTitle>
                <CardDescription>
                  Ces informations seront utilisées pour signer vos témoignages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input 
                        id="firstName" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        placeholder="Votre prénom"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input 
                        id="lastName" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      value={user.email} 
                      disabled 
                      className="bg-muted opacity-70"
                    />
                    <p className="text-[10px] text-muted-foreground italic">L'adresse email ne peut pas être modifiée directement.</p>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full md:w-auto">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer les modifications
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Sécurité
                </CardTitle>
                <CardDescription>
                  Modifiez votre mot de passe pour sécuriser votre compte.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Nouveau mot de passe</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password"
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={updatingPassword} className="w-full md:w-auto">
                    {updatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Modifier le mot de passe
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-4">
              {fetchingFragments ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Chargement de vos témoignages...</p>
                </div>
              ) : fragments.length > 0 ? (
                fragments.map((fragment) => (
                  <Card key={fragment.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                                {fragment.titre || "Témoignage sans titre"}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Publié le {format(new Date(fragment.date_creation), "PPP", { locale: fr })}
                              </p>
                            </div>
                            {getStatusBadge(fragment.statut_id)}
                          </div>
                          
                          <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                            {fragment.description}
                          </p>
                          
                          {fragment.fichier_media && (
                            <div className="pt-2">
                              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider">Média joint</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Aucun témoignage pour le moment</h3>
                    <p className="text-muted-foreground max-w-xs mt-2">
                      Vos contributions apparaîtront ici dès que vous aurez partagé un fragment de mémoire.
                    </p>
                    <Button variant="outline" className="mt-6" asChild>
                      <a href="/memorial">Parcourir le mémorial</a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
