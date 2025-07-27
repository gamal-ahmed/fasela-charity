import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentCode: string;
  amount: number;
  caseTitle: string;
  onConfirm: () => void;
}

export const PaymentConfirmationDialog = ({
  open,
  onOpenChange,
  paymentCode,
  amount,
  caseTitle,
  onConfirm,
}: PaymentConfirmationDialogProps) => {
  const { toast } = useToast();
  const [confirmed, setConfirmed] = useState(false);

  const copyPaymentCode = () => {
    navigator.clipboard.writeText(paymentCode);
    toast({
      title: "تم النسخ",
      description: "تم نسخ كود الدفع بنجاح",
    });
  };

  const handleConfirm = () => {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            تأكيد الدفع
          </DialogTitle>
          <DialogDescription>
            يرجى اتباع التعليمات التالية لإتمام عملية التبرع
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-accent/30 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">ملخص التبرع:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>الحالة:</span>
                <span className="font-medium">{caseTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>المبلغ:</span>
                <span className="font-medium">{amount.toLocaleString()} جنيه</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-primary/20 bg-primary/5 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-primary">مهم جداً - كود الدفع:</h4>
            
            <div className="bg-background p-3 rounded-md border mb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-lg font-mono">
                  {paymentCode}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyPaymentCode}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-sm space-y-2">
              <p className="text-destructive font-medium">
                ⚠️ يجب كتابة الكود "{paymentCode}" في خانة البيان عند الدفع
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>هذا الكود ضروري لربط تبرعك بهذه الحالة</li>
                <li>بدون هذا الكود لن نتمكن من تحديد الحالة المُراد التبرع لها</li>
                <li>تأكد من كتابة الكود بشكل صحيح</li>
              </ul>
            </div>
          </div>

          {!confirmed ? (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                اضغط "فهمت وسأكتب الكود" للمتابعة إلى صفحة الدفع
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-sm text-green-800 flex items-center gap-2">
                ✅ ممتاز! الآن يمكنك المتابعة إلى صفحة الدفع
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleConfirm}
            className="w-full sm:w-auto"
            variant={confirmed ? "default" : "outline"}
          >
            {confirmed ? (
              <>
                <ExternalLink className="w-4 h-4 ml-2" />
                المتابعة للدفع
              </>
            ) : (
              "فهمت وسأكتب الكود"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};