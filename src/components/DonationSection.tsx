import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Heart, Calendar, Gift, CheckCircle } from "lucide-react";
import { PaymentConfirmationDialog } from "./PaymentConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DonationSectionProps {
  monthlyNeed: number;
  caseStatus?: string;
  monthsCovered?: number;
  monthsNeeded?: number;
  paymentCode?: string;
  caseTitle?: string;
  caseId?: string;
}

export const DonationSection = ({ monthlyNeed, caseStatus, monthsCovered = 0, monthsNeeded = 1, paymentCode, caseTitle, caseId }: DonationSectionProps) => {
  const [selectedMonths, setSelectedMonths] = useState([3]);
  const [donationType, setDonationType] = useState<'monthly' | 'custom'>('monthly');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();

  const months = selectedMonths[0];
  const totalAmount = donationType === 'monthly' ? monthlyNeed * months : selectedMonths[0];
  
  // Check if case is closed or fully funded
  const isCaseClosed = caseStatus !== 'active';
  const isFullyFunded = monthsCovered >= monthsNeeded;
  const isDonationDisabled = isCaseClosed || isFullyFunded;

  // Calculate remaining months needed
  const remainingMonths = Math.max(0, monthsNeeded - monthsCovered);
  
  const predefinedOptions = [
    { months: 1, label: "شهر واحد", popular: false },
    { months: 3, label: "3 أشهر", popular: true },
    { months: 6, label: "6 أشهر", popular: false },
    { months: 12, label: "سنة كاملة", popular: false },
  ].filter(option => option.months <= remainingMonths);

  const handleDonateClick = () => {
    if (!paymentCode || !caseTitle) return;
    setShowPaymentDialog(true);
  };

  const handlePaymentConfirm = async (donorName: string) => {
    try {
      if (!caseId || !paymentCode) return;
      
      // Record pending donation with donor name and the amount from the main page
      const { error } = await supabase
        .from('donations')
        .insert({
          case_id: caseId,
          donor_name: donorName,
          amount: totalAmount, // Use the amount already calculated in the main page
          months_pledged: donationType === 'monthly' ? months : Math.ceil(totalAmount / monthlyNeed),
          payment_code: paymentCode,
          donation_type: donationType,
          status: 'pending'
        });

      if (error) {
        console.error('Error recording donation:', error);
        toast({
          title: "خطأ",
          description: "حدث خطأ في تسجيل التبرع. يرجى المحاولة مرة أخرى.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "تم تسجيل نية التبرع",
        description: `شكراً ${donorName}، سيتم مراجعة تبرعك وتأكيده من قبل الإدارة بعد إتمام الدفع.`,
      });

      setShowPaymentDialog(false);
      window.open('https://ipn.eg/S/asayedrb/instapay/2c0Zdf', '_blank');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-8 shadow-soft">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">ساهم في كفالة هذه العائلة</h3>
        <p className="text-muted-foreground">
          اختر المدة التي تريد كفالة العائلة فيها أو تبرع بمبلغ مخصص
        </p>
      </div>

      <div className="space-y-6">
        {/* Status message if case is closed or fully funded */}
        {isDonationDisabled && (
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-muted-foreground">
              {isFullyFunded ? "تم جمع المبلغ المطلوب بالكامل للحالة" : "الحالة مُغلقة حالياً"}
            </p>
          </div>
        )}

        {/* نوع التبرع */}
        {!isDonationDisabled && (
          <div className="flex gap-4 justify-center">
            <Button
              variant={donationType === 'monthly' ? 'default' : 'outline'}
              onClick={() => setDonationType('monthly')}
              className="flex-1 max-w-xs"
            >
              <Calendar className="w-4 h-4 ml-2" />
              كفالة شهرية
            </Button>
            <Button
              variant={donationType === 'custom' ? 'default' : 'outline'}
              onClick={() => setDonationType('custom')}
              className="flex-1 max-w-xs"
            >
              <Gift className="w-4 h-4 ml-2" />
              مبلغ مخصص
            </Button>
          </div>
        )}

        {!isDonationDisabled && donationType === 'monthly' && (
          <>
            {/* خيارات سريعة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {predefinedOptions.map((option) => (
                <div
                  key={option.months}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${months === option.months 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                    }`}
                  onClick={() => setSelectedMonths([option.months])}
                >
                  {option.popular && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 right-2 bg-warm text-warm-foreground text-xs"
                    >
                      الأكثر اختياراً
                    </Badge>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-semibold">{option.label}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {(monthlyNeed * option.months).toLocaleString()} جنيه
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* شريط اختيار الأشهر */}
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-sm text-muted-foreground">أو اختر عدد أشهر مخصص: </span>
                <span className="text-lg font-semibold text-primary">{months}</span>
                <span className="text-sm text-muted-foreground"> شهر</span>
              </div>
              
              <Slider
                value={selectedMonths}
                onValueChange={setSelectedMonths}
                max={remainingMonths}
                min={1}
                step={1}
                className="w-full"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>شهر واحد</span>
                <span>{remainingMonths} شهر</span>
              </div>
            </div>
          </>
        )}

        {!isDonationDisabled && donationType === 'custom' && (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-sm text-muted-foreground">اختر المبلغ المناسب لك</span>
            </div>
            
            <Slider
              value={selectedMonths}
              onValueChange={setSelectedMonths}
              max={monthlyNeed * 12}
              min={100}
              step={50}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>100 جنيه</span>
              <span>{(monthlyNeed * 12).toLocaleString()} جنيه</span>
            </div>
          </div>
        )}

        {/* ملخص التبرع */}
        {!isDonationDisabled && (
          <div className="bg-accent/30 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium">ملخص تبرعك</span>
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            
            <div className="space-y-2">
              {donationType === 'monthly' ? (
                <>
                  <div className="flex justify-between">
                    <span>عدد الأشهر:</span>
                    <span className="font-medium">{months} شهر</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المبلغ الشهري:</span>
                    <span className="font-medium">{monthlyNeed.toLocaleString()} جنيه</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>مبلغ التبرع:</span>
                  <span className="font-medium">{selectedMonths[0].toLocaleString()} جنيه</span>
                </div>
              )}
              
              <hr className="my-3" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>إجمالي التبرع:</span>
                <span className="text-primary">{totalAmount.toLocaleString()} جنيه مصري</span>
              </div>
            </div>
          </div>
        )}

        {/* زر التبرع */}
        <Button 
          size="lg" 
          className={`w-full text-lg py-6 ${isDonationDisabled ? 'opacity-50 cursor-not-allowed' : 'btn-charity'}`}
          disabled={isDonationDisabled}
          onClick={handleDonateClick}
        >
          <Heart className="w-5 h-5 ml-2" />
          {isDonationDisabled 
            ? (isFullyFunded ? 'تم اكتمال التمويل' : 'الحالة مغلقة')
            : `تبرع الآن - ${totalAmount.toLocaleString()} جنيه`
          }
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          سيتم إرسال تقارير شهرية عن استخدام التبرع وأحوال العائلة
        </p>
      </div>

      <PaymentConfirmationDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        paymentCode={paymentCode || ''}
        amount={totalAmount}
        caseTitle={caseTitle || ''}
        onConfirm={handlePaymentConfirm}
      />
    </Card>
  );
};