import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useInvitationByToken, useAcceptInvitation } from "@/hooks/useOrganization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type StepType = "choice" | "password" | "processing";

const AcceptInvitation = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();
    const { toast } = useToast();
    const [step, setStep] = useState<StepType>("choice");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const { data: invitation, isLoading: isLoadingInvitation, error: invitationError } = useInvitationByToken(token || undefined);
    const acceptInvitation = useAcceptInvitation();

    useEffect(() => {
        if (invitation) {
            setEmail(invitation.email);
        }
    }, [invitation]);

    const handleAcceptClick = () => {
        setStep("password");
    };

    const handleReject = () => {
        navigate("/");
    };

    const handlePasswordSubmit = async () => {
        if (!password || !email || !token) {
            toast({
                title: "خطأ",
                description: "يرجى إدخال كلمة المرور",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);
        try {
            setStep("processing");
            
            // Sign up the user with the email and password
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });
            console.log("Auth Data:", authData);
            if (authError) {
                throw new Error(authError.message);
            }

            // Once signed up, accept the invitation in the backend
            if (authData.user) {
                await acceptInvitation.mutateAsync(token);
                
                toast({
                    title: "تم قبول الدعوة",
                    description: `أنت الآن عضو في منظمة ${invitation?.organizations?.name}`,
                });
                
                navigate("/admin");
            }
        } catch (error) {
            setIsProcessing(false);
            setStep("password");
            const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
            toast({
                title: "خطأ في قبول الدعوة",
                description: message,
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
                        {step === "choice" && "تمت دعوتك للانضمام إلى منظمة"}
                        {step === "password" && "أنشئ كلمة مرور"}
                        {step === "processing" && "جاري المعالجة..."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {step === "choice" && (
                        <>
                            <div className="p-4 rounded-lg bg-card border border-border text-center">
                                <h3 className="text-xl font-bold text-primary">{invitation.organizations?.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    بدور: <span className="font-semibold">{(invitation.role as string) === 'admin' ? 'مدير' : (invitation.role as string) === 'volunteer' ? 'متطوع' : 'مستخدم'}</span>
                                </p>
                            </div>
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-right">
                                <p className="text-sm text-blue-900">
                                    البريد الإلكتروني: <span className="font-semibold">{invitation.email}</span>
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                بقبولك هذه الدعوة، ستتمكن من الوصول إلى بيانات هذه المنظمة والمساهمة في أعمالها.
                            </p>
                        </>
                    )}

                    {step === "password" && (
                        <>
                            <div className="p-4 rounded-lg bg-card border border-border text-center">
                                <h3 className="text-lg font-bold text-primary">{invitation.organizations?.name}</h3>
                                <p className="text-sm text-muted-foreground mt-2">{invitation.email}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-right block">البريد الإلكتروني</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    disabled
                                    className="text-right"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-right block">كلمة المرور</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="أدخل كلمة مرور قوية"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                                    className="text-right"
                                    disabled={isProcessing}
                                />
                            </div>
                        </>
                    )}

                    {step === "processing" && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                            <p className="text-sm text-muted-foreground">جاري إنشاء حسابك والانضمام للمنظمة...</p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    {step === "choice" && (
                        <>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleAcceptClick}
                            >
                                قبول الدعوة
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={handleReject}>
                                رفض
                            </Button>
                        </>
                    )}

                    {step === "password" && (
                        <>
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handlePasswordSubmit}
                                disabled={isProcessing || !password}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        جاري...
                                    </>
                                ) : "تأكيد وقبول الدعوة"}
                            </Button>
                            <Button variant="ghost" className="w-full" onClick={() => setStep("choice")} disabled={isProcessing}>
                                العودة للخلف
                            </Button>
                        </>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default AcceptInvitation;
