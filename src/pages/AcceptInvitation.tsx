import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useInvitationByToken, useAcceptInvitation } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AcceptInvitation = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: invitation, isLoading: isLoadingInvitation, error: invitationError } = useInvitationByToken(token || undefined);
    const acceptInvitation = useAcceptInvitation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                const session = data?.session;

                if (!session && token) {
                    // Redirect to auth if not logged in, but keep the token
                    navigate(`/auth?invitation=${token}`);
                }
            } catch (err) {
                console.error("Error checking auth session:", err);
            }
        };

        checkAuth();
    }, [token, navigate]);

    const handleAccept = async () => {
        if (!token) return;

        try {
            await acceptInvitation.mutateAsync(token);
            toast({
                title: "تم قبول الدعوة",
                description: `أنت الآن عضو في منظمة ${invitation?.organizations?.name}`,
            });
            navigate("/admin");
        } catch (error: any) {
            toast({
                title: "خطأ في قبول الدعوة",
                description: error.message || "حدث خطأ غير متوقع",
                variant: "destructive",
            });
        }
    };

    if (isLoadingInvitation) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (invitationError || !invitation) {
        return (
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <XCircle className="w-12 h-12 text-destructive" />
                        </div>
                        <CardTitle className="text-center">دعوة غير صالحة</CardTitle>
                        <CardDescription className="text-center">
                            رابط الدعوة هذا غير صالح أو قد انتهت صلاحيته.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex justify-center">
                        <Button onClick={() => navigate("/")}>العودة للرئيسية</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-muted/30">
            <Card className="w-full max-w-md border-primary/20 shadow-lg">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-full bg-primary/10">
                            <CheckCircle2 className="w-10 h-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">دعوة للانضمام</CardTitle>
                    <CardDescription className="mt-2">
                        تمت دعوتك للانضمام إلى منظمة
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="p-4 rounded-lg bg-card border border-border">
                        <h3 className="text-xl font-bold text-primary">{invitation.organizations?.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            بدور: <span className="font-semibold">{(invitation.role as string) === 'admin' ? 'مدير' : (invitation.role as string) === 'volunteer' ? 'متطوع' : 'مستخدم'}</span>
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        بقبولك هذه الدعوة، ستتمكن من الوصول إلى بيانات هذه المنظمة والمساهمة في أعمالها.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleAccept}
                        disabled={acceptInvitation.isPending}
                    >
                        {acceptInvitation.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                جاري القبول...
                            </>
                        ) : "قبول الدعوة"}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
                        إلغاء
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default AcceptInvitation;
