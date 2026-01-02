import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Calendar, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const FeaturedCasesGrid = () => {
  const { data: featuredCases, isLoading, error } = useQuery({
    queryKey: ["featured-cases"],
    queryFn: async () => {
      // Fetch featured cases
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .eq("is_published", true)
        .eq("is_featured", true)
        .not("title_ar", "is", null)
        .not("description_ar", "is", null)
        .order("created_at", { ascending: false })
        .limit(3);

      if (casesError) {
        console.error("Error fetching featured cases:", casesError);
        // If column doesn't exist, return empty array instead of throwing
        if (casesError.message?.includes("column") && casesError.message?.includes("is_featured")) {
          console.warn("is_featured column may not exist yet. Please run the migration.");
          return [];
        }
        throw casesError;
      }

      // Fetch donations and handovers for each case
      const casesWithStats = await Promise.all(
        (cases || []).map(async (caseItem) => {
          const [
            { data: donations },
            { data: handovers }
          ] = await Promise.all([
            supabase
              .from("donations")
              .select("amount")
              .eq("case_id", caseItem.id)
              .eq("status", "confirmed"),
            supabase
              .from("donation_handovers")
              .select("handover_amount, original_case_id")
              .eq("case_id", caseItem.id)
          ]);

          const directDonations = donations?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;

          // Calculate handovers that came from other cases (transfers)
          // We check if original_case_id exists and is different from the current case_id
          const transferredHandovers = handovers?.reduce((sum, h) => {
            if (h.original_case_id && h.original_case_id !== caseItem.id) {
              return sum + Number(h.handover_amount || 0);
            }
            return sum;
          }, 0) || 0;

          const totalSecured = directDonations + transferredHandovers;

          return {
            ...caseItem,
            total_secured_money: totalSecured
          };
        })
      );

      return casesWithStats;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            حالات مميزة تحتاج دعمكم
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-muted animate-pulse" />
              <CardContent className="p-6">
                <div className="h-6 bg-muted animate-pulse rounded mb-4" />
                <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    console.error("Featured cases error:", error);
    return null; // Silently fail if there's an error (likely migration not run)
  }

  if (!featuredCases || featuredCases.length === 0) {
    return null; // Don't show section if no featured cases
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          حالات مميزة تحتاج دعمكم
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          اختر إحدى هذه الحالات المميزة وساهم في تغيير حياة عائلة محتاجة
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredCases.map((caseItem) => {
          const isOneTime = caseItem.case_care_type === 'one_time_donation';
          const totalNeeded = isOneTime
            ? caseItem.monthly_cost
            : (caseItem.monthly_cost * (caseItem.months_needed || 1));
          const progressValue = totalNeeded > 0
            ? Math.min(((caseItem.total_secured_money || 0) / totalNeeded) * 100, 100)
            : 0;

          return (
            <Link key={caseItem.id} to={`/case/${caseItem.id}`}>
              <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col group border-2 border-transparent hover:border-primary/20">
                {/* Image Section */}
                {caseItem.photo_url ? (
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img
                      src={caseItem.photo_url}
                      alt={caseItem.title_ar || caseItem.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Badge
                        variant="default"
                        className="bg-primary/90 text-primary-foreground text-xs px-2 py-1 backdrop-blur-sm"
                      >
                        حالة مميزة
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          caseItem.case_care_type === 'one_time_donation'
                            ? "bg-orange-500/90 text-white border-orange-600 text-xs backdrop-blur-sm"
                            : caseItem.case_care_type === 'cancelled'
                              ? "bg-gray-500/90 text-white border-gray-600 text-xs backdrop-blur-sm"
                              : "bg-blue-500/90 text-white border-blue-600 text-xs backdrop-blur-sm"
                        }
                      >
                        {caseItem.case_care_type === 'one_time_donation'
                          ? 'مساعدة لمرة واحدة'
                          : caseItem.case_care_type === 'cancelled'
                            ? 'ملغاة'
                            : 'كفالة (التزام شهري)'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Heart className="w-16 h-16 text-primary/40" />
                    <Badge
                      variant="default"
                      className="absolute top-3 right-3 bg-primary/90 text-primary-foreground text-xs"
                    >
                      حالة مميزة
                    </Badge>
                  </div>
                )}

                {/* Content Section */}
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {caseItem.title_ar || caseItem.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {caseItem.short_description_ar || caseItem.short_description}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-primary/5 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-primary" />
                          <span className="text-xs text-muted-foreground">المبلغ الشهري</span>
                        </div>
                        <div className="font-bold text-primary">
                          {caseItem.monthly_cost.toLocaleString()} ج.م
                        </div>
                      </div>

                      {!isOneTime && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-muted-foreground">الشهور</span>
                          </div>
                          <div className="font-bold text-blue-600">
                            {caseItem.months_covered || 0}/{caseItem.months_needed || 1}
                          </div>
                        </div>
                      )}

                      <div className={`bg-green-50 rounded-lg p-3 ${!isOneTime ? 'col-span-2' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-muted-foreground">المبلغ المجمع</span>
                        </div>
                        <div className="font-bold text-green-600 text-lg">
                          {(caseItem.total_secured_money || 0).toLocaleString()} ج.م
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {progressValue < 100 && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">التقدم</span>
                          <span className="font-semibold text-primary">{Math.round(progressValue)}%</span>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{(caseItem.total_secured_money || 0).toLocaleString()} ج.م</span>
                          <span>{totalNeeded.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    variant="outline"
                  >
                    عرض التفاصيل
                    <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

