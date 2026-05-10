import { useEffect, useState, useCallback } from "react";
import { directus } from "@/integration/directus";
import {
  createItem,
  readItems,
  updateItem,
  uploadFiles,
} from "@directus/sdk";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import type {
  ArchivesChronologieLigneRow,
  ArchivesChronologieSectionRow,
  ArchivesRubriqueCategorie,
  ArchivesRubriqueItemRow,
  ArchivesTypeContenu,
  MmrlArchivesRubriqueItemInsert,
} from "@/integration/directus-types";

const CATEGORIES: ArchivesRubriqueCategorie[] = [
  "temoignages",
  "lieux",
  "documents",
  "transmission",
  "bibliographie",
];

const LIST_FIELDS = ["*", "image_couverture.id", "image_couverture.filename_download"] as const;

type RubriqueDraft = Omit<
  MmrlArchivesRubriqueItemInsert,
  never
> & { id?: number };

const emptyRubriqueDraft = (cat: ArchivesRubriqueCategorie): RubriqueDraft => ({
  categorie: cat,
  sort: 0,
  status: "published",
  titre: "",
  description: "",
  type_contenu: cat === "temoignages" ? "text" : null,
  annee: null,
  source_attribution: "",
  auteur_reference: "",
  lien_url: "",
  image_couverture: null,
});

export function ArchivesSiteContentPanel() {
  const [busy, setBusy] = useState(false);
  const [rubriqueItems, setRubriqueItems] = useState<ArchivesRubriqueItemRow[]>([]);
  const [chronoSecs, setChronoSecs] = useState<ArchivesChronologieSectionRow[]>([]);
  const [chronoLignes, setChronoLignes] = useState<ArchivesChronologieLigneRow[]>([]);

  const [rubFilter, setRubFilter] = useState<ArchivesRubriqueCategorie>("temoignages");
  const [rubDlgOpen, setRubDlgOpen] = useState(false);
  const [rubDraft, setRubDraft] = useState<RubriqueDraft>(emptyRubriqueDraft("temoignages"));
  const [rubSaving, setRubSaving] = useState(false);

  const [secDlgOpen, setSecDlgOpen] = useState(false);
  const [secDraft, setSecDraft] = useState({
    titre: "",
    sort: 0,
    status: "published",
    id: undefined as number | undefined,
  });
  const [secSaving, setSecSaving] = useState(false);

  const [lgDlgOpen, setLgDlgOpen] = useState(false);
  const [lgDraft, setLgDraft] = useState({
    id: undefined as number | undefined,
    section_id: 0,
    annee_libelle: "",
    description: "",
    sort: 0,
    status: "published",
  });
  const [lgSaving, setLgSaving] = useState(false);

  const reload = useCallback(async () => {
    setBusy(true);
    try {
      const [rub, secs, lignes] = await Promise.all([
        directus.request(
          readItems("mmrl_archives_rubrique_item", {
            filter: { status: { _neq: "archived" } },
            fields: [...LIST_FIELDS],
            sort: ["categorie", "sort", "id"],
            limit: -1,
          })
        ),
        directus.request(
          readItems("mmrl_archives_chronologie_section", {
            filter: { status: { _neq: "archived" } },
            fields: ["*"],
            sort: ["sort", "id"],
            limit: -1,
          })
        ),
        directus.request(
          readItems("mmrl_archives_chronologie_ligne", {
            filter: { status: { _neq: "archived" } },
            fields: ["*"],
            sort: ["section_id", "sort", "id"],
            limit: -1,
          })
        ),
      ]);
      setRubriqueItems(rub as unknown as ArchivesRubriqueItemRow[]);
      setChronoSecs(secs as unknown as ArchivesChronologieSectionRow[]);
      setChronoLignes(lignes as unknown as ArchivesChronologieLigneRow[]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Chargement contenu archives impossible");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filteredRubrique = rubriqueItems
    .filter((r) => r.categorie === rubFilter)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.id - b.id);

  const softDeleteRubrique = async (id: number) => {
    if (!confirm("Retirer cette entrée du site (corbeille) ?")) return;
    try {
      await directus.request(
        updateItem("mmrl_archives_rubrique_item", id, { status: "archived" })
      );
      toast.success("Entrée archivée");
      await reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur suppression");
    }
  };

  const openNewRubrique = () => {
    setRubDraft(emptyRubriqueDraft(rubFilter));
    setRubDlgOpen(true);
  };

  const openEditRubrique = (row: ArchivesRubriqueItemRow) => {
    setRubDraft({
      id: row.id,
      categorie: row.categorie,
      sort: row.sort ?? 0,
      status: row.status,
      titre: row.titre,
      description: row.description ?? "",
      type_contenu:
        rubFilter === "temoignages"
          ? (row.type_contenu ?? "text")
          : null,
      annee: row.annee ?? null,
      source_attribution: row.source_attribution ?? "",
      auteur_reference: row.auteur_reference ?? "",
      lien_url: row.lien_url ?? "",
      image_couverture:
        typeof row.image_couverture === "string"
          ? row.image_couverture
          : (row.image_couverture as { id?: string } | undefined)?.id ?? null,
    });
    setRubDlgOpen(true);
  };

  const saveRubrique = async () => {
    if (!rubDraft.titre.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    setRubSaving(true);
    try {
      const payload: Record<string, unknown> = {
        categorie: rubDraft.categorie,
        sort: Number(rubDraft.sort) || 0,
        status: rubDraft.status,
        titre: rubDraft.titre.trim(),
        description: rubDraft.description?.trim() || null,
        annee:
          rubDraft.annee !== null &&
          rubDraft.annee !== undefined &&
          String(rubDraft.annee).trim() !== ""
            ? Number(rubDraft.annee)
            : null,
        source_attribution: rubDraft.source_attribution?.trim() || null,
        auteur_reference: rubDraft.auteur_reference?.trim() || null,
        lien_url: rubDraft.lien_url?.trim() || null,
        type_contenu:
          rubDraft.categorie === "temoignages" ? rubDraft.type_contenu || "text" : null,
      };
      const img =
        typeof rubDraft.image_couverture === "string" && rubDraft.image_couverture.length > 0
          ? rubDraft.image_couverture
          : null;
      payload.image_couverture = img;

      if (rubDraft.id) {
        await directus.request(updateItem("mmrl_archives_rubrique_item", rubDraft.id, payload));
        toast.success("Entrée mise à jour");
      } else {
        await directus.request(createItem("mmrl_archives_rubrique_item", payload));
        toast.success("Entrée créée");
      }
      setRubDlgOpen(false);
      await reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur enregistrement");
    } finally {
      setRubSaving(false);
    }
  };

  const handleRubriqueCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await directus.request(uploadFiles(fd));
      const id = (res as { id: string }).id;
      setRubDraft((prev) => ({ ...prev, image_couverture: id }));
      toast.success("Image téléchargée");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Échec upload");
    }
  };

  const clearRubriqueCover = async () => {
    const editId = rubDraft.id;
    setRubDraft((p) => ({ ...p, image_couverture: null }));
    if (editId) {
      try {
        await directus.request(
          updateItem("mmrl_archives_rubrique_item", editId, { image_couverture: null })
        );
        toast.success("Image retirée de l’entrée");
        await reload();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Erreur mise à jour");
      }
    }
  };

  const softDeleteSection = async (id: number) => {
    if (!confirm("Archiver cette section et toutes ses lignes (cascade DB) ?")) return;
    try {
      await directus.request(
        updateItem("mmrl_archives_chronologie_section", id, {
          status: "archived",
        })
      );
      toast.success("Section archivée");
      await reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const softDeleteLigne = async (id: number) => {
    if (!confirm("Archiver cette ligne ?")) return;
    try {
      await directus.request(
        updateItem("mmrl_archives_chronologie_ligne", id, {
          status: "archived",
        })
      );
      toast.success("Ligne archivée");
      await reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const saveSection = async () => {
    if (!secDraft.titre.trim()) {
      toast.error("Titre requis");
      return;
    }
    setSecSaving(true);
    try {
      const payload = {
        titre: secDraft.titre.trim(),
        sort: Number(secDraft.sort) || 0,
        status: secDraft.status,
      };
      if (secDraft.id) {
        await directus.request(updateItem("mmrl_archives_chronologie_section", secDraft.id, payload));
      } else {
        await directus.request(createItem("mmrl_archives_chronologie_section", payload));
      }
      setSecDlgOpen(false);
      await reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur section");
    } finally {
      setSecSaving(false);
    }
  };

  const saveLigne = async () => {
    if (!lgDraft.annee_libelle.trim() || !lgDraft.description.trim()) {
      toast.error("Année/libellé et description requis.");
      return;
    }
    if (!lgDraft.section_id) {
      toast.error("Choisir une section.");
      return;
    }
    setLgSaving(true);
    try {
      const payload = {
        section_id: lgDraft.section_id,
        annee_libelle: lgDraft.annee_libelle.trim(),
        description: lgDraft.description.trim(),
        sort: Number(lgDraft.sort) || 0,
        status: lgDraft.status,
      };
      if (lgDraft.id) {
        await directus.request(updateItem("mmrl_archives_chronologie_ligne", lgDraft.id, payload));
      } else {
        await directus.request(createItem("mmrl_archives_chronologie_ligne", payload));
      }
      setLgDlgOpen(false);
      await reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur ligne");
    } finally {
      setLgSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Contenu du site Archives</h3>
          <p className="text-sm text-muted-foreground max-w-xl">
            Gérez les blocs publiques sur les pages « Archives » (/archives…). Complétez d’abord les tables dans
            Directus (migration <code className="text-xs bg-muted px-1 rounded">db/migration_mmrl_archives_site_content.sql</code>).
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => reload()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Rafraîchir
        </Button>
      </div>

      <Tabs defaultValue="rubrique" className="w-full">
        <TabsList>
          <TabsTrigger value="rubrique">Rubrique (cartes)</TabsTrigger>
          <TabsTrigger value="chrono">Chronologie</TabsTrigger>
        </TabsList>
        <TabsContent value="rubrique" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row flex-wrap gap-4 items-end justify-between">
              <div>
                <CardTitle className="text-base">Rubriques</CardTitle>
                <CardDescription>Filtrer par catégorie affichée sur le front.</CardDescription>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <Select value={rubFilter} onValueChange={(v) => setRubFilter(v as ArchivesRubriqueCategorie)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" onClick={openNewRubrique}>
                  <Plus className="mr-1 h-4 w-4" /> Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRubrique.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Aucune entrée pour cette catégorie.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRubrique.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.sort ?? "—"}</TableCell>
                        <TableCell className="font-medium max-w-[280px] truncate" title={r.titre}>
                          {r.titre}
                        </TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => openEditRubrique(r)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => softDeleteRubrique(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={rubDlgOpen} onOpenChange={setRubDlgOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{rubDraft.id ? "Modifier" : "Ajouter"} une entrée</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Catégorie</Label>
                    <Select
                      value={rubDraft.categorie}
                      onValueChange={(v) =>
                        setRubDraft((p) => ({
                          ...p,
                          categorie: v as ArchivesRubriqueCategorie,
                          type_contenu: v === "temoignages" ? p.type_contenu || "text" : null,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Ordre</Label>
                    <Input
                      type="number"
                      value={rubDraft.sort ?? ""}
                      onChange={(e) =>
                        setRubDraft((p) => ({ ...p, sort: e.target.value === "" ? null : Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rubDraft.status === "published"}
                    onCheckedChange={(v) =>
                      setRubDraft((p) => ({ ...p, status: v ? "published" : "draft" }))
                    }
                  />
                  <Label>Publié (visible sur le site)</Label>
                </div>
                <div className="space-y-1">
                  <Label>Titre *</Label>
                  <Input value={rubDraft.titre} onChange={(e) => setRubDraft((p) => ({ ...p, titre: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={rubDraft.description ?? ""}
                    onChange={(e) => setRubDraft((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                {rubDraft.categorie === "temoignages" && (
                  <div className="space-y-1">
                    <Label>Type contenu</Label>
                    <Select
                      value={rubDraft.type_contenu || "text"}
                      onValueChange={(v) =>
                        setRubDraft((p) => ({ ...p, type_contenu: v as ArchivesTypeContenu }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">text</SelectItem>
                        <SelectItem value="video">video</SelectItem>
                        <SelectItem value="podcast">podcast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(rubDraft.categorie === "temoignages" || rubDraft.categorie === "documents" || rubDraft.categorie === "bibliographie") && (
                  <div className="space-y-1">
                    <Label>Année (optionnel)</Label>
                    <Input
                      type="number"
                      value={rubDraft.annee ?? ""}
                      onChange={(e) =>
                        setRubDraft((p) => ({
                          ...p,
                          annee: e.target.value === "" ? null : Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                )}
                {rubDraft.categorie === "documents" && (
                  <div className="space-y-1">
                    <Label>Source / attribution</Label>
                    <Input
                      value={rubDraft.source_attribution ?? ""}
                      onChange={(e) => setRubDraft((p) => ({ ...p, source_attribution: e.target.value }))}
                    />
                  </div>
                )}
                {rubDraft.categorie === "bibliographie" && (
                  <div className="space-y-1">
                    <Label>Auteur / référence</Label>
                    <Input
                      value={rubDraft.auteur_reference ?? ""}
                      onChange={(e) => setRubDraft((p) => ({ ...p, auteur_reference: e.target.value }))}
                    />
                  </div>
                )}
                {(rubDraft.categorie === "temoignages" ||
                  rubDraft.categorie === "lieux" ||
                  rubDraft.categorie === "documents" ||
                  rubDraft.categorie === "bibliographie") && (
                  <div className="space-y-1">
                    <Label>Lien URL (optionnel)</Label>
                    <Input
                      value={rubDraft.lien_url ?? ""}
                      onChange={(e) => setRubDraft((p) => ({ ...p, lien_url: e.target.value }))}
                      placeholder="https://…"
                    />
                  </div>
                )}
                {(rubDraft.categorie === "lieux" || rubDraft.image_couverture) && (
                  <div className="space-y-1">
                    <Label>Image couverture (lieux)</Label>
                    <Input type="file" accept="image/*" onChange={handleRubriqueCoverUpload} />
                    <p className="text-[11px] text-muted-foreground">UUID fichier : {(rubDraft.image_couverture as string) || "—"}</p>
                    {rubDraft.image_couverture ? (
                      <Button type="button" variant="outline" size="sm" onClick={clearRubriqueCover}>
                        Retirer l’image
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setRubDlgOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={saveRubrique} disabled={rubSaving}>
                  {rubSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="chrono" className="mt-6 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Sections</CardTitle>
                <CardDescription>Regroupe les jalons chronologiques.</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setSecDraft({ titre: "", sort: chronoSecs.length, status: "published", id: undefined });
                  setSecDlgOpen(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Section
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!chronoSecs.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                        Aucune section. Le front affiche la chronologie locale par défaut.
                      </TableCell>
                    </TableRow>
                  ) : (
                    chronoSecs
                      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
                      .map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{s.sort ?? "—"}</TableCell>
                          <TableCell className="font-medium">{s.titre}</TableCell>
                          <TableCell>{s.status}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSecDraft({
                                  id: s.id,
                                  titre: s.titre,
                                  sort: s.sort ?? 0,
                                  status: s.status,
                                });
                                setSecDlgOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => softDeleteSection(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Lignes chronologiques</CardTitle>
                <CardDescription>Évènements sous chaque section.</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={!chronoSecs.length}
                onClick={() => {
                  setLgDraft({
                    id: undefined,
                    section_id: chronoSecs[0]?.id ?? 0,
                    annee_libelle: "",
                    description: "",
                    sort: 0,
                    status: "published",
                  });
                  setLgDlgOpen(true);
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Ligne
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead>Ordre</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!chronoLignes.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        Aucune ligne.
                      </TableCell>
                    </TableRow>
                  ) : (
                    chronoLignes
                      .sort(
                        (a, b) =>
                          a.section_id - b.section_id || (a.sort ?? 0) - (b.sort ?? 0)
                      )
                      .map((l) => {
                        const st = chronoSecs.find((s) => s.id === l.section_id);
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="max-w-[120px] truncate" title={st?.titre}>
                              {st?.titre ?? l.section_id}
                            </TableCell>
                            <TableCell>{l.sort ?? "—"}</TableCell>
                            <TableCell className="whitespace-nowrap">{l.annee_libelle}</TableCell>
                            <TableCell className="max-w-xs truncate">{l.description}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setLgDraft({
                                    id: l.id,
                                    section_id: l.section_id,
                                    annee_libelle: l.annee_libelle,
                                    description: l.description,
                                    sort: l.sort ?? 0,
                                    status: l.status,
                                  });
                                  setLgDlgOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => softDeleteLigne(l.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Dialog open={secDlgOpen} onOpenChange={setSecDlgOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{secDraft.id ? "Section" : "Nouvelle section"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Titre *</Label>
                  <Input value={secDraft.titre} onChange={(e) => setSecDraft((p) => ({ ...p, titre: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Ordre</Label>
                  <Input
                    type="number"
                    value={secDraft.sort ?? ""}
                    onChange={(e) =>
                      setSecDraft((p) => ({
                        ...p,
                        sort: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={secDraft.status === "published"}
                    onCheckedChange={(v) =>
                      setSecDraft((p) => ({ ...p, status: v ? "published" : "draft" }))
                    }
                  />
                  <Label>Publié</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSecDlgOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={saveSection} disabled={secSaving}>
                  {secSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={lgDlgOpen} onOpenChange={setLgDlgOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{lgDraft.id ? "Ligne" : "Nouvelle ligne"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Section *</Label>
                  <Select
                    value={String(lgDraft.section_id || "")}
                    onValueChange={(v) => setLgDraft((p) => ({ ...p, section_id: Number(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir…" />
                    </SelectTrigger>
                    <SelectContent>
                      {chronoSecs.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.titre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Année / libellé *</Label>
                  <Input
                    value={lgDraft.annee_libelle}
                    onChange={(e) => setLgDraft((p) => ({ ...p, annee_libelle: e.target.value }))}
                    placeholder="ex. 1975"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description *</Label>
                  <Textarea
                    rows={4}
                    value={lgDraft.description}
                    onChange={(e) => setLgDraft((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Ordre</Label>
                  <Input
                    type="number"
                    value={lgDraft.sort ?? ""}
                    onChange={(e) =>
                      setLgDraft((p) => ({
                        ...p,
                        sort: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={lgDraft.status === "published"}
                    onCheckedChange={(v) =>
                      setLgDraft((p) => ({ ...p, status: v ? "published" : "draft" }))
                    }
                  />
                  <Label>Publié</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setLgDlgOpen(false)}>
                  Annuler
                </Button>
                <Button type="button" onClick={saveLigne} disabled={lgSaving}>
                  {lgSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
