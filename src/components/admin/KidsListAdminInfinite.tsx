import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, Baby, User } from "lucide-react";
import KidCard, { Kid } from "@/components/KidCard";

const PAGE_SIZE = 12;

const KidsListAdminInfinite = () => {
    // Fetch statistics
    const { data: stats } = useQuery({
        queryKey: ["kids-stats"],
        queryFn: async () => {
            const { data: kids, error } = await supabase
                .from("case_kids")
                .select("gender, age");

            if (error) throw error;

            const total = kids?.length || 0;
            const boys = kids?.filter(k => k.gender === "male").length || 0;
            const girls = kids?.filter(k => k.gender === "female").length || 0;

            // Age statistics
            const ages0to5 = kids?.filter(k => k.age >= 0 && k.age <= 5).length || 0;
            const ages6to12 = kids?.filter(k => k.age >= 6 && k.age <= 12).length || 0;
            const ages13to18 = kids?.filter(k => k.age >= 13 && k.age <= 18).length || 0;
            const averageAge = kids?.length ? Math.round(kids.reduce((sum, k) => sum + k.age, 0) / kids.length) : 0;

            return { total, boys, girls, ages0to5, ages6to12, ages13to18, averageAge };
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
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

            {/* Age Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">متوسط العمر</CardTitle>
                        <Baby className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.averageAge || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            سنة
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">0-5 سنوات</CardTitle>
                        <Baby className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.ages0to5 || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.total ? Math.round((stats.ages0to5 / stats.total) * 100) : 0}% من الإجمالي
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">6-12 سنة</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.ages6to12 || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.total ? Math.round((stats.ages6to12 / stats.total) * 100) : 0}% من الإجمالي
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">13-18 سنة</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.ages13to18 || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats?.total ? Math.round((stats.ages13to18 / stats.total) * 100) : 0}% من الإجمالي
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Kids Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kids?.map((kid) => (
                    <KidCard key={kid.id} kid={kid} />
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
