import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, ChevronLeft, ChevronRight, Edit2, Plus, Search, LogOut, Home, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface HandoverData {
  id?: string;
  amount: number;
  date: string;
  notes?: string;
}

interface CaseHandovers {
  caseId: string;
  caseTitle: string;
  caseTitleAr: string;
  monthlyCost: number;
  handoversByMonth: Record<string, HandoverData[]>;
}

interface Donation {
  id: string;
  donor_name: string;
  amount: number;
  total_handed_over: number;
  remaining: number;
}

export default function CaseHandoverCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    caseId: string;
    caseTitle: string;
    caseTitleAr: string;
    monthlyCost: number;
    month: number;
    year: number;
    existingHandover?: HandoverData;
  } | null>(null);
  const [editForm, setEditForm] = useState({ 
    amount: "", 
    notes: "", 
    selectedDonationId: "" 
  });
  const [availableDonations, setAvailableDonations] = useState<Donation[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        } else {
          checkUserRole(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session?.user) {
        navigate("/auth");
      } else {
        checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error checking user role:", error);
        return;
      }

      const hasAdminRole = data?.some(role => role.role === "admin") || false;
      setIsAdmin(hasAdminRole || false);
      
      if (!hasAdminRole) {
        toast({
          title: "غير مخول",
          description: "ليس لديك صلاحية للوصول إلى هذه الصفحة",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });
      navigate("/auth");
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const { data: casesWithHandovers, isLoading } = useQuery({
    queryKey: ["case-handover-calendar", selectedYear],
    queryFn: async () => {
      const { data: cases, error: casesError } = await supabase
        .from("cases")
        .select("id, title, title_ar, monthly_cost")
        .eq("is_published", true)
        .order("title");

      if (casesError) throw casesError;

      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31, 23, 59, 59);

      const { data: handovers, error: handoversError } = await supabase
        .from("donation_handovers")
        .select("id, case_id, handover_amount, handover_date, handover_notes")
        .gte("handover_date", startDate.toISOString())
        .lte("handover_date", endDate.toISOString());

      if (handoversError) throw handoversError;

      const result: CaseHandovers[] = cases.map(caseItem => {
        const caseHandovers = handovers.filter(h => h.case_id === caseItem.id);
        const handoversByMonth: Record<string, HandoverData[]> = {};

        caseHandovers.forEach(handover => {
          const date = new Date(handover.handover_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!handoversByMonth[monthKey]) {
            handoversByMonth[monthKey] = [];
          }

          handoversByMonth[monthKey].push({
            id: handover.id,
            amount: handover.handover_amount,
            date: handover.handover_date,
            notes: handover.handover_notes || undefined,
          });
        });

        return {
          caseId: caseItem.id,
          caseTitle: caseItem.title,
          caseTitleAr: caseItem.title_ar || caseItem.title,
          monthlyCost: caseItem.monthly_cost || 0,
          handoversByMonth,
        };
      });

      return result;
    },
  });

  // Fetch available donations when dialog opens
  const fetchAvailableDonations = async (caseId: string) => {
    const { data, error } = await supabase
      .from("donations")
      .select("id, donor_name, amount, total_handed_over")
      .eq("case_id", caseId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل التبرعات المتاحة",
        variant: "destructive",
      });
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      donor_name: d.donor_name || "متبرع مجهول",
      amount: Number(d.amount),
      total_handed_over: Number(d.total_handed_over || 0),
      remaining: Number(d.amount) - Number(d.total_handed_over || 0),
    })).filter(d => d.remaining > 0);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: {
      caseId: string;
      donationId: string;
      month: number;
      year: number;
      amount: number;
      notes?: string;
      handoverId?: string;
    }) => {
      const handoverDate = new Date(data.year, data.month, 15);
      const preciseAmount = Number(Number(data.amount).toFixed(2));

      if (data.handoverId) {
        const { error } = await supabase
          .from("donation_handovers")
          .update({
            handover_amount: preciseAmount,
            handover_notes: data.notes,
            donation_id: data.donationId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.handoverId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("donation_handovers")
          .insert({
            case_id: data.caseId,
            donation_id: data.donationId,
            handover_amount: preciseAmount,
            handover_date: handoverDate.toISOString(),
            handover_notes: data.notes,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-handover-calendar"] });
      toast({
        title: "نجح",
        description: "تم حفظ التسليم بنجاح",
      });
      setEditDialog(null);
      setEditForm({ amount: "", notes: "", selectedDonationId: "" });
      setAvailableDonations([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openEditDialog = async (
    caseId: string,
    caseTitle: string,
    caseTitleAr: string,
    monthlyCost: number,
    month: number,
    existingHandovers?: HandoverData[]
  ) => {
    const existingHandover = existingHandovers?.[0];
    
    // Fetch available donations
    const donations = await fetchAvailableDonations(caseId);
    setAvailableDonations(donations);
    
    setEditForm({
      amount: existingHandover?.amount.toString() || monthlyCost.toString(),
      notes: existingHandover?.notes || "",
      selectedDonationId: "",
    });
    
    setEditDialog({
      open: true,
      caseId,
      caseTitle,
      caseTitleAr,
      monthlyCost,
      month,
      year: selectedYear,
      existingHandover,
    });
  };

  const handleSave = () => {
    if (!editDialog) return;

    const amount = parseFloat(editForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "مبلغ غير صالح",
        description: "الرجاء إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (!editForm.selectedDonationId) {
      toast({
        title: "تبرع غير محدد",
        description: "الرجاء اختيار التبرع الذي سيتم الخصم منه",
        variant: "destructive",
      });
      return;
    }

    const selectedDonation = availableDonations.find(d => d.id === editForm.selectedDonationId);
    if (selectedDonation && amount > selectedDonation.remaining) {
      toast({
        title: "مبلغ غير صالح",
        description: `المبلغ المتبقي في التبرع: ${selectedDonation.remaining.toFixed(2)} جنيه`,
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      caseId: editDialog.caseId,
      donationId: editForm.selectedDonationId,
      month: editDialog.month,
      year: editDialog.year,
      amount,
      notes: editForm.notes,
      handoverId: editDialog.existingHandover?.id,
    });
  };

  const getMonthTotal = (handovers?: HandoverData[]) => {
    if (!handovers || handovers.length === 0) return 0;
    return Number(handovers.reduce((sum, h) => sum + Number(h.amount), 0).toFixed(2));
  };

  // Filter cases based on search query
  const filteredCases = casesWithHandovers?.filter(caseData => 
    caseData.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    caseData.caseTitleAr.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl">جار التحميل...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/lovable-uploads/1377342f-e772-4165-b1d5-8f6cbc909fa4.png" alt="الشعار" className="w-8 h-8" />
                <span className="text-xl font-bold">فَسِيلَة خير</span>
              </div>
            </div>
          </div>
        </header>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">جار التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/lovable-uploads/1377342f-e772-4165-b1d5-8f6cbc909fa4.png" alt="الشعار" className="w-8 h-8" />
                <span className="text-xl font-bold">فَسِيلَة خير</span>
              </div>
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <LogOut className="w-4 h-4 ml-2" />
                خروج
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    الرئيسية
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin" className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    لوحة التحكم
                  </Link>
                </Button>
              </nav>
              <div className="text-right">
                <h1 className="text-lg font-semibold">تقويم التسليم الشهري</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              تقويم التسليم الشهري
            </h1>
            <p className="text-muted-foreground mt-1">
              تتبع التسليمات الشهرية لكل حالة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(selectedYear - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-xl font-semibold min-w-[100px] text-center">
              {selectedYear}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(selectedYear + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ابحث عن حالة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      <div className="space-y-6">
        {filteredCases && filteredCases.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              لا توجد حالات مطابقة لبحثك
            </CardContent>
          </Card>
        )}
        
        {filteredCases?.map((caseData) => (
          <Card key={caseData.caseId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{caseData.caseTitleAr}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  التكلفة الشهرية: {caseData.monthlyCost.toLocaleString()} جنيه
                </span>
              </CardTitle>
              <CardDescription>{caseData.caseTitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {months.map((monthName, monthIndex) => {
                  const monthKey = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}`;
                  const handovers = caseData.handoversByMonth[monthKey];
                  const total = getMonthTotal(handovers);
                  const hasHandover = handovers && handovers.length > 0;

                  return (
                    <div
                      key={monthIndex}
                      className={`relative border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer ${
                        hasHandover
                          ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                          : "border-border hover:border-primary"
                      }`}
                      onClick={() => openEditDialog(
                        caseData.caseId, 
                        caseData.caseTitle, 
                        caseData.caseTitleAr,
                        caseData.monthlyCost,
                        monthIndex, 
                        handovers
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">{monthName.slice(0, 3)}</div>
                        {hasHandover ? (
                          <Edit2 className="w-3 h-3 text-green-600" />
                        ) : (
                          <Plus className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      {hasHandover ? (
                        <div className="space-y-1">
                          <div className="text-lg font-bold text-green-700 dark:text-green-400">
                            {total.toFixed(2)} جنيه
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {handovers.length} تسليم
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">لا يوجد تسليم</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>

      <Dialog open={editDialog?.open || false} onOpenChange={(open) => {
        if (!open) {
          setEditDialog(null);
          setAvailableDonations([]);
          setEditForm({ amount: "", notes: "", selectedDonationId: "" });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editDialog?.existingHandover ? "تعديل" : "إضافة"} تسليم شهري
            </DialogTitle>
            <DialogDescription className="space-y-1">
              <div className="font-semibold">{editDialog?.caseTitleAr}</div>
              <div className="text-sm">{months[editDialog?.month || 0]} {editDialog?.year}</div>
              <div className="text-sm">التكلفة الشهرية: {editDialog?.monthlyCost.toLocaleString()} جنيه</div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="donation">اختر التبرع للخصم منه *</Label>
              <Select 
                value={editForm.selectedDonationId} 
                onValueChange={(value) => {
                  const donation = availableDonations.find(d => d.id === value);
                  setEditForm({ 
                    ...editForm, 
                    selectedDonationId: value,
                    amount: Math.min(
                      editDialog?.monthlyCost || 0,
                      donation?.remaining || 0
                    ).toString()
                  });
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="اختر تبرعاً..." />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {availableDonations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      لا توجد تبرعات متاحة لهذه الحالة
                    </div>
                  ) : (
                    availableDonations.map((donation) => (
                      <SelectItem key={donation.id} value={donation.id} className="cursor-pointer">
                        <div className="flex flex-col py-1">
                          <div className="font-medium">{donation.donor_name}</div>
                          <div className="text-sm text-muted-foreground">
                            المتبقي: {donation.remaining.toFixed(2)} من {donation.amount.toFixed(2)} جنيه
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {editForm.selectedDonationId && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  المبلغ المتاح: {availableDonations.find(d => d.id === editForm.selectedDonationId)?.remaining.toFixed(2)} جنيه
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ (جنيه) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="أدخل المبلغ"
                value={editForm.amount}
                onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أضف أي ملاحظات عن هذا التسليم"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialog(null);
              setAvailableDonations([]);
            }}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
