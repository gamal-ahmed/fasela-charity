import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Baby } from "lucide-react";
import KidCard, { Kid } from "@/components/KidCard";

const KidsListAdmin = () => {
  const { data: kids, isLoading } = useQuery({
    queryKey: ["admin-kids-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_kids")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    );
  }

  if (!kids || kids.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Baby className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">
            لا يوجد أطفال مسجلين حالياً
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kids?.map((kid) => (
        <KidCard key={kid.id} kid={kid} />
      ))}
    </div>
  );
};

export default KidsListAdmin;
