
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";

import MinusPhraseCleaner from "./pages/MinusPhraseCleaner";
import HowToUse from "./pages/HowToUse";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import WordstatParserPage from "./pages/WordstatParserPage";
import ClusteringKeywordsPage from "./pages/ClusteringKeywordsPage";
import YandexDirectOperatorsPage from "./pages/YandexDirectOperatorsPage";
import MinusWordsGeneratorPage from "./pages/MinusWordsGeneratorPage";
import BlogPage from "./pages/BlogPage";
import PricingPage from "./pages/PricingPage";
import AboutUsPage from "./pages/AboutUsPage";
import AdminPage from "./pages/AdminPage";
import RSYAProjects from "./pages/RSYAProjects";
import RSYAProject from "./pages/RSYAProject";
import RSYAAuth from "./pages/RSYAAuth";
import RSYASetup from "./pages/RSYASetup";
import RSYASettings from "./pages/RSYASettings";
import RSYAFilterTester from "./pages/RSYAFilterTester";
import RSYACleaningDashboard from "./pages/RSYACleaningDashboard";
import RSYAWorkersMonitoring from "./pages/RSYAWorkersMonitoring";
import RSYAErrors from "./pages/RSYAErrors";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<ProtectedRoute><Navigate to="/rsya" replace /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><Navigate to="/rsya" replace /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Navigate to="/rsya" replace /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<Auth />} />

          <Route path="/clustering" element={<ProtectedRoute><Navigate to="/rsya" replace /></ProtectedRoute>} />
          <Route path="/clustering/:id" element={<ProtectedRoute><Navigate to="/rsya" replace /></ProtectedRoute>} />

          <Route path="/wordstat" element={<ProtectedRoute><Navigate to="/rsya" replace /></ProtectedRoute>} />
          <Route path="/minus-cleaner" element={<MinusPhraseCleaner />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          
          <Route path="/wordstat-parser" element={<WordstatParserPage />} />
          <Route path="/parser-wordstat" element={<WordstatParserPage />} />
          <Route path="/clustering-keywords" element={<ClusteringKeywordsPage />} />
          <Route path="/klasterizaciya-zaprosov" element={<ClusteringKeywordsPage />} />
          <Route path="/yandex-direct-operators" element={<YandexDirectOperatorsPage />} />
          <Route path="/operatory-sootvetstviya" element={<YandexDirectOperatorsPage />} />
          <Route path="/minus-words-generator" element={<MinusWordsGeneratorPage />} />
          <Route path="/minus-slova" element={<MinusWordsGeneratorPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/tseny" element={<PricingPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/o-nas" element={<AboutUsPage />} />
          <Route path="/project/:id" element={<Navigate to="/rsya" replace />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/rsya" element={<ProtectedRoute><RSYAProjects /></ProtectedRoute>} />
          <Route path="/rsya/:id" element={<ProtectedRoute><RSYAProject /></ProtectedRoute>} />
          <Route path="/rsya/:id/auth" element={<ProtectedRoute><RSYAAuth /></ProtectedRoute>} />
          <Route path="/rsya/:id/setup" element={<ProtectedRoute><RSYASetup /></ProtectedRoute>} />
          <Route path="/rsya/:id/settings" element={<ProtectedRoute><RSYASettings /></ProtectedRoute>} />
          <Route path="/rsya/:id/filter-tester" element={<ProtectedRoute><RSYAFilterTester /></ProtectedRoute>} />
          <Route path="/rsya/:id/test-filters" element={<ProtectedRoute><RSYAFilterTester /></ProtectedRoute>} />
          <Route path="/rsya-agent" element={<ProtectedRoute><RSYAProjects /></ProtectedRoute>} />
          <Route path="/telega-crm" element={<Navigate to="/rsya" replace />} />
	          <Route path="/admin" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />
	          <Route path="/admin/rsya-cleaning" element={<AdminProtectedRoute><RSYACleaningDashboard /></AdminProtectedRoute>} />
	          <Route path="/admin/rsya-workers" element={<AdminProtectedRoute><RSYAWorkersMonitoring /></AdminProtectedRoute>} />
	          <Route path="/admin/errors" element={<AdminProtectedRoute><RSYAErrors /></AdminProtectedRoute>} />
	          <Route path="/admin/*" element={<AdminProtectedRoute><AdminPage /></AdminProtectedRoute>} />
          <Route path="/rsya-cleaning" element={<ProtectedRoute><RSYAProjects /></ProtectedRoute>} />
          <Route path="/chistka-rsya" element={<ProtectedRoute><RSYAProjects /></ProtectedRoute>} />
          <Route path="/cases" element={<Navigate to="/rsya" replace />} />
          <Route path="/keisy" element={<Navigate to="/rsya" replace />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
