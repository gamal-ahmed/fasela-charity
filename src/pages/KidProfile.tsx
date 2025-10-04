import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, GraduationCap, BookOpen, Calendar, Award } from "lucide-react";
import { useParams, Link } from "react-router-dom";

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

const KidProfile = () => {
  const { id } = useParams<{ id: string }>();

  const { data: kid, isLoading } = useQuery({
    queryKey: ["kid", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("case_kids")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Fetch case details
      const { data: caseData } = await supabase
        .from("cases")
        .select("id, title, title_ar")
        .eq("id", data.case_id)
        .single();

      return {
        ...data,
        cases: caseData
      } as Kid;
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
      <div className="min-h-screen bg-background" dir="rtl">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!kid) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-xl text-muted-foreground">لم يتم العثور على ملف الطفل</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="text-5xl">{getGenderIcon(kid.gender)}</div>
              <div>
                <CardTitle className="text-3xl mb-2">{kid.name}</CardTitle>
                <Link 
                  to={`/case/${kid.case_id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {kid.cases?.title_ar || kid.cases?.title}
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">
                {kid.age} سنة
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {getGenderText(kid.gender)}
              </Badge>
            </div>

            {kid.description && (
              <div>
                <h3 className="font-semibold mb-2">نبذة</h3>
                <p className="text-muted-foreground">{kid.description}</p>
              </div>
            )}

            {kid.health_state && (
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Heart className="w-5 h-5 text-red-500 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">الحالة الصحية</h3>
                  <p className="text-muted-foreground">{kid.health_state}</p>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {kid.current_grade && (
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <GraduationCap className="w-5 h-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">الصف الدراسي</h3>
                    <p className="text-muted-foreground">{kid.current_grade}</p>
                  </div>
                </div>
              )}

              {kid.school_name && (
                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">المدرسة</h3>
                    <p className="text-muted-foreground">{kid.school_name}</p>
                  </div>
                </div>
              )}
            </div>

            {kid.ongoing_courses && kid.ongoing_courses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">الدورات الحالية</h3>
                </div>
                <div className="space-y-2">
                  {kid.ongoing_courses.map((course: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{typeof course === 'string' ? course : course.name || 'دورة'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kid.certificates && kid.certificates.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">الشهادات والإنجازات</h3>
                </div>
                <div className="grid gap-2">
                  {kid.certificates.map((cert: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{typeof cert === 'string' ? cert : cert.name || 'شهادة'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kid.education_progress && kid.education_progress.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">التقدم التعليمي</h3>
                <div className="space-y-3">
                  {kid.education_progress.map((progress: any, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{typeof progress === 'string' ? progress : progress.description || 'تقدم'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default KidProfile;
