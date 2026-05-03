-- =============================================================================
--  FRAGMENTIS — Migration : Recueil de mémoires
--  À exécuter dans phpMyAdmin ou via Directus SQL
-- =============================================================================

CREATE TABLE IF NOT EXISTS mmrl_recueil (
    id                 INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    auteur_temoin_id   INT          NOT NULL,
    type_id            INT          NOT NULL DEFAULT 1,
    titre              VARCHAR(255) NULL,
    contenu            TEXT         NULL,
    fichier_media      CHAR(36)     NULL,
    is_public          BOOLEAN      NOT NULL DEFAULT TRUE,
    statut_id          INT          NOT NULL DEFAULT 2,
    date_creation      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_modification  TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMP    NULL,

    CONSTRAINT mmrl_fk_recueil_auteur
        FOREIGN KEY (auteur_temoin_id) REFERENCES mmrl_temoins(id) ON DELETE CASCADE,
    CONSTRAINT mmrl_fk_recueil_type
        FOREIGN KEY (type_id) REFERENCES mmrl_type_fragment(id) ON DELETE RESTRICT,
    CONSTRAINT mmrl_fk_recueil_media
        FOREIGN KEY (fichier_media) REFERENCES directus_files(id) ON DELETE SET NULL,
    CONSTRAINT mmrl_fk_recueil_statut
        FOREIGN KEY (statut_id) REFERENCES mmrl_qualite_statut(id) ON DELETE RESTRICT,

    INDEX idx_recueil_auteur (auteur_temoin_id),
    INDEX idx_recueil_public (is_public),
    INDEX idx_recueil_type (type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
