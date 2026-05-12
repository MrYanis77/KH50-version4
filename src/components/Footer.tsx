import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-background" role="contentinfo">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <Link to="/" className="inline-flex items-center gap-2 w-fit">
            <img
              src="https://www.fragmentis-vitae.org/images/fragment-rond.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain opacity-90"
            />
            <span className="font-body text-sm font-semibold text-foreground">Fragments #KH50</span>
          </Link>
          <p className="max-w-md text-sm text-muted-foreground">
            Mémoire et histoire du génocide cambodgien — fragmentis-vitae.org
          </p>
        </div>

        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
          aria-label="Informations légales"
        >
          <Link
            to="/mentions-legales"
            className="text-foreground/75 transition-colors hover:text-foreground underline-offset-4 hover:underline"
          >
            Mentions légales
          </Link>
          <Link
            to="/politique-confidentialite"
            className="text-foreground/75 transition-colors hover:text-foreground underline-offset-4 hover:underline"
          >
            Politique de confidentialité
          </Link>
          <Link
            to="/about"
            className="text-foreground/75 transition-colors hover:text-foreground underline-offset-4 hover:underline"
          >
            À propos
          </Link>
        </nav>
      </div>

      <div className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-[1200px] px-6 py-3">
          <p className="text-center text-xs text-muted-foreground">
            © {year} Fragments #KH50. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
