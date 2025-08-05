import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShoppingBasket, Home, GraduationCap, Heart, Stethoscope } from "lucide-react";

interface Need {
  category: string;
  amount: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

interface MonthlyNeedsProps {
  totalMonthlyNeed: number;
  needs: Need[];
}

export const MonthlyNeeds = ({ totalMonthlyNeed, needs }: MonthlyNeedsProps) => {
  if (needs.length === 0 && totalMonthlyNeed === 0) {
    return (
      <Card className="p-8 shadow-soft">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">الاحتياجات الشهرية</h3>
          <p className="text-muted-foreground">لم يتم إدخال تفاصيل الاحتياجات الشهرية بعد</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6 lg:p-8 shadow-soft">
      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-2">الاحتياجات الشهرية</h3>
        <p className="text-muted-foreground text-sm sm:text-base">تفاصيل المصروفات الشهرية المطلوبة للعائلة</p>
      </div>

      {totalMonthlyNeed > 0 && (
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">{totalMonthlyNeed}</span>
            <span className="text-lg sm:text-xl text-muted-foreground">جنيه مصري</span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">إجمالي الاحتياجات الشهرية</p>
        </div>
      )}

      {needs.length > 0 && (
        <div className="space-y-6">
          {needs.map((need, index) => {
            const percentage = totalMonthlyNeed > 0 ? (need.amount / totalMonthlyNeed) * 100 : 0;
            
            return (
              <div key={index} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${need.color} flex-shrink-0`}>
                      {need.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm sm:text-base">{need.category}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">{need.description}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-semibold">{need.amount}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground mr-1">جنيه</span>
                  </div>
                </div>
                
                <Progress 
                  value={percentage} 
                  className="h-2"
                />
                
                <div className="text-xs text-muted-foreground text-left">
                  {percentage.toFixed(1)}% من إجمالي الاحتياجات
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 bg-charity-light rounded-lg">
        <div className="flex items-center gap-2 text-charity">
          <Heart className="w-5 h-5" />
          <span className="font-medium">ملاحظة مهمة</span>
        </div>
        <p className="text-sm text-charity mt-2">
          جميع المبالغ محسوبة بناءً على الاحتياجات الفعلية للعائلة ويتم مراجعتها شهرياً لضمان الشفافية الكاملة.
        </p>
      </div>
    </Card>
  );
};