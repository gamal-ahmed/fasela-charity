import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FamilyProfile } from "@/components/FamilyProfile";
import { DonationSection } from "@/components/DonationSection";
import { FeaturedCasesCarousel } from "@/components/FeaturedCasesCarousel";
import { Heart, ArrowLeft } from "lucide-react";

export default function OrgDashboard() {
  const { orgSlug } = useParams();

  // Fetch organization by slug
  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = useQuery({
    queryKey: ["org-by-slug", orgSlug],
    queryFn: async () => {
      if (!orgSlug) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", orgSlug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgSlug,
  });

  // Fetch first featured case for this organization
  const { data: featuredCase, isLoading: caseLoading } = useQuery({
    queryKey: ["org-featured-case", org?.id],
    queryFn: async () => {
      if (!org?.id) return null;

      // Fetch first featured published case for this organization
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("*")
        .eq("organization_id", org.id)
        .eq("is_published", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (caseError) {
        // No featured case found is not an error
        if (caseError.code === "PGRST116") return null;
        throw caseError;
      }

      // Fetch donation stats for this case
      const { data: donations } = await supabase
        .from("donations")
        .select("amount")
        .eq("case_id", caseData.id)
        .eq("status", "confirmed");

      const totalSecured =
        donations?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;

      return {
        ...caseData,
        total_secured_money: totalSecured,
      };
    },
    enabled: !!org?.id,
  });

  // Loading state
  if (orgLoading || caseLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="gradient-hero text-white py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="h-8 w-48 bg-white/20 rounded animate-pulse mx-auto mb-4" />
            <div className="h-6 w-64 bg-white/10 rounded animate-pulse mx-auto" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-80 animate-pulse bg-muted" />
            </div>
            <div>
              <Card className="h-80 animate-pulse bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Organization not found
  if (orgError || !org) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">المنظمة غير موجودة</h2>
            <p className="text-muted-foreground mb-6">
              لم نتمكن من العثور على المنظمة المطلوبة. قد تكون غير نشطة أو الرابط
              غير صحيح.
            </p>
            <Button asChild>
              <Link to="/">العودة للصفحة الرئيسية</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare family profile data from the featured case
  const familyData = featuredCase
    ? {
        familyName: featuredCase.title_ar || featuredCase.title || "عائلة",
        location: featuredCase.city || featuredCase.area || "",
        familySize: featuredCase.kids_number || 0,
        members: [], // Cases don't store individual members
        story:
          featuredCase.description_ar ||
          featuredCase.description ||
          featuredCase.short_description_ar ||
          featuredCase.short_description ||
          "",
        image:
          featuredCase.photo_url ||
          "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=300&fit=crop",
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Organization Branding */}
      <div className="relative gradient-hero text-white py-12 sm:py-16 lg:py-20 overflow-hidden">
        <div className="relative container mx-auto px-4 text-center">
          {org.logo_url && (
            <img
              src={org.logo_url}
              alt={org.name}
              className="mx-auto h-20 sm:h-24 mb-4 rounded-lg bg-white/10 p-2"
            />
          )}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {org.name}
          </h1>
          {(org.settings as { description?: string })?.description && (
            <p className="text-lg sm:text-xl opacity-90 max-w-3xl mx-auto leading-relaxed mb-6">
              {(org.settings as { description?: string }).description}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="text-base sm:text-lg px-6 sm:px-8"
            >
              <Link to={`/o/${orgSlug}/cases`}>تصفح جميع الحالات</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base sm:text-lg px-6 sm:px-8 bg-transparent text-white border-white hover:bg-white hover:text-primary"
            >
              <Link to="/">
                <ArrowLeft className="w-4 h-4 ml-2" />
                الصفحة الرئيسية
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {featuredCase && familyData ? (
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Featured Case Info */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              <div className="text-center lg:text-right mb-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                  حالة مميزة
                </h2>
                <p className="text-muted-foreground">
                  إحدى الحالات المميزة التي تحتاج دعمكم
                </p>
              </div>
              <FamilyProfile {...familyData} />
            </div>

            {/* Right Column - Donation Section */}
            <div className="space-y-6">
              <DonationSection
                monthlyNeed={featuredCase.monthly_cost || 0}
                caseStatus={featuredCase.status}
                monthsCovered={featuredCase.months_covered || 0}
                monthsNeeded={featuredCase.months_needed || 1}
                paymentCode={featuredCase.payment_code}
                caseTitle={
                  featuredCase.title_ar || featuredCase.title || "حالة"
                }
                caseId={featuredCase.id}
                caseCareType={featuredCase.case_care_type as 'cancelled' | 'sponsorship' | 'one_time_donation'}
                totalSecured={featuredCase.total_secured_money || 0}
              />
            </div>
          </div>
        ) : (
          // No featured cases fallback
          <Card className="max-w-2xl mx-auto">
            <CardContent className="text-center py-12">
              <Heart className="w-16 h-16 text-primary/40 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                لا توجد حالات مميزة حالياً
              </h2>
              <p className="text-muted-foreground mb-6">
                لم يتم تحديد أي حالة كمميزة لهذه المنظمة بعد. يمكنك تصفح جميع
                الحالات المتاحة.
              </p>
              <Button asChild size="lg">
                <Link to={`/o/${orgSlug}/cases`}>تصفح جميع الحالات</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Featured Cases Carousel - Organization Scoped */}
        <div className="mt-12 lg:mt-16">
          <FeaturedCasesCarousel organizationId={org.id} />
        </div>
      </div>
    </div>
  );
}
