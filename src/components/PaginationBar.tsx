import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationBar = ({ currentPage, totalPages, onPageChange }: PaginationBarProps) => {
  const getVisiblePages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1, 2, 3);
    if (currentPage > 4) pages.push("...");
    const mid = Math.max(4, Math.min(currentPage, totalPages - 3));
    if (mid > 3 && mid < totalPages - 2) pages.push(mid);
    if (currentPage < totalPages - 3) pages.push("...");
    pages.push(totalPages - 1, totalPages);
    return [...new Set(pages)];
  };

  return (
    <nav className="flex items-center justify-center gap-2 py-10" aria-label="Pagination">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
        aria-label="Page précédente"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      {getVisiblePages().map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
              currentPage === page
                ? "pagination-active"
                : "text-muted-foreground hover:bg-secondary"
            }`}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
        aria-label="Page suivante"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </nav>
  );
};

export default PaginationBar;
