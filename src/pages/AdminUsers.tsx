import { Users as UsersIcon, Shield, UserCircle } from "lucide-react";
import { UsersPanel } from "@/components/admin/UsersPanel";

const AdminUsers = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex items-center gap-3 mb-10">
          <UsersIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-display text-foreground">Gestion des comptes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administrateurs et utilisateurs contributeurs.
            </p>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Administrateurs
            </h2>
            <UsersPanel mode="administrators" />
          </section>
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <UserCircle className="h-4 w-4" /> Utilisateurs
            </h2>
            <UsersPanel mode="members" />
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
