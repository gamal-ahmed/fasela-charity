import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Heart, GraduationCap, CheckCircle, TrendingUp, Calendar } from "lucide-react";

const PublicDonorReport = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["donor-report-stats"],
    queryFn: async () => {
      // Get total cases
      const { count: totalCases } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      // Get sponsored cases
      const { count: sponsoredCases } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("lifecycle_status", "sponsored");

      // Get completed cases
      const { count: completedCases } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("lifecycle_status", "completed");

      // Get total kids
      const { count: totalKids } = await supabase
        .from("case_kids")
        .select("*", { count: "exact", head: true });

      // Get confirmed donations
      const { data: donations } = await supabase
        .from("donations")
        .select("amount")
        .eq("status", "confirmed");

      const totalDonations = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // Get total donors
      const { data: uniqueDonors } = await supabase
        .from("donations")
        .select("donor_email")
        .eq("status", "confirmed");

      const totalDonors = new Set(uniqueDonors?.map(d => d.donor_email).filter(Boolean)).size;

      return {
        totalCases: totalCases || 0,
        sponsoredCases: sponsoredCases || 0,
        completedCases: completedCases || 0,
        totalKids: totalKids || 0,
        totalDonations,
        totalDonors,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Loading report...</div>
      </div>
    );
  }

  const impactMetrics = [
    {
      icon: Users,
      label: "Families Supported",
      value: stats?.totalCases || 0,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Heart,
      label: "Families Sponsored",
      value: stats?.sponsoredCases || 0,
      color: "from-pink-500 to-rose-500",
      bgColor: "bg-pink-500/10",
    },
    {
      icon: CheckCircle,
      label: "Cases Completed",
      value: stats?.completedCases || 0,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: GraduationCap,
      label: "Children Helped",
      value: stats?.totalKids || 0,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: TrendingUp,
      label: "Total Donations",
      value: `${(stats?.totalDonations || 0).toLocaleString()} EGP`,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Calendar,
      label: "Generous Donors",
      value: stats?.totalDonors || 0,
      color: "from-indigo-500 to-blue-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-block">
            <div className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              <h1 className="text-5xl font-bold mb-2">Impact Report</h1>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Together, we're changing lives and building a better future for families in need
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Updated: {new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {impactMetrics.map((metric, index) => (
            <Card
              key={index}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} rounded-full blur-2xl`} />
              </div>
              
              <div className="p-6 relative">
                <div className={`inline-flex p-3 rounded-xl ${metric.bgColor} mb-4`}>
                  <metric.icon className={`h-6 w-6 bg-gradient-to-br ${metric.color} bg-clip-text text-transparent`} />
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {metric.value}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Success Rate */}
        <Card className="p-8 mb-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Success Rate</h2>
            <div className="flex items-center justify-center gap-8">
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  {stats?.totalCases ? Math.round((stats.completedCases / stats.totalCases) * 100) : 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">Cases Completed</p>
              </div>
              <div className="h-16 w-px bg-border" />
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  {stats?.totalCases ? Math.round((stats.sponsoredCases / stats.totalCases) * 100) : 0}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">Currently Sponsored</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Thank You Message */}
        <Card className="p-8 text-center bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
          <Heart className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Thank You for Your Support</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every donation makes a real difference. Together, we've helped {stats?.totalCases || 0} families 
            and {stats?.totalKids || 0} children build a brighter future. Your generosity creates lasting change.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default PublicDonorReport;
