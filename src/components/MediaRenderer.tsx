import { Video, Music, FileText, File, ExternalLink } from "lucide-react";
import { getAssetUrl, getDirectusFileMime, directusVideoMimeHint } from "@/integration/directus";

type MediaType = "image" | "video" | "audio" | "pdf" | "document" | "unknown";

function detectMediaType(url: string, mimeType?: string): MediaType {
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.startsWith("application/")) return "document";
  }
  // Fallback : extension depuis l'URL
  const lower = url.toLowerCase().split("?")[0];
  if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/.test(lower)) return "image";
  if (/\.(mp4|mov|webm|ogg|avi|mkv)$/.test(lower)) return "video";
  if (/\.(mp3|wav|ogg|flac|aac|m4a)$/.test(lower)) return "audio";
  if (/\.pdf$/.test(lower)) return "pdf";
  if (/\.(doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/.test(lower)) return "document";
  return "unknown";
}

interface MediaRendererProps {
  /** UUID ou objet fichier Directus (expand `fichier_media.*`). */
  fileId: unknown;
  mimeType?: string;
  /** Si fourni, surcharge la détection automatique */
  forceType?: MediaType;
  className?: string;
  onClick?: () => void;
}

export function MediaRenderer({ fileId, mimeType, forceType, className = "", onClick }: MediaRendererProps) {
  const url = getAssetUrl(fileId);
  const effectiveMime = mimeType ?? getDirectusFileMime(fileId);
  const type = forceType ?? detectMediaType(url, effectiveMime);

  if (type === "video") {
    const hint = directusVideoMimeHint(fileId);
    return (
      <video
        controls
        preload="metadata"
        playsInline
        className={`w-full rounded-lg bg-black max-h-96 ${className}`}
        onClick={onClick}
      >
        <source src={url} type={hint} />
      </video>
    );
  }

  if (type === "audio") {
    const hint = effectiveMime?.startsWith("audio/") ? effectiveMime : undefined;
    return (
      <div className={`flex items-center gap-3 bg-muted rounded-lg p-3 ${className}`}>
        <Music className="h-5 w-5 text-primary flex-shrink-0" />
        <audio controls preload="metadata" className="w-full">
          {hint ? <source src={url} type={hint} /> : <source src={url} />}
        </audio>
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className={`rounded-lg border border-border overflow-hidden ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-muted text-sm text-muted-foreground border-b border-border">
          <FileText className="h-4 w-4" />
          <span>Document PDF</span>
          <a href={url} target="_blank" rel="noreferrer" className="ml-auto hover:text-foreground">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <iframe
          src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full border-none"
          style={{ height: "400px" }}
          title="Document PDF"
        />
      </div>
    );
  }

  if (type === "document") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center gap-3 bg-muted rounded-lg p-4 border border-border hover:border-primary/50 transition-colors group ${className}`}
      >
        <File className="h-8 w-8 text-primary flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            Télécharger le document
          </p>
          <p className="text-xs text-muted-foreground">Cliquer pour ouvrir</p>
        </div>
        <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
      </a>
    );
  }

  if (type === "image") {
    return (
      <img
        src={url}
        alt="Média"
        className={`max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        onClick={onClick}
      />
    );
  }

  // unknown — lien générique
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center gap-2 text-sm text-primary underline underline-offset-4 hover:text-primary/80 ${className}`}
    >
      <File className="h-4 w-4" /> Ouvrir le fichier
    </a>
  );
}

/** Détecte le type depuis l'extension dans l'URL pour la lightbox */
export function getMediaTypeFromUrl(url: string): "image" | "video" | "pdf" {
  const type = detectMediaType(url);
  if (type === "video") return "video";
  if (type === "pdf") return "pdf";
  return "image";
}
