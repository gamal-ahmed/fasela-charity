import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingUp, TrendingDown, Users, ClipboardList, DollarSign, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const MonthlyReport = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`);
  
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
    months.push({ value, label });
  }

  const { data: reportData, isLoading } = useQuery({
    queryKey: ["monthly-report", selectedMonth],
    queryFn: async () => {
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

      // Get cases that changed lifecycle_status to 'closed' or 'paused' in this month
      const { data: droppedCases, error: droppedError } = await supabase
        .from("cases")
        .select("id, title_ar, title, lifecycle_status, profile_notes, updated_at")
        .in("lifecycle_status", ["closed", "paused"])
        .gte("updated_at", startDate.toISOString())
        .lte("updated_at", endDate.toISOString());

      if (droppedError) throw droppedError;

      // Get cases created in this month
      const { data: joinedCases, error: joinedError } = await supabase
        .from("cases")
        .select("id, title_ar, title, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (joinedError) throw joinedError;

      // Get follow-ups in this month
      const { data: followups, error: followupsError } = await supabase
        .from("followup_actions")
        .select("id, title, status, cost, action_date, case_id, cases(title_ar, title)")
        .gte("action_date", startDate.toISOString().split('T')[0])
        .lte("action_date", endDate.toISOString().split('T')[0]);

      if (followupsError) throw followupsError;

      // Get donations confirmed in this month
      const { data: donations, error: donationsError } = await supabase
        .from("donations")
        .select("id, amount, donation_type, confirmed_at, case_id, cases(title_ar, title)")
        .eq("status", "confirmed")
        .gte("confirmed_at", startDate.toISOString())
        .lte("confirmed_at", endDate.toISOString());

      if (donationsError) throw donationsError;

      // Get handovers in this month
      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("handover_amount, handover_date")
        .gte("handover_date", startDate.toISOString())
        .lte("handover_date", endDate.toISOString());

      if (handoversError) throw handoversError;

      // Calculate statistics
      const totalDonations = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalHandovers = handovers?.reduce((sum, h) => sum + Number(h.handover_amount), 0) || 0;
      const totalFollowupCost = followups?.reduce((sum, f) => sum + Number(f.cost || 0), 0) || 0;

      // Group follow-ups by status
      const followupsByStatus = followups?.reduce((acc, f) => {
        acc[f.status] = (acc[f.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Group donations by type
      const donationsByType = donations?.reduce((acc, d) => {
        acc[d.donation_type] = (acc[d.donation_type] || 0) + Number(d.amount);
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        droppedCases: droppedCases || [],
        joinedCases: joinedCases || [],
        followups: followups || [],
        donations: donations || [],
        stats: {
          totalDonations,
          totalHandovers,
          totalFollowupCost,
          followupsCount: followups?.length || 0,
          followupsPending: followupsByStatus['pending'] || 0,
          followupsCompleted: followupsByStatus['completed'] || 0,
          droppedCount: droppedCases?.length || 0,
          joinedCount: joinedCases?.length || 0,
        },
        charts: {
          followupsByStatus: Object.entries(followupsByStatus).map(([name, value]) => ({
            name: name === 'pending' ? 'قيد الانتظار' : name === 'completed' ? 'مكتمل' : name,
            value,
          })),
          donationsByType: Object.entries(donationsByType).map(([name, value]) => ({
            name: name === 'monthly' ? 'شهري' : name === 'one_time' ? 'لمرة واحدة' : name,
            value,
          })),
        },
      };
    },
  });

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">جاري التحميل...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">التقرير الشهري</h1>
            <p className="text-muted-foreground text-lg">
              تقرير شامل عن نشاطات المؤسسة والحالات
            </p>
          </div>

          {/* Month Selector */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                اختر الشهر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  حالات جديدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {reportData?.stats.joinedCount || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  حالات متوقفة/مغلقة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {reportData?.stats.droppedCount || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  المتابعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reportData?.stats.followupsCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  مكتمل: {reportData?.stats.followupsCompleted || 0} | 
                  قيد الانتظار: {reportData?.stats.followupsPending || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  التبرعات المؤكدة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {reportData?.stats.totalDonations.toLocaleString('ar-EG')} ج.م
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  تم التسليم: {reportData?.stats.totalHandovers.toLocaleString('ar-EG')} ج.م
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Follow-ups Status Chart */}
            {reportData?.charts.followupsByStatus && reportData.charts.followupsByStatus.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>حالة المتابعات</CardTitle>
                  <CardDescription>توزيع المتابعات حسب الحالة</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.charts.followupsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.charts.followupsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Donations by Type Chart */}
            {reportData?.charts.donationsByType && reportData.charts.donationsByType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>التبرعات حسب النوع</CardTitle>
                  <CardDescription>توزيع مبالغ التبرعات</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.charts.donationsByType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString('ar-EG')} ج.م`} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Joined Cases */}
          {reportData?.joinedCases && reportData.joinedCases.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  الحالات الجديدة ({reportData.joinedCases.length})
                </CardTitle>
                <CardDescription>الحالات التي انضمت هذا الشهر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.joinedCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20"
                    >
                      <div>
                        <p className="font-semibold">{caseItem.title_ar || caseItem.title}</p>
                        <p className="text-sm text-muted-foreground">
                          تاريخ الانضمام: {new Date(caseItem.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        جديد
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dropped Cases */}
          {reportData?.droppedCases && reportData.droppedCases.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  الحالات المتوقفة/المغلقة ({reportData.droppedCases.length})
                </CardTitle>
                <CardDescription>الحالات التي توقفت أو أغلقت هذا الشهر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.droppedCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex flex-col gap-2 p-4 border rounded-lg bg-red-50 dark:bg-red-950/20"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{caseItem.title_ar || caseItem.title}</p>
                        <Badge 
                          variant="outline" 
                          className={
                            caseItem.lifecycle_status === 'closed' 
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-yellow-100 text-yellow-800 border-yellow-300"
                          }
                        >
                          {caseItem.lifecycle_status === 'closed' ? 'مغلقة' : 'متوقفة'}
                        </Badge>
                      </div>
                      {caseItem.profile_notes && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            <strong>السبب:</strong> {caseItem.profile_notes}
                          </AlertDescription>
                        </Alert>
                      )}
                      <p className="text-sm text-muted-foreground">
                        تاريخ التحديث: {new Date(caseItem.updated_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                الملخص المالي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">إجمالي التبرعات المؤكدة</p>
                  <p className="text-2xl font-bold text-primary">
                    {reportData?.stats.totalDonations.toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">المبالغ المسلمة للحالات</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reportData?.stats.totalHandovers.toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">تكلفة المتابعات</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData?.stats.totalFollowupCost.toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Follow-ups Summary */}
          {reportData?.followups && reportData.followups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  ملخص المتابعات ({reportData.followups.length})
                </CardTitle>
                <CardDescription>المتابعات التي تمت هذا الشهر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.followups.slice(0, 10).map((followup) => (
                    <div
                      key={followup.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{followup.title}</p>
                        <p className="text-sm text-muted-foreground">
                          الحالة: {(followup.cases as any)?.title_ar || (followup.cases as any)?.title}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={followup.status === 'completed' ? 'default' : 'secondary'}
                        >
                          {followup.status === 'completed' ? 'مكتمل' : 'قيد الانتظار'}
                        </Badge>
                        {followup.cost && followup.cost > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {Number(followup.cost).toLocaleString('ar-EG')} ج.م
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {reportData.followups.length > 10 && (
                    <p className="text-center text-sm text-muted-foreground pt-2">
                      ... و {reportData.followups.length - 10} متابعة أخرى
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default MonthlyReport;
