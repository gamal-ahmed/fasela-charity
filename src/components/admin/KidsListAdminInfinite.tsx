import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Heart, GraduationCap, BookOpen, Baby, User } from "lucide-react";
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

const PAGE_SIZE = 12;

const KidsListAdminInfinite = () => {
    // Fetch statistics
    const { data: stats } = useQuery({
        queryKey: ["kids-stats"],
        queryFn: async () => {
            const { data: kids, error } = await supabase
                .from("case_kids")
                .select("gender");

            if (error) throw error;

            const total = kids?.length || 0;
            const boys = kids?.filter(k => k.gender === "male").length || 0;
            const girls = kids?.filter(k => k.gender === "female").length || 0;

            return { total, boys, girls };
        },
    });

    // Fetch kids with infinite scroll
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ["admin-kids-infinite"],
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data: kidsData, error } = await supabase
                .from("case_kids")
                .select("*")
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Fetch case details separately
            const caseIds = [...new Set(kidsData?.map(k => k.case_id) || [])];
            const { data: casesData } = await supabase
                .from("cases")
                .select("id, title, title_ar")
                .in("id", caseIds);

            const casesMap = new Map(casesData?.map(c => [c.id, c]) || []);

            return kidsData?.map(kid => ({
                ...kid,
                cases: casesMap.get(kid.case_id)
            })) as Kid[];
        },
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.length < PAGE_SIZE) return undefined;
            return pages.length;
        },
        initialPageParam: 0,
    });

    const kids = data?.pages.flat() || [];

    const getGenderIcon = (gender: string) => {
        return gender === "male" ? "👦" : "👧";
    };

    const getGenderText = (gender: string) => {
        return gender === "male" ? "ذكر" : "أنثى";
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-8 w-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-12 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
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
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الأطفال</CardTitle>
                        <Baby className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            جميع الأطفال المسجلين
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الأولاد</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.boys || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.total ? Math.round((stats.boys / stats.total) * 100) : 0}% من الإجمالي
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-pink-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">البنات</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.girls || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.total ? Math.round((stats.girls / stats.total) * 100) : 0}% من الإجمالي
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Kids Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kids?.map((kid) => (
                    <Link key={kid.id} to={`/kid/${kid.id}`}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
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

            {/* Load More Button */}
            {hasNextPage && (
                <div className="flex justify-center pt-4">
                    <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                        size="lg"
                    >
                        {isFetchingNextPage ? "جار التحميل..." : "تحميل المزيد"}
                    </Button>
                </div>
            )}

            {/* Empty State */}
            {kids.length === 0 && (
                <Card className="text-center py-12">
                    <CardContent>
                        <Baby className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-xl text-muted-foreground">
                            لا يوجد أطفال مسجلين حالياً
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default KidsListAdminInfinite;
