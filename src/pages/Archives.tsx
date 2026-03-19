import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Book, Film, Mic, FileText, MapPin, Users, ExternalLink, ChevronDown, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/* ─── data ─── */

const temoignages = [
  { title: "Le dernier jour à Phnom Penh", desc: "Récit d'un survivant évacué de la capitale en avril 1975.", type: "text" as const, year: 1975 },
  { title: "Voix de Battambang", desc: "Témoignage audio recueilli auprès d'une famille de riziculteurs.", type: "podcast" as const, year: 1978 },
  { title: "Les enfants du camp", desc: "Documentaire sur les jeunes survivants des camps de travail.", type: "video" as const, year: 2004 },
  { title: "Mémoire d'une mère", desc: "Lettres retrouvées d'une mère à ses enfants disparus.", type: "text" as const, year: 1976 },
];

const chronologie = [
  { year: "1970", title: "Coup d'État de Lon Nol", desc: "Renversement du prince Sihanouk. Le Cambodge entre dans une guerre civile dévastatrice." },
  { year: "1975", title: "Prise de Phnom Penh par les Khmers rouges", desc: "Le 17 avril 1975, les Khmers rouges entrent dans la capitale et ordonnent l'évacuation totale de la ville." },
  { year: "1975–1979", title: "Régime des Khmers rouges", desc: "Sous Pol Pot, le régime instaure une dictature agraire responsable de la mort de près de deux millions de personnes." },
  { year: "1979", title: "Fin du régime", desc: "L'intervention vietnamienne met fin au régime. Le pays entame un long processus de reconstruction." },
];

const lieux = [
  { name: "Tuol Sleng (S-21)", desc: "Ancien lycée transformé en centre de détention et de torture par les Khmers rouges.", photo: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80" },
  { name: "Choeung Ek", desc: "Principal site d'exécution du régime, aujourd'hui mémorial et musée.", photo: "https://images.unsplash.com/photo-1540611025311-01df3cef54b5?w=600&q=80" },
  { name: "Phnom Penh", desc: "Capitale vidée de ses habitants le 17 avril 1975, symbole de l'exode forcé.", photo: "https://images.unsplash.com/photo-1575881875475-31023242e3f9?w=600&q=80" },
];

const documents = [
  { title: "Registre administratif S-21", year: 1977, source: "Archives nationales du Cambodge" },
  { title: "Lettres confisquées", year: 1976, source: "Musée Tuol Sleng" },
  { title: "Photographies d'identité", year: 1978, source: "Documentation Center of Cambodia" },
  { title: "Cartes des fosses communes", year: 1980, source: "Yale Cambodian Genocide Program" },
];

const transmission = [
  { title: "Fragmentis Vitae Asia", desc: "Projet numérique de mémoire collective dédié aux vies disparues." },
  { title: "Programme éducatif ECCC", desc: "Initiative pédagogique autour des tribunaux khmers rouges." },
  { title: "Mémoire de la diaspora", desc: "Recueil de témoignages au sein de la communauté cambodgienne en France." },
  { title: "Exposition itinérante", desc: "Parcours muséal présentant les traces matérielles du génocide." },
];

const bibliographie = [
  { title: "D'abord, ils ont tué mon père", author: "Loung Ung", year: 2000, link: "#" },
  { title: "L'Élimination", author: "Rithy Panh", year: 2012, link: "#" },
  { title: "Survival in the Killing Fields", author: "Haing Ngor", year: 1987, link: "#" },
  { title: "The Gate", author: "François Bizot", year: 2003, link: "#" },
];

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
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const SectionTitle = ({ children, icon, onViewAll }: { children: React.ReactNode; icon: React.ReactNode; onViewAll?: () => void; }) => (
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">{icon}</div>
      <h2 className="font-display text-2xl md:text-3xl text-foreground">{children}</h2>
    </div>
    {onViewAll && (
      <Button variant="ghost" size="sm" onClick={onViewAll} className="text-accent hover:text-foreground gap-1.5">
        Tout voir <ArrowRight size={14} />
      </Button>
    )}
  </div>
);

/* ─── timeline item ─── */

const TimelineItem = ({ item, index }: { item: typeof chronologie[0]; index: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="relative pl-8 pb-10 last:pb-0 group"
    >
      {/* timeline line */}
      <div className="absolute left-[11px] top-3 bottom-0 w-px bg-border group-last:hidden" />
      {/* dot */}
      <div className="absolute left-0 top-2 w-[23px] h-[23px] rounded-full border-2 border-accent bg-background flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-accent" />
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-body font-semibold text-brand-burnt tracking-wide">{item.year}</span>
        <h3 className="font-display text-lg text-foreground mt-1 flex items-center gap-2">
          {item.title}
          <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </h3>
      </button>
      {open && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="font-body text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg"
        >
          {item.desc}
        </motion.p>
      )}
    </motion.div>
  );
};

/* ─── page ─── */

const Archives = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 fragmentis-diagonal pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* decorative accent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-8 h-px bg-brand-burnt/50" style={{ transform: "rotate(30.54deg)" }} aria-hidden="true" />
            <span className="text-brand-burnt text-sm" aria-hidden="true">✦</span>
            <div className="w-8 h-px bg-brand-burnt/50" style={{ transform: "rotate(-30.54deg)" }} aria-hidden="true" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6"
          >
            Archives de mémoire
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Explorer les témoignages, documents et traces historiques liés au génocide cambodgien et à la mémoire des vies disparues.
          </motion.p>
        </div>
      </section>

      {/* Sections */}
      <div className="container mx-auto px-4 pb-24 space-y-20">

        {/* 1 · Témoignages */}
        <section>
          <SectionTitle icon={<Mic size={20} />} onViewAll={() => navigate("/archives/temoignages")}>Témoignages</SectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Récits de survivants, mémoires transmises et voix préservées.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {temoignages.map((t, i) => (
              <motion.article
                key={t.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                    {typeIcon(t.type)} {t.type}
                  </span>
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
        </section>

        {/* 2 · Chronologie historique */}
        <section>
          <SectionTitle icon={<Book size={20} />} onViewAll={() => navigate("/archives/chronologie")}>Chronologie historique</SectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Les événements clés du génocide cambodgien.
          </p>
          <div className="max-w-xl">
            {chronologie.map((item, i) => (
              <TimelineItem key={item.year} item={item} index={i} />
            ))}
          </div>
        </section>

        {/* 3 · Lieux de mémoire */}
        <section>
          <SectionTitle icon={<MapPin size={20} />} onViewAll={() => navigate("/archives/lieux")}>Lieux de mémoire</SectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Lieux historiques liés au génocide et à la mémoire collective.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lieux.map((l, i) => (
              <motion.article
                key={l.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={l.photo}
                    alt={l.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
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
        </section>

        {/* 4 · Archives et documents */}
        <section>
          <SectionTitle icon={<FileText size={20} />} onViewAll={() => navigate("/archives/documents")}>Archives et documents</SectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Documents historiques, registres et photographies d'archives.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {documents.map((d, i) => (
              <motion.div
                key={d.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-center gap-4 bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
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
        </section>

        {/* 5 · Transmission et mémoire */}
        <section>
          <SectionTitle icon={<Users size={20} />} onViewAll={() => navigate("/archives/transmission")}>Transmission et mémoire</SectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Projets et initiatives dédiés à la préservation de la mémoire.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {transmission.map((t, i) => (
              <motion.article
                key={t.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <h3 className="font-display text-base text-foreground mb-2">{t.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* 6 · Bibliographie et ressources */}
        <section>
          <SectionTitle icon={<Book size={20} />} onViewAll={() => navigate("/archives/bibliographie")}>Bibliographie et ressources</SectionTitle>
          <p className="font-body text-muted-foreground mb-8 max-w-xl">
            Ouvrages, films et travaux académiques recommandés.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {bibliographie.map((b, i) => (
              <motion.div
                key={b.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex items-center gap-4 bg-card rounded-xl p-5 border border-border hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center shrink-0">
                  <Book size={18} className="text-brand-brown" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base text-foreground truncate">{b.title}</h3>
                  <p className="font-body text-xs text-muted-foreground">{b.author} · {b.year}</p>
                </div>
                <a
                  href={b.link}
                  className="text-sm font-body font-semibold text-accent hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-1"
                  aria-label={`Voir ${b.title}`}
                >
                  Voir <ExternalLink size={12} />
                </a>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      {/* Footer accent */}
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

export default Archives;
