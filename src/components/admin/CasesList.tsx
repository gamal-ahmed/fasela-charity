import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Edit, Trash2, ToggleLeft, ToggleRight, FileText, Calendar, Users, ArrowUpDown, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import CaseForm from "./CaseForm";
import { useOrgQueryOptions } from "@/hooks/useOrgQuery";

type SortOption = "created_at_desc" | "created_at_asc" | "name_asc" | "name_desc" | "followups_desc" | "kids_desc" | "confirmed_desc";

const CasesList = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("created_at_desc");
  const [showOnlyWithFollowups, setShowOnlyWithFollowups] = useState(false);
  const { toast } = useToast();
  const { orgId, enabled } = useOrgQueryOptions();

  const { data: cases, refetch } = useQuery({
    queryKey: ["admin-cases", orgId],
    queryFn: async () => {
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }) as any;

      if (casesError) throw casesError;

      // Get confirmed donations for each case
      const { data: confirmedDonations, error: confirmedError } = await supabase
        .from("donations")
        .select("case_id, amount")
        .eq("organization_id", orgId)
        .eq("status", "confirmed") as any;

      if (confirmedError) throw confirmedError;

      // Get legacy redeemed donations for each case
      const { data: redeemedDonations, error: redeemedError } = await supabase
        .from("donations")
        .select("case_id, amount")
        .eq("organization_id", orgId)
        .eq("status", "redeemed") as any;

      if (redeemedError) throw redeemedError;

      // Get new handover amounts from donation_handovers table
      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("case_id, handover_amount")
        .eq("organization_id", orgId) as any;

      if (handoversError) throw handoversError;

      // Get kids count for each case
      const { data: kids, error: kidsError } = await supabase
        .from("case_kids")
        .select("case_id")
        .eq("organization_id", orgId) as any;

      if (kidsError) throw kidsError;

      // Get pending followups for each case
      const { data: followups, error: followupsError } = await supabase
        .from("followup_actions")
        .select("case_id, status")
        .eq("organization_id", orgId)
        .neq("status", "completed") as any;

      if (followupsError) throw followupsError;

      // Calculate totals for each case
      const casesWithFinancials = casesData.map(caseItem => {
        const confirmedAmount = confirmedDonations
          .filter(donation => donation.case_id === caseItem.id)
          .reduce((sum, donation) => sum + donation.amount, 0);

        const redeemedAmount = redeemedDonations
          .filter(donation => donation.case_id === caseItem.id)
          .reduce((sum, donation) => sum + donation.amount, 0);

        const handoverAmount = handovers
          .filter(handover => handover.case_id === caseItem.id)
          .reduce((sum, handover) => sum + handover.handover_amount, 0);

        const kidsCount = kids.filter(k => k.case_id === caseItem.id).length;
        const pendingFollowupsCount = followups.filter(f => f.case_id === caseItem.id).length;

        const totalHandedOver = redeemedAmount + handoverAmount;
        const remainingAmount = confirmedAmount - totalHandedOver;

        return {
          ...caseItem,
          confirmed_amount: confirmedAmount,
          handed_over_amount: totalHandedOver,
          remaining_amount: remainingAmount,
          kids_count: kidsCount,
          pending_followups_count: pendingFollowupsCount
        };
      });

      return casesWithFinancials;
    },
    enabled: !!orgId,
  });

  const togglePublished = async (caseId: string, currentStatus: boolean) => {
    setLoading(caseId);
    try {
      const { error } = await supabase
        .from("cases")
        .update({ is_published: !currentStatus })
        .eq("id", caseId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: `تم ${!currentStatus ? "نشر" : "إخفاء"} الحالة بنجاح`,
      });

      refetch();
    } catch (error) {
      console.error("Error updating case:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحالة",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const deleteCase = async (caseId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الحالة؟ سيتم حذف جميع البيانات المرتبطة بها.")) {
      return;
    }

    setLoading(caseId);
    try {
      // Delete related data first
      await supabase.from("monthly_needs").delete().eq("case_id", caseId);
      await supabase.from("monthly_reports").delete().eq("case_id", caseId);
      await supabase.from("pledges").delete().eq("case_id", caseId);

      // Then delete the case
      const { error } = await supabase
        .from("cases")
        .delete()
        .eq("id", caseId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الحالة بنجاح",
      });

      refetch();
    } catch (error) {
      console.error("Error deleting case:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الحالة",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    if (!cases) return [];

    let filtered = [...cases];

    // Filter by pending followups
    if (showOnlyWithFollowups) {
      filtered = filtered.filter(c => c.pending_followups_count > 0);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "created_at_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "created_at_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return (a.title_ar || a.title || "").localeCompare(b.title_ar || b.title || "", "ar");
        case "name_desc":
          return (b.title_ar || b.title || "").localeCompare(a.title_ar || a.title || "", "ar");
        case "followups_desc":
          return (b.pending_followups_count || 0) - (a.pending_followups_count || 0);
        case "kids_desc":
          return (b.kids_count || 0) - (a.kids_count || 0);
        case "confirmed_desc":
          return (b.confirmed_amount || 0) - (a.confirmed_amount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [cases, sortBy, showOnlyWithFollowups]);

  if (!cases) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">إدارة الحالات</h2>
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter: Show only with pending followups */}
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Switch
              id="followup-filter"
              checked={showOnlyWithFollowups}
              onCheckedChange={setShowOnlyWithFollowups}
            />
            <Label htmlFor="followup-filter" className="text-sm cursor-pointer">
              متابعات معلقة فقط
            </Label>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">الأحدث أولاً</SelectItem>
                <SelectItem value="created_at_asc">الأقدم أولاً</SelectItem>
                <SelectItem value="name_asc">الاسم (أ - ي)</SelectItem>
                <SelectItem value="name_desc">الاسم (ي - أ)</SelectItem>
                <SelectItem value="followups_desc">المتابعات الأكثر</SelectItem>
                <SelectItem value="kids_desc">الأطفال الأكثر</SelectItem>
                <SelectItem value="confirmed_desc">التبرعات الأعلى</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            عرض: {filteredAndSortedCases.length} من {cases.length}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAndSortedCases.map((caseItem) => (
          <Card
            key={caseItem.id}
            className={`transition-all ${caseItem.pending_followups_count > 0 ? 'border-2 border-yellow-400 bg-yellow-50/30' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {caseItem.admin_profile_picture_url ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                      <img
                        src={caseItem.admin_profile_picture_url}
                        alt={caseItem.title_ar || caseItem.title || "Case"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <div className="text-2xl">💙</div>
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {caseItem.title_ar || caseItem.title}
                      {caseItem.pending_followups_count > 0 && (
                        <Badge variant="destructive" className="mr-2 animate-pulse bg-yellow-500 hover:bg-yellow-600 text-white border-none">
                          متابعة مطلوبة
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {caseItem.short_description_ar || caseItem.short_description}
                    </p>

                    {/* New Key Metrics Row */}
                    <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span>{caseItem.kids_count} أطفال</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <FileText className={`w-4 h-4 ${caseItem.pending_followups_count > 0 ? 'text-red-500' : 'text-green-500'}`} />
                        <span className={caseItem.pending_followups_count > 0 ? 'text-red-600 font-bold' : ''}>
                          {caseItem.pending_followups_count} متابعات معلقة
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                        <span className="font-bold text-green-700">{caseItem.confirmed_amount?.toLocaleString() || 0}</span>
                        <span className="text-xs">جمعة دخل</span>
                      </div>
                    </div>

                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={caseItem.is_published ? "default" : "secondary"}>
                    {caseItem.is_published ? "منشورة" : "مخفية"}
                  </Badge>
                  <Badge variant="outline">
                    {caseItem.status === "active" ? "نشطة" : "مكتملة"}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid md:grid-cols-5 gap-4 mb-4 pt-4 border-t">
                <div className="text-sm">
                  <span className="font-medium">التكلفة الشهرية:</span>
                  <br />
                  {caseItem.monthly_cost?.toLocaleString()} جنيه
                </div>
                <div className="text-sm">
                  <span className="font-medium">التقدم:</span>
                  <br />
                  {caseItem.months_covered} من {caseItem.months_needed} شهر
                </div>
                <div className="text-sm">
                  <span className="font-medium">التبرعات المؤكدة:</span>
                  <br />
                  <span className="text-green-600 font-semibold">
                    {caseItem.confirmed_amount?.toLocaleString() || 0} جنيه
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">المسلم للعائلة:</span>
                  <br />
                  <span className="text-blue-600 font-semibold">
                    {caseItem.handed_over_amount?.toLocaleString() || 0} جنيه
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">المتبقي للتسليم:</span>
                  <br />
                  <span className={`font-semibold ${(caseItem.remaining_amount || 0) > 0 ? 'text-orange-600' : 'text-gray-500'
                    }`}>
                    {caseItem.remaining_amount?.toLocaleString() || 0} جنيه
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" asChild>
                  <Link to={`/admin/case/${caseItem.id}`}>
                    <Eye className="w-4 h-4 ml-1" />
                    عرض الملف الكامل
                  </Link>
                </Button>

                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" asChild title="التقويم">
                    <Link to={`/admin/case/${caseItem.id}?tab=handovers`}>
                      <Calendar className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild title="المتابعات">
                    <Link to={`/admin/case/${caseItem.id}?tab=followups`}>
                      <FileText className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild title="الأطفال">
                    <Link to={`/admin/case/${caseItem.id}?tab=kids`}>
                      <Users className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>

                <Dialog open={editingCase === caseItem.id} onOpenChange={(open) => setEditingCase(open ? caseItem.id : null)}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 ml-1" />
                      تعديل
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>تعديل الحالة</DialogTitle>
                    </DialogHeader>
                    <CaseForm
                      caseId={caseItem.id}
                      onSuccess={() => {
                        setEditingCase(null);
                        refetch();
                      }}
                    />
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => togglePublished(caseItem.id, caseItem.is_published)}
                  disabled={loading === caseItem.id}
                >
                  {caseItem.is_published ? (
                    <ToggleRight className="w-4 h-4 ml-1" />
                  ) : (
                    <ToggleLeft className="w-4 h-4 ml-1" />
                  )}
                  {caseItem.is_published ? "إخفاء" : "نشر"}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteCase(caseItem.id)}
                  disabled={loading === caseItem.id}
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAndSortedCases.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {showOnlyWithFollowups ? "لا توجد حالات بمتابعات معلقة" : "لا توجد حالات بعد"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CasesList;