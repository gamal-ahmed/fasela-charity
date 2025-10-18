import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, User, Calendar, CreditCard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DonationDetail {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  total_handed_over: number;
  remaining: number;
  confirmed_at: string;
  case_title: string | null;
  case_title_ar: string | null;
  payment_code: string;
  admin_notes: string | null;
}

interface MonthlyDonationData {
  month: string;
  displayMonth: string;
  totalDonations: number;
  totalHandedOver: number;
  readyToHandover: number;
  confirmedCount: number;
  donations: DonationDetail[];
}

export const MonthlyDonationsView = () => {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(month)) {
        newSet.delete(month);
      } else {
        newSet.add(month);
      }
      return newSet;
    });
  };

  const { data: monthlyData, isLoading } = useQuery({
    queryKey: ["monthly-donations"],
    queryFn: async () => {
      // Fetch all confirmed donations with case details
      const { data: donations, error: donationsError } = await supabase
        .from("donations")
        .select(`
          id,
          amount,
          confirmed_at,
          total_handed_over,
          donor_name,
          donor_email,
          payment_code,
          admin_notes,
          case_id,
          cases (
            title,
            title_ar
          )
        `)
        .eq("status", "confirmed")
        .order("confirmed_at", { ascending: false });

      if (donationsError) throw donationsError;

      // Group by month
      const monthlyGroups: { [key: string]: MonthlyDonationData } = {};

      donations?.forEach((donation) => {
        if (!donation.confirmed_at) return;

        const date = parseISO(donation.confirmed_at);
        const monthKey = format(date, "yyyy-MM");
        const displayMonth = format(date, "MMMM yyyy", { locale: ar });

        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = {
            month: monthKey,
            displayMonth,
            totalDonations: 0,
            totalHandedOver: 0,
            readyToHandover: 0,
            confirmedCount: 0,
            donations: [],
          };
        }

        const amount = parseFloat(donation.amount.toString());
        const handedOver = parseFloat((donation.total_handed_over || 0).toString());
        const remaining = amount - handedOver;

        monthlyGroups[monthKey].totalDonations += amount;
        monthlyGroups[monthKey].totalHandedOver += handedOver;
        monthlyGroups[monthKey].readyToHandover += remaining;
        monthlyGroups[monthKey].confirmedCount += 1;
        
        // Add donation details
        monthlyGroups[monthKey].donations.push({
          id: donation.id,
          donor_name: donation.donor_name,
          donor_email: donation.donor_email,
          amount,
          total_handed_over: handedOver,
          remaining,
          confirmed_at: donation.confirmed_at,
          case_title: donation.cases?.[0]?.title || null,
          case_title_ar: donation.cases?.[0]?.title_ar || null,
          payment_code: donation.payment_code,
          admin_notes: donation.admin_notes,
        });
      });

      // Convert to array and sort by month descending
      return Object.values(monthlyGroups).sort((a, b) => 
        b.month.localeCompare(a.month)
      );
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          لا توجد تبرعات مؤكدة
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = monthlyData.reduce(
    (acc, month) => ({
      totalDonations: acc.totalDonations + month.totalDonations,
      totalHandedOver: acc.totalHandedOver + month.totalHandedOver,
      readyToHandover: acc.readyToHandover + month.readyToHandover,
      confirmedCount: acc.confirmedCount + month.confirmedCount,
    }),
    { totalDonations: 0, totalHandedOver: 0, readyToHandover: 0, confirmedCount: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">ملخص التبرعات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">إجمالي التبرعات</p>
              <p className="text-2xl font-bold text-primary">
                {totals.totalDonations.toFixed(2)} ج.م
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">تم التسليم</p>
              <p className="text-2xl font-bold text-green-600">
                {totals.totalHandedOver.toFixed(2)} ج.م
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">جاهز للتسليم</p>
              <p className="text-2xl font-bold text-orange-600">
                {totals.readyToHandover.toFixed(2)} ج.م
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">عدد التبرعات</p>
              <p className="text-2xl font-bold">{totals.confirmedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">التفصيل الشهري</h3>
        {monthlyData.map((month) => {
          const handoverPercentage = (month.totalHandedOver / month.totalDonations) * 100;
          const isExpanded = expandedMonths.has(month.month);
          
          return (
            <Card key={month.month} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center justify-between">
                  <span>{month.displayMonth}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal text-muted-foreground">
                      {month.confirmedCount} تبرع
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleMonth(month.month)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">نسبة التسليم</span>
                      <span className="font-medium">{handoverPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                        style={{ width: `${handoverPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Amounts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="bg-primary/5 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">إجمالي التبرعات</p>
                      <p className="text-lg font-bold text-primary">
                        {month.totalDonations.toFixed(2)} ج.م
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">تم التسليم</p>
                      <p className="text-lg font-bold text-green-700">
                        {month.totalHandedOver.toFixed(2)} ج.م
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">جاهز للتسليم</p>
                      <p className="text-lg font-bold text-orange-700">
                        {month.readyToHandover.toFixed(2)} ج.م
                      </p>
                    </div>
                  </div>

                  {/* Expanded Donations List */}
                  {isExpanded && (
                    <div className="mt-6 space-y-3 border-t pt-4">
                      <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                        تفاصيل التبرعات ({month.donations.length})
                      </h4>
                      {month.donations.map((donation) => {
                        const donationPercentage = (donation.total_handed_over / donation.amount) * 100;
                        
                        return (
                          <Card key={donation.id} className="bg-muted/30">
                            <CardContent className="pt-4 space-y-3">
                              {/* Donor Info */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {donation.donor_name || "متبرع مجهول"}
                                    </span>
                                  </div>
                                  {donation.donor_email && (
                                    <p className="text-xs text-muted-foreground mr-6">
                                      {donation.donor_email}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {donation.payment_code}
                                </Badge>
                              </div>

                              {/* Case Info */}
                              {donation.case_title_ar && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">الحالة:</span>
                                  <span className="font-medium">{donation.case_title_ar}</span>
                                </div>
                              )}

                              {/* Amount Details */}
                              <div className="grid grid-cols-3 gap-2 pt-2">
                                <div className="bg-background rounded p-2 text-center">
                                  <p className="text-xs text-muted-foreground">المبلغ</p>
                                  <p className="text-sm font-bold text-primary">
                                    {donation.amount.toFixed(2)}
                                  </p>
                                </div>
                                <div className="bg-background rounded p-2 text-center">
                                  <p className="text-xs text-muted-foreground">تم التسليم</p>
                                  <p className="text-sm font-bold text-green-600">
                                    {donation.total_handed_over.toFixed(2)}
                                  </p>
                                </div>
                                <div className="bg-background rounded p-2 text-center">
                                  <p className="text-xs text-muted-foreground">المتبقي</p>
                                  <p className="text-sm font-bold text-orange-600">
                                    {donation.remaining.toFixed(2)}
                                  </p>
                                </div>
                              </div>

                              {/* Mini Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>نسبة التسليم</span>
                                  <span>{donationPercentage.toFixed(0)}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${donationPercentage}%` }}
                                  />
                                </div>
                              </div>

                              {/* Admin Notes */}
                              {donation.admin_notes && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                                  <p className="text-xs font-semibold text-amber-900">ملاحظات الإدارة:</p>
                                  <p className="text-sm text-amber-800 whitespace-pre-wrap">
                                    {donation.admin_notes}
                                  </p>
                                </div>
                              )}

                              {/* Date */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                <CreditCard className="h-3 w-3" />
                                <span>
                                  تم التأكيد: {format(parseISO(donation.confirmed_at), "dd/MM/yyyy", { locale: ar })}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
