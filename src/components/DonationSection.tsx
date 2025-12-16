import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
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
  caseCareType?: 'cancelled' | 'sponsorship' | 'one_time_donation';
  totalSecured?: number;
  minCustomDonation?: number;
  showMonthlyDonation?: boolean;
  showCustomDonation?: boolean;
}

export const DonationSection = ({ 
  monthlyNeed, 
  caseStatus, 
  monthsCovered = 0, 
  monthsNeeded = 1, 
  paymentCode, 
  caseTitle, 
  caseId, 
  caseCareType = 'sponsorship', 
  totalSecured = 0,
  minCustomDonation = 1,
  showMonthlyDonation = true,
  showCustomDonation = true
}: DonationSectionProps) => {
  const isOneTime = caseCareType === 'one_time_donation';
  const isCancelled = caseCareType === 'cancelled';
  
  // Determine which tabs to show
  const canShowMonthly = showMonthlyDonation && !isOneTime && monthsNeeded !== 1;
  const canShowCustom = showCustomDonation;
  
  // Default to first available tab
  const getDefaultDonationType = () => {
    if (isOneTime) return 'custom';
    if (canShowMonthly) return 'monthly';
    if (canShowCustom) return 'custom';
    return 'monthly';
  };
  
  const [selectedMonths, setSelectedMonths] = useState([1]);
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState<'monthly' | 'custom'>(getDefaultDonationType());
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();

  const months = selectedMonths[0];
  const totalAmount = donationType === 'monthly' ? monthlyNeed * months : Number(customAmount) || 0;
  
  // Check if case is closed or fully funded
  const isCaseClosed = caseStatus !== 'active';
  const isFullyFunded = isOneTime 
    ? (totalSecured >= monthlyNeed) 
    : (monthsCovered >= monthsNeeded);
  const isDonationDisabled = isCaseClosed || isFullyFunded || isCancelled;

  // Calculate remaining months needed
  const remainingMonths = Math.max(0, monthsNeeded - monthsCovered);
  
  const predefinedOptions = [
    { months: 1, label: "شهر واحد", popular: false },
    { months: 3, label: "3 أشهر", popular: true },
    { months: 6, label: "6 أشهر", popular: false },
    { months: 12, label: "سنة كاملة", popular: false },
  ].filter(option => option.months <= remainingMonths);

  const handleDonateClick = () => {
    if (!paymentCode || !caseTitle) {
      toast({
        title: "خطأ",
        description: "معلومات الدفع غير متوفرة",
        variant: "destructive"
      });
      return;
    }

    // Validate amount based on donation type
    if (donationType === 'monthly') {
      if (months <= 0 || monthlyNeed <= 0) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار عدد الأشهر والمبلغ الشهري",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Custom donation
      const amount = Number(customAmount);
      if (!customAmount || amount < minCustomDonation) {
        toast({
          title: "خطأ",
          description: `يرجى إدخال مبلغ التبرع (الحد الأدنى ${minCustomDonation} جنيه)`,
          variant: "destructive"
        });
        return;
      }
    }

    // Validate total amount
    if (totalAmount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ التبرع",
        variant: "destructive"
      });
      return;
    }

    setShowPaymentDialog(true);
  };

  const handlePaymentConfirm = async (donorName: string, donorEmail?: string) => {
    try {
      if (!caseId || !paymentCode) return;
      
      // Record pending donation with donor name and the amount from the main page
      const { error } = await supabase
        .from('donations')
        .insert({
          case_id: caseId,
          donor_name: donorName,
          donor_email: donorEmail || null,
          amount: totalAmount, // Use the amount already calculated in the main page
          months_pledged: isOneTime ? 1 : (donationType === 'monthly' ? months : Math.ceil(totalAmount / monthlyNeed)),
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
    <Card className="p-4 sm:p-6 lg:p-8 shadow-soft">
      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-2">
          {isOneTime ? 'ساهم في مساعدة هذه العائلة' : 'ساهم في كفالة هذه العائلة'}
        </h3>
        <p className="text-muted-foreground text-sm sm:text-base">
          {isOneTime 
            ? 'تبرع بمبلغ مخصص لمساعدة لمرة واحدة'
            : 'اختر المدة التي تريد كفالة العائلة فيها أو تبرع بمبلغ مخصص'
          }
        </p>
      </div>

      <div className="space-y-6">
        {/* Status message if case is closed or fully funded */}
        {isDonationDisabled && (
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <p className="text-muted-foreground">
              {isCancelled ? "هذه الحالة ملغاة ولا تقبل تبرعات" 
               : isFullyFunded ? "تم جمع المبلغ المطلوب بالكامل للحالة" 
               : "الحالة مُغلقة حالياً"}
            </p>
          </div>
        )}

        {/* نوع التبرع */}
        {!isDonationDisabled && canShowMonthly && canShowCustom && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              variant={donationType === 'monthly' ? 'default' : 'outline'}
              onClick={() => setDonationType('monthly')}
              className="flex-1 max-w-xs text-sm sm:text-base"
            >
              <Calendar className="w-4 h-4 ml-2" />
              كفالة شهرية
            </Button>
            <Button
              variant={donationType === 'custom' ? 'default' : 'outline'}
              onClick={() => setDonationType('custom')}
              className="flex-1 max-w-xs text-sm sm:text-base"
            >
              <Gift className="w-4 h-4 ml-2" />
              مبلغ مخصص
            </Button>
          </div>
        )}

        {!isDonationDisabled && donationType === 'monthly' && canShowMonthly && (
          <>
            {/* خيارات سريعة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {predefinedOptions.map((option) => (
                <div
                  key={option.months}
                  className={`relative p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all
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
                    <div className="text-base sm:text-lg font-semibold">{option.label}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">
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
            
            <div className="space-y-2">
              <label htmlFor="customAmount" className="text-sm font-medium">
                المبلغ بالجنيه المصري
              </label>
              <Input
                id="customAmount"
                type="number"
                placeholder="أدخل المبلغ"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min="1"
                className="text-lg text-center"
              />
              <p className="text-xs text-muted-foreground text-center">
                الحد الأدنى للتبرع: {minCustomDonation} جنيه
              </p>
            </div>
          </div>
        )}

        {/* ملخص التبرع */}
        {!isDonationDisabled && (
          <div className="bg-accent/30 p-4 sm:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base sm:text-lg font-medium">ملخص تبرعك</span>
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
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
                  <span className="font-medium">{Number(customAmount).toLocaleString() || 0} جنيه</span>
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
          className={`w-full text-base sm:text-lg py-4 sm:py-6 ${isDonationDisabled ? 'opacity-50 cursor-not-allowed' : 'btn-charity'}`}
          disabled={isDonationDisabled}
          onClick={handleDonateClick}
        >
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
          {isDonationDisabled 
            ? (isCancelled ? 'الحالة ملغاة' : isFullyFunded ? 'تم اكتمال التمويل' : 'الحالة مغلقة')
            : `تبرع الآن - ${totalAmount.toLocaleString()} جنيه`
          }
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          {isOneTime 
            ? 'سيتم إرسال تقرير عن استخدام التبرع وأحوال العائلة'
            : 'سيتم إرسال تقارير شهرية عن استخدام التبرع وأحوال العائلة'
          }
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