import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MemorialCard from "@/components/MemorialCard";

function renderCard(props: Partial<React.ComponentProps<typeof MemorialCard>> = {}) {
  const defaults = {
    id: 42,
    firstName: "Jean",
    lastName: "Dupont",
    imageSrc: "https://example.com/photo.jpg",
    index: 0,
  };
  return render(
    <MemoryRouter>
      <MemorialCard {...defaults} {...props} />
    </MemoryRouter>
  );
}

describe("MemorialCard", () => {
  it("renders the person's first and last name", () => {
    renderCard();
    // jsdom does not apply CSS transforms, so `uppercase` class does not change text content
    expect(screen.getByText("Jean")).toBeInTheDocument();
    expect(screen.getByText("Dupont")).toBeInTheDocument();
  });

  it("links to the correct memorial profile URL", () => {
    renderCard({ id: 7 });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/memorial/7");
  });

  it("has an accessible aria-label combining first and last name", () => {
    renderCard({ firstName: "Marie", lastName: "Curie" });
    expect(screen.getByRole("link", { name: "Marie Curie" })).toBeInTheDocument();
  });

  it("renders the portrait image when a valid imageSrc is provided", () => {
    renderCard({ firstName: "Ana", lastName: "Vorn" });
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "Portrait de Ana Vorn");
  });

  it("shows a placeholder icon when imageSrc is empty", () => {
    renderCard({ imageSrc: "" });
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows a placeholder icon when imageSrc ends with 'null'", () => {
    renderCard({ imageSrc: "https://api.example.com/assets/null" });
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("shows a placeholder icon when imageSrc ends with 'undefined'", () => {
    renderCard({ imageSrc: "https://api.example.com/assets/undefined" });
    expect(screen.queryByRole("img")).toBeNull();
  });
});
