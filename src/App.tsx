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
import AdminCaseProfile from "./pages/AdminCaseProfile";
import AdminFollowupActions from "./pages/AdminFollowupActions";
import AdminCaseView from "./pages/AdminCaseView";
import AdminCaseListView from "./pages/AdminCaseListView";
import PublicDonorReport from "./pages/PublicDonorReport";
import MonthlyDonorReport from "./pages/MonthlyDonorReport";
import MonthlyReport from "./pages/MonthlyReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CasesList />} />
          <Route path="/cases" element={<CasesList />} />
          <Route path="/case/:id" element={<CaseDetails />} />
          <Route path="/kids" element={<KidsList />} />
          <Route path="/kid/:id" element={<KidProfile />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/calendar" element={<CaseHandoverCalendar />} />
          <Route path="/admin/case-profile/:id" element={<AdminCaseProfile />} />
          <Route path="/admin/followups" element={<AdminFollowupActions />} />
          <Route path="/admin/cases" element={<AdminCaseListView />} />
          <Route path="/admin/case/:id" element={<AdminCaseView />} />
          <Route path="/donor-report" element={<PublicDonorReport />} />
          <Route path="/monthly-donor-report" element={<MonthlyDonorReport />} />
          <Route path="/monthly-report" element={<MonthlyReport />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
