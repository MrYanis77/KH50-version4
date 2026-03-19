import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FloatingBackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg hover:opacity-90 transition"
      aria-label="Retour"
    >
      <ArrowLeft size={16} />
      Retour
    </button>
  );
};

export default FloatingBackButton;