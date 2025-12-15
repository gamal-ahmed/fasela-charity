import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CasesList from "./pages/CasesList";
import CaseDetails from "./pages/CaseDetails";
import KidsList from "./pages/KidsList";
import KidProfile from "./pages/KidProfile";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import CaseHandoverCalendar from "./pages/CaseHandoverCalendar";
import AdminLayout from "./components/layouts/AdminLayout";
import AdminCasesPage from "./pages/admin/AdminCasesPage";
import AdminKidsPage from "./pages/admin/AdminKidsPage";
import AdminDonationsPage from "./pages/admin/AdminDonationsPage";
import AdminTasksPage from "./pages/admin/AdminTasksPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminCaseProfile from "./pages/AdminCaseProfile";
import AdminFollowupActions from "./pages/AdminFollowupActions";
import AdminCaseView from "./pages/AdminCaseView";
import PublicDonorReport from "./pages/PublicDonorReport";
import MonthlyDonorReport from "./pages/MonthlyDonorReport";
import MonthlyReport from "./pages/MonthlyReport";
import AdminStaticPages from "./pages/admin/AdminStaticPages";
import SelectionCriteria from "./pages/SelectionCriteria";
import FundingChannels from "./pages/FundingChannels";
import CasePipeline from "./pages/CasePipeline";
import Fasela50 from "./pages/Fasela50";
import MomSurvey from "./pages/MomSurvey";
import CaseFollowups from "./pages/CaseFollowups";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import PublicLayout from "./components/layouts/PublicLayout";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Standalone pages without navigation - for case mothers */}
          <Route path="/mom-survey" element={<MomSurvey />} />
          <Route path="/case-followups" element={<CaseFollowups />} />

          {/* Public Routes - Wrapped in PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<CasesList />} />
            <Route path="/cases" element={<CasesList />} />
            <Route path="/case/:id" element={<CaseDetails />} />
            <Route path="/kids" element={<KidsList />} />
            <Route path="/kid/:id" element={<KidProfile />} />
            <Route path="/case-pipeline" element={<CasePipeline />} />
            <Route path="/fasela50" element={<Fasela50 />} />
            <Route path="/selection-criteria" element={<SelectionCriteria />} />
            <Route path="/funding-channels" element={<FundingChannels />} />
            <Route path="/monthly-report" element={<MonthlyReport />} />
            <Route path="/donor-report" element={<PublicDonorReport />} />
            <Route path="/monthly-donor-report" element={<MonthlyDonorReport />} />
          </Route>

          <Route path="/auth" element={<Auth />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/cases" element={<AdminLayout><AdminCasesPage /></AdminLayout>} />
          <Route path="/admin/kids" element={<AdminLayout><AdminKidsPage /></AdminLayout>} />
          <Route path="/admin/calendar" element={<AdminLayout><CaseHandoverCalendar /></AdminLayout>} />
          <Route path="/admin/donations" element={<AdminLayout><AdminDonationsPage /></AdminLayout>} />
          <Route path="/admin/tasks" element={<AdminLayout><AdminTasksPage /></AdminLayout>} />
          <Route path="/admin/reports" element={<AdminLayout><AdminReportsPage /></AdminLayout>} />
          <Route path="/admin/static-pages" element={<AdminLayout><AdminStaticPages /></AdminLayout>} />

          {/* Admin Detail Views - Wrapped in Layout for consistency */}
          <Route path="/admin/case-profile/:id" element={<AdminLayout><AdminCaseProfile /></AdminLayout>} />
          <Route path="/admin/case/:id" element={<AdminLayout><AdminCaseView /></AdminLayout>} />
          <Route path="/admin/followups" element={<AdminLayout><AdminFollowupActions /></AdminLayout>} />


          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
