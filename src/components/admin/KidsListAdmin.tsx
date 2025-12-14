import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Heart, GraduationCap, BookOpen, Baby } from "lucide-react";
import { Link } from "react-router-dom";

interface Kid {
  id: string;
  name: string;
  age: number;
  gender: string;
  description?: string;
  health_state?: string;
  current_grade?: string;
  school_name?: string;
  education_progress?: any[];
  certificates?: any[];
  ongoing_courses?: any[];
  hobbies?: string[];
  case_id: string;
  cases?: {
    title: string;
    title_ar: string;
  };
}

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

  const getGenderIcon = (gender: string) => {
    return gender === "male" ? "👦" : "👧";
  };

  const getGenderText = (gender: string) => {
    return gender === "male" ? "ذكر" : "أنثى";
  };

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
        <Link key={kid.id} to={`/kid/${kid.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getGenderIcon(kid.gender)}</div>
                  <div>
                    <CardTitle className="text-lg">{kid.name}</CardTitle>
                    <Link 
                      to={`/case/${kid.case_id}`}
                      className="text-xs text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {kid.cases?.title_ar || kid.cases?.title}
                    </Link>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {kid.age} سنة
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {getGenderText(kid.gender)}
                </Badge>
              </div>

              {kid.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {kid.description}
                </p>
              )}

              <div className="space-y-2">
                {kid.health_state && (
                  <div className="flex items-center gap-2 text-xs">
                    <Heart className="w-3 h-3 text-red-500" />
                    <span className="text-muted-foreground">الحالة الصحية:</span>
                    <span className="font-medium">{kid.health_state}</span>
                  </div>
                )}

                {kid.current_grade && (
                  <div className="flex items-center gap-2 text-xs">
                    <GraduationCap className="w-3 h-3 text-blue-500" />
                    <span className="text-muted-foreground">الصف:</span>
                    <span className="font-medium">{kid.current_grade}</span>
                  </div>
                )}

                {kid.school_name && (
                  <div className="flex items-center gap-2 text-xs">
                    <BookOpen className="w-3 h-3 text-green-500" />
                    <span className="text-muted-foreground">المدرسة:</span>
                    <span className="font-medium line-clamp-1">{kid.school_name}</span>
                  </div>
                )}
              </div>

              {kid.hobbies && kid.hobbies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {kid.hobbies.slice(0, 3).map((hobby, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-100">
                      {hobby}
                    </Badge>
                  ))}
                  {kid.hobbies.length > 3 && (
                    <span className="text-[10px] text-muted-foreground self-center">+{kid.hobbies.length - 3}</span>
                  )}
                </div>
              )}

              {kid.certificates && kid.certificates.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  🏆 {kid.certificates.length} شهادة
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default KidsListAdmin;
