import { describe, it, expect } from "vitest";
import {
  getAcceptAttributeForFragmentTypeCode,
  fragmentFileMatchesFragmentType,
  resolveTypeCode,
  getFragmentMediaHintFr,
} from "@/utils/fragmentMedia";
import type { TypeFragmentRow } from "@/integration/directus-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name: string, type: string): File {
  return new File([""], name, { type });
}

// ---------------------------------------------------------------------------
// getAcceptAttributeForFragmentTypeCode
// ---------------------------------------------------------------------------

describe("getAcceptAttributeForFragmentTypeCode", () => {
  it("returns image/* for photographie", () => {
    expect(getAcceptAttributeForFragmentTypeCode("photographie")).toBe("image/*");
  });

  it("returns video/* for video", () => {
    expect(getAcceptAttributeForFragmentTypeCode("video")).toBe("video/*");
  });

  it("returns audio/* for audio", () => {
    expect(getAcceptAttributeForFragmentTypeCode("audio")).toBe("audio/*");
  });

  it("returns document accept string for document", () => {
    const accept = getAcceptAttributeForFragmentTypeCode("document");
    expect(accept).toContain(".pdf");
    expect(accept).toContain("application/pdf");
  });

  it("returns document accept string for recit", () => {
    const accept = getAcceptAttributeForFragmentTypeCode("recit");
    expect(accept).toContain(".pdf");
  });

  it("returns image/* for lieu", () => {
    expect(getAcceptAttributeForFragmentTypeCode("lieu")).toBe("image/*");
  });

  it("returns combined accept string for temoignage", () => {
    const accept = getAcceptAttributeForFragmentTypeCode("temoignage");
    expect(accept).toContain("image/*");
    expect(accept).toContain("audio/*");
    expect(accept).toContain(".pdf");
  });

  it("returns a broad fallback for unknown codes", () => {
    const accept = getAcceptAttributeForFragmentTypeCode(undefined);
    expect(accept).toContain("image/*");
    expect(accept).toContain("video/*");
    expect(accept).toContain("audio/*");
  });
});

// ---------------------------------------------------------------------------
// fragmentFileMatchesFragmentType
// ---------------------------------------------------------------------------

describe("fragmentFileMatchesFragmentType", () => {
  describe("photographie / lieu — accepts images only", () => {
    it("accepts a JPEG for photographie", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("photo.jpg", "image/jpeg"), "photographie")).toBe(true);
    });

    it("rejects a video for photographie", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("clip.mp4", "video/mp4"), "photographie")).toBe(false);
    });

    it("accepts a PNG for lieu", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("map.png", "image/png"), "lieu")).toBe(true);
    });

    it("rejects a PDF for lieu", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("doc.pdf", "application/pdf"), "lieu")).toBe(false);
    });
  });

  describe("video — accepts videos only", () => {
    it("accepts an MP4 by MIME type", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("film.mp4", "video/mp4"), "video")).toBe(true);
    });

    it("accepts a .webm by extension (no MIME)", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("clip.webm", ""), "video")).toBe(true);
    });

    it("rejects a JPEG for video", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("img.jpg", "image/jpeg"), "video")).toBe(false);
    });
  });

  describe("audio — accepts audio only", () => {
    it("accepts an MP3 by MIME type", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("song.mp3", "audio/mpeg"), "audio")).toBe(true);
    });

    it("accepts a .flac by extension", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("track.flac", ""), "audio")).toBe(true);
    });

    it("rejects a video for audio", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("film.mp4", "video/mp4"), "audio")).toBe(false);
    });
  });

  describe("document / recit — accepts documents only", () => {
    it("accepts a PDF by MIME type", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("report.pdf", "application/pdf"), "document")).toBe(true);
    });

    it("accepts a .docx by extension", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("report.docx", ""), "document")).toBe(true);
    });

    it("accepts a .txt for recit", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("story.txt", "text/plain"), "recit")).toBe(true);
    });

    it("rejects a JPEG for document", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("img.jpg", "image/jpeg"), "document")).toBe(false);
    });
  });

  describe("temoignage — accepts image, audio, document but NOT video", () => {
    it("accepts an image", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("photo.jpg", "image/jpeg"), "temoignage")).toBe(true);
    });

    it("accepts audio", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("voice.mp3", "audio/mpeg"), "temoignage")).toBe(true);
    });

    it("accepts a PDF document", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("scan.pdf", "application/pdf"), "temoignage")).toBe(true);
    });

    it("rejects a video", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("clip.mp4", "video/mp4"), "temoignage")).toBe(false);
    });
  });

  describe("undefined code — broad fallback", () => {
    it("accepts any media type", () => {
      expect(fragmentFileMatchesFragmentType(makeFile("img.jpg", "image/jpeg"), undefined)).toBe(true);
      expect(fragmentFileMatchesFragmentType(makeFile("clip.mp4", "video/mp4"), undefined)).toBe(true);
      expect(fragmentFileMatchesFragmentType(makeFile("song.mp3", "audio/mpeg"), undefined)).toBe(true);
      expect(fragmentFileMatchesFragmentType(makeFile("doc.pdf", "application/pdf"), undefined)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// resolveTypeCode
// ---------------------------------------------------------------------------

describe("resolveTypeCode", () => {
  const typeFragments: TypeFragmentRow[] = [
    { id: 1, code: "temoignage", libelle: "Témoignage" },
    { id: 2, code: "photographie", libelle: "Photographie" },
    { id: 3, code: "video", libelle: "Vidéo" },
    { id: 7, code: "audio", libelle: "Audio" },
  ];

  it("resolves a numeric id to the correct code", () => {
    expect(resolveTypeCode(typeFragments, 1)).toBe("temoignage");
    expect(resolveTypeCode(typeFragments, 3)).toBe("video");
    expect(resolveTypeCode(typeFragments, 7)).toBe("audio");
  });

  it("resolves a string id", () => {
    expect(resolveTypeCode(typeFragments, "2")).toBe("photographie");
  });

  it("returns undefined for an unknown id", () => {
    expect(resolveTypeCode(typeFragments, 999)).toBeUndefined();
  });

  it("returns undefined for a non-finite value", () => {
    expect(resolveTypeCode(typeFragments, "abc")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// getFragmentMediaHintFr
// ---------------------------------------------------------------------------

describe("getFragmentMediaHintFr", () => {
  it("returns an image hint for photographie", () => {
    expect(getFragmentMediaHintFr("photographie")).toMatch(/images/i);
  });

  it("returns a video hint for video", () => {
    expect(getFragmentMediaHintFr("video")).toMatch(/vid/i);
  });

  it("returns an audio hint for audio", () => {
    expect(getFragmentMediaHintFr("audio")).toMatch(/audio/i);
  });

  it("returns a document hint for document", () => {
    expect(getFragmentMediaHintFr("document")).toMatch(/pdf/i);
  });

  it("returns the same document hint for recit", () => {
    expect(getFragmentMediaHintFr("recit")).toMatch(/pdf/i);
  });

  it("returns an image-specific hint for lieu", () => {
    expect(getFragmentMediaHintFr("lieu")).toMatch(/images/i);
  });

  it("warns against video files for temoignage", () => {
    const hint = getFragmentMediaHintFr("temoignage");
    expect(hint).toMatch(/vid/i);
    expect(hint).toContain("Vidéo");
  });

  it("returns a broad fallback for undefined", () => {
    const hint = getFragmentMediaHintFr(undefined);
    expect(hint).toMatch(/image/i);
    expect(hint).toMatch(/vid/i);
  });
});
