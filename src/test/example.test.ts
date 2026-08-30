import { describe, it, expect } from "vitest";
import { STATUT_ID, TYPE_FRAGMENT_ID, TYPE_RELATION_LABELS, TYPE_SEPULTURE_LABELS } from "@/integration/directus-types";

describe("directus-types constants", () => {
  describe("STATUT_ID", () => {
    it("has the correct values", () => {
      expect(STATUT_ID.VERIFIE).toBe(1);
      expect(STATUT_ID.A_VERIFIER).toBe(2);
      expect(STATUT_ID.NON_FIABLE).toBe(3);
      expect(STATUT_ID.MODIFIE_USER).toBe(4);
      expect(STATUT_ID.MODIFIE_ADMIN).toBe(5);
    });

    it("has unique values", () => {
      const values = Object.values(STATUT_ID);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe("TYPE_FRAGMENT_ID", () => {
    it("covers all 7 fragment types", () => {
      expect(Object.keys(TYPE_FRAGMENT_ID)).toHaveLength(7);
    });

    it("has unique numeric IDs", () => {
      const values = Object.values(TYPE_FRAGMENT_ID);
      expect(new Set(values).size).toBe(values.length);
    });
  });

  describe("TYPE_RELATION_LABELS", () => {
    it("provides French labels for every relation type", () => {
      expect(TYPE_RELATION_LABELS.conjoint).toBeTruthy();
      expect(TYPE_RELATION_LABELS.parent).toBeTruthy();
      expect(TYPE_RELATION_LABELS.enfant).toBeTruthy();
      expect(TYPE_RELATION_LABELS.frere_soeur).toBeTruthy();
      expect(TYPE_RELATION_LABELS.autre).toBeTruthy();
    });
  });

  describe("TYPE_SEPULTURE_LABELS", () => {
    it("provides a label for each burial type", () => {
      expect(TYPE_SEPULTURE_LABELS.stupa).toBeTruthy();
      expect(TYPE_SEPULTURE_LABELS.autel).toBeTruthy();
      expect(TYPE_SEPULTURE_LABELS.jardin).toBeTruthy();
    });
  });
});
