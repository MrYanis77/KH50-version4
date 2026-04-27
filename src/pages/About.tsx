import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Linkedin, Twitter, Facebook, Instagram, Heart, Handshake, MessageCircle, ExternalLink } from "lucide-react";
import heroTexture from "@/assets/hero-texture.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

// const ctaButtons = [
//   { label: "Adhérer à l'association", icon: Handshake, href: "#" },
//   { label: "Faire un don", icon: Heart, href: "#" },
//   { label: "Témoigner", icon: MessageCircle, href: "#" },
// ];

const missions = [
  "Préserver la mémoire des victimes",
  "Transmettre l'histoire du génocide cambodgien",
  "Rassembler les fragments d'histoires familiales",
  "Construire une mémoire collective",
];

const socials = [
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Twitter, label: "X", href: "#" },
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background font-body">
      

      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <img src={heroTexture} alt="" className="w-full h-full object-cover" aria-hidden="true" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background pointer-events-none" />

        <motion.div
          className="relative z-10 container mx-auto px-4 text-center"
          initial="hidden"
          animate="visible"
        >
          {/* Logo mark */}
          <motion.div
            custom={0}
            variants={fadeUp}
            className="mx-auto mb-6 w-20 h-20 rounded-full  flex items-center justify-center"
          >
            <img src="https://www.fragmentis-vitae.org/images/fragment-rond.svg" alt="fragments KH50 logo" height="100" width="100" />
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="font-display text-4xl md:text-5xl lg:text-6xl tracking-tight text-foreground mb-4"
          >
            Fragments #KH50
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Rassembler nos fragments d'histoires pour reconstituer notre mémoire collective
          </motion.p>
        </motion.div>
      </section>

      {/* Video */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl text-center text-foreground mb-10"
          >
            Présentation du projet Fragments #KH50
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="aspect-video rounded-lg overflow-hidden shadow-lg border border-border"
          >
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/mA8bvEZmCPM?start=40"
              title="Présentation du projet Fragments #KH50"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>
        </div>
      </section>

      {/* Project description */}
      <section className="py-16 md:py-24 fragmentis-diagonal">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-card-foreground leading-relaxed"
          >
            <p>
              Le projet <strong>FRAGMENTS #KH50</strong> a été initié par des descendants de familles
              ayant fui le Cambodge pour se réfugier en France afin de mener un travail de mémoire.
            </p>
            <p>
              Du fait de l'exil et de la guerre, chacun ne possède que quelques fragments de
              l'histoire de sa famille.
            </p>
            <p>
              Porté par l'association loi 1901 <strong>FRAGMENTIS VITAE ASIA</strong>, reconnue
              d'intérêt général, le projet a pour objectif de rassembler ces fragments d'histoires
              personnelles afin de reconstituer la mémoire collective.
            </p>
            <a
              href="https://www.fragmentis-vitae.org/porteurs-projet/"
              className="inline-flex items-center gap-1.5 text-accent font-medium hover:underline text-sm"
            >
              En savoir plus <ExternalLink size={14} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 md:py-24 bg-card/50">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl text-foreground mb-8 text-center"
          >
            Notre mission
          </motion.h2>
          <ul className="space-y-4">
            {missions.map((m, i) => (
              <motion.li
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-start gap-3 text-card-foreground"
              >
                <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />
                <span>{m}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Digital memorial */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-3xl text-foreground mb-6"
          >
            Le mémorial numérique
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-muted-foreground mb-8 leading-relaxed"
          >
            Ce mémorial numérique permet d'honorer les victimes, de transmettre les histoires
            familiales et de préserver les noms dans un espace de mémoire accessible à tous.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link
              to="/memorial"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-md"
            >
              Explorer le mur virtuel
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Social links */}
      <section className="py-12">
        <div className="container mx-auto px-4 flex justify-center gap-5">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              <s.icon size={18} />
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          © 2026 Fragmentis Vitae Asia
        </p>
      </footer>
    </div>
  );
};

export default About;
