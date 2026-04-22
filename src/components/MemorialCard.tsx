import { Link } from "react-router-dom";
import { User } from "lucide-react";

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
      <div className="relative w-full h-full bg-muted flex items-center justify-center overflow-hidden">
        {imageSrc && !imageSrc.endsWith('undefined') && !imageSrc.endsWith('null') ? (
          <img
            src={imageSrc}
            alt={`Portrait de ${firstName} ${lastName}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/40">
            <User size={48} strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="absolute inset-0 memorial-card-overlay" />
      <div className="absolute bottom-0 left-0 right-0 p-5 text-center translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white font-display text-lg leading-tight drop-shadow-md">
          {firstName}{" "}
          <span className="font-bold uppercase tracking-tight">{lastName}</span>
        </p>
      </div>
    </Link>
  );
};

export default MemorialCard;
