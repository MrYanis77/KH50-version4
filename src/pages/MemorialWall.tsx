import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { allPeople } from "@/data/memorialData";
import HeroSection from "@/components/HeroSection";
import SearchFilterBar from "@/components/SearchFilterBar";
import MemorialCard from "@/components/MemorialCard";
import FloatingBackButton from "@/components/FloatingBackButton";

type ViewMode = "grid" | "cards" | "list";
type CountryFilter = "Toutes les personnes" | "Vietnam" | "Cambodge" | "Laos";

const MemorialWall = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] =
    useState<CountryFilter>("Toutes les personnes");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredPeople = useMemo(() => {
    return allPeople.filter((person) => {
      const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase());

      let matchesCountry = true;

      if (selectedCountry === "Cambodge") {
        matchesCountry =
          person.familyOrigin?.includes("Khmer") ||
          person.familyOrigin?.includes("Cham") ||
          false;
      } else if (selectedCountry === "Vietnam") {
        matchesCountry = person.familyOrigin?.includes("Vietnam") || false;
      } else if (selectedCountry === "Laos") {
        matchesCountry = person.familyOrigin?.includes("Laos") || false;
      }

      return matchesSearch && matchesCountry;
    });
  }, [searchQuery, selectedCountry]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCountry("Toutes les personnes");
    setViewMode("grid");
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <HeroSection />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <AnimatePresence mode="wait">
        {viewMode === "grid" && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {filteredPeople.map((person, index) => (
              <MemorialCard
                key={person.id}
                id={person.id}
                firstName={person.firstName}
                lastName={person.lastName}
                imageSrc={person.imageSrc}
                index={index}
              />
            ))}
          </motion.div>
        )}

        {viewMode === "cards" && (
          <motion.div
            key="cards"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {filteredPeople.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link
                  to={`/memorial/${person.id}`}
                  className="group block overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="grid md:grid-cols-[220px_1fr]">
                    <div className="h-[280px] md:h-full overflow-hidden">
                      <img
                        src={person.imageSrc}
                        alt={`${person.firstName} ${person.lastName}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-6 flex flex-col justify-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                        Fragment de mémoire
                      </p>

                      <h3 className="text-2xl font-semibold text-foreground">
                        {person.firstName}{" "}
                        <span className="uppercase">{person.lastName}</span>
                      </h3>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {person.birthPlace} • {person.birthDate} — {person.deathDate}
                      </p>

                      {person.profession && (
                        <p className="mt-4 text-sm text-foreground/80">
                          {person.profession}
                        </p>
                      )}

                      {person.familyOrigin && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {person.familyOrigin}
                        </p>
                      )}

                      <span className="mt-6 inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                        Voir la mémoire
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {viewMode === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.28 }}
            className="space-y-4"
          >
            {filteredPeople.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Link
                  to={`/memorial/${person.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-muted/40 transition-colors"
                >
                  <img
                    src={person.imageSrc}
                    alt={`${person.firstName} ${person.lastName}`}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {person.birthPlace} • {person.birthDate} — {person.deathDate}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingBackButton />
    </main>
  );
};

export default MemorialWall;