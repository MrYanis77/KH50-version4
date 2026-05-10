import type { TypeFragmentCode, TypeFragmentRow } from "@/integration/directus-types";

const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "heic",
  "avif",
]);

const VIDEO_EXT = new Set(["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv"]);

const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "flac", "aac", "opus", "wma"]);

const DOCUMENT_EXT = new Set(["pdf", "doc", "docx", "odt", "rtf", "txt"]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  if (i < 0 || i === name.length - 1) return "";
  return name.slice(i + 1).toLowerCase();
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXT.has(extOf(file.name));
}

function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  return VIDEO_EXT.has(extOf(file.name));
}

function isAudioFile(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  const e = extOf(file.name);
  if (e === "webm" && file.type === "audio/webm") return true;
  return AUDIO_EXT.has(e);
}

function isDocumentFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (
    mime === "application/pdf" ||
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/vnd.oasis.opendocument.text" ||
    mime === "application/rtf" ||
    mime === "text/rtf" ||
    mime === "text/plain"
  ) {
    return true;
  }
  return DOCUMENT_EXT.has(extOf(file.name));
}

/** HTML `accept` string for the selected fragment type `code`. */
export function getAcceptAttributeForFragmentTypeCode(code: string | undefined): string {
  switch (code as TypeFragmentCode | undefined) {
    case "photographie":
      return "image/*";
    case "video":
      return "video/*";
    case "audio":
      return "audio/*";
    case "document":
    case "recit":
      return ".pdf,.doc,.docx,.odt,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,application/rtf,text/plain";
    case "lieu":
      return "image/*";
    case "temoignage":
      return "image/*,audio/*,.pdf,.doc,.docx,.odt,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "image/*,video/*,audio/*,.pdf,.doc,.docx,.odt,.rtf,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
}

/** Whether `file` is allowed for fragment type `code` (MIME + extension fallback). */
export function fragmentFileMatchesFragmentType(file: File, code: string | undefined): boolean {
  const c = code as TypeFragmentCode | undefined;
  switch (c) {
    case "photographie":
    case "lieu":
      return isImageFile(file);
    case "video":
      return isVideoFile(file);
    case "audio":
      return isAudioFile(file);
    case "document":
    case "recit":
      return isDocumentFile(file);
    case "temoignage":
      if (isVideoFile(file)) return false;
      return isImageFile(file) || isAudioFile(file) || isDocumentFile(file);
    default:
      return (
        isImageFile(file) || isVideoFile(file) || isAudioFile(file) || isDocumentFile(file)
      );
  }
}

export function resolveTypeCode(typeFragments: TypeFragmentRow[], typeId: number | string): TypeFragmentCode | undefined {
  const id = Number(typeId);
  if (!Number.isFinite(id)) return undefined;
  const row = typeFragments.find((t) => t.id === id);
  return row?.code;
}

export function getFragmentMediaHintFr(code: string | undefined): string {
  switch (code as TypeFragmentCode | undefined) {
    case "photographie":
      return "Images uniquement.";
    case "video":
      return "Vidéos uniquement.";
    case "audio":
      return "Audio uniquement.";
    case "document":
    case "recit":
      return "PDF, Word, texte ou formats bureautiques compatibles.";
    case "lieu":
      return "Images uniquement (lieu ou carte illustrative).";
    case "temoignage":
      return "Image, audio ou document — pas de fichier vidéo (utilisez le type Vidéo).";
    default:
      return "Image, vidéo, audio ou document selon le type choisi.";
  }
}
