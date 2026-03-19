import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Book, Film, Mic, FileText, MapPin, Users, ExternalLink, ChevronDown, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/* ─── data (shared with Archives) ─── */

const temoignages = [
  { title: "Le dernier jour à Phnom Penh", desc: "Récit d'un survivant évacué de la capitale en avril 1975.", type: "text" as const, year: 1975 },
  { title: "Voix de Battambang", desc: "Témoignage audio recueilli auprès d'une famille de riziculteurs.", type: "podcast" as const, year: 1978 },
  { title: "Les enfants du camp", desc: "Documentaire sur les jeunes survivants des camps de travail.", type: "video" as const, year: 2004 },
  { title: "Mémoire d'une mère", desc: "Lettres retrouvées d'une mère à ses enfants disparus.", type: "text" as const, year: 1976 },
  { title: "La marche vers Battambang", desc: "Un adolescent raconte l'exode forcé de sa famille vers les rizières.", type: "text" as const, year: 1975 },
  { title: "Le silence de Kampong Cham", desc: "Témoignage d'un ancien instituteur sur la fermeture des écoles.", type: "podcast" as const, year: 1976 },
  { title: "Retrouvailles à Paris", desc: "Un frère et une sœur se retrouvent après 30 ans de séparation.", type: "video" as const, year: 2008 },
  { title: "Les rizières de sang", desc: "Journal d'un paysan forcé de travailler dans les champs collectifs.", type: "text" as const, year: 1977 },
];

const chronologie = [
  { year: "1970", title: "Coup d'État de Lon Nol", desc: "Renversement du prince Sihanouk. Le Cambodge entre dans une guerre civile dévastatrice." },
  { year: "1975", title: "Prise de Phnom Penh par les Khmers rouges", desc: "Le 17 avril 1975, les Khmers rouges entrent dans la capitale et ordonnent l'évacuation totale de la ville." },
  { year: "1975–1979", title: "Régime des Khmers rouges", desc: "Sous Pol Pot, le régime instaure une dictature agraire responsable de la mort de près de deux millions de personnes." },
  { year: "1979", title: "Fin du régime", desc: "L'intervention vietnamienne met fin au régime. Le pays entame un long processus de reconstruction." },
  { year: "1980–1991", title: "Occupation et guerre civile", desc: "Le Cambodge est occupé par le Vietnam. Une guérilla persiste dans les zones frontalières." },
  { year: "1991", title: "Accords de Paris", desc: "Les accords de paix sont signés, ouvrant la voie à des élections supervisées par l'ONU." },
  { year: "2006", title: "Création du tribunal ECCC", desc: "Les Chambres extraordinaires au sein des tribunaux cambodgiens commencent à juger les responsables du génocide." },
];

const lieux = [
  { name: "Tuol Sleng (S-21)", desc: "Ancien lycée transformé en centre de détention et de torture par les Khmers rouges.", photo: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80" },
  { name: "Choeung Ek", desc: "Principal site d'exécution du régime, aujourd'hui mémorial et musée.", photo: "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=600&q=80" },
  { name: "Phnom Penh", desc: "Capitale vidée de ses habitants le 17 avril 1975, symbole de l'exode forcé.", photo: "https://images.unsplash.com/photo-1575881875475-31023242e3f9?w=600&q=80" },
  { name: "Battambang", desc: "Deuxième ville du pays, théâtre de travaux forcés dans les rizières environnantes.", photo: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80" },
  { name: "Angkor", desc: "Site archéologique utilisé comme camp de travail pendant le régime.", photo: "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=600&q=80" },
  { name: "Kampong Cham", desc: "Province où de nombreuses familles furent déplacées et séparées.", photo: "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=600&q=80" },
];

const documents = [
  { title: "Registre administratif S-21", year: 1977, source: "Archives nationales du Cambodge" },
  { title: "Lettres confisquées", year: 1976, source: "Musée Tuol Sleng" },
  { title: "Photographies d'identité", year: 1978, source: "Documentation Center of Cambodia" },
  { title: "Cartes des fosses communes", year: 1980, source: "Yale Cambodian Genocide Program" },
  { title: "Procès-verbaux d'interrogatoire", year: 1977, source: "Archives nationales du Cambodge" },
  { title: "Rapports de production agricole", year: 1976, source: "Archives du régime" },
  { title: "Correspondance diplomatique", year: 1978, source: "Nations Unies" },
  { title: "Témoignages filmés ECCC", year: 2009, source: "Chambres extraordinaires" },
];

const transmission = [
  { title: "Fragmentis Vitae Asia", desc: "Projet numérique de mémoire collective dédié aux vies disparues." },
  { title: "Programme éducatif ECCC", desc: "Initiative pédagogique autour des tribunaux khmers rouges." },
  { title: "Mémoire de la diaspora", desc: "Recueil de témoignages au sein de la communauté cambodgienne en France." },
  { title: "Exposition itinérante", desc: "Parcours muséal présentant les traces matérielles du génocide." },
  { title: "Ateliers scolaires", desc: "Programmes de sensibilisation dans les écoles cambodgiennes." },
  { title: "Archives orales", desc: "Projet d'enregistrement systématique des récits de survivants." },
];

const bibliographie = [
  { title: "D'abord, ils ont tué mon père", author: "Loung Ung", year: 2000, link: "#" },
  { title: "L'Élimination", author: "Rithy Panh", year: 2012, link: "#" },
  { title: "Survival in the Killing Fields", author: "Haing Ngor", year: 1987, link: "#" },
  { title: "The Gate", author: "François Bizot", year: 2003, link: "#" },
  { title: "When Broken Glass Floats", author: "Chanrithy Him", year: 2000, link: "#" },
  { title: "Cambodia's Curse", author: "Joel Brinkley", year: 2011, link: "#" },
  { title: "Les Larmes interdites", author: "Malay Phcar", year: 2007, link: "#" },
  { title: "Le portail", author: "François Bizot", year: 2000, link: "#" },
];

/* ─── config ─── */

type CategoryKey = "temoignages" | "chronologie" | "lieux" | "documents" | "transmission" | "bibliographie";

const categoryConfig: Record<CategoryKey, { label: string; desc: string; icon: React.ReactNode }> = {
  temoignages: { label: "Témoignages", desc: "Récits de survivants, mémoires transmises et voix préservées.", icon: <Mic size={22} /> },
  chronologie: { label: "Chronologie historique", desc: "Les événements clés du génocide cambodgien.", icon: <Book size={22} /> },
  lieux: { label: "Lieux de mémoire", desc: "Lieux historiques liés au génocide et à la mémoire collective.", icon: <MapPin size={22} /> },
  documents: { label: "Archives et documents", desc: "Documents historiques, registres et photographies d'archives.", icon: <FileText size={22} /> },
  transmission: { label: "Transmission et mémoire", desc: "Projets et initiatives dédiés à la préservation de la mémoire.", icon: <Users size={22} /> },
  bibliographie: { label: "Bibliographie et ressources", desc: "Ouvrages, films et travaux académiques recommandés.", icon: <Book size={22} /> },
};

/* ─── helpers ─── */

const typeIcon = (type: "text" | "video" | "podcast") => {
  switch (type) {
    case "video": return <Film size={14} />;
    case "podcast": return <Mic size={14} />;
    default: return <Book size={14} />;
  }
};

const typeLabel = (type: "text" | "video" | "podcast") => {
  switch (type) {
    case "video": return "Voir";
    case "podcast": return "Écouter";
    default: return "Lire";
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ─── sub-renderers ─── */

const TemoignagesGrid = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {temoignages.map((t, i) => (
      <motion.article key={t.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">{typeIcon(t.type)} {t.type}</span>
          <span>{t.year}</span>
        </div>
        <h3 className="font-display text-base text-foreground mb-2">{t.title}</h3>
        <p className="font-body text-sm text-muted-foreground flex-1 leading-relaxed">{t.desc}</p>
        <button className="mt-4 self-start text-sm font-body font-semibold text-accent hover:text-foreground transition-colors flex items-center gap-1">
          {typeLabel(t.type)} <ExternalLink size={12} />
        </button>
      </motion.article>
    ))}
  </div>
);

const ChronologieList = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="max-w-2xl">
      {chronologie.map((item, i) => (
        <motion.div key={item.year} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="relative pl-8 pb-10 last:pb-0 group">
          <div className="absolute left-[11px] top-3 bottom-0 w-px bg-border group-last:hidden" />
          <div className="absolute left-0 top-2 w-[23px] h-[23px] rounded-full border-2 border-accent bg-background flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-accent" />
          </div>
          <button onClick={() => setOpenIdx(openIdx === i ? null : i)} className="w-full text-left" aria-expanded={openIdx === i}>
            <span className="text-sm font-body font-semibold text-brand-burnt tracking-wide">{item.year}</span>
            <h3 className="font-display text-lg text-foreground mt-1 flex items-center gap-2">
              {item.title}
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${openIdx === i ? "rotate-180" : ""}`} />
            </h3>
          </button>
          {openIdx === i && (
            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className="font-body text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">{item.desc}</motion.p>
          )}
        </motion.div>
      ))}
    </div>
  );
};

const LieuxGrid = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {lieux.map((l, i) => (
      <motion.article key={l.name} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
        <div className="aspect-[16/10] overflow-hidden">
          <img src={l.photo} alt={l.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg text-foreground mb-2">{l.name}</h3>
          <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">{l.desc}</p>
          <button className="text-sm font-body font-semibold text-accent hover:text-foreground transition-colors flex items-center gap-1">
            Explorer <ExternalLink size={12} />
          </button>
        </div>
      </motion.article>
    ))}
  </div>
);

const DocumentsList = () => (
  <div className="grid sm:grid-cols-2 gap-4">
    {documents.map((d, i) => (
      <motion.div key={d.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="flex items-center gap-4 bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
          <FileText size={18} className="text-brand-brown" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-foreground truncate">{d.title}</h3>
          <p className="font-body text-xs text-muted-foreground">{d.year} · {d.source}</p>
        </div>
        <button className="text-sm font-body font-semibold text-accent hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-1">
          Voir <ExternalLink size={12} />
        </button>
      </motion.div>
    ))}
  </div>
);

const TransmissionGrid = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {transmission.map((t, i) => (
      <motion.article key={t.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <h3 className="font-display text-base text-foreground mb-2">{t.title}</h3>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
      </motion.article>
    ))}
  </div>
);

const BibliographieList = () => (
  <div className="grid sm:grid-cols-2 gap-4">
    {bibliographie.map((b, i) => (
      <motion.div key={b.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="flex items-center gap-4 bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
        <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
          <Book size={18} className="text-brand-brown" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base text-foreground truncate">{b.title}</h3>
          <p className="font-body text-xs text-muted-foreground">{b.author} · {b.year}</p>
        </div>
        <a href={b.link} className="text-sm font-body font-semibold text-accent hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-1" aria-label={`Voir ${b.title}`}>
          Voir <ExternalLink size={12} />
        </a>
      </motion.div>
    ))}
  </div>
);

const categoryRenderer: Record<CategoryKey, () => JSX.Element> = {
  temoignages: TemoignagesGrid,
  chronologie: ChronologieList,
  lieux: LieuxGrid,
  documents: DocumentsList,
  transmission: TransmissionGrid,
  bibliographie: BibliographieList,
};

/* ─── page ─── */

const ArchiveCategory = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const key = category as CategoryKey;
  const config = categoryConfig[key];

  if (!config) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">Catégorie introuvable</h1>
          <Button variant="outline" onClick={() => navigate("/archives")} className="gap-2">
            <ArrowLeft size={16} /> Retour aux archives
          </Button>
        </div>
      </div>
    );
  }

  const Renderer = categoryRenderer[key];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 fragmentis-diagonal pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <Button variant="ghost" onClick={() => navigate("/archives")} className="gap-2 mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Retour aux archives
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">{config.icon}</div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground">{config.label}</h1>
          </div>
          <p className="font-body text-lg text-muted-foreground max-w-2xl leading-relaxed">{config.desc}</p>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 pb-24">
        <Renderer />
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-6 h-px bg-brand-burnt/40" style={{ transform: "rotate(30.54deg)" }} aria-hidden="true" />
          <span className="text-brand-burnt text-xs" aria-hidden="true">✦</span>
          <div className="w-6 h-px bg-brand-burnt/40" style={{ transform: "rotate(-30.54deg)" }} aria-hidden="true" />
        </div>
        <p className="font-body text-sm text-muted-foreground">Fragmentis Vitae Asia · Mémoire collective</p>
      </footer>
    </div>
  );
};

export default ArchiveCategory;
