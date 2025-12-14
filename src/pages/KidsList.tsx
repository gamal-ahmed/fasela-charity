import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import KidCard, { Kid } from "@/components/KidCard";

const KidsList = () => {
  const { data: kids, isLoading } = useQuery({
    queryKey: ["all-kids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_kids")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch case details separately
      const caseIds = [...new Set(data?.map(k => k.case_id) || [])];
      const { data: casesData } = await supabase
        .from("cases")
        .select("id, title, title_ar")
        .in("id", caseIds);

      const casesMap = new Map(casesData?.map(c => [c.id, c]) || []);

      return data?.map(kid => ({
        ...kid,
        cases: casesMap.get(kid.case_id)
      })) as Kid[];
    },
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" />
            ملفات الأطفال
          </h1>
          <p className="text-muted-foreground">
            جميع الأطفال المسجلين في النظام
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-lg text-muted-foreground">
                إجمالي الأطفال: <span className="font-bold text-foreground">{kids?.length || 0}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kids?.map((kid) => (
                <KidCard key={kid.id} kid={kid} />
              ))}
            </div>

            {!kids || kids.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-xl text-muted-foreground">
                    لا يوجد أطفال مسجلين حالياً
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default KidsList;
