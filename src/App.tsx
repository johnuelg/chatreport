import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import RoutePermissionGuard from "@/components/admin/RoutePermissionGuard";
import AdminLanding from "@/components/admin/AdminLanding";
import Index from "./pages/Index.tsx";

import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminSettings from "./pages/AdminSettings.tsx";
import AdminUsers from "./pages/AdminUsers.tsx";
import Auth from "./pages/Auth.tsx";
import AdminDocuments from "./pages/AdminDocuments.tsx";
import AdminChat from "./pages/AdminChat.tsx";
import AdminBookmarks from "./pages/AdminBookmarks.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin/login" element={<Auth />} />
                <Route path="/admin/landing" element={<AdminLanding />} />
                <Route path="/admin" element={<RoutePermissionGuard><AdminDashboard /></RoutePermissionGuard>} />
                <Route path="/admin/settings" element={<RoutePermissionGuard><AdminSettings /></RoutePermissionGuard>} />
                <Route path="/admin/users" element={<RoutePermissionGuard><AdminUsers /></RoutePermissionGuard>} />
                <Route path="/admin/documents" element={<RoutePermissionGuard><AdminDocuments /></RoutePermissionGuard>} />
                <Route path="/admin/chat" element={<RoutePermissionGuard><AdminChat /></RoutePermissionGuard>} />
                <Route path="/admin/bookmarks" element={<RoutePermissionGuard><AdminBookmarks /></RoutePermissionGuard>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
