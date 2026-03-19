import { Link } from "react-router-dom";

interface MemorialCardProps {
  id: number;
  firstName: string;
  lastName: string;
  imageSrc: string;
  index: number;
}

const MemorialCard = ({ id, firstName, lastName, imageSrc, index }: MemorialCardProps) => {
  return (
    <Link
      to={`/memorial/${id}`}
      className="memorial-card aspect-[3/4] opacity-0 animate-fade-in block"
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`${firstName} ${lastName}`}
    >
      <img
        src={imageSrc}
        alt={`Portrait de ${firstName} ${lastName}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 memorial-card-overlay" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <p className="text-primary-foreground font-semibold text-base leading-tight">
          {firstName}{" "}
          <span className="font-bold uppercase">{lastName}</span>
        </p>
      </div>
    </Link>
  );
};

export default MemorialCard;
