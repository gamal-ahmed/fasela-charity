import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, User, Calendar, Package, BarChart3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MonthlyHandoverSummary } from "./MonthlyHandoverSummary";

interface HandedOverDonation {
  id: string;
  case_id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  months_pledged: number;
  payment_code: string;
  donation_type: string;
  payment_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  original_donation_amount?: number;
  handover_notes?: string | null;
}

interface CaseWithHandedOverDonations {
  id: string;
  title: string;
  title_ar: string;
  monthly_cost: number;
  total_secured_money: number;
  months_covered: number;
  status: string;
  handedOverDonations: HandedOverDonation[];
}

interface MonthlyData {
  month: string;
  displayMonth: string;
  cases: CaseWithHandedOverDonations[];
  totalAmount: number;
  totalDonations: number;
}

export const HandedOverDonationsByCase = () => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            الملخص الشهري
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            التفاصيل بالحالات
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <MonthlyHandoverSummary />
        </TabsContent>
        
        <TabsContent value="detailed">
          <HandedOverDonationsByCase_Detailed />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const HandedOverDonationsByCase_Detailed = () => {
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const [openCases, setOpenCases] = useState<Set<string>>(new Set());

  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ["handed-over-donations-by-case-monthly"],
    queryFn: async () => {
      // First get all cases
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, title, title_ar, monthly_cost, total_secured_money, months_covered, status")
        .eq("is_published", true)
        .order("title_ar");

      if (casesError) throw casesError;

      // Then get all handover records for these cases with donation details
      const { data: handoverRecords, error: handoversError } = await supabase
        .from("donation_handovers")
        .select(`
          *,
          donations (
            donor_name,
            donor_email,
            amount,
            months_pledged,
            payment_code,
            donation_type,
            payment_reference,
            admin_notes,
            created_at,
            confirmed_at
          )
        `)
        .in("case_id", cases.map(c => c.id))
        .order("handover_date", { ascending: false });

      if (handoversError) throw handoversError;

      // Group handovers by month and case
      const monthlyGroups: { [key: string]: MonthlyData } = {};

      handoverRecords.forEach(handover => {
        const date = new Date(handover.handover_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const displayMonth = date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
        
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = {
            month: monthKey,
            displayMonth,
            cases: [],
            totalAmount: 0,
            totalDonations: 0
          };
        }

        monthlyGroups[monthKey].totalAmount += handover.handover_amount;
        monthlyGroups[monthKey].totalDonations += 1;

        // Find or create case in this month
        let caseInMonth = monthlyGroups[monthKey].cases.find(c => c.id === handover.case_id);
        if (!caseInMonth) {
          const caseData = cases.find(c => c.id === handover.case_id);
          if (caseData) {
            caseInMonth = {
              ...caseData,
              handedOverDonations: []
            };
            monthlyGroups[monthKey].cases.push(caseInMonth);
          }
        }
        
        if (caseInMonth) {
          // Transform handover record to match the old structure
          const handoverWithDonationData = {
            id: handover.id,
            case_id: handover.case_id,
            donor_name: handover.donations?.donor_name || null,
            donor_email: handover.donations?.donor_email || null,
            amount: handover.handover_amount, // Use handover amount instead of original donation amount
            months_pledged: handover.donations?.months_pledged || 0,
            payment_code: handover.donations?.payment_code || '',
            donation_type: handover.donations?.donation_type || 'custom',
            payment_reference: handover.donations?.payment_reference || null,
            admin_notes: handover.handover_notes || handover.donations?.admin_notes || null,
            created_at: handover.handover_date, // Use handover date
            confirmed_at: handover.donations?.confirmed_at || null,
            original_donation_amount: handover.donations?.amount || 0,
            handover_notes: handover.handover_notes
          };
          caseInMonth.handedOverDonations.push(handoverWithDonationData);
        }
      });

      // Convert to array and sort by month (newest first)
      const sortedMonthlyData = Object.values(monthlyGroups).sort((a, b) => b.month.localeCompare(a.month));
      
      return sortedMonthlyData;
    }
  });

  const toggleMonth = (monthKey: string) => {
    const newOpenMonths = new Set(openMonths);
    if (newOpenMonths.has(monthKey)) {
      newOpenMonths.delete(monthKey);
    } else {
      newOpenMonths.add(monthKey);
    }
    setOpenMonths(newOpenMonths);
  };

  const toggleCase = (caseId: string) => {
    const newOpenCases = new Set(openCases);
    if (newOpenCases.has(caseId)) {
      newOpenCases.delete(caseId);
    } else {
      newOpenCases.add(caseId);
    }
    setOpenCases(newOpenCases);
  };

  const getHandedOverStats = (donations: HandedOverDonation[]) => {
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonations = donations.length;
    const monthlyDonations = donations.filter(d => d.donation_type === 'monthly').length;
    const customDonations = donations.filter(d => d.donation_type === 'custom').length;
    
    return {
      totalAmount,
      totalDonations,
      monthlyDonations,
      customDonations,
    };
  };

  // Calculate overall totals
  const overallStats = monthlyData?.reduce((acc, month) => {
    return {
      totalAmount: acc.totalAmount + month.totalAmount,
      totalDonations: acc.totalDonations + month.totalDonations,
      totalCases: acc.totalCases + month.cases.length,
      totalMonths: acc.totalMonths + 1,
    };
  }, { totalAmount: 0, totalDonations: 0, totalCases: 0, totalMonths: 0 }) || { totalAmount: 0, totalDonations: 0, totalCases: 0, totalMonths: 0 };

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">التبرعات المسلمة فعلياً حسب الحالة (شهرياً)</h2>
          <div className="mt-2 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-lg font-bold text-primary">
              إجمالي المبالغ المسلمة: {overallStats.totalAmount.toLocaleString()} جنيه
            </div>
            <div className="text-sm text-muted-foreground">
              من {overallStats.totalDonations} عملية تسليم خلال {overallStats.totalMonths} شهر
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {monthlyData?.length || 0} شهر يحتوي على عمليات تسليم
        </div>
      </div>

      <div className="space-y-6">
        {monthlyData?.map((monthData) => {
          const isMonthOpen = openMonths.has(monthData.month);
          
          return (
            <Card key={monthData.month} className="overflow-hidden">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full" 
                  onClick={() => toggleMonth(monthData.month)}
                >
                  <CardHeader className="pb-3 bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <CardTitle className="text-lg sm:text-xl text-primary">
                          {monthData.displayMonth}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground mt-1">
                          {monthData.cases.length} حالة • {monthData.totalDonations} تبرع مسلم
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {monthData.totalAmount.toLocaleString()} ج.م
                          </div>
                          <div className="text-xs text-muted-foreground">
                            إجمالي الشهر
                          </div>
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-4 space-y-4">
                    {monthData.cases.map((caseItem) => {
                      const stats = getHandedOverStats(caseItem.handedOverDonations);
                      const isCaseOpen = openCases.has(`${monthData.month}-${caseItem.id}`);
                      
                      return (
                        <Card key={caseItem.id} className="border-l-4 border-l-primary/30">
                          <Collapsible>
                            <CollapsibleTrigger 
                              className="w-full" 
                              onClick={() => toggleCase(`${monthData.month}-${caseItem.id}`)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 text-right">
                                    <CardTitle className="text-base">
                                      {caseItem.title_ar}
                                    </CardTitle>
                                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                                      <span>التكلفة الشهرية: {caseItem.monthly_cost?.toLocaleString()} ج.م</span>
                                      <span>•</span>
                                      <span>المؤمن: {caseItem.total_secured_money?.toLocaleString()} ج.م</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-primary">
                                        {stats.totalAmount.toLocaleString()} ج.م مسلم
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {stats.totalDonations} تبرع
                                      </div>
                                    </div>
                                    <ChevronDown 
                                      className={`w-4 h-4 transition-transform ${isCaseOpen ? 'rotate-180' : ''}`} 
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    <Package className="w-3 h-3 ml-1" />
                                    مسلم: {stats.totalDonations}
                                  </Badge>
                                  {stats.monthlyDonations > 0 && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700">
                                      شهري: {stats.monthlyDonations}
                                    </Badge>
                                  )}
                                  {stats.customDonations > 0 && (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                      مخصص: {stats.customDonations}
                                    </Badge>
                                  )}
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-right">المتبرع</TableHead>
                                        <TableHead className="text-right">المبلغ</TableHead>
                                        <TableHead className="text-right">النوع</TableHead>
                                        <TableHead className="text-right">كود الدفع</TableHead>
                                         <TableHead className="text-right">تاريخ التسليم</TableHead>
                                         <TableHead className="text-right">ملاحظات التسليم</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {caseItem.handedOverDonations.map((donation) => (
                                        <TableRow key={donation.id}>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <User className="w-4 h-4" />
                                              <div>
                                                <div className="font-medium">
                                                  {donation.donor_name || 'متبرع مجهول'}
                                                </div>
                                                {donation.donor_email && (
                                                  <div className="text-xs text-muted-foreground">
                                                    {donation.donor_email}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </TableCell>
                                           <TableCell>
                                             <div className="font-medium text-primary">
                                               {donation.amount.toLocaleString()} ج.م مسلم
                                             </div>
                                             {donation.original_donation_amount && donation.original_donation_amount !== donation.amount && (
                                               <div className="text-xs text-muted-foreground">
                                                 من أصل {donation.original_donation_amount.toLocaleString()} ج.م
                                               </div>
                                             )}
                                             {donation.donation_type === 'monthly' && (
                                               <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                 <Calendar className="w-3 h-3" />
                                                 {donation.months_pledged} شهر
                                               </div>
                                             )}
                                           </TableCell>
                                          <TableCell>
                                            {donation.donation_type === 'monthly' ? 'شهري' : 'مخصص'}
                                          </TableCell>
                                          <TableCell>
                                            <span className="font-mono text-sm">
                                              {donation.payment_code}
                                            </span>
                                          </TableCell>
                                          <TableCell>
                                            {new Date(donation.created_at).toLocaleDateString('ar-SA')}
                                          </TableCell>
                                          <TableCell>
                                            <div className="text-xs text-muted-foreground max-w-32 truncate">
                                              {donation.admin_notes || '-'}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
        
        {(!monthlyData || monthlyData.length === 0) && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">لا توجد تبرعات مسلمة بعد</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};