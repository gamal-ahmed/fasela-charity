import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Calendar, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

export const FeaturedCasesCarousel = () => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

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
        .limit(10); // Allow more cases in carousel

      if (casesError) {
        console.error("Error fetching featured cases:", casesError);
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
              .select("handover_amount")
              .eq("case_id", caseItem.id)
          ]);

          const directDonations = donations?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;
          const handoverAmounts = handovers?.reduce((sum, h) => sum + Number(h.handover_amount || 0), 0) || 0;
          const totalSecured = directDonations + handoverAmounts;

          return {
            ...caseItem,
            total_secured_money: totalSecured
          };
        })
      );

      return casesWithStats;
    }
  });

  // Auto-rotate carousel
  useEffect(() => {
    if (!api || !featuredCases || featuredCases.length <= 1) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [api, featuredCases]);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            حالات مميزة تحتاج دعمكم
          </h2>
        </div>
        <Card className="overflow-hidden">
          <div className="h-96 bg-muted animate-pulse" />
        </Card>
      </div>
    );
  }

  if (error) {
    console.error("Featured cases error:", error);
    return null;
  }

  if (!featuredCases || featuredCases.length === 0) {
    return null;
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

      <div className="relative">
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {featuredCases.map((caseItem) => {
              const isOneTime = caseItem.case_care_type === 'one_time_donation';
              const totalNeeded = isOneTime 
                ? caseItem.monthly_cost 
                : (caseItem.monthly_cost * (caseItem.months_needed || 1));
              const progressValue = totalNeeded > 0 
                ? Math.min(((caseItem.total_secured_money || 0) / totalNeeded) * 100, 100)
                : 0;

              return (
                <CarouselItem key={caseItem.id}>
                  <Link to={`/case/${caseItem.id}`} className="block">
                    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary/20 group">
                      <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Section */}
                        {caseItem.photo_url ? (
                          <div className="relative h-64 md:h-96 bg-gray-100">
                            <img 
                              src={caseItem.photo_url} 
                              alt={caseItem.title_ar || caseItem.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                            <div className="absolute top-4 right-4 flex flex-col gap-2">
                              <Badge 
                                variant="default"
                                className="bg-primary/90 text-primary-foreground text-sm px-3 py-1 backdrop-blur-sm"
                              >
                                حالة مميزة
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={
                                  caseItem.case_care_type === 'one_time_donation'
                                    ? "bg-orange-500/90 text-white border-orange-600 text-sm backdrop-blur-sm"
                                    : caseItem.case_care_type === 'cancelled'
                                    ? "bg-gray-500/90 text-white border-gray-600 text-sm backdrop-blur-sm"
                                    : "bg-blue-500/90 text-white border-blue-600 text-sm backdrop-blur-sm"
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
                          <div className="relative h-64 md:h-96 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <Heart className="w-24 h-24 text-primary/40" />
                            <Badge 
                              variant="default"
                              className="absolute top-4 right-4 bg-primary/90 text-primary-foreground text-sm"
                            >
                              حالة مميزة
                            </Badge>
                          </div>
                        )}

                        {/* Content Section */}
                        <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-between bg-gradient-to-br from-background to-muted/30">
                          <div className="flex-1">
                            <h3 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                              {caseItem.title_ar || caseItem.title}
                            </h3>
                            <p className="text-muted-foreground text-base md:text-lg mb-6 line-clamp-3">
                              {caseItem.short_description_ar || caseItem.short_description}
                            </p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-5 h-5 text-primary" />
                                  <span className="text-sm text-muted-foreground">المبلغ الشهري</span>
                                </div>
                                <div className="font-bold text-lg text-primary">
                                  {caseItem.monthly_cost.toLocaleString()} ج.م
                                </div>
                              </div>

                              {!isOneTime && (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm text-muted-foreground">الشهور</span>
                                  </div>
                                  <div className="font-bold text-lg text-blue-600">
                                    {caseItem.months_covered || 0}/{caseItem.months_needed || 1}
                                  </div>
                                </div>
                              )}

                              <div className={`bg-green-50 rounded-lg p-4 border border-green-100 ${!isOneTime ? 'col-span-2' : ''}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <Heart className="w-5 h-5 text-green-600" />
                                  <span className="text-sm text-muted-foreground">المبلغ المجمع</span>
                                </div>
                                <div className="font-bold text-xl text-green-600">
                                  {(caseItem.total_secured_money || 0).toLocaleString()} ج.م
                                </div>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            {progressValue < 100 && (
                              <div className="space-y-2 mb-6">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground font-medium">التقدم المالي</span>
                                  <span className="font-bold text-primary">{Math.round(progressValue)}%</span>
                                </div>
                                <Progress value={progressValue} className="h-3" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{(caseItem.total_secured_money || 0).toLocaleString()} ج.م</span>
                                  <span>{totalNeeded.toLocaleString()} ج.م</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* CTA Button */}
                          <Button 
                            size="lg"
                            className="w-full text-base md:text-lg py-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                            variant="outline"
                          >
                            عرض التفاصيل والمساهمة
                            <ArrowRight className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-2 md:left-4" />
          <CarouselNext className="right-2 md:right-4" />
        </Carousel>

        {/* Dots Indicator */}
        {featuredCases.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {featuredCases.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  current === index 
                    ? "w-8 bg-primary" 
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


