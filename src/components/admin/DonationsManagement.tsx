import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, Eye, CreditCard, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Donation {
  id: string;
  case_id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  months_pledged: number;
  payment_code: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  donation_type: 'monthly' | 'custom';
  payment_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  cases: {
    title: string;
    title_ar: string;
  };
}

export const DonationsManagement = () => {
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: donations, isLoading } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          cases!inner(title, title_ar)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Donation[];
    }
  });

  const confirmDonationMutation = useMutation({
    mutationFn: async ({ id, paymentRef, notes }: { id: string; paymentRef: string; notes: string }) => {
      console.log("Confirming donation:", { id, paymentRef, notes });
      
      const { error } = await supabase
        .from("donations")
        .update({
          status: "confirmed",
          payment_reference: paymentRef,
          admin_notes: notes,
          confirmed_at: new Date().toISOString(),
          confirmed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", id);

      if (error) {
        console.error("Error confirming donation:", error);
        throw error;
      }
      console.log("Donation confirmed successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      toast({
        title: "تم تأكيد التبرع",
        description: "تم تأكيد التبرع بنجاح وتحديث إجمالي الحالة."
      });
      setSelectedDonation(null);
      setPaymentReference("");
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تأكيد التبرع",
        variant: "destructive"
      });
    }
  });

  const cancelDonationMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "cancelled",
          admin_notes: notes
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      toast({
        title: "تم إلغاء التبرع",
        description: "تم إلغاء التبرع بنجاح."
      });
      setSelectedDonation(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في إلغاء التبرع",
        variant: "destructive"
      });
    }
  });

  const handleConfirmDonation = () => {
    if (!selectedDonation) return;
    confirmDonationMutation.mutate({
      id: selectedDonation.id,
      paymentRef: paymentReference,
      notes: adminNotes
    });
  };

  const handleCancelDonation = () => {
    if (!selectedDonation) return;
    cancelDonationMutation.mutate({
      id: selectedDonation.id,
      notes: adminNotes
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">في الانتظار</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">مؤكد</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700">ملغي</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingDonations = donations?.filter(d => d.status === 'pending') || [];
  const confirmedDonations = donations?.filter(d => d.status === 'confirmed') || [];
  const cancelledDonations = donations?.filter(d => d.status === 'cancelled') || [];

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">إدارة التبرعات</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
            <span>في الانتظار: {pendingDonations.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 rounded-full"></div>
            <span>مؤكدة: {confirmedDonations.length}</span>
          </div>
        </div>
      </div>

      {/* التبرعات المعلقة */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-yellow-700">التبرعات في الانتظار ({pendingDonations.length})</h3>
        {pendingDonations.length === 0 ? (
          <p className="text-muted-foreground">لا توجد تبرعات في الانتظار</p>
        ) : (
          <div className="space-y-4">
            {pendingDonations.map((donation) => (
              <div key={donation.id} className="border rounded-lg p-4 bg-yellow-50/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium">
                        {donation.cases.title_ar || donation.cases.title}
                      </span>
                      {getStatusBadge(donation.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {donation.donor_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>المتبرع: {donation.donor_name}</span>
                        </div>
                      )}
                      <div>المبلغ: {donation.amount.toLocaleString()} جنيه</div>
                      <div className="flex items-center gap-4">
                        <span>كود الدفع: {donation.payment_code}</span>
                        {donation.donation_type === 'monthly' && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {donation.months_pledged} شهر
                          </span>
                        )}
                      </div>
                      <div>تاريخ الطلب: {new Date(donation.created_at).toLocaleDateString('ar-SA')}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDonation(donation);
                        setPaymentReference("");
                        setAdminNotes("");
                      }}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      مراجعة
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* التبرعات المؤكدة */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-green-700">التبرعات المؤكدة ({confirmedDonations.length})</h3>
        {confirmedDonations.length === 0 ? (
          <p className="text-muted-foreground">لا توجد تبرعات مؤكدة</p>
        ) : (
          <div className="space-y-3">
            {confirmedDonations.slice(0, 5).map((donation) => (
              <div key={donation.id} className="border rounded-lg p-3 bg-green-50/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {donation.cases.title_ar || donation.cases.title}
                      </span>
                      {getStatusBadge(donation.status)}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {donation.donor_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>المتبرع: {donation.donor_name}</span>
                        </div>
                      )}
                      <div>{donation.amount.toLocaleString()} جنيه - {new Date(donation.created_at).toLocaleDateString('ar-SA')}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {confirmedDonations.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                وعدد {confirmedDonations.length - 5} تبرعات أخرى...
              </p>
            )}
          </div>
        )}
      </Card>

      {/* نافذة مراجعة التبرع */}
      <Dialog open={!!selectedDonation} onOpenChange={() => setSelectedDonation(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>مراجعة التبرع</DialogTitle>
            <DialogDescription>
              راجع تفاصيل التبرع واتخذ الإجراء المناسب
            </DialogDescription>
          </DialogHeader>

          {selectedDonation && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">الحالة:</span> {selectedDonation.cases.title_ar || selectedDonation.cases.title}
                </div>
                <div className="text-sm">
                  <span className="font-medium">المبلغ:</span> {selectedDonation.amount.toLocaleString()} جنيه
                </div>
                <div className="text-sm">
                  <span className="font-medium">كود الدفع:</span> {selectedDonation.payment_code}
                </div>
                {selectedDonation.donation_type === 'monthly' && (
                  <div className="text-sm">
                    <span className="font-medium">عدد الأشهر:</span> {selectedDonation.months_pledged}
                  </div>
                )}
                {selectedDonation.donor_name && (
                  <div className="text-sm">
                    <span className="font-medium">اسم المتبرع:</span> {selectedDonation.donor_name}
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium">تاريخ الطلب:</span> {new Date(selectedDonation.created_at).toLocaleDateString('ar-SA')}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">رقم العملية/المرجع:</label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="أدخل رقم العملية أو المرجع"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات إدارية:</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="أضف ملاحظات إضافية..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedDonation(null)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelDonation}
              disabled={cancelDonationMutation.isPending}
            >
              <X className="w-4 h-4 ml-1" />
              رفض
            </Button>
            <Button 
              onClick={handleConfirmDonation}
              disabled={confirmDonationMutation.isPending || !paymentReference.trim()}
            >
              <Check className="w-4 h-4 ml-1" />
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};