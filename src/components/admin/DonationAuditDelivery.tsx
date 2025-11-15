import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Truck, 
  Eye, 
  Filter,
  Download,
  AlertCircle,
  CreditCard,
  Package,
  History,
  ChevronDown,
  ChevronRight
} from "lucide-react";

interface Donation {
  id: string;
  case_id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  status: string;
  donation_type: string;
  months_pledged: number;
  payment_reference: string | null;
  admin_notes: string | null;
  created_at: string;
  confirmed_at: string | null;
  handover_status: string;
  total_handed_over: number;
  payment_code: string;
  cases: {
    id: string;
    title: string;
    title_ar: string;
  };
}

interface HandoverRecord {
  id: string;
  donation_id: string;
  case_id: string;
  handover_amount: number;
  handover_date: string;
  handover_notes: string | null;
  handed_over_by: string | null;
  created_at: string;
  cases: {
    title: string;
    title_ar: string;
  };
  donations: {
    donor_name: string | null;
    amount: number;
    payment_code: string;
    created_at: string;
    confirmed_at: string | null;
  };
}

const DonationAuditDelivery = () => {
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [handoverAmount, setHandoverAmount] = useState("");
  const [handoverNotes, setHandoverNotes] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [createReport, setCreateReport] = useState(true); // New state for checkbox
  const [filterStatus, setFilterStatus] = useState("all");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [handoverPage, setHandoverPage] = useState(1);
  const HANDOVERS_PER_PAGE = 20;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch donations with case details
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["donation-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          cases!inner(id, title, title_ar)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Donation[];
    }
  });

  // Fetch cases for handover transfer
  const { data: allCases = [] } = useQuery({
    queryKey: ["cases-for-handover"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("id, title_ar, status")
        .order("title_ar", { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all handover history since inception with pagination
  const { data: handoverHistory = [], isFetching: isFetchingHandovers } = useQuery({
    queryKey: ["handover-history", handoverPage],
    queryFn: async () => {
      const from = 0;
      const to = handoverPage * HANDOVERS_PER_PAGE - 1;
      
      const { data, error } = await supabase
        .from("donation_handovers")
        .select(`
          *,
          cases(title, title_ar),
          donations(donor_name, amount, payment_code, created_at, confirmed_at)
        `)
        .order("handover_date", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return data as HandoverRecord[];
    }
  });
  
  // Check if there are more handovers to load
  const { data: totalHandovers } = useQuery({
    queryKey: ["handover-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("donation_handovers")
        .select("*", { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Confirm donation mutation
  const confirmDonationMutation = useMutation({
    mutationFn: async ({ donationId, paymentRef, notes }: { donationId: string; paymentRef: string; notes: string }) => {
      const { error } = await supabase
        .from("donations")
        .update({
          status: "confirmed",
          payment_reference: paymentRef,
          admin_notes: notes,
          confirmed_at: new Date().toISOString(),
          confirmed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq("id", donationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "تم تأكيد التبرع بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["donation-audit"] });
      setShowActionDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء تأكيد التبرع", variant: "destructive" });
    }
  });

  // Handover mutation
  const handoverMutation = useMutation({
    mutationFn: async ({ 
      donationId, 
      caseId, 
      amount, 
      notes,
      shouldCreateReport
    }: { 
      donationId: string; 
      caseId: string; 
      amount: number; 
      notes: string;
      shouldCreateReport: boolean;
    }) => {
      try {
        // Insert handover record
        const { error: handoverError } = await supabase
          .from("donation_handovers")
          .insert({
            donation_id: donationId,
            case_id: caseId,
            handover_amount: amount,
            handover_notes: notes,
            handed_over_by: (await supabase.auth.getUser()).data.user?.id
          });
        
        if (handoverError) throw handoverError;

        // Note: total_handed_over is automatically updated by database trigger
        // when donation_handovers record is inserted

        // Only create report if checkbox is checked
        if (shouldCreateReport) {
          // Get donation details for report
          const { data: donationData, error: donationError } = await supabase
            .from("donations")
            .select("amount, payment_code")
            .eq("id", donationId)
            .single();

          if (donationError) throw donationError;

          // Get case details for report
          const { data: caseData, error: caseError } = await supabase
            .from("cases")
            .select("title, title_ar")
            .eq("id", caseId)
            .single();

          if (caseError) throw caseError;

          // Create automatic report
          const reportTitle = `تسليم تبرع بقيمة ${amount.toLocaleString()} ج.م`;
          const reportDescription = `تم تسليم مبلغ ${amount.toLocaleString()} ج.م من التبرع رقم ${donationData.payment_code}''} إلى الحالة ${caseData.title_ar || caseData.title}.${notes ? `\n\nملاحظات التسليم:\n${notes}` : ''}`;

          const { error: reportError } = await supabase
            .from("monthly_reports")
            .insert({
              case_id: caseId,
              title: reportTitle,
              description: reportDescription,
              report_date: new Date().toISOString().split('T')[0],
              status: 'completed',
              category: 'handover'
            });

          if (reportError) throw reportError;
        }
        
        return { success: true };
      } catch (error) {
        console.error("Handover mutation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "تم تسليم التبرع بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["donation-audit"] });
      queryClient.invalidateQueries({ queryKey: ["handover-history"] });
      queryClient.invalidateQueries({ queryKey: ["handover-count"] });
      setShowHandoverDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Handover error:", error);
      toast({ 
        title: "حدث خطأ أثناء تسليم التبرع", 
        description: error.message || "خطأ غير معروف",
        variant: "destructive" 
      });
    }
  });

  // Cancel donation mutation
  const cancelDonationMutation = useMutation({
    mutationFn: async (donationId: string) => {
      const { error } = await supabase
        .from("donations")
        .update({ status: "cancelled" })
        .eq("id", donationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "تم إلغاء التبرع" });
      queryClient.invalidateQueries({ queryKey: ["donation-audit"] });
      setShowActionDialog(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "حدث خطأ أثناء إلغاء التبرع", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setSelectedDonation(null);
    setPaymentReference("");
    setAdminNotes("");
    setHandoverAmount("");
    setHandoverNotes("");
    setSelectedCaseId("");
    setCreateReport(true); // Reset checkbox to checked by default
  };

  const toggleCaseExpansion = (caseId: string) => {
    setExpandedCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(caseId)) {
        newSet.delete(caseId);
      } else {
        newSet.add(caseId);
      }
      return newSet;
    });
  };

  const openActionDialog = (donation: Donation) => {
    setSelectedDonation(donation);
    setPaymentReference(donation.payment_reference || "");
    setAdminNotes(donation.admin_notes || "");
    setShowActionDialog(true);
  };

  const openHandoverDialog = (donation: Donation) => {
    setSelectedDonation(donation);
    setSelectedCaseId(donation.case_id);
    setHandoverAmount(String(donation.amount - (donation.total_handed_over || 0)));
    setShowHandoverDialog(true);
  };

  const handleConfirm = () => {
    if (!selectedDonation) return;
    confirmDonationMutation.mutate({
      donationId: selectedDonation.id,
      paymentRef: paymentReference,
      notes: adminNotes
    });
  };

  const handleHandover = () => {
    if (!selectedDonation || !handoverAmount) return;
    
    const targetCaseId = selectedCaseId === "original" ? selectedDonation.case_id : selectedCaseId;
    
    handoverMutation.mutate({
      donationId: selectedDonation.id,
      caseId: targetCaseId,
      amount: Number(handoverAmount),
      notes: handoverNotes,
      shouldCreateReport: createReport
    });
  };

  const handleCancel = () => {
    if (!selectedDonation) return;
    cancelDonationMutation.mutate(selectedDonation.id);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, text: "في الانتظار" },
      confirmed: { variant: "default" as const, icon: CheckCircle, text: "مؤكد" },
      cancelled: { variant: "destructive" as const, icon: XCircle, text: "ملغى" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getHandoverStatusBadge = (status: string, total: number, amount: number) => {
    if (status === "none") {
      return <Badge variant="outline">لم يسلم</Badge>;
    } else if (status === "partial") {
      return <Badge variant="secondary">مسلم جزئياً ({total} من {amount})</Badge>;
    } else {
      return <Badge variant="default">مسلم كاملاً</Badge>;
    }
  };

  // Filter donations
  const pendingDonations = donations.filter(d => d.status === "pending");
  const readyForDelivery = donations.filter(d => 
    d.status === "confirmed" && 
    (d.handover_status === "none" || d.handover_status === "partial")
  );
  const filteredDonations = filterStatus === "all" ? donations : 
    donations.filter(d => d.status === filterStatus);

  // Group ready for delivery donations by case
  const groupedReadyForDelivery = readyForDelivery.reduce((acc, donation) => {
    const caseId = donation.case_id;
    if (!acc[caseId]) {
      acc[caseId] = {
        case: donation.cases,
        donations: []
      };
    }
    acc[caseId].donations.push(donation);
    return acc;
  }, {} as Record<string, { case: { id: string; title: string; title_ar: string }; donations: Donation[] }>);

  // Group handover history by case
  const groupedHandoverHistory = handoverHistory.reduce((acc, record) => {
    const caseId = record.case_id;
    if (!acc[caseId]) {
      acc[caseId] = {
        caseId: caseId,
        case: record.cases,
        records: []
      };
    }
    acc[caseId].records.push(record);
    return acc;
  }, {} as Record<string, { caseId: string; case: { title: string; title_ar: string }; records: HandoverRecord[] }>);

  if (isLoading) {
    return <div className="text-center py-8">جار التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              في الانتظار
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDonations.length}</div>
            <p className="text-sm text-muted-foreground">
              {pendingDonations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              جاهز للتسليم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readyForDelivery.length}</div>
            <p className="text-sm text-muted-foreground">
              {readyForDelivery.reduce((sum, d) => sum + (d.amount - (d.total_handed_over || 0)), 0).toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-500" />
              مسلم هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {handoverHistory.filter(h => 
                new Date(h.handover_date).getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-sm text-muted-foreground">عملية تسليم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              إجمالي التبرعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{donations.length}</div>
            <p className="text-sm text-muted-foreground">
              {donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ج.م
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            في الانتظار ({pendingDonations.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            جاهز للتسليم ({readyForDelivery.length})
          </TabsTrigger>
          <TabsTrigger value="handed-over" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            مسلم ({handoverHistory.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Donations Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingDonations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  التبرعات في الانتظار ({pendingDonations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingDonations.map((donation) => (
                    <div key={donation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{donation.donor_name || "متبرع مجهول"}</p>
                            <p className="text-sm text-muted-foreground">
                              {donation.cases.title_ar} - {donation.amount.toLocaleString()} ج.م
                            </p>
                            <p className="text-xs text-muted-foreground">
                              التاريخ: {new Date(donation.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              كود الدفع: {donation.payment_code}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(donation.status)}
                        <Button 
                          size="sm" 
                          onClick={() => openActionDialog(donation)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          مراجعة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد تبرعات في الانتظار</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Ready for Delivery Tab */}
        <TabsContent value="ready" className="space-y-4">
          {readyForDelivery.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-500" />
                  جاهز للتسليم ({readyForDelivery.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.values(groupedReadyForDelivery).map((group) => {
                    const isExpanded = expandedCases.has(group.case.id);
                    return (
                      <div key={group.case.id} className="space-y-3">
                        <div 
                          className="border-b pb-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                          onClick={() => toggleCaseExpansion(group.case.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{group.case.title_ar}</h3>
                              <p className="text-sm text-muted-foreground">
                                {group.donations.length} تبرع جاهز للتسليم
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {isExpanded ? "إخفاء" : "عرض"}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="space-y-3 pl-4">
                            {group.donations.map((donation) => (
                              <div key={donation.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-full">
                                      <p className="font-medium">{donation.donor_name || "متبرع مجهول"}</p>
                                      <p className="text-sm text-muted-foreground">
                                        المبلغ المتبقي: {(donation.amount - (donation.total_handed_over || 0)).toLocaleString()} ج.م من {donation.amount.toLocaleString()} ج.م
                                      </p>
                                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span>
                                          تاريخ الإنشاء: {new Date(donation.created_at).toLocaleDateString('ar-EG', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </span>
                                        {donation.confirmed_at && (
                                          <span>
                                            تاريخ التأكيد: {new Date(donation.confirmed_at).toLocaleDateString('ar-EG', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric'
                                            })}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        {getHandoverStatusBadge(donation.handover_status, donation.total_handed_over || 0, donation.amount)}
                                      </div>
                                      {donation.admin_notes && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">
                                          ملاحظات: {donation.admin_notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => openHandoverDialog(donation)}
                                    className="flex items-center gap-1"
                                  >
                                    <Truck className="w-3 h-3" />
                                    تسليم
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد تبرعات جاهزة للتسليم</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Handed Over Donations Tab */}
        <TabsContent value="handed-over" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-green-500" />
                جميع التسليمات منذ البداية ({handoverHistory.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {Object.keys(groupedHandoverHistory).length > 0 ? (
                  Object.values(groupedHandoverHistory).map((group) => {
                    const isExpanded = expandedCases.has(group.caseId);
                    return (
                      <div key={group.caseId} className="space-y-3">
                        <div 
                          className="border-b pb-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                          onClick={() => toggleCaseExpansion(group.caseId)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{group.case.title_ar}</h3>
                              <p className="text-sm text-muted-foreground">
                                {group.records.length} عملية تسليم
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {isExpanded ? "إخفاء" : "عرض"}
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="space-y-2 pl-4">
                            {group.records.map((record) => (
                              <div key={record.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {record.donations.donor_name || "متبرع مجهول"} - {record.handover_amount.toLocaleString()} ج.م
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span>
                                      تاريخ التسليم: {new Date(record.handover_date).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </span>
                                    {record.donations.created_at && (
                                      <span>
                                        تاريخ الإنشاء: {new Date(record.donations.created_at).toLocaleDateString('ar-EG', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    )}
                                    {record.donations.confirmed_at && (
                                      <span>
                                        تاريخ التأكيد: {new Date(record.donations.confirmed_at).toLocaleDateString('ar-EG', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </span>
                                    )}
                                  </div>
                                  {record.handover_notes && (
                                    <p className="text-xs text-muted-foreground mt-1 italic">
                                      ملاحظات التسليم: {record.handover_notes}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  مسلم
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    لا توجد تسليمات مسجلة
                  </div>
                )}
              </div>
              
              {/* Load More Button */}
              {totalHandovers && handoverHistory.length < totalHandovers && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setHandoverPage(prev => prev + 1)}
                    disabled={isFetchingHandovers}
                  >
                    {isFetchingHandovers ? "جاري التحميل..." : `تحميل المزيد (${totalHandovers - handoverHistory.length} متبقي)`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>مراجعة التبرع</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p><strong>المتبرع:</strong> {selectedDonation.donor_name || "مجهول"}</p>
                <p><strong>المبلغ:</strong> {selectedDonation.amount.toLocaleString()} ج.م</p>
                <p><strong>الحالة:</strong> {selectedDonation.cases.title_ar}</p>
                <p><strong>كود الدفع:</strong> {selectedDonation.payment_code}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="payment-ref">مرجع الدفع</Label>
                  <Input
                    id="payment-ref"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="أدخل مرجع الدفع"
                  />
                </div>
                
                <div>
                  <Label htmlFor="admin-notes">ملاحظات الإدارة</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleConfirm}
                  disabled={confirmDonationMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  تأكيد
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelDonationMutation.isPending}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Handover Dialog */}
      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسليم التبرع</DialogTitle>
          </DialogHeader>
          {selectedDonation && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p><strong>المتبرع:</strong> {selectedDonation.donor_name || "مجهول"}</p>
                <p><strong>المبلغ الأصلي:</strong> {selectedDonation.amount.toLocaleString()} ج.م</p>
                <p><strong>المسلم سابقاً:</strong> {(selectedDonation.total_handed_over || 0).toLocaleString()} ج.م</p>
                <p><strong>المتبقي:</strong> {(selectedDonation.amount - (selectedDonation.total_handed_over || 0)).toLocaleString()} ج.م</p>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="handover-amount">المبلغ المراد تسليمه</Label>
                  <Input
                    id="handover-amount"
                    type="number"
                    value={handoverAmount}
                    onChange={(e) => setHandoverAmount(e.target.value)}
                    max={selectedDonation.amount - (selectedDonation.total_handed_over || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="target-case">تسليم إلى الحالة</Label>
                  <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة المستهدفة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original">الحالة الأصلية</SelectItem>
                      {allCases?.filter(c => c.id !== selectedDonation.case_id).map((caseItem) => (
                        <SelectItem key={caseItem.id} value={caseItem.id}>
                          {caseItem.title_ar}
                          {caseItem.status === "active" ? " (نشطة)" : " (مكتملة)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="handover-notes">ملاحظات التسليم</Label>
                  <Textarea
                    id="handover-notes"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="ملاحظات حول عملية التسليم"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="create-report" 
                    checked={createReport}
                    onCheckedChange={(checked) => setCreateReport(checked as boolean)}
                  />
                  <Label htmlFor="create-report" className="text-sm">
                    إنشاء تقرير تلقائي للحالة
                  </Label>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleHandover}
                  disabled={handoverMutation.isPending || !handoverAmount}
                  className="flex-1"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  تسليم
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowHandoverDialog(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { DonationAuditDelivery };