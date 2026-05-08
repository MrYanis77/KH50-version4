-- -----------------------------------------------------------------------------
-- Réparer les lookups mmrl_type_fragment si la FK recueil/fragments échoue (400).
-- À exécuter sur ta base Directus/MySQL locale. Upsert via clé primaire id.
-- Valeurs alignées sur db/schema.sql
-- -----------------------------------------------------------------------------
INSERT INTO mmrl_type_fragment (id, code, libelle) VALUES
    (1, 'temoignage',   'Témoignage'),
    (2, 'photographie', 'Photographie'),
    (3, 'video',        'Vidéo'),
    (4, 'recit',        'Récit'),
    (5, 'document',     'Document'),
    (6, 'lieu',         'Lieu / Objet'),
    (7, 'audio',        'Audio')
ON DUPLICATE KEY UPDATE
    code    = VALUES(code),
    libelle = VALUES(libelle);
