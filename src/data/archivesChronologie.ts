/** Contenu de la chronologie historique (Archives). */

export type ChronologieEntry = {
  year: string;
  desc: string;
};

export type ChronologieSection = {
  title: string;
  entries: ChronologieEntry[];
};

export const CHRONOLOGIE_SECTIONS: ChronologieSection[] = [
  {
    title: "Colonisation et premiers déplacements",
    entries: [
      {
        year: "1863",
        desc: "Le Cambodge devient protectorat français sous le roi Norodom Ier, cherchant à préserver le royaume face aux puissances voisines.",
      },
      {
        year: "1916",
        desc: "Plus de 1 000 Cambodgiens, soldats et travailleurs, sont envoyés en France pour soutenir l'effort de guerre : premiers déplacements significatifs vers l'Europe, prémices d'une mémoire diasporique.",
      },
      {
        year: "Années 1920",
        desc: "À Jardin d'agronomie tropicale de Paris, des monuments, dont un stupa, rendent hommage aux soldats indochinois morts pour la France : une mémoire coloniale inscrite dans le paysage français.",
      },
    ],
  },
  {
    title: "Indépendance et fractures",
    entries: [
      {
        year: "1941–1953",
        desc: "Occupation japonaise puis lutte pour l'indépendance menée par Norodom Sihanouk, obtenue en 1953.",
      },
      {
        year: "1953–1970",
        desc: "Un royaume indépendant, officiellement neutre, mais fragilisé par la guerre froide et les tensions internes.",
      },
      {
        year: "18 mars 1970",
        desc: "Coup d'État : Lon Nol renverse Sihanouk et proclame la République khmère.",
      },
      {
        year: "1970–1975",
        desc: "Guerre civile. Depuis l'exil, Sihanouk s'allie aux Khmers rouges, contribuant à leur légitimation auprès des populations rurales.",
      },
    ],
  },
  {
    title: "Génocide et rupture",
    entries: [
      {
        year: "17 avril 1975",
        desc: "Chute de Phnom Penh. Les Khmers rouges instaurent le Kampuchéa démocratique sous Pol Pot : début d'un génocide qui fait près de 2 millions de morts.",
      },
      {
        year: "1975–1979",
        desc: "Déportations massives, destruction des structures sociales, persécution des élites et des minorités. Le centre S-21 devient le symbole de la machine de mort.",
      },
      {
        year: "1975–1978",
        desc: "Retour piégé de centaines d'intellectuels liés au GRUNK depuis l'étranger : beaucoup seront arrêtés, torturés et exécutés.",
      },
    ],
  },
  {
    title: "Exil et naissance de la diaspora en France",
    entries: [
      {
        year: "7 janvier 1979",
        desc: "Chute du régime après l'intervention vietnamienne. Le pays est dévasté.",
      },
      {
        year: "Années 1980",
        desc: "Exils massifs : des centaines de milliers de Cambodgiens fuient vers la France, les États-Unis et d'autres pays. Naissance de la diaspora cambodgienne contemporaine, marquée par le traumatisme et le silence.",
      },
    ],
  },
  {
    title: "Reconstruction politique du Cambodge",
    entries: [
      {
        year: "23 octobre 1991",
        desc: "Accords de paix de Paris : fin officielle du conflit, sous l'égide de l'ONU.",
      },
      {
        year: "1993",
        desc: "Restauration de la monarchie constitutionnelle avec Norodom Sihanouk.",
      },
      {
        year: "1997",
        desc: "Hun Sen consolide durablement son pouvoir.",
      },
    ],
  },
  {
    title: "Justice et reconnaissance internationale",
    entries: [
      {
        year: "Avril 1998",
        desc: "Pol Pot meurt sans avoir été jugé. Longtemps protégé par les équilibres de la guerre froide et l'isolement des zones contrôlées par les Khmers rouges, il échappe à la justice internationale, laissant aux survivants et à la diaspora une mémoire marquée par l'absence de procès du principal responsable du génocide.",
      },
      {
        year: "2003",
        desc: "Création des Chambres extraordinaires au sein des tribunaux cambodgiens (CETC).",
      },
      {
        year: "2010–2022",
        desc: "Condamnations de figures majeures du régime : Duch, Nuon Chea, Khieu Samphan. Une justice tardive, partielle, mais essentielle dans la reconnaissance des crimes contre l'humanité.",
      },
    ],
  },
  {
    title: "Mémoire diasporique et transmission",
    entries: [
      {
        year: "17 avril 2018",
        desc: "À Parc de Choisy à Paris, une première stèle est inaugurée en mémoire des victimes des Khmers rouges : la mémoire du génocide entre dans l'espace public français.",
      },
      {
        year: "17 avril 2025",
        desc: "À Lognes (Seine-et-Marne), la diaspora inaugure le Mémorial KH50, porté par Fragmentis Vitae Asia à l'occasion du cinquantenaire de la Prise de Phnom Penh. Premier monument dédié aux victimes des Khmers rouges érigé hors du Cambodge par la génération née après le génocide.",
      },
    ],
  },
];
