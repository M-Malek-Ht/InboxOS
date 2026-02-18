import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Dashboard from "./pages/Dashboard";
import MarketingPage from "./pages/Index";
import InboxPage from "./pages/InboxPage";
import DraftsPage from "./pages/DraftsPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import CalendarPage from "./pages/CalendarPage";
import SentPage from "./pages/SentPage";
import TrashPage from "./pages/TrashPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <motion.div
      animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
    >
      <Sparkles className="h-5 w-5 text-primary-foreground" />
    </motion.div>
  </div>
);

function AuthGuard() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

function HomeRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <AuthLoading />;
  if (!user) return <MarketingPage />;
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster position="bottom-right" />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/login" element={<LoginPage />} />
              <Route element={<AuthGuard />}>
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/sent" element={<SentPage />} />
                <Route path="/trash" element={<TrashPage />} />
                <Route path="/drafts" element={<DraftsPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Analytics />
        <SpeedInsights />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
