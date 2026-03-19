import { useState, useMemo, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import HomeHeroStupa from "@/components/HomeHeroStupa";
import { useStupaSequence, type StupaPhase } from "@/components/StupaOpeningSequence";
import ArchiveRegisterScene from "@/components/ArchiveRegisterScene";
import FragmentisFloatingMenu from "@/components/FragmentisFloatingMenu";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SearchFilterBar from "@/components/SearchFilterBar";
import MemorialCard from "@/components/MemorialCard";
import PaginationBar from "@/components/PaginationBar";
import { allPeople } from "@/data/memorialData";

const ITEMS_PER_PAGE = 12;

type AppScene = "hero" | "register" | "wall";

const Index = () => {
  const [scene, setScene] = useState<AppScene>("hero");
  const [phase, setPhase] = useState<StupaPhase>("idle");
  const prefersReduced = useReducedMotion();

  // Wall state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "cards" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  const handlePhaseChange = useCallback((newPhase: StupaPhase) => {
    setPhase(newPhase);
    if (newPhase === "done") {
      setScene("register");
    }
  }, []);

  const { start: startSequence } = useStupaSequence({
    onPhaseChange: handlePhaseChange,
    reducedMotion: prefersReduced ?? false,
  });

  const handleEnterStupa = useCallback(() => {
    startSequence();
  }, [startSequence]);

  const handleExploreWall = useCallback(() => {
    setScene("wall");
  }, []);

  // Wall filtering
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allPeople;
    const q = searchQuery.toLowerCase();
    return allPeople.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleReset = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const gridCols =
    viewMode === "list"
      ? "grid-cols-1"
      : viewMode === "cards"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";

  // Hero scene
  if (scene === "hero") {
    return (
      <div className="min-h-screen bg-background">
        <FragmentisFloatingMenu />
        <HomeHeroStupa onEnter={handleEnterStupa} phase={phase} />
      </div>
    );
  }

  // Register / archive scene
  if (scene === "register") {
    return (
      <div className="min-h-screen bg-background">
        <FragmentisFloatingMenu />
        <ArchiveRegisterScene visible onExplore={handleExploreWall} />
      </div>
    );
  }

  // Wall scene (existing memorial grid)
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <main className="container mx-auto px-4">
        <div className={`grid ${gridCols} gap-5`}>
          {paginated.map((person, index) => (
            <MemorialCard
              key={person.id}
              id={person.id}
              firstName={person.firstName}
              lastName={person.lastName}
              imageSrc={person.imageSrc}
              index={index}
            />
          ))}
        </div>

        {paginated.length === 0 && (
          <p className="text-center text-muted-foreground py-20 text-lg">
            Aucun résultat trouvé.
          </p>
        )}
      </main>

      <PaginationBar
        currentPage={currentPage}
        totalPages={Math.min(totalPages, 68)}
        onPageChange={setCurrentPage}
      />

    </div>
  );
};

export default Index;
