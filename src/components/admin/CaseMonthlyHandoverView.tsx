import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, Users } from "lucide-react";

interface CaseHandoverData {
  caseId: string;
  caseTitle: string;
  monthlyHandovers: {
    month: string;
    displayMonth: string;
    totalAmount: number;
    handoverCount: number;
  }[];
  totalHandedOver: number;
}

export const CaseMonthlyHandoverView = () => {
  const { data: caseHandovers, isLoading } = useQuery({
    queryKey: ["case-monthly-handovers"],
    queryFn: async () => {
      // Get cases data
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, title, title_ar");

      if (casesError) throw casesError;

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

      // Create case lookup
      const caseLookup = cases.reduce((acc, case_) => {
        acc[case_.id] = case_.title_ar || case_.title;
        return acc;
      }, {} as Record<string, string>);

      // Group by case and month
      const caseGroups: { [caseId: string]: CaseHandoverData } = {};

      // Process new handovers
      handovers.forEach(handover => {
        const date = new Date(handover.handover_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const displayMonthAr = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
        const displayMonthEn = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        const displayMonth = `${displayMonthAr} | ${displayMonthEn}`;

        if (!caseGroups[handover.case_id]) {
          caseGroups[handover.case_id] = {
            caseId: handover.case_id,
            caseTitle: caseLookup[handover.case_id] || 'حالة غير معروفة',
            monthlyHandovers: [],
            totalHandedOver: 0
          };
        }

        let monthData = caseGroups[handover.case_id].monthlyHandovers.find(m => m.month === monthKey);
        if (!monthData) {
          monthData = {
            month: monthKey,
            displayMonth,
            totalAmount: 0,
            handoverCount: 0
          };
          caseGroups[handover.case_id].monthlyHandovers.push(monthData);
        }

        monthData.totalAmount += handover.handover_amount;
        monthData.handoverCount += 1;
        caseGroups[handover.case_id].totalHandedOver += handover.handover_amount;
      });

      // Process legacy donations
      legacyDonations.forEach(donation => {
        const date = new Date(donation.confirmed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const displayMonthAr = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
        const displayMonthEn = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        const displayMonth = `${displayMonthAr} | ${displayMonthEn}`;

        if (!caseGroups[donation.case_id]) {
          caseGroups[donation.case_id] = {
            caseId: donation.case_id,
            caseTitle: caseLookup[donation.case_id] || 'حالة غير معروفة',
            monthlyHandovers: [],
            totalHandedOver: 0
          };
        }

        let monthData = caseGroups[donation.case_id].monthlyHandovers.find(m => m.month === monthKey);
        if (!monthData) {
          monthData = {
            month: monthKey,
            displayMonth,
            totalAmount: 0,
            handoverCount: 0
          };
          caseGroups[donation.case_id].monthlyHandovers.push(monthData);
        }

        monthData.totalAmount += donation.amount;
        monthData.handoverCount += 1;
        caseGroups[donation.case_id].totalHandedOver += donation.amount;
      });

      // Sort monthly handovers by month for each case
      Object.values(caseGroups).forEach(caseData => {
        caseData.monthlyHandovers.sort((a, b) => b.month.localeCompare(a.month));
      });

      return Object.values(caseGroups).sort((a, b) => b.totalHandedOver - a.totalHandedOver);
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold">التبرعات المسلمة لكل حالة شهرياً</h2>
        <div className="text-sm text-muted-foreground">
          {caseHandovers?.length || 0} حالة
        </div>
      </div>

      <div className="space-y-6">
        {caseHandovers?.map((caseData) => (
          <Card key={caseData.caseId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {caseData.caseTitle}
                </CardTitle>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  إجمالي: {caseData.totalHandedOver.toLocaleString()} ج.م
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {caseData.monthlyHandovers.map((monthData) => (
                  <div key={monthData.month} className="p-4 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <div className="text-sm font-medium text-primary">
                        {monthData.displayMonth}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg font-bold">
                        {monthData.totalAmount.toLocaleString()} ج.م
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <Package className="w-3 h-3 ml-1" />
                        {monthData.handoverCount} تسليم
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {(!caseHandovers || caseHandovers.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">لا توجد تبرعات مسلمة بعد</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};