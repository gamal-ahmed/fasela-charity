import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  Calendar,
  FileText,
  Heart,
} from "lucide-react";
import FollowupActionForm from "@/components/admin/FollowupActionForm";
import FollowupActionsList from "@/components/admin/FollowupActionsList";
import { CaseMonthlyHandoverView } from "@/components/admin/CaseMonthlyHandoverView";
import { KidsInfo } from "@/components/KidsInfo";

export default function AdminCaseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [followupFormOpen, setFollowupFormOpen] = useState(false);

  const { data: caseData, isLoading } = useQuery({
    queryKey: ["admin-case-view", id],
    queryFn: async () => {
      // Fetch case data
      const { data: caseInfo, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .single();

      if (caseError) throw caseError;

      // Fetch related data separately
      const [kidsData] = await Promise.all([
        supabase.from("case_kids").select("*").eq("case_id", id),
      ]);

      return {
        ...caseInfo,
        case_kids: kidsData.data || [],
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">جار التحميل...</div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground">الحالة غير موجودة</p>
            <Button asChild className="mt-4">
              <Link to="/admin/cases">العودة لقائمة الحالات</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/cases")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة لقائمة الحالات
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-4xl">💙</div>
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {caseData.title_ar || caseData.title}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={caseData.is_published ? "default" : "secondary"}>
                  {caseData.is_published ? "منشورة" : "غير منشورة"}
                </Badge>
                <Badge variant={caseData.all_donations_handed_over ? "default" : "destructive"}>
                  {caseData.all_donations_handed_over ? "تم تسليم جميع التبرعات" : "لم يتم تسليم جميع التبرعات"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="followups" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="followups" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              المتابعات
            </TabsTrigger>
            <TabsTrigger value="handovers" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              التقويم الشهري
            </TabsTrigger>
            <TabsTrigger value="kids" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              الأطفال
            </TabsTrigger>
          </TabsList>

          {/* Follow-ups Tab */}
          <TabsContent value="followups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>متابعات الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                <FollowupActionsList 
                  caseId={id!} 
                  onCreateNew={() => setFollowupFormOpen(true)} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Handovers Tab */}
          <TabsContent value="handovers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التقويم الشهري للتسليمات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    عرض التسليمات الشهرية للحالة: {caseData.title_ar || caseData.title}
                  </p>
                  <CaseMonthlyHandoverView />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kids Tab */}
          <TabsContent value="kids" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الأبناء</CardTitle>
              </CardHeader>
              <CardContent>
                {caseData.case_kids && Array.isArray(caseData.case_kids) && caseData.case_kids.length > 0 ? (
                  <KidsInfo kids={caseData.case_kids.map((kid: any) => ({
                    id: kid.id,
                    name: kid.name,
                    age: kid.age,
                    gender: kid.gender as 'male' | 'female',
                    description: kid.description || ""
                  }))} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>لا توجد بيانات عن الأبناء</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Follow-up Form Dialog */}
        <FollowupActionForm
          caseId={id!}
          open={followupFormOpen}
          onOpenChange={setFollowupFormOpen}
        />
      </div>
    </div>
  );
}
