import { useState } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { directus } from "@/integration/directus";
import { createItem, uploadFiles } from "@directus/sdk";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Loader2, AlertCircle, FileArchive, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CsvImporterProps {
  onImportComplete: () => void;
}

export const CsvImporter = ({ onImportComplete }: CsvImporterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, phase: "" });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const processImport = async (csvData: any[], mediaMap: Record<string, string> = {}) => {
    setProgress({ current: 0, total: csvData.length, phase: "Création des enregistrements..." });
    let successCount = 0;
    let errorCount = 0;
    
    // Store newly created IDs for auto-mapping relationships
    const createdIdsMap: Record<string, number[]> = {};

    for (let i = 0; i < csvData.length; i++) {
      const rowData = csvData[i];
      const targetCol = rowData.collection || rowData.table || rowData.table_name;

      if (!targetCol) {
        errorCount++;
        continue;
      }

      const cleanedData: Record<string, any> = {};
      for (const key in rowData) {
        if (key !== 'collection' && key !== 'table' && key !== 'table_name') {
          let value = rowData[key];
          
          // Auto-map relational IDs if they reference a relative index (1, 2, 3...)
          if (key === 'auteur_temoin_id' && createdIdsMap['mmrl_temoins']) {
             const index = parseInt(value) - 1;
             if (!isNaN(index) && createdIdsMap['mmrl_temoins'][index]) {
                 value = createdIdsMap['mmrl_temoins'][index];
             }
          }
          if (key === 'source_id' && createdIdsMap['mmrl_sources_temoignage']) {
             const index = parseInt(value) - 1;
             if (!isNaN(index) && createdIdsMap['mmrl_sources_temoignage'][index]) {
                 value = createdIdsMap['mmrl_sources_temoignage'][index];
             }
          }
          if (key === 'victime_id' && createdIdsMap['mmrl_victimes']) {
             const index = parseInt(value) - 1;
             if (!isNaN(index) && createdIdsMap['mmrl_victimes'][index]) {
                 value = createdIdsMap['mmrl_victimes'][index];
             }
          }
          // Convert statut string to statut_id integer
          if (key === 'statut') {
            const statutMap: Record<string, number> = { verifie: 1, a_verifier: 2, non_fiable: 3 };
            cleanedData['statut_id'] = statutMap[value] ?? 2;
            continue; // skip adding 'statut' key
          }

          // If the value matches a media filename we just uploaded, replace it with the ID
          if (typeof value === 'string' && mediaMap[value]) {
            value = mediaMap[value];
          } else if (value === "") {
            continue; // Skip empty strings
          }
          
          cleanedData[key] = value;
        }
      }

      try {
        const result = await directus.request(createItem(targetCol as any, cleanedData));
        
        // Track the ID of the newly created item
        if (!createdIdsMap[targetCol]) createdIdsMap[targetCol] = [];
        createdIdsMap[targetCol].push((result as any).id);
        
        successCount++;
      } catch (err) {
        console.error(`Erreur ligne ${i + 1} (${targetCol}):`, err);
        errorCount++;
      }
      setProgress(prev => ({ ...prev, current: i + 1 }));
    }

    return { successCount, errorCount };
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Veuillez sélectionner un fichier (CSV ou ZIP)");
      return;
    }

    setIsImporting(true);
    const isZip = file.name.endsWith(".zip");

    try {
      if (isZip) {
        setProgress({ current: 0, total: 0, phase: "Lecture de l'archive ZIP..." });
        const zip = await JSZip.loadAsync(file);
        
        // 1. Find the CSV file in the zip
        const csvFileName = Object.keys(zip.files).find(name => name.endsWith(".csv") && !name.startsWith("__MACOSX"));
        if (!csvFileName) throw new Error("Aucun fichier CSV valide trouvé dans l'archive ZIP");
        
        const csvContent = await zip.files[csvFileName].async("string");
        
        // Handle multi-block CSV (separated by blank lines)
        const blocks = csvContent.split(/\r?\n\s*\r?\n/);
        let rows: any[] = [];
        for (const block of blocks) {
          if (!block.trim()) continue;
          const parsed = Papa.parse(block.trim(), { header: true, skipEmptyLines: true });
          rows = rows.concat(parsed.data);
        }

        // 2. Upload media files
        const mediaMap: Record<string, string> = {};
        const mediaFiles = Object.keys(zip.files).filter(name => 
          !zip.files[name].dir && !name.endsWith(".csv") && !name.startsWith("__MACOSX")
        );

        if (mediaFiles.length > 0) {
          setProgress({ current: 0, total: mediaFiles.length, phase: "Upload des médias..." });
          
          // Basic MIME type mapping
          const mimeTypes: Record<string, string> = {
            'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
            'gif': 'image/gif', 'webp': 'image/webp', 'pdf': 'application/pdf',
            'mp4': 'video/mp4'
          };

          for (let i = 0; i < mediaFiles.length; i++) {
            const fileName = mediaFiles[i];
            const fileData = await zip.files[fileName].async("blob");
            
            const ext = fileName.split('.').pop()?.toLowerCase() || '';
            const mimeType = mimeTypes[ext] || 'application/octet-stream';
            
            // Reconstruct Blob with correct MIME type so Directus recognizes it
            const properBlob = new Blob([fileData], { type: mimeType });
            const actualFileName = fileName.split('/').pop() || fileName;

            const formData = new FormData();
            formData.append("file", properBlob, actualFileName);
            
            try {
              const result = await directus.request(uploadFiles(formData));
              const fileId = (result as any).id;
              mediaMap[fileName] = fileId;
              mediaMap[actualFileName] = fileId; // Map both full path and basename
            } catch (err) {
              console.error(`Erreur upload média ${fileName}:`, err);
            }
            setProgress(prev => ({ ...prev, current: i + 1 }));
          }
        }

        // 3. Process records
        const { successCount, errorCount } = await processImport(rows, mediaMap);
        toast.success(`Import ZIP terminé : ${successCount} succès, ${errorCount} erreurs.`);
        
      } else {
        // Simple CSV import
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            // Handle multi-block CSV
            const blocks = content.split(/\r?\n\s*\r?\n/);
            let rows: any[] = [];
            for (const block of blocks) {
              if (!block.trim()) continue;
              const parsed = Papa.parse(block.trim(), { header: true, skipEmptyLines: true });
              rows = rows.concat(parsed.data);
            }
            
            const { successCount, errorCount } = await processImport(rows);
            toast.success(`Import CSV terminé : ${successCount} succès, ${errorCount} erreurs.`);
            finishImport();
          } catch (err: any) {
            toast.error(`Erreur d'import: ${err.message}`);
            setIsImporting(false);
          }
        };
        reader.readAsText(file);
        return; // handleImport finishes in onload
      }
      
      finishImport();
    } catch (err: any) {
      toast.error(`Erreur d'import: ${err.message}`);
      setIsImporting(false);
    }
  };

  const finishImport = () => {
    setIsImporting(false);
    setIsOpen(false);
    setFile(null);
    onImportComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload size={16} />
          Bulk Import (CSV/ZIP)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importation de masse</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Instructions</AlertTitle>
            <AlertDescription className="text-xs mt-1 space-y-2">
              <p>
                <strong>Option 1 (CSV) :</strong> Import de texte uniquement. La colonne <code className="bg-muted px-1 rounded">collection</code> est requise.
              </p>
              <p>
                <strong>Option 2 (ZIP) :</strong> Import complet (Données + Médias). 
                L'archive doit contenir un fichier <code className="bg-muted px-1 rounded">.csv</code> et vos images. 
                Dans le CSV, indiquez simplement le nom du fichier image (ex: <code className="bg-muted px-1 rounded">photo1.jpg</code>) dans les colonnes correspondantes.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Fichier (CSV ou ZIP)</Label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-all duration-200 ${file ? 'border-primary bg-primary/5' : isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-muted-foreground/20 hover:border-primary/50'}`}
            >
              <div className="mb-4 text-muted-foreground">
                {file ? (
                  file.name.endsWith(".zip") ? <FileArchive className="h-12 w-12 text-primary" /> : <FileSpreadsheet className="h-12 w-12 text-primary" />
                ) : (
                  <Upload className={`h-12 w-12 transition-transform ${isDragging ? 'scale-110' : ''}`} />
                )}
              </div>
              <div className="text-sm font-semibold mb-1 text-center">
                {file ? file.name : isDragging ? "Déposez le fichier ici" : "Cliquez ou glissez-déposez"}
              </div>
              <div className="text-xs text-muted-foreground text-center">
                CSV ou ZIP contenant CSV + Médias
              </div>
              <Input 
                type="file" 
                accept=".csv,.zip" 
                onChange={handleFileChange}
                disabled={isImporting}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          {isImporting && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-primary animate-pulse">{progress.phase}</span>
                <span>{progress.current} / {progress.total || '?'}</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300" 
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 50}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isImporting} className="flex-1">
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={!file || isImporting} className="flex-1">
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Lancer l'import"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
