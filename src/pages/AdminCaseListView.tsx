import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Eye, 
  Users, 
  Calendar, 
  FileText,
  Heart,
  DollarSign,
  Package,
  ClipboardList
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";

const AdminCaseListView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "followups">("date");

  const { data: cases, isLoading } = useQuery({
    queryKey: ["admin-cases-list"],
    queryFn: async () => {
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (casesError) throw casesError;
      
      // Get confirmed donations for each case
      const { data: confirmedDonations, error: confirmedError } = await supabase
        .from("donations")
        .select("case_id, amount")
        .eq("status", "confirmed");
      
      if (confirmedError) throw confirmedError;
      
      // Get legacy redeemed donations for each case
      const { data: redeemedDonations, error: redeemedError } = await supabase
        .from("donations")
        .select("case_id, amount")
        .eq("status", "redeemed");
      
      if (redeemedError) throw redeemedError;
      
      // Get new handover amounts from donation_handovers table
      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("case_id, handover_amount");
      
      if (handoversError) throw handoversError;
      
      // Get follow-up actions count for each case
      const { data: followups, error: followupsError } = await supabase
        .from("followup_actions")
        .select("case_id");
      
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
        
        const totalHandedOver = redeemedAmount + handoverAmount;
        const remainingAmount = confirmedAmount - totalHandedOver;
        
        const followupCount = followups?.filter(f => f.case_id === caseItem.id).length || 0;
        
        return {
          ...caseItem,
          confirmed_amount: confirmedAmount,
          handed_over_amount: totalHandedOver,
          remaining_amount: remainingAmount,
          followup_count: followupCount
        };
      });
      
      return casesWithFinancials;
    }
  });

  // Filter and sort cases
  const filteredCases = (cases?.filter(caseItem => 
    (caseItem.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     caseItem.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []).sort((a, b) => {
    if (sortBy === "followups") {
      return (b.followup_count || 0) - (a.followup_count || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (isLoading) {
    return (
      <AdminHeader title="إدارة الحالات">
        <div className="text-center py-8">جار التحميل...</div>
      </AdminHeader>
    );
  }

  return (
    <AdminHeader title="إدارة الحالات">
      <div className="space-y-6">
        <div className="mb-8">
          <p className="text-muted-foreground">
            عرض وإدارة جميع الحالات المسجلة في النظام
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث في الحالات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                إجمالي الحالات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cases?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                إجمالي التبرعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cases?.reduce((sum, c) => sum + c.confirmed_amount, 0).toLocaleString() || 0} ج.م
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                مسلم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cases?.reduce((sum, c) => sum + c.handed_over_amount, 0).toLocaleString() || 0} ج.م
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                المتبقي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cases?.reduce((sum, c) => sum + c.remaining_amount, 0).toLocaleString() || 0} ج.م
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((caseItem) => (
            <Link key={caseItem.id} to={`/admin/case/${caseItem.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">💙</div>
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {caseItem.title_ar || caseItem.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant={caseItem.is_published ? "default" : "secondary"}>
                            {caseItem.is_published ? "منشورة" : "غير منشورة"}
                          </Badge>
                          {caseItem.followup_count > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ClipboardList className="w-3 h-3" />
                              {caseItem.followup_count} متابعة
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Financial Summary */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">إجمالي التبرعات:</span>
                      <span className="font-semibold">{caseItem.confirmed_amount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">مسلم:</span>
                      <span className="font-semibold text-green-600">{caseItem.handed_over_amount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">متبقي:</span>
                      <span className="font-semibold text-orange-600">{caseItem.remaining_amount.toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="w-4 h-4 ml-2" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredCases.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "لا توجد حالات تطابق البحث" : "لا توجد حالات مسجلة"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? "جرب البحث بكلمات مختلفة" : "ابدأ بإضافة حالة جديدة"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminHeader>
  );
};

export default AdminCaseListView;
