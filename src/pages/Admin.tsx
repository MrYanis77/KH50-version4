import { useState } from "react";
import { directus } from "@/integration/directus";
import { updateItem } from "@directus/sdk";
import { useAdminData } from "@/hooks/useDirectus";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shield, Trash2, Loader2, RefreshCcw,
  AlertTriangle, UserCircle, ShieldCheck, Users, BookOpen, Archive,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { STATUT_ID } from "@/integration/directus-types";
import { notifyContributorOnStatutChange } from "@/services/notificationService";
import { CsvImporter } from "@/components/admin/CsvImporter";
import { MultiInsertDialog } from "@/components/admin/MultiInsertDialog";
import { DossiersPanel } from "@/components/admin/DossiersPanel";
import { LookupsPanel } from "@/components/admin/LookupsPanel";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { ArchivePanel } from "@/components/admin/ArchivePanel";
import { ArchivesSiteContentPanel } from "@/components/admin/ArchivesSiteContentPanel";

const Admin = () => {
  const {
    victimes, users, sources, parcours, fragments, recueil, qualiteStatuts, typeFragments,
    loading, error, collectionErrors, refreshAction,
    setVictimes, setUsers, setSources, setParcours, setFragments, setRecueil,
  } = useAdminData();

  const [activeTab, setActiveTab] = useState("dossiers");

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (error) return <div className="p-8 text-destructive text-center">Erreur: {error}</div>;

  // ── Helpers ──
  const getId = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'object' && val.id !== undefined) return Number(val.id);
    return Number(val);
  };

  const getTemoinName = (id: any) => {
    return `User #${id}`;
  };

  const getTypeName = (type_id: any) => {
    const tid = getId(type_id);
    const t = typeFragments.find(t => t.id === tid);
    return t ? t.libelle : `Type #${tid}`;
  };

  const getStatutBadge = (statut_id: any) => {
    const sid = getId(statut_id);
    const qs = qualiteStatuts.find(q => q.id === sid);
    const color = qs?.couleur_hex || '#aaa';
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium border"
        style={{ borderColor: color, color, backgroundColor: color + '22' }}
      >
        {qs?.libelle || `Statut #${statut_id}`}
      </span>
    );
  };

  // ── Inline status change ──
  const handleQuickStatus = async (
    collection: 'mmrl_victimes' | 'directus_users' | 'mmrl_parcours' | 'mmrl_fragments' | 'mmrl_recueil',
    id: number | string,
    newStatutId: number
  ) => {
    console.log(`Updating ${collection}#${id} status to ${newStatutId}`);
    try {
      // 1. Mise à jour de l'élément cible
      await directus.request(updateItem(collection as any, id, { statut_id: newStatutId }));
      
      // 2. Propagation
      if (collection === 'mmrl_victimes') {
        const v = victimes.find(x => x.id === id);
        const userId = v ? v.auteur_user_id : null;
        if (userId) {
          // directus_users n'a pas de statut_id mais un champ 'status' ? Non, directus_users standard a 'status' ou on le gère autrement. 
          // Par prudence, on ne propage pas le statut_id vers directus_users car ce n'est pas la même logique.
        }
        setVictimes(prev => prev.map(v => v.id === id ? { ...v, statut_id: newStatutId } : v));
      } 
      else if (collection === 'directus_users') {
        const linkedVictimes = victimes.filter(v => v.auteur_user_id === String(id));
        for (const v of linkedVictimes) {
          await directus.request(updateItem('mmrl_victimes', v.id, { statut_id: newStatutId }));
        }
        setVictimes(prev => prev.map(v => v.auteur_user_id === String(id) ? { ...v, statut_id: newStatutId } : v));
      }
      else if (collection === 'mmrl_parcours') {
        setParcours(prev => prev.map(p => p.id === id ? { ...p, statut_id: newStatutId } : p));
      }
      else if (collection === 'mmrl_fragments') {
        setFragments(prev => prev.map(f => f.id === id ? { ...f, statut_id: newStatutId } : f));
      }
      else if (collection === 'mmrl_recueil') {
        setRecueil(prev => prev.map(r => r.id === id ? { ...r, statut_id: newStatutId } : r));
      }
      
      // Notification au contributeur (validation / rejet)
      if (newStatutId === STATUT_ID.VERIFIE || newStatutId === STATUT_ID.NON_FIABLE) {
        await notifyContributorOnStatutChange(collection, Number(id), newStatutId, {
          victimes,
          fragments,
          parcours,
          recueil,
        });
      }

      toast.success("Statut mis à jour et propagé avec succès");
    } catch (err: any) { 
      console.error("Update failed:", err);
      toast.error(`Erreur mise à jour : ${err.message || "Problème de permissions"}`); 
    }
  };

  const handleDelete = async (collection: string, id: number, setter: (fn: (prev: any[]) => any[]) => void) => {
    if (!confirm("Archiver cet élément ?")) return;
    try {
      await directus.request(updateItem(collection as any, id, { deleted_at: new Date().toISOString() }));
      setter(prev => prev.filter(item => item.id !== id));
      toast.success("Archivé avec succès");
    } catch (err: any) { 
      console.error("Archive failed:", err);
      toast.error(`Erreur archivage : ${err.message}`); 
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display text-foreground">Explorateur de Données</h1>
          </div>
          <div className="flex gap-2">
            <MultiInsertDialog onComplete={refreshAction} sources={sources} victimes={victimes} typeFragments={typeFragments} />
            <CsvImporter onImportComplete={refreshAction} />
            <Button variant="outline" size="sm" onClick={refreshAction} disabled={loading} className="gap-2">
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Gestion données</p>
              <nav className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("dossiers")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "dossiers" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Users size={18} /> <span>Contributeurs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("recueil")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "recueil" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <BookOpen size={18} /> <span>Recueil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("archives")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "archives" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Archive size={18} /> <span>Archives</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("corbeille")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "corbeille" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Trash2 size={18} /> <span>Corbeille</span>
                </button>
              </nav>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Gestion utilisateurs</p>
              <nav className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("user-admins")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "user-admins" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Shield size={18} /> <span>Administrateurs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("user-members")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "user-members" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <UserCircle size={18} /> <span>Utilisateurs</span>
                </button>
              </nav>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Administration</p>
              <nav className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("administration")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "administration" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <ShieldCheck size={18} /> <span>Paramètres</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <Tabs value={activeTab} className="w-full mt-0">
              {/* TabsContent are hidden if value doesn't match activeTab */}
              
              {/* ─── DOSSIERS ─── */}
              <TabsContent value="dossiers" className="mt-0">
                  <DossiersPanel
                    victimes={victimes}
                    users={users}
                    sources={sources}
                    parcours={parcours}
                    fragments={fragments}
                    setVictimes={setVictimes}
                    setUsers={setUsers}
                    setSources={setSources}
                    setParcours={setParcours}
                    setFragments={setFragments}
                    recueil={recueil}
                    onRefresh={refreshAction}
                    qualiteStatuts={qualiteStatuts}
                    typeFragments={typeFragments}
                  />
              </TabsContent>

              {/* ─── RECUEIL ─── */}
              <TabsContent value="recueil" className="mt-0">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Recueil de mémoires ({recueil.length})</h2>
                  <p className="text-sm text-muted-foreground max-w-md text-right">
                    Les contributions <span className="font-medium">publiques</span> arrivent en « à vérifier » ; validez pour les afficher sur le site.
                  </p>
                </div>
                {collectionErrors.recueil && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erreur de chargement</AlertTitle>
                    <AlertDescription>{collectionErrors.recueil}</AlertDescription>
                  </Alert>
                )}
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre / Extrait</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Visibilité</TableHead>
                        <TableHead>Auteur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recueil.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="max-w-[220px]">
                            <div className="font-semibold truncate">{r.titre || "Sans titre"}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {(r.contenu || "").slice(0, 80)}
                              {(r.contenu || "").length > 80 ? "…" : ""}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs capitalize">{getTypeName(r.type_id)}</TableCell>
                          <TableCell className="text-xs">{r.is_public ? "Public" : "Privé"}</TableCell>
                          <TableCell className="text-xs">{getTemoinName(r.auteur_user_id)}</TableCell>
                          <TableCell>{getStatutBadge(r.statut_id)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Select
                                value={String(getId(r.statut_id))}
                                onValueChange={(s) => handleQuickStatus("mmrl_recueil", r.id, Number(s))}
                              >
                                <SelectTrigger className="h-7 text-xs w-36">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {qualiteStatuts.map((q) => (
                                    <SelectItem key={q.id} value={String(q.id)}>
                                      {q.libelle}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDelete("mmrl_recueil", r.id, setRecueil)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {recueil.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                            Aucune entrée recueil.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* ─── ARCHIVES (PAGE /ARCHIVES) ─── */}
              <TabsContent value="archives" className="mt-0 space-y-6">
                <div className="mb-2">
                  <h2 className="text-xl font-bold tracking-tight">Contenu de la page Archives</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rubriques, cartes et chronologie affichées sur{' '}
                    <span className="font-medium text-foreground">/archives</span> et ses sous-pages.
                  </p>
                </div>
                <ArchivesSiteContentPanel />
              </TabsContent>

              {/* ─── CORBEILLE ─── */}
              <TabsContent value="corbeille" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-tight">Corbeille</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Éléments supprimés (date de suppression renseignée) : restauration ou suppression définitive.
                  </p>
                </div>
                <div className="rounded-xl border border-orange-200/60 dark:border-orange-900/40 bg-orange-50/30 dark:bg-orange-950/20 p-4">
                  <ArchivePanel />
                </div>
              </TabsContent>

              {/* ─── CONFIGURATION ─── */}
              <TabsContent value="user-admins" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-tight">Gestion des administrateurs</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comptes avec le rôle administrateur (accès complet Directus / back-office).
                  </p>
                </div>
                <UsersPanel mode="administrators" />
              </TabsContent>

              <TabsContent value="user-members" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-xl font-bold tracking-tight">Gestion des utilisateurs</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contributeurs et autres comptes (hors rôle administrateur).
                  </p>
                </div>
                <UsersPanel mode="members" />
              </TabsContent>

              <TabsContent value="administration" className="mt-0 space-y-10">
                <div className="mb-2">
                  <h2 className="text-xl font-bold tracking-tight">Administration</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Référentiels (statuts, types de fragments).
                  </p>
                </div>
                <LookupsPanel 
                  qualiteStatuts={qualiteStatuts}
                  typeFragments={typeFragments}
                  onRefresh={refreshAction}
                />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;
