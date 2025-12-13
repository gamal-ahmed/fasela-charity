import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, UserX, Activity, Wallet, CheckCircle2 } from "lucide-react";

export const CaseAcceptanceCriteria = () => {
    const criteria = [
        {
            id: 1,
            text: "أن تكون الأسرة فاقدةً للعائل (أسرة يتيم).",
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-50",
            border: "border-blue-200"
        },
        {
            id: 2,
            text: "أن تكون الأم حريصةً على تعليم الأبناء ولديها الهمة والالتزام.",
            icon: BookOpen,
            color: "text-purple-500",
            bg: "bg-purple-50",
            border: "border-purple-200"
        },
        {
            id: 3,
            text: "ألّا توجد في الأسرة بناتٌ في سنّ الزواج.",
            icon: UserX,
            color: "text-pink-500",
            bg: "bg-pink-50",
            border: "border-pink-200"
        },
        {
            id: 4,
            text: "ألّا يكون الأطفال مصابين بمرضٍ مزمن يمنعهم تمامًا من التعلّم.",
            icon: Activity,
            color: "text-red-500",
            bg: "bg-red-50",
            border: "border-red-200"
        },
        {
            id: 5,
            text: "أن يكون للأسرة أي مصدر دخلٍ آخر (ولو كان غير كافٍ لتلبية احتياجاتها).",
            icon: Wallet,
            color: "text-green-500",
            bg: "bg-green-50",
            border: "border-green-200"
        }
    ];

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">
                        معايير الاختيار
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        شروط انضمام الأسرة إلى برنامج الكفالة
                    </h2>
                    <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        نستعين بالله وحده، مع الأخذ بالأسباب، لنجاح هذا المشروع. ولتعظيم النتائج بالموارد المادية المحدودة المتاحة، نسعى إلى استثمار كل العوامل الممكنة لتحقيق أكبر أثر.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Criteria Cards */}
                    {criteria.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-start gap-4 p-6 rounded-2xl border ${item.bg} ${item.border} hover:shadow-md transition-shadow duration-300`}
                        >
                            <div className={`p-3 rounded-xl bg-white shadow-sm ${item.color}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-lg font-medium text-foreground/90 leading-relaxed">
                                    {item.text}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Summary Card - Takes up remaining space gracefully or sits last */}
                    <div className="flex items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 md:col-span-1">
                        <div className="text-center">
                            <div className="mx-auto bg-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle2 className="w-6 h-6 text-primary" />
                            </div>
                            <p className="font-semibold text-primary">
                                نسعى لتحقيق أقصى أثر
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
