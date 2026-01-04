
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";

import ClusteringProjects from "./pages/ClusteringProjects";
import RSYAProjects from "./pages/RSYAProjects";
import RSYAAuth from "./pages/RSYAAuth";
import RSYASetup from "./pages/RSYASetup";
import RSYAProject from "./pages/RSYAProject";
import RSYASettings from "./pages/RSYASettings";
import Index from "./pages/Index";
import Wordstat from "./pages/Wordstat";
import WordstatNew from "./pages/WordstatNew";
import TestClustering from "./pages/TestClustering";
import TestVectorClustering from "./pages/TestVectorClustering";
import MinusPhraseCleaner from "./pages/MinusPhraseCleaner";
import HowToUse from "./pages/HowToUse";
import Subscription from "./pages/Subscription";
import AffiliateProgram from "./pages/AffiliateProgram";
import AdminPage from "./pages/AdminPage";
import AdminAnalytics from "./pages/AdminAnalytics";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import WordstatParserPage from "./pages/WordstatParserPage";
import ClusteringKeywordsPage from "./pages/ClusteringKeywordsPage";
import YandexDirectOperatorsPage from "./pages/YandexDirectOperatorsPage";
import MinusWordsGeneratorPage from "./pages/MinusWordsGeneratorPage";
import RSYACleaningPage from "./pages/RSYACleaningLanding";
import BlogPage from "./pages/BlogPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import AboutUsPage from "./pages/AboutUsPage";
import CasesPage from "./pages/CasesPage";
import RSYACleaningDashboard from "./pages/RSYACleaningDashboard";
import RSYATestCleaning from "./pages/RSYATestCleaning";
import RSYAWorkersMonitoring from "./pages/RSYAWorkersMonitoring";
import RSYAAgent from "./pages/RSYAAgent";
import RSYAFilterTester from "./pages/RSYAFilterTester";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<Auth />} />

          <Route path="/project/:id" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/clustering" element={<ProtectedRoute><ClusteringProjects /></ProtectedRoute>} />
          <Route path="/clustering/:id" element={<ProtectedRoute><TestClustering /></ProtectedRoute>} />
          <Route path="/rsya" element={<ProtectedRoute><RSYAProjects /></ProtectedRoute>} />
          <Route path="/rsya-agent" element={<ProtectedRoute><RSYAAgent /></ProtectedRoute>} />
          <Route path="/rsya/:id" element={<ProtectedRoute><RSYAProject /></ProtectedRoute>} />
          <Route path="/rsya/:id/auth" element={<ProtectedRoute><RSYAAuth /></ProtectedRoute>} />
          <Route path="/rsya/:id/setup" element={<ProtectedRoute><RSYASetup /></ProtectedRoute>} />
          <Route path="/rsya/:id/settings" element={<ProtectedRoute><RSYASettings /></ProtectedRoute>} />
          <Route path="/rsya/:id/test-filters" element={<ProtectedRoute><RSYAFilterTester /></ProtectedRoute>} />

          <Route path="/wordstat" element={<ProtectedRoute><WordstatNew /></ProtectedRoute>} />
          <Route path="/wordstat-old" element={<ProtectedRoute><Wordstat /></ProtectedRoute>} />
          <Route path="/test-vector" element={<TestVectorClustering />} />
          <Route path="/minus-cleaner" element={<MinusPhraseCleaner />} />
          <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
          <Route path="/affiliate" element={<ProtectedRoute><AffiliateProgram /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          
          <Route path="/wordstat-parser" element={<WordstatParserPage />} />
          <Route path="/parser-wordstat" element={<WordstatParserPage />} />
          <Route path="/clustering-keywords" element={<ClusteringKeywordsPage />} />
          <Route path="/klasterizaciya-zaprosov" element={<ClusteringKeywordsPage />} />
          <Route path="/yandex-direct-operators" element={<YandexDirectOperatorsPage />} />
          <Route path="/operatory-sootvetstviya" element={<YandexDirectOperatorsPage />} />
          <Route path="/minus-words-generator" element={<MinusWordsGeneratorPage />} />
          <Route path="/minus-slova" element={<MinusWordsGeneratorPage />} />
          <Route path="/rsya-cleaning" element={<RSYACleaningPage />} />
          <Route path="/chistka-rsya" element={<RSYACleaningPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/tseny" element={<PricingPage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/o-nas" element={<AboutUsPage />} />
          <Route path="/cases" element={<CasesPage />} />
          <Route path="/keisy" element={<CasesPage />} />
          <Route path="/admin/rsya-cleaning" element={<RSYACleaningDashboard />} />
          <Route path="/admin/rsya-workers" element={<RSYAWorkersMonitoring />} />
          <Route path="/rsya-test-cleaning" element={<RSYATestCleaning />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;