import { useState, useEffect } from "react";
import { directus } from "@/integration/directus";
import { readUsers, createUser, deleteUser, updateUser, readRoles } from "@directus/sdk";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, Loader2, Key, ShieldCheck } from "lucide-react";

interface DirectusUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string | null;
  status: string;
}

interface DirectusRole {
  id: string;
  name: string;
}

export const UsersPanel = () => {
  const [users, setUsers] = useState<DirectusUser[]>([]);
  const [roles, setRoles] = useState<DirectusRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<DirectusUser> & { password?: string }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        directus.request(readUsers({ limit: -1 })),
        directus.request(readRoles({ limit: -1 }))
      ]);
      setUsers(usersRes as unknown as DirectusUser[]);
      setRoles(rolesRes as unknown as DirectusRole[]);
    } catch (err: any) {
      toast.error("Erreur de chargement des utilisateurs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser.email) {
      toast.error("L'email est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userData: any = {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status || 'active',
      };

      if (editingUser.password) {
        userData.password = editingUser.password;
      }

      if (editingUser.id) {
        await directus.request(updateUser(editingUser.id, userData));
        toast.success("Utilisateur mis à jour");
      } else {
        if (!editingUser.password) {
          toast.error("Le mot de passe est obligatoire pour un nouveau compte.");
          setIsSubmitting(false);
          return;
        }
        await directus.request(createUser(userData));
        toast.success("Utilisateur créé");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    try {
      await directus.request(deleteUser(id));
      toast.success("Supprimé");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getRoleName = (roleId: string | null) => {
    if (!roleId) return "Public / Aucun";
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : "Rôle inconnu";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Gestion des Utilisateurs
        </CardTitle>
        <Button onClick={() => { setEditingUser({ status: 'active' }); setIsDialogOpen(true); }}>
          <Plus size={18} className="mr-2" /> Nouvel Utilisateur
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}` : "—"}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{getRoleName(u.role)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingUser({...u, password: ""}); setIsDialogOpen(true); }}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(u.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser.id ? "Modifier" : "Créer"} un utilisateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input value={editingUser.first_name || ""} onChange={e => setEditingUser(p => ({...p, first_name: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={editingUser.last_name || ""} onChange={e => setEditingUser(p => ({...p, last_name: e.target.value}))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editingUser.email || ""} onChange={e => setEditingUser(p => ({...p, email: e.target.value}))} required />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={editingUser.role || "none"} onValueChange={v => setEditingUser(p => ({...p, role: v === "none" ? null : v}))}>
                <SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Public / Aucun</SelectItem>
                  {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={editingUser.status || "active"} onValueChange={v => setEditingUser(p => ({...p, status: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{editingUser.id ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}</Label>
              <Input type="password" value={editingUser.password || ""} onChange={e => setEditingUser(p => ({...p, password: e.target.value}))} required={!editingUser.id} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
