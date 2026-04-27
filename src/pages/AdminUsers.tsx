import { Shield, Users as UsersIcon } from "lucide-react";
import { UsersPanel } from "@/components/admin/UsersPanel";

const AdminUsers = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-display text-foreground">Gestion des Utilisateurs</h1>
          </div>
        </div>
        
        <UsersPanel />
      </div>
    </div>
  );
};

export default AdminUsers;
