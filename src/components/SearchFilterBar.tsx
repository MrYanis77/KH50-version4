import { Search, LayoutGrid, Users, List, ChevronDown } from "lucide-react";

export type ViewMode = "grid" | "cards" | "list";
export type CountryFilter =
  | "Toutes les personnes"
  | "Vietnam"
  | "Cambodge"
  | "Laos";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // Optionnels pour compatibilité avec les anciennes pages
  selectedCountry?: CountryFilter;
  onCountryChange?: (country: CountryFilter) => void;
  showCountryFilter?: boolean;
}

const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectedCountry = "Toutes les personnes",
  onCountryChange,
  showCountryFilter = true,
}: SearchFilterBarProps) => {
  return (
    <div className="container mx-auto px-4 mb-10">
      <div className="bg-card rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 search-bar-shadow">
        {showCountryFilter && (
          <div className="relative min-w-[200px]">
            <select
              value={selectedCountry}
              onChange={(e) =>
                onCountryChange?.(e.target.value as CountryFilter)
              }
              className="w-full appearance-none bg-secondary text-secondary-foreground rounded-xl px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Filtrer par catégorie"
            >
              <option>Toutes les personnes</option>
              <option>Vietnam</option>
              <option>Cambodge</option>
              <option>Laos</option>
            </select>

            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        )}

        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Recherchez un nom, un prénom, ..."
            className="w-full bg-secondary text-secondary-foreground rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Rechercher une personne"
          />
        </div>

        <div className="flex items-center gap-1 bg-secondary rounded-xl p-1">
          {[
            { mode: "grid" as ViewMode, icon: LayoutGrid, label: "Vue grille" },
            { mode: "cards" as ViewMode, icon: Users, label: "Vue cartes" },
            { mode: "list" as ViewMode, icon: List, label: "Vue liste" },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === mode
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={label}
              aria-pressed={viewMode === mode}
              type="button"
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;