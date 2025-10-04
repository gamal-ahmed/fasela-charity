import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Heart, GraduationCap, BookOpen } from "lucide-react";
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
  case_id: string;
  cases?: {
    title: string;
    title_ar: string;
  };
}

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

  const getGenderIcon = (gender: string) => {
    return gender === "male" ? "👦" : "👧";
  };

  const getGenderText = (gender: string) => {
    return gender === "male" ? "ذكر" : "أنثى";
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navigation />
      
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
                <Link key={kid.id} to={`/kid/${kid.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getGenderIcon(kid.gender)}</div>
                        <div>
                          <CardTitle className="text-xl">{kid.name}</CardTitle>
                          <Link 
                            to={`/case/${kid.case_id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {kid.cases?.title_ar || kid.cases?.title}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                        <div className="flex items-center gap-2 text-sm">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-muted-foreground">الحالة الصحية:</span>
                          <span className="font-medium">{kid.health_state}</span>
                        </div>
                      )}

                      {kid.current_grade && (
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4 text-blue-500" />
                          <span className="text-muted-foreground">الصف:</span>
                          <span className="font-medium">{kid.current_grade}</span>
                        </div>
                      )}

                      {kid.school_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="w-4 h-4 text-green-500" />
                          <span className="text-muted-foreground">المدرسة:</span>
                          <span className="font-medium line-clamp-1">{kid.school_name}</span>
                        </div>
                      )}
                    </div>

                    {kid.ongoing_courses && kid.ongoing_courses.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          الدورات الحالية: {kid.ongoing_courses.length}
                        </p>
                      </div>
                    )}

                    {kid.certificates && kid.certificates.length > 0 && (
                      <div>
                        <Badge variant="outline" className="text-xs">
                          🏆 {kid.certificates.length} شهادة
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
                </Link>
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
