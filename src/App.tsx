import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Archives from "./pages/Archives.tsx";
import ArchiveCategory from "./pages/ArchiveCategory.tsx";
import About from "./pages/About.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import MemorialProfile from "./pages/MemorialProfile.tsx";
import MemorialWall from "./pages/MemorialWall.tsx";
import Admin from "./pages/Admin.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import RecueilMemoires from "./pages/RecueilMemoires.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

/** Guard: redirects non-admin users to /auth */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return null; // wait for auth to resolve
  if (!user || !isAdmin) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/archives/:category" element={<ArchiveCategory />} />
            <Route path="/about" element={<About />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/memorial/:id" element={<MemorialProfile />} />
            <Route path="/memorial/" element={<MemorialWall />} />
            <Route path="/recueil" element={<RecueilMemoires />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

