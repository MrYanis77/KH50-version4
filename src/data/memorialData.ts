import portrait1 from "@/assets/portraits/portrait-1.jpg";
import portrait2 from "@/assets/portraits/portrait-2.jpg";
import portrait3 from "@/assets/portraits/portrait-3.jpg";
import portrait4 from "@/assets/portraits/portrait-4.jpg";
import portrait5 from "@/assets/portraits/portrait-5.jpg";
import portrait6 from "@/assets/portraits/portrait-6.jpg";
import portrait7 from "@/assets/portraits/portrait-7.jpg";
import portrait8 from "@/assets/portraits/portrait-8.jpg";
import portrait9 from "@/assets/portraits/portrait-9.jpg";
import portrait10 from "@/assets/portraits/portrait-10.jpg";
import portrait11 from "@/assets/portraits/portrait-11.jpg";
import portrait12 from "@/assets/portraits/portrait-12.jpg";

export interface LifeEvent {
  year: string;
  description: string;
  photo?: string;
}

export interface MemoryFragment {
  id: number;
  author: string;
  date: string;
  type: "testimony" | "photograph" | "video" | "story" | "document" | "place";
  description: string;
  mediaSrc?: string;
  status: "validated" | "pending";
}

export interface MemorialPerson {
  id: number;
  firstName: string;
  lastName: string;
  imageSrc: string;
  sex?: string;
  birthPlace?: string;
  birthDate?: string;
  deathPlace?: string;
  deathDate?: string;
  profession?: string;
  familyOrigin?: string;
  testimonies?: string[];
  timeline?: LifeEvent[];
  gallery?: string[];
  fragments?: MemoryFragment[];
}

const portraits = [
  portrait1, portrait2, portrait3, portrait4, portrait5, portrait6,
  portrait7, portrait8, portrait9, portrait10, portrait11, portrait12,
];

const names: [string, string][] = [
  ["Vinh", "TRUONG"],
  ["Nguan", "KIM"],
  ["Chuun", "RATTANAVONG"],
  ["Rosa", "PHOK"],
  ["Molina", "PHAM"],
  ["Elise", "CHEAK"],
  ["Lin", "MEI"],
  ["Vanessa", "CHEA"],
  ["Dara", "SUN"],
  ["Sally", "PICH"],
  ["Tix", "TE"],
  ["Sokha", "LY"],
];

const sampleSex = ["Femme", "Homme", "Femme", "Femme", "Femme", "Femme", "Femme", "Femme", "Homme", "Femme", "Homme", "Femme"];
const sampleBirthPlaces = ["Phnom Penh", "Battambang", "Siem Reap", "Kampong Cham", "Takéo", "Prey Veng", "Kandal", "Pursat", "Kampot", "Svay Rieng", "Kratié", "Stung Treng"];
const sampleBirthDates = ["1935", "1942", "1928", "1950", "1947", "1953", "1939", "1955", "1944", "1951", "1937", "1946"];
const sampleDeathPlaces = ["Phnom Penh", "Tuol Sleng (S-21)", "Choeung Ek", "Battambang", "Kampong Cham", "Inconnu", "Prey Veng", "Pursat", "Kampot", "Inconnu", "Kratié", "Phnom Penh"];
const sampleDeathDates = ["1976", "1977", "1978", "1975", "1977", "1979", "1976", "1978", "1975", "1977", "1976", "1978"];
const sampleProfessions = ["Institutrice", "Commerçant", "Danseuse", "Couturière", "Médecin", "Étudiante", "Agricultrice", "Fonctionnaire", "Pêcheur", "Artisan", "Moine", "Sage-femme"];
const sampleOrigins = ["Famille Khmer", "Famille Sino-Khmère", "Famille Khmer", "Famille Cham", "Famille Sino-Khmère", "Famille Khmer", "Famille Khmer", "Famille Khmer", "Famille Khmer", "Famille Cham", "Famille Khmer", "Famille Khmer"];

const sampleTestimonies = [
  [
    "Elle était connue dans tout le quartier pour sa générosité. Chaque matin, elle préparait du riz pour les voisins les plus démunis.",
    "Ma grand-mère me racontait souvent qu'elle chantait des berceuses en khmer ancien, des mélodies que personne d'autre ne connaissait.",
  ],
  [
    "Il tenait une petite échoppe près du marché central. Tout le monde venait lui demander conseil.",
  ],
  [
    "Elle dansait l'Apsara avec une grâce que même les maîtres admiraient. Son art était sa vie.",
    "Lors des fêtes au palais, elle portait toujours un sampot doré qui brillait sous les lanternes.",
  ],
];

const sampleTimelines: LifeEvent[][] = [
  [
    { year: "1935", description: "Naissance à Phnom Penh" },
    { year: "1955", description: "Devient institutrice dans une école de quartier" },
    { year: "1970", description: "Continue d'enseigner malgré les troubles politiques" },
    { year: "1975", description: "Déportée vers les campagnes par les Khmers rouges" },
    { year: "1976", description: "Disparue, présumée décédée" },
  ],
  [
    { year: "1942", description: "Naissance à Battambang" },
    { year: "1962", description: "Ouvre un commerce au marché central" },
    { year: "1975", description: "Arrestation par les Khmers rouges" },
    { year: "1977", description: "Décès à Tuol Sleng (S-21)" },
  ],
  [
    { year: "1928", description: "Naissance à Siem Reap" },
    { year: "1940", description: "Danseuse professionnelle au Ballet Royal" },
    { year: "1955", description: "Aperçue pour la dernière fois à Phnom Penh" },
    { year: "1978", description: "Disparue à Choeung Ek" },
  ],
];

const sampleFragments: MemoryFragment[][] = [
  [
    { id: 1, author: "Marie Truong", date: "2023-04-12", type: "testimony", description: "Ma mère m'a toujours parlé de sa bonté. Elle accueillait tout le monde chez elle sans distinction.", status: "validated" },
    { id: 2, author: "Paul Kem", date: "2024-01-08", type: "photograph", description: "Photo retrouvée dans les archives familiales, datée d'environ 1960.", status: "validated" },
    { id: 3, author: "Anonyme", date: "2024-06-15", type: "story", description: "Un voisin se souvient de ses cours du soir pour les enfants du quartier.", status: "pending" },
  ],
  [
    { id: 4, author: "Sophea Kim", date: "2023-09-20", type: "testimony", description: "Mon grand-père était un homme discret mais respecté de tous au marché.", status: "validated" },
  ],
  [
    { id: 5, author: "Chantrea Sao", date: "2024-02-14", type: "video", description: "Témoignage vidéo d'une ancienne élève qui se souvient de ses danses.", status: "validated" },
    { id: 6, author: "Famille Rattanavong", date: "2024-05-01", type: "document", description: "Copie d'un document administratif mentionnant son nom.", status: "pending" },
  ],
];

// Generate enough people for multiple pages
export const allPeople: MemorialPerson[] = Array.from({ length: 68 * 12 }, (_, i) => {
  const nameIdx = i % names.length;
  const portraitIdx = i % portraits.length;
  return {
    id: i + 1,
    firstName: names[nameIdx][0],
    lastName: names[nameIdx][1],
    imageSrc: portraits[portraitIdx],
    sex: sampleSex[nameIdx],
    birthPlace: sampleBirthPlaces[nameIdx],
    birthDate: sampleBirthDates[nameIdx],
    deathPlace: sampleDeathPlaces[nameIdx],
    deathDate: sampleDeathDates[nameIdx],
    profession: sampleProfessions[nameIdx],
    familyOrigin: sampleOrigins[nameIdx],
    testimonies: sampleTestimonies[i % sampleTestimonies.length],
    timeline: sampleTimelines[i % sampleTimelines.length],
    gallery: [portraits[portraitIdx], portraits[(portraitIdx + 1) % portraits.length], portraits[(portraitIdx + 2) % portraits.length]],
    fragments: sampleFragments[i % sampleFragments.length],
  };
});

export function getPersonById(id: number): MemorialPerson | undefined {
  return allPeople.find((p) => p.id === id);
}
