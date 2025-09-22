import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, TrendingUp } from "lucide-react";

interface MonthlyHandoverData {
  month: string;
  displayMonth: string;
  totalAmount: number;
  totalHandovers: number;
  uniqueCases: number;
}

export const MonthlyHandoverSummary = () => {
  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ["monthly-handover-summary"],
    queryFn: async () => {
      // Get new partial handovers
      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("handover_amount, handover_date, case_id")
        .order("handover_date", { ascending: false });

      if (handoversError) throw handoversError;

      // Get legacy handed over donations (redeemed status)
      const { data: legacyDonations, error: legacyError } = await supabase
        .from("donations")
        .select("amount, confirmed_at, case_id")
        .eq("status", "redeemed")
        .not("confirmed_at", "is", null)
        .order("confirmed_at", { ascending: false });

      if (legacyError) throw legacyError;

      // Group by month
      const monthlyGroups: { [key: string]: MonthlyHandoverData } = {};
      const casesPerMonth: { [key: string]: Set<string> } = {};

      // Process new handovers
      handovers.forEach(handover => {
        const date = new Date(handover.handover_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const displayMonth = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
        
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = {
            month: monthKey,
            displayMonth,
            totalAmount: 0,
            totalHandovers: 0,
            uniqueCases: 0
          };
        }

        if (!casesPerMonth[monthKey]) {
          casesPerMonth[monthKey] = new Set();
        }

        monthlyGroups[monthKey].totalAmount += handover.handover_amount;
        monthlyGroups[monthKey].totalHandovers += 1;
        casesPerMonth[monthKey].add(handover.case_id);
      });

      // Process legacy donations (redeemed ones are considered fully handed over)
      legacyDonations.forEach(donation => {
        const date = new Date(donation.confirmed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const displayMonth = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
        
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = {
            month: monthKey,
            displayMonth,
            totalAmount: 0,
            totalHandovers: 0,
            uniqueCases: 0
          };
        }

        if (!casesPerMonth[monthKey]) {
          casesPerMonth[monthKey] = new Set();
        }

        monthlyGroups[monthKey].totalAmount += donation.amount;
        monthlyGroups[monthKey].totalHandovers += 1;
        casesPerMonth[monthKey].add(donation.case_id);
      });

      // Update unique cases count
      Object.keys(monthlyGroups).forEach(monthKey => {
        monthlyGroups[monthKey].uniqueCases = casesPerMonth[monthKey]?.size || 0;
      });

      return Object.values(monthlyGroups).sort((a, b) => b.month.localeCompare(a.month));
    }
  });

  // Calculate overall totals
  const overallStats = monthlyData?.reduce((acc, month) => ({
    totalAmount: acc.totalAmount + month.totalAmount,
    totalHandovers: acc.totalHandovers + month.totalHandovers,
    totalMonths: acc.totalMonths + 1,
  }), { totalAmount: 0, totalHandovers: 0, totalMonths: 0 }) || { totalAmount: 0, totalHandovers: 0, totalMonths: 0 };

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">ملخص التبرعات المسلمة شهرياً</h2>
          <div className="mt-2 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-lg font-bold text-primary">
              إجمالي المبالغ المسلمة: {overallStats.totalAmount.toLocaleString()} جنيه
            </div>
            <div className="text-sm text-muted-foreground">
              من {overallStats.totalHandovers} عملية تسليم خلال {overallStats.totalMonths} شهر
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {monthlyData?.length || 0} شهر
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {monthlyData?.map((monthData) => (
          <Card key={monthData.month} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {monthData.displayMonth}
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {monthData.totalAmount.toLocaleString()} ج.م
                </div>
                <div className="text-sm text-muted-foreground">
                  إجمالي المبلغ المسلم
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Package className="w-3 h-3 ml-1" />
                  {monthData.totalHandovers} تسليم
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {monthData.uniqueCases} حالة
                </Badge>
              </div>

              <div className="pt-2 border-t border-border/40">
                <div className="text-center text-sm text-muted-foreground">
                  متوسط التسليم: {Math.round(monthData.totalAmount / monthData.totalHandovers).toLocaleString()} ج.م
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {(!monthlyData || monthlyData.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">لا توجد تبرعات مسلمة بعد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};