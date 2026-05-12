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
      className="group memorial-card flex flex-col overflow-hidden opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`${firstName} ${lastName}`}
    >
      <div className="relative aspect-[3/4] w-full shrink-0 bg-muted overflow-hidden">
        {imageSrc && !imageSrc.endsWith('undefined') && !imageSrc.endsWith('null') ? (
          <img
            src={imageSrc}
            alt={`Portrait de ${firstName} ${lastName}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/40">
            <User size={48} strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="border-t border-border/50 bg-background/95 px-3 py-2.5 text-center">
        <p className="font-display text-sm leading-snug text-foreground sm:text-[15px]">
          <span>{firstName} </span>
          <span className="font-bold uppercase tracking-tight">{lastName}</span>
        </p>
      </div>
    </Link>
  );
};

export default MemorialCard;
