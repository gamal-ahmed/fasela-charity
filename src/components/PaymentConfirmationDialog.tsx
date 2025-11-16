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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, ExternalLink, CreditCard, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentCode: string;
  amount: number; // Final calculated amount from the main page
  caseTitle: string;
  onConfirm: (donorName: string, donorEmail?: string) => void;
}

export const PaymentConfirmationDialog = ({
  open,
  onOpenChange,
  paymentCode,
  amount = 500, // Default fallback value
  caseTitle,
  onConfirm,
}: PaymentConfirmationDialogProps) => {
  const { toast } = useToast();
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  // Safe amount with fallback to prevent undefined errors
  const safeAmount = amount && typeof amount === 'number' && !isNaN(amount) ? amount : 500;

  const copyPaymentCode = () => {
    navigator.clipboard.writeText(paymentCode);
    toast({
      title: "تم النسخ",
      description: "تم نسخ كود الدفع بنجاح",
    });
  };

  const handleConfirm = () => {
    if (!donorName.trim()) {
      toast({
        title: "مطلوب",
        description: "يرجى إدخال الاسم",
        variant: "destructive"
      });
      return;
    }
    onConfirm(donorName, donorEmail.trim() || undefined);
  };

  const resetDialog = () => {
    setDonorName("");
    setDonorEmail("");
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  // Reset form data when dialog opens to prevent caching
  const handleOpenChange = (open: boolean) => {
    if (open) {
      resetDialog();
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-4" dir="rtl">
        <DialogHeader className="flex-shrink-0 pb-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5" />
            تأكيد التبرع
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            احصل على كود دفع → احول المبلغ → اكتب الكود في البيان → سيتم التأكيد
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
          {/* معلومات المتبرع */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="donor-name" className="text-sm font-medium">
                الاسم الكريم <span className="text-destructive">*</span>
              </Label>
              <Input
                id="donor-name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="أدخل اسمك الكريم"
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="donor-email" className="text-sm font-medium">
                البريد الإلكتروني <span className="text-muted-foreground text-xs">(اختياري)</span>
              </Label>
              <Input
                id="donor-email"
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="example@email.com"
                className="text-right"
                dir="ltr"
              />
            </div>
          </div>

          {/* ملخص مختصر */}
          <div className="bg-accent/30 p-3 rounded-lg text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">{caseTitle}</span>
              <span className="font-bold text-primary">{safeAmount.toLocaleString()} جنيه</span>
            </div>
          </div>

          {/* كود الدفع */}
          <div className="border-2 border-primary/20 bg-primary/5 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-primary text-sm">كود الدفع:</h4>
              <Badge variant="outline" className="text-base font-mono px-2 py-1">
                {paymentCode}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyPaymentCode}
                className="h-7 w-7 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-destructive font-medium">
              ⚠️ اكتب هذا الكود في خانة البيان عند التحويل
            </p>
          </div>

          {/* رسالة التوضيح */}
          <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg space-y-2">
            <p className="text-sm font-medium text-primary">
              📱 الخطوات التالية:
            </p>
            <ol className="text-xs text-muted-foreground space-y-1 mr-4 list-decimal">
              <li>سيتم توجيهك إلى إنستاباي لإتمام الدفع</li>
              <li>استخدم كود الدفع أعلاه في خانة البيان</li>
              <li>سيتم مراجعة وتأكيد التبرع من الإدارة</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-3 border-t gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            إلغاء
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!donorName.trim()}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 ml-1" />
            المتابعة للدفع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};