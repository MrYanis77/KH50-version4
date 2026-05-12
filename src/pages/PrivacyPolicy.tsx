import { Link } from "react-router-dom";

const sectionClass = "space-y-3";
const h2Class = "font-display text-2xl font-semibold text-foreground tracking-tight";
const pClass = "text-sm leading-relaxed text-muted-foreground md:text-base";
const ulClass = "list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground md:text-base";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background font-body">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <h1 className="font-display text-3xl font-bold text-foreground tracking-tight md:text-4xl mb-2">
          Politique de confidentialité
        </h1>
        <p className={pClass}>
          Dernière mise à jour : 12 mai 2026. Ce document décrit, de manière générale, comment des
          données personnelles peuvent être traitées dans le cadre du site « Fragments #KH50 ». Il doit
          être adapté à vos traitements réels (hébergeur, outils d’analyse, prestataires, etc.) et validé
          juridiquement.
        </p>

        <div className="mt-12 space-y-12">
          <section className={sectionClass} aria-labelledby="responsable">
            <h2 id="responsable" className={h2Class}>
              1. Responsable du traitement
            </h2>
            <p className={pClass}>
              Le responsable du traitement des données est{" "}
              <strong className="text-foreground font-medium">[dénomination sociale]</strong>, [coordonnées
              complètes]. Contact dédié à la protection des données (le cas échéant) : [DPO ou référent] —
              [e-mail].
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="donnees-collectees">
            <h2 id="donnees-collectees" className={h2Class}>
              2. Données collectées
            </h2>
            <p className={pClass}>
              Selon les fonctionnalités du site (navigation, compte utilisateur, formulaire de contact,
              newsletter, etc.), peuvent notamment être collectées :
            </p>
            <ul className={ulClass}>
              <li>données d’identification et de contact (nom, prénom, adresse e-mail, etc.) ;</li>
              <li>données de connexion et de navigation (adresse IP, logs techniques, type d’appareil,
                navigateur) ;</li>
              <li>tout contenu que vous choisissez de transmettre volontairement (messages, pièces
                jointes).</li>
            </ul>
            <p className={pClass}>
              Indiquez ici précisément quels formulaires, comptes ou services du site collectent des
              données et lesquelles.
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="finalites">
            <h2 id="finalites" className={h2Class}>
              3. Finalités du traitement
            </h2>
            <p className={pClass}>Les traitements sont mis en œuvre pour des finalités précises, par exemple :</p>
            <ul className={ulClass}>
              <li>fourniture du service et gestion des comptes utilisateurs ;</li>
              <li>réponse aux demandes de contact ;</li>
              <li>amélioration du site et mesure d’audience ;</li>
              <li>respect d’obligations légales ou réglementaires.</li>
            </ul>
          </section>

          <section className={sectionClass} aria-labelledby="base-legale">
            <h2 id="base-legale" className={h2Class}>
              4. Base légale
            </h2>
            <p className={pClass}>
              Les traitements reposent sur une ou plusieurs bases prévues par le RGPD : exécution d’un
              contrat, obligation légale, intérêt légitime ou consentement lorsque celui-ci est requis.
              Précisez, pour chaque finalité majeure, la base légale applicable après analyse de votre cas.
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="destinataires">
            <h2 id="destinataires" className={h2Class}>
              5. Destinataires et sous-traitants
            </h2>
            <p className={pClass}>
              Les données peuvent être communiquées à des prestataires strictement nécessaires à
              l’hébergement, la maintenance, l’authentification ou l’envoi d’e-mails (liste à compléter :
              hébergeur, CMS, outil d’e-mailing, etc.). Ces acteurs traitent les données selon vos
              instructions et des garanties contractuelles conformes au RGPD.
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="transferts">
            <h2 id="transferts" className={h2Class}>
              6. Transferts hors Union européenne
            </h2>
            <p className={pClass}>
              Si certains outils impliquent un transfert de données hors de l’EEE, indiquez les pays
              concernés et les garanties (clauses contractuelles types de la Commission européenne,
              décision d’adéquation, etc.) ou précisez qu’aucun transfert n’a lieu.
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="durees">
            <h2 id="durees" className={h2Class}>
              7. Durées de conservation
            </h2>
            <p className={pClass}>
              Les données sont conservées pour la durée nécessaire aux finalités poursuivies, augmentée
              le cas échéant des délais légaux de prescription. Détaillez vos durées (ex. compte inactif,
              logs, prospection) après revue interne.
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="droits">
            <h2 id="droits" className={h2Class}>
              8. Vos droits
            </h2>
            <p className={pClass}>
              Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d’un droit
              d’accès, de rectification, d’effacement, de limitation, d’opposition dans les conditions
              prévues par la loi, ainsi que d’un droit à la portabilité lorsqu’il s’applique. Vous pouvez
              retirer votre consentement à tout moment lorsque le traitement en est fondé. Pour exercer
              vos droits : [procédure et contact].
            </p>
            <p className={pClass}>
              Vous pouvez introduire une réclamation auprès de la{" "}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
              >
                CNIL
              </a>
              .
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="cookies">
            <h2 id="cookies" className={h2Class}>
              9. Cookies et traceurs
            </h2>
            <p className={pClass}>
              Le site peut déposer des cookies strictement nécessaires au fonctionnement technique ou,
              sous réserve de votre consentement le cas échéant, des traceurs de mesure d’audience ou
              liés à des services tiers. Listez les cookies utilisés (nom, finalité, durée) et indiquez
              comment gérer les préférences (bandeau, paramètres du navigateur).
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="securite">
            <h2 id="securite" className={h2Class}>
              10. Sécurité
            </h2>
            <p className={pClass}>
              L’éditeur met en œuvre des mesures organisationnelles et techniques appropriées pour
              protéger les données contre la destruction, la perte, l’altération ou l’accès non autorisé.
            </p>
          </section>

          <section className={sectionClass} aria-labelledby="modifs">
            <h2 id="modifs" className={h2Class}>
              11. Modifications
            </h2>
            <p className={pClass}>
              Cette politique peut être mise à jour ; la date de dernière révision est indiquée en tête de
              page. En cas de changement substantiel, une information sur le site pourra être prévue.
            </p>
            <p className={pClass}>
              Pour les informations relatives à l’éditeur et à l’hébergement du site, voir aussi les{" "}
              <Link
                to="/mentions-legales"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
              >
                Mentions légales
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
