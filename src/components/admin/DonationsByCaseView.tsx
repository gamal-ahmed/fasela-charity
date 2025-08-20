import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, User, Calendar, CreditCard, Check, X, Package, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Donation {
  id: string;
  case_id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  months_pledged: number;
  payment_code: string;
  status: string;
  donation_type: string;
  payment_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
}

interface CaseWithDonations {
  id: string;
  title: string;
  title_ar: string;
  monthly_cost: number;
  total_secured_money: number;
  months_covered: number;
  status: string;
  donations: Donation[];
}

export const DonationsByCaseView = () => {
  const [openCases, setOpenCases] = useState<Set<string>>(new Set());
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: casesWithDonations, isLoading } = useQuery({
    queryKey: ["donations-by-case"],
    queryFn: async () => {
      // First get all cases
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, title, title_ar, monthly_cost, total_secured_money, months_covered, status")
        .eq("is_published", true)
        .order("title_ar");

      if (casesError) throw casesError;

      // Then get all donations for these cases
      const { data: donations, error: donationsError } = await supabase
        .from("donations")
        .select("*")
        .in("case_id", cases.map(c => c.id))
        .order("created_at", { ascending: false });

      if (donationsError) throw donationsError;

      // Group donations by case
      const casesWithDonations: CaseWithDonations[] = cases.map(caseItem => ({
        ...caseItem,
        donations: donations.filter(d => d.case_id === caseItem.id)
      }));

      return casesWithDonations;
    }
  });

  const confirmDonationMutation = useMutation({
    mutationFn: async ({ id, paymentRef, notes }: { id: string; paymentRef: string; notes: string }) => {
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

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations-by-case"] });
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

  const redeemDonationMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "redeemed",
          admin_notes: notes
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donations-by-case"] });
      toast({
        title: "تم تسليم التبرع",
        description: "تم تسليم التبرع للعائلة بنجاح."
      });
      setSelectedDonation(null);
      setAdminNotes("");
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تسليم التبرع",
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
      queryClient.invalidateQueries({ queryKey: ["donations-by-case"] });
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

  const handleRedeemDonation = () => {
    if (!selectedDonation) return;
    redeemDonationMutation.mutate({
      id: selectedDonation.id,
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

  const toggleCase = (caseId: string) => {
    const newOpenCases = new Set(openCases);
    if (newOpenCases.has(caseId)) {
      newOpenCases.delete(caseId);
    } else {
      newOpenCases.add(caseId);
    }
    setOpenCases(newOpenCases);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">في الانتظار</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">مؤكد</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700">ملغي</Badge>;
      case 'redeemed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">تم التسليم</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDonationStats = (donations: Donation[]) => {
    const stats = {
      total: donations.length,
      pending: donations.filter(d => d.status === 'pending').length,
      confirmed: donations.filter(d => d.status === 'confirmed').length,
      redeemed: donations.filter(d => d.status === 'redeemed').length,
      cancelled: donations.filter(d => d.status === 'cancelled').length,
      totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
      confirmedAmount: donations.filter(d => d.status === 'confirmed').reduce((sum, d) => sum + d.amount, 0),
      redeemedAmount: donations.filter(d => d.status === 'redeemed').reduce((sum, d) => sum + d.amount, 0),
    };
    return stats;
  };

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">التبرعات حسب الحالة</h2>
          <div className="mt-2 p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
            <div className="text-lg font-bold text-primary">
              إجمالي التبرعات المسلمة: {casesWithDonations?.reduce((total, caseItem) => 
                total + getDonationStats(caseItem.donations).redeemedAmount, 0)?.toLocaleString() || 0} جنيه
            </div>
            <div className="text-sm text-muted-foreground">
              من {casesWithDonations?.reduce((total, caseItem) => 
                total + getDonationStats(caseItem.donations).redeemed, 0) || 0} تبرع مسلم
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {casesWithDonations?.length || 0} حالة
        </div>
      </div>

      <div className="space-y-4">
        {casesWithDonations?.map((caseItem) => {
          const stats = getDonationStats(caseItem.donations);
          const isOpen = openCases.has(caseItem.id);
          
          return (
            <Card key={caseItem.id} className="overflow-hidden">
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full" 
                  onClick={() => toggleCase(caseItem.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-right">
                        <CardTitle className="text-base sm:text-lg">
                          {caseItem.title_ar}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>التكلفة الشهرية: {caseItem.monthly_cost?.toLocaleString()} ج.م</span>
                          <span>•</span>
                          <span>المؤمن: {caseItem.total_secured_money?.toLocaleString()} ج.م</span>
                          <span>•</span>
                          <span>الأشهر المغطاة: {caseItem.months_covered || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {stats.total} تبرع
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stats.confirmedAmount.toLocaleString()} ج.م مؤكد
                          </div>
                        </div>
                        <ChevronDown 
                          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </div>
                    
                    {stats.total > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {stats.pending > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            في الانتظار: {stats.pending}
                          </Badge>
                        )}
                        {stats.confirmed > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            مؤكد: {stats.confirmed}
                          </Badge>
                        )}
                        {stats.redeemed > 0 && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            مسلم: {stats.redeemed}
                          </Badge>
                        )}
                        {stats.cancelled > 0 && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            ملغي: {stats.cancelled}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {caseItem.donations.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        لا توجد تبرعات لهذه الحالة
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">المتبرع</TableHead>
                            <TableHead className="text-right">المبلغ</TableHead>
                            <TableHead className="text-right">النوع</TableHead>
                            <TableHead className="text-right">كود الدفع</TableHead>
                            <TableHead className="text-right">الحالة</TableHead>
                            <TableHead className="text-right">تاريخ التبرع</TableHead>
                            <TableHead className="text-right">تاريخ التأكيد</TableHead>
                            <TableHead className="text-right">إجراءات</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>
                            {caseItem.donations.map((donation) => (
                              <TableRow key={donation.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">
                                        {donation.donor_name || 'متبرع مجهول'}
                                      </div>
                                      {donation.donor_email && (
                                        <div className="text-xs text-muted-foreground">
                                          {donation.donor_email}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {donation.amount.toLocaleString()} ج.م
                                  </div>
                                  {donation.donation_type === 'monthly' && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {donation.months_pledged} شهر
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {donation.donation_type === 'monthly' ? 'شهري' : 'مخصص'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    <span className="font-mono text-sm">
                                      {donation.payment_code}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(donation.status)}
                                </TableCell>
                                <TableCell>
                                  {new Date(donation.created_at).toLocaleDateString('ar-SA')}
                                </TableCell>
                              <TableCell>
                                {donation.confirmed_at 
                                  ? new Date(donation.confirmed_at).toLocaleDateString('ar-SA')
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedDonation(donation);
                                      setPaymentReference(donation.payment_reference || "");
                                      setAdminNotes(donation.admin_notes || "");
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  {donation.status === 'pending' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => {
                                        setSelectedDonation(donation);
                                        setPaymentReference("");
                                        setAdminNotes("");
                                      }}
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {donation.status === 'confirmed' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700"
                                      onClick={() => {
                                        setSelectedDonation(donation);
                                        setAdminNotes("");
                                      }}
                                    >
                                      <Package className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {(donation.status === 'pending' || donation.status === 'confirmed') && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => {
                                        setSelectedDonation(donation);
                                        setAdminNotes("");
                                      }}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Management Dialog */}
      <Dialog open={!!selectedDonation} onOpenChange={(open) => !open && setSelectedDonation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إدارة التبرع</DialogTitle>
            <DialogDescription>
              {selectedDonation && (
                <div className="space-y-2 mt-4">
                  <div>المتبرع: {selectedDonation.donor_name || 'متبرع مجهول'}</div>
                  <div>المبلغ: {selectedDonation.amount.toLocaleString()} ج.م</div>
                  <div>كود الدفع: {selectedDonation.payment_code}</div>
                  <div>الحالة الحالية: {getStatusBadge(selectedDonation.status)}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDonation?.status === 'pending' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">مرجع الدفع</label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="أدخل مرجع الدفع"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات الإدارة</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="أضف ملاحظات..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            {selectedDonation?.status === 'pending' && (
              <>
                <Button
                  onClick={handleConfirmDonation}
                  disabled={confirmDonationMutation.isPending || !paymentReference.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 ml-1" />
                  تأكيد
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelDonation}
                  disabled={cancelDonationMutation.isPending}
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
              </>
            )}
            
            {selectedDonation?.status === 'confirmed' && (
              <>
                <Button
                  onClick={handleRedeemDonation}
                  disabled={redeemDonationMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="w-4 h-4 ml-1" />
                  تسليم للعائلة
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelDonation}
                  disabled={cancelDonationMutation.isPending}
                >
                  <X className="w-4 h-4 ml-1" />
                  إلغاء
                </Button>
              </>
            )}
            
            <Button variant="outline" onClick={() => setSelectedDonation(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};