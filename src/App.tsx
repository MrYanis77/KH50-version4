import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Archives from "./pages/Archives.tsx";
import ArchiveCategory from "./pages/ArchiveCategory.tsx";
import About from "./pages/About.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import MemorialProfile from "./pages/MemorialProfile.tsx";
import MemorialWall from "./pages/MemorialWall.tsx";
import Index from "./pages/index.tsx";
import Admin from "./pages/Admin.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import RecueilMemoires from "./pages/RecueilMemoires.tsx";
import Profile from "./pages/Profile.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

/** Guard: redirects non-admin users to /auth */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

/** Guard: redirects unauthenticated users to /auth */
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

/** Layout with Navbar for standard pages */
const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-grow">
      {children}
    </main>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            
            <Route path="/archives" element={<MainLayout><Archives /></MainLayout>} />
            <Route path="/archives/:category" element={<MainLayout><ArchiveCategory /></MainLayout>} />
            <Route path="/about" element={<MainLayout><About /></MainLayout>} />
            <Route path="/auth" element={<MainLayout><Auth /></MainLayout>} />
            <Route path="/reset-password" element={<MainLayout><ResetPassword /></MainLayout>} />
            <Route path="/memorial/:id" element={<MainLayout><MemorialProfile /></MainLayout>} />
            <Route path="/memorial" element={<MainLayout><MemorialWall /></MainLayout>} />
            <Route path="/recueil" element={<MainLayout><RecueilMemoires /></MainLayout>} />
            
            <Route path="/admin" element={<AdminRoute><MainLayout><Admin /></MainLayout></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><MainLayout><AdminUsers /></MainLayout></AdminRoute>} />
            
            <Route path="/profile" element={<PrivateRoute><MainLayout><Profile /></MainLayout></PrivateRoute>} />
            
            <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

