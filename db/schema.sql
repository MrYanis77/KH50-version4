-- =============================================================================
--  FRAGMENTIS VITAE ASIA — Mémorial KH50
--  Schéma de base de données pour Directus 11.3.5
--  Conventions :
--    - Toutes les tables métier sont préfixées `mmrl_`
--    - Les FK vers les médias pointent vers `directus_files(id)` (CHAR(36))
--    - Les FK vers les comptes pointent vers `directus_users(id)` (CHAR(36))
--    - Soft-delete : colonne `deleted_at TIMESTAMP NULL` sur les tables métier
--    - Statut qualité (blanc/jaune) → FK vers `mmrl_qualite_statut`
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS mmrl_sepultures;
DROP TABLE IF EXISTS mmrl_relations_familiales;
DROP TABLE IF EXISTS mmrl_fragments;
DROP TABLE IF EXISTS mmrl_parcours;
DROP TABLE IF EXISTS mmrl_victimes;
DROP TABLE IF EXISTS mmrl_sources_temoignage;
DROP TABLE IF EXISTS mmrl_temoins;
DROP TABLE IF EXISTS mmrl_type_fragment;
DROP TABLE IF EXISTS mmrl_qualite_statut;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. LOOKUPS
-- =============================================================================

-- 1.1 Qualité du statut d'une information (blanc / jaune / non fiable)
CREATE TABLE mmrl_qualite_statut (
    id            INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(30)   NOT NULL UNIQUE,
    libelle       VARCHAR(100)  NOT NULL,
    couleur_hex   VARCHAR(7)    NOT NULL DEFAULT '#FFFFFF',
    show_on_wall  BOOLEAN       NOT NULL DEFAULT FALSE
) ENGINE=InnoDB;

INSERT INTO mmrl_qualite_statut (id, code, libelle, couleur_hex, show_on_wall) VALUES
    (1, 'verifie',    'Information avérée',   '#FFFFFF', TRUE),
    (2, 'a_verifier', 'Hypothèse à vérifier', '#FACC15', TRUE),
    (3, 'non_fiable', 'Non fiable',           '#EF4444', FALSE);

-- 1.2 Type de fragment de mémoire
CREATE TABLE mmrl_type_fragment (
    id      INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code    VARCHAR(30)  NOT NULL UNIQUE,
    libelle VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

INSERT INTO mmrl_type_fragment (id, code, libelle) VALUES
    (1, 'temoignage',   'Témoignage'),
    (2, 'photographie', 'Photographie'),
    (3, 'video',        'Vidéo'),
    (4, 'recit',        'Récit'),
    (5, 'document',     'Document'),
    (6, 'lieu',         'Lieu / Objet'),
    (7, 'audio',        'Audio');

-- =============================================================================
-- 2. PERSONNES & SOURCES
-- =============================================================================

-- 2.1 Témoins (= utilisateurs métier, peuvent être liés à un compte Directus)
CREATE TABLE mmrl_temoins (
    id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    directus_user_id   CHAR(36)     NULL,
    prenom             VARCHAR(255) NOT NULL,
    nom                VARCHAR(255) NOT NULL,
    email              VARCHAR(255) NULL,
    telephone          VARCHAR(50)  NULL,
    statut_id          INT          NOT NULL DEFAULT 2,
    date_creation      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification  TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP    NULL,
    CONSTRAINT mmrl_fk_temoin_user
        FOREIGN KEY (directus_user_id) REFERENCES directus_users(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_temoin_statut
        FOREIGN KEY (statut_id) REFERENCES mmrl_qualite_statut(id) ON DELETE RESTRICT,
    INDEX idx_temoin_user (directus_user_id),
    INDEX idx_temoin_email (email)
) ENGINE=InnoDB;

-- 2.2 Sources de témoignage (personne à l'origine d'une info, avec ou sans compte)
CREATE TABLE mmrl_sources_temoignage (
    id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    source_user_id     CHAR(36)     NULL,
    prenom             VARCHAR(255) NOT NULL,
    nom                VARCHAR(255) NOT NULL,
    email              VARCHAR(255) NULL,
    telephone          VARCHAR(50)  NULL,
    statut_id          INT          NOT NULL DEFAULT 2,
    date_creation      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification  TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP    NULL,
    CONSTRAINT mmrl_fk_source_user
        FOREIGN KEY (source_user_id) REFERENCES directus_users(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_source_statut
        FOREIGN KEY (statut_id) REFERENCES mmrl_qualite_statut(id) ON DELETE RESTRICT,
    INDEX idx_source_user (source_user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 3. VICTIMES & CONTENUS
-- =============================================================================

-- 3.1 Victimes du génocide
CREATE TABLE mmrl_victimes (
    id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    auteur_temoin_id   INT          NOT NULL,
    source_id          INT          NOT NULL,
    prenom             VARCHAR(255) NOT NULL,
    nom                VARCHAR(255) NOT NULL,
    sexe               TINYINT      NULL COMMENT '0=inconnu, 1=masculin, 2=féminin',
    annee_naissance    INT          NULL,
    date_naissance     DATE         NULL,
    lieu_naissance     VARCHAR(255) NULL,
    annee_deces        INT          NULL,
    date_deces         DATE         NULL,
    lieu_deces         VARCHAR(255) NULL,
    profession         VARCHAR(255) NULL,
    origine_familiale  VARCHAR(255) NULL,
    photo_principale   CHAR(36)     NULL,
    statut_id          INT          NOT NULL DEFAULT 2,
    date_creation      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification  TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP    NULL,
    CONSTRAINT mmrl_fk_victime_auteur
        FOREIGN KEY (auteur_temoin_id) REFERENCES mmrl_temoins(id) ON DELETE RESTRICT,
    CONSTRAINT mmrl_fk_victime_source
        FOREIGN KEY (source_id) REFERENCES mmrl_sources_temoignage(id) ON DELETE RESTRICT,
    CONSTRAINT mmrl_fk_victime_photo
        FOREIGN KEY (photo_principale) REFERENCES directus_files(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_victime_statut
        FOREIGN KEY (statut_id) REFERENCES mmrl_qualite_statut(id) ON DELETE RESTRICT,
    INDEX idx_victime_nom (nom, prenom),
    INDEX idx_victime_statut (statut_id)
) ENGINE=InnoDB;

-- 3.2 Parcours chronologique d'une victime
CREATE TABLE mmrl_parcours (
    id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    victime_id         INT          NOT NULL,
    annee_evenement    INT          NULL,
    date_evenement     DATE         NULL,
    titre              VARCHAR(255) NULL,
    description        TEXT         NULL,
    fichier_media      CHAR(36)     NULL,
    ordre              INT          NOT NULL DEFAULT 0,
    statut_id          INT          NOT NULL DEFAULT 2,
    date_creation      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification  TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP    NULL,
    CONSTRAINT mmrl_fk_parcours_victime
        FOREIGN KEY (victime_id) REFERENCES mmrl_victimes(id) ON DELETE CASCADE,
    CONSTRAINT mmrl_fk_parcours_media
        FOREIGN KEY (fichier_media) REFERENCES directus_files(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_parcours_statut
        FOREIGN KEY (statut_id) REFERENCES mmrl_qualite_statut(id) ON DELETE RESTRICT,
    INDEX idx_parcours_victime (victime_id)
) ENGINE=InnoDB;

-- 3.3 Fragments de mémoire (témoignages, photos, vidéos, etc.)
CREATE TABLE mmrl_fragments (
    id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    victime_id         INT          NOT NULL,
    auteur_temoin_id   INT          NOT NULL,
    source_id          INT          NULL,
    type_id            INT          NOT NULL DEFAULT 1,
    titre              VARCHAR(255) NULL,
    description        TEXT         NOT NULL,
    annee_fragment     INT          NULL,
    date_fragment      DATE         NULL,
    fichier_media      CHAR(36)     NULL,
    statut_id          INT          NOT NULL DEFAULT 2,
    date_creation      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification  TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP    NULL,
    CONSTRAINT mmrl_fk_fragment_victime
        FOREIGN KEY (victime_id) REFERENCES mmrl_victimes(id) ON DELETE CASCADE,
    CONSTRAINT mmrl_fk_fragment_auteur
        FOREIGN KEY (auteur_temoin_id) REFERENCES mmrl_temoins(id) ON DELETE RESTRICT,
    CONSTRAINT mmrl_fk_fragment_source
        FOREIGN KEY (source_id) REFERENCES mmrl_sources_temoignage(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_fragment_type
        FOREIGN KEY (type_id) REFERENCES mmrl_type_fragment(id) ON DELETE RESTRICT,
    CONSTRAINT mmrl_fk_fragment_media
        FOREIGN KEY (fichier_media) REFERENCES directus_files(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_fragment_statut
        FOREIGN KEY (statut_id) REFERENCES mmrl_qualite_statut(id) ON DELETE RESTRICT,
    INDEX idx_fragment_victime (victime_id),
    INDEX idx_fragment_type (type_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 4. NOUVEAUTÉS PHASE 1 — Araignée généalogique & Sépulture virtuelle
-- =============================================================================

-- 4.1 Liens de parenté (« araignée »)
--     victime_id_a est toujours renseignée ; victime_id_b est renseignée si
--     le relatif existe déjà dans la base, sinon on stocke nom_relatif_externe.
CREATE TABLE mmrl_relations_familiales (
    id                    INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    victime_id_a          INT          NOT NULL,
    victime_id_b          INT          NULL,
    nom_relatif_externe   VARCHAR(255) NULL,
    type_relation         ENUM('conjoint','parent','enfant','frere_soeur','autre')
                                       NOT NULL DEFAULT 'autre',
    description           TEXT         NULL,
    auteur_temoin_id      INT          NULL,
    statut_id             INT          NOT NULL DEFAULT 2,
    date_creation         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification     TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at            TIMESTAMP    NULL,
    CONSTRAINT mmrl_fk_relation_a
        FOREIGN KEY (victime_id_a) REFERENCES mmrl_victimes(id) ON DELETE CASCADE,
    CONSTRAINT mmrl_fk_relation_b
        FOREIGN KEY (victime_id_b) REFERENCES mmrl_victimes(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_relation_auteur
        FOREIGN KEY (auteur_temoin_id) REFERENCES mmrl_temoins(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_relation_statut
        FOREIGN KEY (statut_id) REFERENCES mmrl_qualite_statut(id) ON DELETE RESTRICT,
    CONSTRAINT mmrl_chk_relation_cible
        CHECK (victime_id_b IS NOT NULL OR nom_relatif_externe IS NOT NULL),
    INDEX idx_relation_a (victime_id_a),
    INDEX idx_relation_b (victime_id_b)
) ENGINE=InnoDB;

-- 4.2 Sépulture virtuelle (1 par victime maximum)
CREATE TABLE mmrl_sepultures (
    id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    victime_id         INT          NOT NULL UNIQUE,
    auteur_temoin_id   INT          NULL,
    type_sepulture     ENUM('stupa','autel','jardin') NOT NULL DEFAULT 'stupa',
    epitaphe           TEXT         NULL,
    message            TEXT         NULL,
    nb_bougies         INT          NOT NULL DEFAULT 0,
    statut_id          INT          NOT NULL DEFAULT 2,
    date_creation      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification  TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP    NULL,
    CONSTRAINT mmrl_fk_sepulture_victime
        FOREIGN KEY (victime_id) REFERENCES mmrl_victimes(id) ON DELETE CASCADE,
    CONSTRAINT mmrl_fk_sepulture_auteur
        FOREIGN KEY (auteur_temoin_id) REFERENCES mmrl_temoins(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_sepulture_statut
        FOREIGN KEY (statut_id) REFERENCES mmrl_qualite_statut(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
