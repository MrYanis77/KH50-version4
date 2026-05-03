import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { directus, directusAuth } from "@/integration/directus";
import { updateMe, readItems, updateItem } from "@directus/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, MessageSquare, Settings, LogOut, Loader2, Clock, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { FragmentRow, QualiteStatutRow, VictimeRow, RelationFamilialeRow } from "@/integration/directus-types";
import { TYPE_RELATION_LABELS } from "@/integration/directus-types";
import { Users, Link as LinkIcon, Pencil, Trash2 } from "lucide-react";
import AddVictimeDialog from "@/components/AddVictimeDialog";
import { deleteItem } from "@directus/sdk";

const Profile = () => {
  const { user, temoin, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fragments, setFragments] = useState<FragmentRow[]>([]);
  const [victimes, setVictimes] = useState<VictimeRow[]>([]);
  const [relations, setRelations] = useState<RelationFamilialeRow[]>([]);
  const [statuts, setStatuts] = useState<QualiteStatutRow[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
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

  const fetchUserContent = async () => {
    // Attendre que les données d'authentification soient prêtes
    if (!user || !temoin) {
      return;
    }
    
    try {
      setFetchingFragments(true);
      
      // 1. Récupérer les fragments
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

      // 2. Récupérer les victimes
      const victimesData = await directus.request(
        readItems("mmrl_victimes", {
          filter: {
            auteur_temoin_id: { _eq: Number(temoin.id) },
            deleted_at: { _null: true }
          },
          sort: ["-date_creation"],
          fields: ["*", "statut_id.*"]
        })
      );
      setVictimes(victimesData as unknown as VictimeRow[]);

      // 3. Récupérer les relations familiales
      const relationsData = await directus.request(
        readItems("mmrl_relations_familiales", {
          filter: {
            auteur_temoin_id: { _eq: Number(temoin.id) },
            deleted_at: { _null: true }
          },
          sort: ["-date_creation"],
          fields: ["*", "victime_id_a.prenom", "victime_id_a.nom", "victime_id_b.prenom", "victime_id_b.nom", "statut_id.*"]
        })
      );
      setRelations(relationsData as unknown as RelationFamilialeRow[]);

      // 4. Récupérer les statuts pour la correspondance des badges
      const statutsData = await directus.request(
        readItems("mmrl_qualite_statut", { limit: -1 })
      );
      setStatuts(statutsData as unknown as QualiteStatutRow[]);
      // 5. Récupérer les archives de l'utilisateur
      const [archVictimes, archFragments, archParcours, archRelations] = await Promise.all([
        directus.request(readItems("mmrl_victimes", { filter: { auteur_temoin_id: { _eq: Number(temoin.id) }, deleted_at: { _nnull: true } } })).catch(() => []),
        directus.request(readItems("mmrl_fragments", { filter: { auteur_temoin_id: { _eq: Number(temoin.id) }, deleted_at: { _nnull: true } } })).catch(() => []),
        directus.request(readItems("mmrl_parcours", { filter: { victime_id: { auteur_temoin_id: { _eq: Number(temoin.id) } }, deleted_at: { _nnull: true } } })).catch(() => []),
        directus.request(readItems("mmrl_relations_familiales", { filter: { auteur_temoin_id: { _eq: Number(temoin.id) }, deleted_at: { _nnull: true } } })).catch(() => [])
      ]);

      const allArchives = [
        ...archVictimes.map((v: any) => ({ ...v, _type: 'Victime', _collection: 'mmrl_victimes', _title: `${v.prenom} ${v.nom}` })),
        ...archFragments.map((f: any) => ({ ...f, _type: 'Fragment', _collection: 'mmrl_fragments', _title: f.titre || f.description?.substring(0,50) })),
        ...archParcours.map((p: any) => ({ ...p, _type: 'Parcours', _collection: 'mmrl_parcours', _title: p.titre || p.description?.substring(0,50) })),
        ...archRelations.map((r: any) => ({ ...r, _type: 'Lien Familial', _collection: 'mmrl_relations_familiales', _title: `Lien ID ${r.id}` }))
      ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

      setArchives(allArchives);

    } catch (error) {
      console.error("[Profile] Error fetching content:", error);
      toast.error("Impossible de charger vos données");
    } finally {
      setFetchingFragments(false);
    }
  };

  useEffect(() => {
    fetchUserContent();
  }, [temoin?.id, user?.id]);

  const handleDeleteRelation = async (id: number) => {
    if (!confirm("Voulez-vous vraiment archiver ce lien de parenté ?")) return;
    try {
      await directusAuth.request(updateItem("mmrl_relations_familiales", id, { deleted_at: new Date().toISOString() }));
      toast.success("Lien de parenté archivé.");
      fetchUserContent();
    } catch (error) {
      toast.error("Erreur lors de l'archivage.");
    }
  };

  const handleArchiveItem = async (collection: string, id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet élément ? Il sera placé dans vos archives.")) return;
    try {
      await directusAuth.request(updateItem(collection as any, id, { deleted_at: new Date().toISOString() }));
      toast.success("Élément placé dans vos archives.");
      fetchUserContent();
    } catch (error) {
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleRestoreItem = async (collection: string, id: number) => {
    if (!confirm("Voulez-vous restaurer cet élément ?")) return;
    try {
      await directusAuth.request(updateItem(collection as any, id, { deleted_at: null }));
      toast.success("Élément restauré.");
      fetchUserContent();
    } catch (error) {
      toast.error("Erreur lors de la restauration.");
    }
  };

  const handleDownloadArchive = (item: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `archive_${item._type}_${item.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

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
          <TabsList className="grid w-full grid-cols-5 max-w-[900px] mb-8">
            <TabsTrigger value="testimonials" className="gap-2">
              <MessageSquare size={16} />
              <span className="hidden sm:inline">Témoignages</span>
            </TabsTrigger>
            <TabsTrigger value="victimes" className="gap-2">
              <Users size={16} />
              <span className="hidden sm:inline">Personnes</span>
            </TabsTrigger>
            <TabsTrigger value="relations" className="gap-2">
              <LinkIcon size={16} />
              <span className="hidden sm:inline">Liens</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings size={16} />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
            <TabsTrigger value="archives" className="gap-2 text-orange-600 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <Trash2 size={16} />
              <span className="hidden sm:inline">Archives</span>
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
                            <div className="flex items-center gap-3">
                              {getStatusBadge(fragment.statut_id)}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10" 
                                onClick={() => handleArchiveItem("mmrl_fragments", fragment.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
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

          <TabsContent value="victimes" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-end mb-4">
              <AddVictimeDialog onSuccess={fetchUserContent} statuses={statuts} />
            </div>
            <div className="grid gap-4">
              {fetchingFragments ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Chargement de vos personnes...</p>
                </div>
              ) : victimes.length > 0 ? (
                victimes.map((victime) => (
                  <Card key={victime.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                                {victime.prenom} {victime.nom}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                Ajouté le {victime.date_creation ? format(new Date(victime.date_creation), "PPP", { locale: fr }) : "Date inconnue"}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(victime.statut_id)}
                              <AddVictimeDialog 
                                editVictime={victime} 
                                onSuccess={fetchUserContent} 
                                statuses={statuts}
                                triggerVariant="ghost"
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10" 
                                onClick={() => handleArchiveItem("mmrl_victimes", victime.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                            {victime.annee_naissance ? `Né(e) en ${victime.annee_naissance}` : "Année de naissance inconnue"} 
                            {victime.lieu_naissance ? ` à ${victime.lieu_naissance}` : ""}
                            {" - "}
                            {victime.annee_deces ? `Décédé(e) en ${victime.annee_deces}` : "Année de décès inconnue"}
                            {victime.lieu_deces ? ` à ${victime.lieu_deces}` : ""}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Aucune personne pour le moment</h3>
                    <p className="text-muted-foreground max-w-xs mt-2">
                      Les personnes que vous ajoutez au mémorial apparaîtront ici.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="relations" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-4">
              {fetchingFragments ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Chargement de vos liens de parenté...</p>
                </div>
              ) : relations.length > 0 ? (
                relations.map((relation) => {
                  const vA = relation.victime_id_a as any;
                  const vB = relation.victime_id_b as any;
                  return (
                    <Card key={relation.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                      <CardContent className="p-0">
                        <div className="flex flex-col md:flex-row">
                          <div className="flex-1 p-6 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                                  {vA?.prenom} {vA?.nom} 
                                  <span className="text-muted-foreground mx-2 font-normal text-sm">
                                    {TYPE_RELATION_LABELS[relation.type_relation] || relation.type_relation} de
                                  </span>
                                  {vB ? `${vB.prenom} ${vB.nom}` : relation.nom_relatif_externe}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Ajouté le {relation.date_creation ? format(new Date(relation.date_creation), "PPP", { locale: fr }) : "Date inconnue"}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                {getStatusBadge(relation.statut_id)}
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:bg-destructive/10" 
                                  onClick={() => handleDeleteRelation(relation.id)}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </div>
                            
                            {relation.description && (
                              <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                                {relation.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <LinkIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Aucun lien de parenté pour le moment</h3>
                    <p className="text-muted-foreground max-w-xs mt-2">
                      Les liens familiaux que vous ajoutez apparaîtront ici.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ─── ARCHIVES TAB CONTENT ─── */}
          <TabsContent value="archives" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-4">
              {fetchingFragments ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Chargement de vos archives...</p>
                </div>
              ) : archives.length > 0 ? (
                archives.map((archive) => (
                  <Card key={`${archive._collection}_${archive.id}`} className="overflow-hidden opacity-80 bg-muted/30">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-6 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{archive._type}</Badge>
                                <span className="text-xs text-muted-foreground">Archivé le {format(new Date(archive.deleted_at), "PPP", { locale: fr })}</span>
                              </div>
                              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                                {archive._title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleDownloadArchive(archive)}>Télécharger (JSON)</Button>
                              <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleRestoreItem(archive._collection, archive.id)}>Restaurer</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Trash2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Votre corbeille est vide</h3>
                    <p className="text-muted-foreground max-w-xs mt-2">
                      Les éléments que vous supprimez apparaîtront ici pour que vous puissiez les restaurer.
                    </p>
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
