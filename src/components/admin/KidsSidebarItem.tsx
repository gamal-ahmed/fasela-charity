import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Baby, ChevronRight, Loader2, User } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrgQueryOptions } from "@/hooks/useOrgQuery";
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

export function KidsSidebarItem() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const { orgId, enabled: orgReady } = useOrgQueryOptions();

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ["admin-sidebar-kids", orgId],
        queryFn: async ({ pageParam = 0 }) => {
            const from = pageParam * 10;
            const to = from + 9;

            const query = supabase
                .from("case_kids")
                .select("id, name")
                .order("created_at", { ascending: false })
                .range(from, to);

            if (orgId) {
                query.eq("organization_id", orgId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < 10) return undefined;
            return allPages.length;
        },
        enabled: isOpen && orgReady,
    });

    const kids = data?.pages.flatMap((page) => page) || [];

    return (
        <Collapsible
            asChild
            open={isOpen}
            onOpenChange={setIsOpen}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="إدارة الأطفال">
                        <Baby />
                        <span>إدارة الأطفال</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        <SidebarMenuSubItem>
                            <SidebarMenuSubButton asChild isActive={location.pathname === "/admin/kids"}>
                                <Link to="/admin/kids">
                                    <span>عرض الكل</span>
                                </Link>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                        {isLoading && (
                            <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        )}

                        {kids.map((kid) => (
                            <SidebarMenuSubItem key={kid.id}>
                                <SidebarMenuSubButton asChild isActive={location.pathname === `/kid/${kid.id}`}>
                                    <Link to={`/kid/${kid.id}`}>
                                        <User className="h-4 w-4" />
                                        <span>{kid.name}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}

                        {hasNextPage && (
                            <SidebarMenuSubItem>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start h-8 text-xs"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        fetchNextPage();
                                    }}
                                    disabled={isFetchingNextPage}
                                >
                                    {isFetchingNextPage ? (
                                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    ) : (
                                        <span>تحميل المزيد...</span>
                                    )}
                                </Button>
                            </SidebarMenuSubItem>
                        )}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
