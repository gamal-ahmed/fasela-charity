
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    Loader2, Phone, User, CheckCircle2,
    Palette, Gamepad2, BookOpen, Music,
    Dumbbell, Bike, Flower2, PenTool,
    Utensils, Globe, Code, Calculator,
    ArrowRight, ArrowLeft
} from "lucide-react";

// Hobbies List with Icons
const HOBBIES = [
    { id: "art", label: "الرسم", icon: Palette, color: "bg-purple-100 text-purple-600" },
    { id: "sports", label: "الرياضة", icon: Dumbbell, color: "bg-blue-100 text-blue-600" },
    { id: "reading", label: "القراءة", icon: BookOpen, color: "bg-yellow-100 text-yellow-600" },
    { id: "gaming", label: "الألعاب", icon: Gamepad2, color: "bg-red-100 text-red-600" },
    { id: "music", label: "الموسيقى", icon: Music, color: "bg-pink-100 text-pink-600" },
    { id: "cycling", label: "الدراجة", icon: Bike, color: "bg-green-100 text-green-600" },
    { id: "nature", label: "الزراعة", icon: Flower2, color: "bg-emerald-100 text-emerald-600" },
    { id: "crafts", label: "الأشغال", icon: PenTool, color: "bg-orange-100 text-orange-600" },
    { id: "cooking", label: "الطبخ", icon: Utensils, color: "bg-rose-100 text-rose-600" },
];

export default function MomSurvey() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<"phone" | "kids" | "hobbies" | "success">("phone");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [caseId, setCaseId] = useState<string | null>(null);
    const [selectedKidId, setSelectedKidId] = useState<string | null>(null);
    const [selectedKidName, setSelectedKidName] = useState("");
    const [kidHobbies, setKidHobbies] = useState<string[]>([]);

    // 1. Check Phone Number
    const checkPhoneMutation = useMutation({
        mutationFn: async (phone: string) => {
            // Normalize phone (remove spaces, etc. if needed) simple check for now
            const { data, error } = await supabase
                .from("cases")
                .select("id")
                .eq("contact_phone", phone)
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            setCaseId(data.id);
            setStep("kids");
        },
        onError: () => {
            toast({
                title: "رقم غير صحيح",
                description: "لم نجد هذا الرقم في سجلاتنا. يرجى التأكد والمحاولة مرة أخرى.",
                variant: "destructive",
            });
        },
    });

    // 2. Fetch Kids
    const { data: kids, isLoading: isLoadingKids } = useQuery({
        queryKey: ["case_kids", caseId],
        queryFn: async () => {
            if (!caseId) return [];
            const { data, error } = await supabase
                .from("case_kids")
                .select("id, name, gender, age, hobbies")
                .eq("case_id", caseId);
            if (error) throw error;
            return data;
        },
        enabled: !!caseId,
    });

    // 3. Save Hobbies
    const saveHobbiesMutation = useMutation({
        mutationFn: async () => {
            if (!selectedKidId) return;
            const { error } = await supabase
                .from("case_kids")
                .update({ hobbies: kidHobbies })
                .eq("id", selectedKidId);
            if (error) throw error;
        },
        onSuccess: () => {
            setStep("success");
            queryClient.invalidateQueries({ queryKey: ["case_kids"] });
            // Reset for next kid after delay? Or just show celebration
            setTimeout(() => {
                setStep("kids");
                setSelectedKidId(null);
                setKidHobbies([]);
            }, 3000);
        },
        onError: () => {
            toast({ title: "حدث خطأ", variant: "destructive" });
        }
    });

    const handleKidSelect = (kid: any) => {
        setSelectedKidId(kid.id);
        setSelectedKidName(kid.name);
        setKidHobbies(kid.hobbies || []); // Pre-fill existing
        setStep("hobbies");
    };

    const toggleHobby = (hobbyId: string) => {
        if (kidHobbies.includes(hobbyId)) {
            setKidHobbies(kidHobbies.filter(h => h !== hobbyId));
        } else {
            setKidHobbies([...kidHobbies, hobbyId]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-right" dir="rtl">

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-purple-500" />

                <AnimatePresence mode="wait">

                    {/* STEP 1: PHONE */}
                    {step === "phone" && (
                        <motion.div
                            key="phone"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="p-8 flex flex-col h-full justify-center space-y-8"
                        >
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Phone className="w-10 h-10 text-purple-600" />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-800">أهلاً بك يا أمي</h1>
                                <p className="text-slate-500 text-lg">يرجى إدخال رقم الجوال المسجل لدينا للدخول</p>
                            </div>

                            <Input
                                placeholder="05XXXXXXXX"
                                className="text-center text-3xl p-8 rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:ring-0 tracking-widest"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                type="tel"
                            />

                            <Button
                                size="lg"
                                className="w-full h-16 text-xl rounded-2xl bg-purple-600 hover:bg-purple-700"
                                onClick={() => checkPhoneMutation.mutate(phoneNumber)}
                                disabled={checkPhoneMutation.isPending || phoneNumber.length < 8}
                            >
                                {checkPhoneMutation.isPending ? <Loader2 className="animate-spin" /> : "التــالي"}
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 2: SELECT KID */}
                    {step === "kids" && (
                        <motion.div
                            key="kids"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="p-8 h-full flex flex-col"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">مين من الأولاد؟</h2>
                                <p className="text-slate-500">اختاري الطفل لتحديث هواياته</p>
                            </div>

                            {isLoadingKids ? (
                                <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin w-10 h-10 text-purple-500" /></div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[400px] p-2">
                                    {kids?.map((kid) => (
                                        <motion.button
                                            key={kid.id}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleKidSelect(kid)}
                                            className="bg-white border-2 border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-purple-500 hover:shadow-md transition-all group text-right"
                                        >
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-purple-100">
                                                <User className="w-8 h-8 text-slate-400 group-hover:text-purple-600" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-xl text-slate-800">{kid.name}</div>
                                                <div className="text-slate-400">{kid.age} سنوات</div>
                                            </div>
                                            {kid.hobbies && kid.hobbies.length > 0 && <CheckCircle2 className="mr-auto text-green-500 w-6 h-6" />}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <Button variant="ghost" className="mt-auto" onClick={() => setStep("phone")}>
                                <ArrowRight className="ml-2 w-4 h-4" /> خروج / تغيير الرقم
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 3: SELECT HOBBIES */}
                    {step === "hobbies" && (
                        <motion.div
                            key="hobbies"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="p-6 h-full flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <Button variant="ghost" size="icon" onClick={() => setStep("kids")}><ArrowRight /></Button>
                                <div className="text-center">
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedKidName}</h2>
                                    <p className="text-purple-600 font-medium">ايش يحب يسوي؟</p>
                                </div>
                                <div className="w-10" />
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {HOBBIES.map((hobby) => {
                                    const isSelected = kidHobbies.includes(hobby.id);
                                    return (
                                        <motion.button
                                            key={hobby.id}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => toggleHobby(hobby.id)}
                                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-300 border-2 ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-lg scale-105' : 'bg-white border-slate-100 hover:border-purple-200'}`}
                                        >
                                            <hobby.icon className={`w-8 h-8 ${isSelected ? 'text-white' : hobby.color.split(" ")[1]}`} />
                                            <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-600'}`}>{hobby.label}</span>
                                        </motion.button>
                                    )
                                })}
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-16 text-xl rounded-2xl bg-green-600 hover:bg-green-700 mt-auto shadow-lg shadow-green-200"
                                onClick={() => saveHobbiesMutation.mutate()}
                                disabled={saveHobbiesMutation.isPending}
                            >
                                {saveHobbiesMutation.isPending ? <Loader2 className="animate-spin" /> : "حفــظ واستمـرار"}
                            </Button>
                        </motion.div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-16 h-16 text-green-600" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-slate-800">ممتازة يا أم {selectedKidName}!</h2>
                            <p className="text-slate-500 text-lg">تم حفظ المعلومات بنجاح.</p>
                            <p className="text-sm text-slate-400">جاري نقلك للقائمة...</p>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}
