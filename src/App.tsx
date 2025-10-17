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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
