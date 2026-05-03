import { useState, useEffect } from "react";
import { directus } from "@/integration/directus";
import { readItems, updateItem } from "@directus/sdk";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, RefreshCcw, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const ArchivePanel = () => {
  const [archives, setArchives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const [victimes, fragments, parcours, temoins] = await Promise.all([
        directus.request(readItems("mmrl_victimes", { filter: { deleted_at: { _nnull: true } }, fields: ["*.*"] })).catch(() => []),
        directus.request(readItems("mmrl_fragments", { filter: { deleted_at: { _nnull: true } }, fields: ["*.*"] })).catch(() => []),
        directus.request(readItems("mmrl_parcours", { filter: { deleted_at: { _nnull: true } }, fields: ["*.*"] })).catch(() => []),
        directus.request(readItems("mmrl_temoins", { filter: { deleted_at: { _nnull: true } }, fields: ["*.*"] })).catch(() => [])
      ]);

      const allArchives = [
        ...victimes.map((v: any) => ({ ...v, _type: 'Victime', _collection: 'mmrl_victimes', _title: `${v.prenom} ${v.nom}` })),
        ...fragments.map((f: any) => ({ ...f, _type: 'Fragment', _collection: 'mmrl_fragments', _title: f.titre || f.description?.substring(0,50) })),
        ...parcours.map((p: any) => ({ ...p, _type: 'Parcours', _collection: 'mmrl_parcours', _title: p.titre || p.description?.substring(0,50) })),
        ...temoins.map((t: any) => ({ ...t, _type: 'Témoin', _collection: 'mmrl_temoins', _title: `${t.prenom} ${t.nom}` }))
      ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

      setArchives(allArchives);
    } catch (e: any) {
      toast.error("Erreur lors du chargement des archives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, []);

  const handleRestore = async (collection: string, id: number) => {
    if (!confirm("Restaurer cet élément ?")) return;
    try {
      await directus.request(updateItem(collection as any, id, { deleted_at: null }));
      toast.success("Élément restauré");
      fetchArchives();
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  const handleDownload = (item: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `archive_${item._type}_${item.id}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Archive className="text-primary" /> Archives & Corbeille</h2>
          <p className="text-muted-foreground text-sm">Éléments supprimés. Vous pouvez les restaurer ou les télécharger.</p>
        </div>
        <Button variant="outline" onClick={fetchArchives}><RefreshCcw className="mr-2 h-4 w-4" /> Rafraîchir</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Contenu / Titre</TableHead>
                <TableHead>Date de suppression</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground animate-pulse">Chargement...</TableCell></TableRow>
              ) : archives.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">La corbeille est vide.</TableCell></TableRow>
              ) : archives.map(a => (
                <TableRow key={`${a._collection}_${a.id}`}>
                  <TableCell><Badge variant="outline">{a._type}</Badge></TableCell>
                  <TableCell className="font-medium max-w-xs truncate" title={a._title}>{a._title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(a.deleted_at).toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(a)} title="Télécharger les données brutes (JSON)">
                        <Download className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRestore(a._collection, a.id)} className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
                        Restaurer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
