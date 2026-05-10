-- =============================================================================
-- Contenu éditorial des pages /archives (vitrine)
-- À appliquer sur une base existante (Directus / MySQL 8+).
-- Champs alignés avec le modèle système Directus (status, sort, date_created…).
-- image_couverture : pas de FK SQL vers directus_files (variation type/collation → #150).
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS mmrl_archives_rubrique_item (
    id                  INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,

    -- Champs métier
    categorie           VARCHAR(32)   NOT NULL,
    titre               VARCHAR(500)  NOT NULL,
    description         TEXT          NULL,
    type_contenu        VARCHAR(20)   NULL,
    annee               INT           NULL,
    source_attribution  VARCHAR(500)  NULL,
    auteur_reference    VARCHAR(500)  NULL,
    lien_url            VARCHAR(2000) NULL,

    -- Relation Directus File (relation gérée par l’UI Directus)
    image_couverture    CHAR(36)      NULL,

    -- Champs système standards Directus
    status              VARCHAR(255)  NOT NULL DEFAULT 'published',
    sort                INT           NULL,
    user_created        CHAR(36)      NULL,
    date_created        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_updated        CHAR(36)      NULL,
    date_updated        TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_archives_rubrique_cat (categorie, sort, status),
    INDEX idx_archives_rubrique_file (image_couverture)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mmrl_archives_chronologie_section (
    id                  INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,

    -- Champs métier
    titre               VARCHAR(500)  NOT NULL,

    -- Champs système standards Directus
    status              VARCHAR(255)  NOT NULL DEFAULT 'published',
    sort                INT           NULL,
    user_created        CHAR(36)      NULL,
    date_created        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_updated        CHAR(36)      NULL,
    date_updated        TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_archives_chrono_sec (sort, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mmrl_archives_chronologie_ligne (
    id                  INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
    section_id          INT           NOT NULL,

    -- Champs métier
    annee_libelle       VARCHAR(255)  NOT NULL,
    description         TEXT          NOT NULL,

    -- Champs système standards Directus
    status              VARCHAR(255)  NOT NULL DEFAULT 'published',
    sort                INT           NULL,
    user_created        CHAR(36)      NULL,
    date_created        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_updated        CHAR(36)      NULL,
    date_updated        TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT mmrl_fk_archives_chrono_ligne_section
        FOREIGN KEY (section_id) REFERENCES mmrl_archives_chronologie_section(id) ON DELETE CASCADE,

    INDEX idx_archives_chrono_ligne (section_id, sort, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
