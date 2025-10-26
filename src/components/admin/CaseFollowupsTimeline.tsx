import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Phone, Home, Handshake, FileText } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface CaseFollowupsTimelineProps {
  caseId: string;
}

interface Followup {
  id: string;
  followup_date: string;
  followup_type: string;
  notes: string;
  next_action: string | null;
  created_at: string;
  created_by: string | null;
}

const followupTypeIcons = {
  visit: Home,
  call: Phone,
  meeting: Handshake,
  other: FileText,
};

const followupTypeLabels = {
  visit: "زيارة",
  call: "اتصال",
  meeting: "اجتماع",
  other: "أخرى",
};

const followupTypeColors = {
  visit: "bg-blue-500",
  call: "bg-green-500",
  meeting: "bg-purple-500",
  other: "bg-gray-500",
};

export default function CaseFollowupsTimeline({ caseId }: CaseFollowupsTimelineProps) {
  const { data: followups, isLoading } = useQuery({
    queryKey: ["case-followups", caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_followups")
        .select("*")
        .eq("case_id", caseId)
        .order("followup_date", { ascending: false });

      if (error) throw error;
      return data as Followup[];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        جاري تحميل المتابعات...
      </div>
    );
  }

  if (!followups || followups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>لا توجد متابعات مسجلة لهذه الحالة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute right-[21px] top-8 bottom-0 w-0.5 bg-border" />

        {followups.map((followup, index) => {
          const Icon = followupTypeIcons[followup.followup_type as keyof typeof followupTypeIcons] || FileText;
          const colorClass = followupTypeColors[followup.followup_type as keyof typeof followupTypeColors];

          return (
            <div key={followup.id} className="relative pr-12 pb-8 last:pb-0">
              {/* Timeline dot */}
              <div className={`absolute right-3 top-1.5 h-10 w-10 rounded-full ${colorClass} flex items-center justify-center z-10`}>
                <Icon className="h-5 w-5 text-white" />
              </div>

              <Card className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {followupTypeLabels[followup.followup_type as keyof typeof followupTypeLabels]}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(followup.followup_date), "dd MMM yyyy", {
                        locale: ar,
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">الملاحظات:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {followup.notes}
                    </p>
                  </div>

                  {followup.next_action && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold mb-1 text-amber-900">
                        الإجراء التالي:
                      </h4>
                      <p className="text-sm text-amber-800 whitespace-pre-wrap">
                        {followup.next_action}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    تم التسجيل: {format(new Date(followup.created_at), "dd MMM yyyy - HH:mm", {
                      locale: ar,
                    })}
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
