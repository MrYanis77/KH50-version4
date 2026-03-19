import heroTexture from "@/assets/hero-texture.jpg";

const HeroSection = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <img
          src={heroTexture}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      </div>
      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-4">
          LE MUR VIRTUEL
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
          Le Mur Virtuel rassemble les visages et les fragments de mémoire des personnes dont l’histoire continue de vivre à travers les témoignages, les archives et les souvenirs transmis par leurs proches.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
