import { Link } from "react-router-dom";

const sectionClass = "space-y-3";
const h2Class = "font-display text-2xl font-semibold text-foreground tracking-tight";
const pClass = "text-sm leading-relaxed text-muted-foreground md:text-base";

const LegalNotice = () => {
  return (
    <div className="min-h-screen bg-background font-body">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight md:text-4xl mb-2">
          Mentions légales
        </h1>
        <p className={pClass}>
          Dernière mise à jour : 12 mai 2026. Les présentes mentions ont un caractère informatif et
          doivent être complétées et validées par vos conseils en fonction de votre statut juridique
          exact (association, personne physique, etc.).
        </p>

        <div className="mt-12 space-y-12">
          <section className={sectionClass} aria-labelledby="editeur">
            <h2 id="editeur" className={h2Class}>
              1. Éditeur du site
            </h2>
            <p className={pClass}>
              Le site « Fragments #KH50 » accessible à l’adresse du projet (production : à préciser)
              est édité par <strong className="text-foreground font-medium">[dénomination sociale]</strong>
              , [forme juridique], dont le siège social est situé au [adresse complète].
            </p>
            <p className={pClass}>
              <strong className="text-foreground font-medium">Contact :</strong> [adresse e-mail et/ou
              formulaire de contact].
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="directeur">
            <h2 id="directeur" className={h2Class}>
              2. Directeur de la publication
            </h2>
            <p className={pClass}>
              [Nom et qualité du responsable légal ou du directeur de la publication], en qualité de
              [fonction].
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="hebergeur">
            <h2 id="hebergeur" className={h2Class}>
              3. Hébergement
            </h2>
            <p className={pClass}>
              Le site est hébergé par <strong className="text-foreground font-medium">[nom de l’hébergeur]</strong>
              , [adresse de l’hébergeur], [site web de l’hébergeur].
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="propriete">
            <h2 id="propriete" className={h2Class}>
              4. Propriété intellectuelle
            </h2>
            <p className={pClass}>
              L’ensemble des éléments composant le site (textes, images, graphismes, logo, icônes,
              sons, logiciels, etc.) est protégé par les dispositions relatives à la propriété
              intellectuelle. Toute reproduction ou représentation, intégrale ou partielle, sans
              autorisation expresse de l’éditeur est interdite et constituerait une contrefaçon
              sanctionnée par le Code de la propriété intellectuelle.
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="donnees">
            <h2 id="donnees" className={h2Class}>
              5. Données personnelles
            </h2>
            <p className={pClass}>
              Pour les traitements de données à caractère personnel, les engagements de
              confidentialité et vos droits, veuillez consulter notre{" "}
              <Link
                to="/politique-confidentialite"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
              >
                Politique de confidentialité
              </Link>
              .
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="litiges">
            <h2 id="litiges" className={h2Class}>
              6. Litiges et droit applicable
            </h2>
            <p className={pClass}>
              Les présentes mentions sont régies par le droit français. En cas de litige, et après
              tentative de recherche d’une solution amiable, les tribunaux français seront seuls
              compétents, sous réserve des dispositions imperatives applicables.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LegalNotice;
