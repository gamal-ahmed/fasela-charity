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
import { useOrgQueryOptions } from "@/hooks/useOrgQuery";

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
  original_case_id: string | null;
  handover_amount: number;
  handover_date: string;
  handover_notes: string | null;
  handed_over_by: string | null;
  created_at: string;
  cases: {
    title: string;
    title_ar: string;
  };
  original_case: {
    title: string;
    title_ar: string;
  } | null;
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
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [createReport, setCreateReport] = useState(true); // New state for checkbox
  const [filterStatus, setFilterStatus] = useState("all");
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [handoverPage, setHandoverPage] = useState(1);
  const HANDOVERS_PER_PAGE = 20;
  const [searchName, setSearchName] = useState("");
  const [searchAmount, setSearchAmount] = useState("");
  const [sortByDate, setSortByDate] = useState<"desc" | "asc">("desc");

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { orgId, enabled: orgReady } = useOrgQueryOptions();

  // Fetch donations with case details
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ["donation-audit", orgId],
    queryFn: async () => {
      const query = supabase
        .from("donations")
        .select(`
          *,
          cases!inner(id, title, title_ar)
        `)
        .order("created_at", { ascending: false });
      if (orgId) query.eq("organization_id", orgId);
      const { data, error } = await query as any;

      if (error) throw error;
      return data as Donation[];
    },
    enabled: orgReady,
  });

  // Fetch cases for handover transfer
  const { data: allCases = [] } = useQuery({
    queryKey: ["cases-for-handover", orgId],
    queryFn: async () => {
      const query = supabase
        .from("cases")
        .select("id, title_ar, status")
        .order("title_ar", { ascending: true });
      if (orgId) query.eq("organization_id", orgId);
      const { data, error } = await query as any;

      if (error) throw error;
      return data;
    },
    enabled: orgReady,
  });

  // Fetch all handover history since inception with pagination
  const { data: handoverHistory = [], isFetching: isFetchingHandovers } = useQuery({
    queryKey: ["handover-history", handoverPage, orgId],
    queryFn: async () => {
      const from = 0;
      const to = handoverPage * HANDOVERS_PER_PAGE - 1;

      const query = supabase
        .from("donation_handovers")
        .select(`
          *,
          cases!donation_handovers_case_id_fkey(title, title_ar),
          original_case:cases!donation_handovers_original_case_id_fkey(title, title_ar),
          donations(donor_name, amount, payment_code, created_at, confirmed_at)
        `)
        .order("handover_date", { ascending: false })
        .range(from, to);
      if (orgId) query.eq("organization_id", orgId);
      const { data, error } = await query as any;

      if (error) throw error;
      return data as HandoverRecord[];
    },
    enabled: orgReady,
  });

  // Check if there are more handovers to load
  const { data: totalHandovers } = useQuery({
    queryKey: ["handover-count", orgId],
    queryFn: async () => {
      const query = supabase
        .from("donation_handovers")
        .select("*", { count: 'exact', head: true });
      if (orgId) query.eq("organization_id", orgId);
      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    },
    enabled: orgReady,
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
      date,
      shouldCreateReport
    }: {
      donationId: string;
      caseId: string;
      amount: number;
      notes: string;
      date: string;
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
            handover_date: date,
            handed_over_by: (await supabase.auth.getUser()).data.user?.id
          } as any);

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
              report_date: date,
              status: 'completed',
              category: 'handover'
            } as any);

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
    setHandoverDate(new Date().toISOString().split('T')[0]);
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
      date: handoverDate,
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

  // Helper function to filter and sort donations
  const filterAndSortDonations = (donations: Donation[]) => {
    let filtered = [...donations];

    // Filter by name
    if (searchName.trim()) {
      filtered = filtered.filter(d =>
        d.donor_name?.toLowerCase().includes(searchName.toLowerCase()) ||
        d.cases?.title_ar?.toLowerCase().includes(searchName.toLowerCase()) ||
        d.cases?.title?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by amount
    if (searchAmount.trim()) {
      const searchAmountNum = parseFloat(searchAmount);
      if (!isNaN(searchAmountNum)) {
        filtered = filtered.filter(d => d.amount === searchAmountNum);
      }
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortByDate === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  // Helper function to filter handover history
  const filterAndSortHandovers = (handovers: HandoverRecord[]) => {
    let filtered = [...handovers];

    // Filter by name
    if (searchName.trim()) {
      filtered = filtered.filter(h =>
        h.donations?.donor_name?.toLowerCase().includes(searchName.toLowerCase()) ||
        h.cases?.title_ar?.toLowerCase().includes(searchName.toLowerCase()) ||
        h.cases?.title?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Filter by amount
    if (searchAmount.trim()) {
      const searchAmountNum = parseFloat(searchAmount);
      if (!isNaN(searchAmountNum)) {
        filtered = filtered.filter(h => h.handover_amount === searchAmountNum);
      }
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.handover_date).getTime();
      const dateB = new Date(b.handover_date).getTime();
      return sortByDate === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  // Filter donations
  const pendingDonations = filterAndSortDonations(donations.filter(d => d.status === "pending"));
  const readyForDelivery = filterAndSortDonations(donations.filter(d =>
    d.status === "confirmed" &&
    (d.handover_status === "none" || d.handover_status === "partial")
  ));
  const filteredHandoverHistory = filterAndSortHandovers(handoverHistory);

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
  const groupedHandoverHistory = filteredHandoverHistory.reduce((acc, record) => {
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
          {/* Search and Sort Controls */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1">بحث بالاسم أو الحالة</Label>
                <Input
                  placeholder="ابحث..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs mb-1">بحث بالمبلغ</Label>
                <Input
                  type="number"
                  placeholder="المبلغ..."
                  value={searchAmount}
                  onChange={(e) => setSearchAmount(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs mb-1">ترتيب</Label>
                <Select value={sortByDate} onValueChange={(value: "desc" | "asc") => setSortByDate(value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">الأحدث أولاً</SelectItem>
                    <SelectItem value="asc">الأقدم أولاً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

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
          {/* Search and Sort Controls */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1">بحث بالاسم أو الحالة</Label>
                <Input
                  placeholder="ابحث..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs mb-1">بحث بالمبلغ</Label>
                <Input
                  type="number"
                  placeholder="المبلغ..."
                  value={searchAmount}
                  onChange={(e) => setSearchAmount(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs mb-1">ترتيب</Label>
                <Select value={sortByDate} onValueChange={(value: "desc" | "asc") => setSortByDate(value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">الأحدث أولاً</SelectItem>
                    <SelectItem value="asc">الأقدم أولاً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

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
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{group.case.title_ar}</h3>
                              <div className="flex items-center gap-4 mt-1 flex-wrap">
                                <p className="text-sm text-muted-foreground">
                                  {group.donations.length} تبرع جاهز للتسليم
                                </p>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-muted-foreground">
                                    إجمالي المبلغ: <span className="font-semibold text-blue-600">
                                      {group.donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()} ج.م
                                    </span>
                                  </span>
                                  <span className="text-muted-foreground">
                                    المسلم: <span className="font-semibold text-green-600">
                                      {group.donations.reduce((sum, d) => sum + (d.total_handed_over || 0), 0).toLocaleString()} ج.م
                                    </span>
                                  </span>
                                  <span className="text-muted-foreground">
                                    جاهز: <span className="font-semibold text-orange-600">
                                      {group.donations.reduce((sum, d) => sum + (d.amount - (d.total_handed_over || 0)), 0).toLocaleString()} ج.م
                                    </span>
                                  </span>
                                </div>
                              </div>
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
                            {group.donations.map((donation) => {
                              const remainingAmount = donation.amount - (donation.total_handed_over || 0);
                              const handedOverPercentage = donation.amount > 0 ? ((donation.total_handed_over || 0) / donation.amount * 100).toFixed(1) : "0";

                              return (
                                <Card key={donation.id} className="p-4 border-2">
                                  <div className="space-y-4">
                                    {/* Header with Donor Info */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-lg">{donation.donor_name || "متبرع مجهول"}</p>
                                          {donation.donor_email && (
                                            <Badge variant="outline" className="text-xs">
                                              {donation.donor_email}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                            {donation.donation_type === 'monthly' ? 'كفالة شهرية' : 'تبرع مخصص'}
                                          </Badge>
                                          {donation.donation_type === 'monthly' && donation.months_pledged > 0 && (
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                              {donation.months_pledged} شهر
                                            </Badge>
                                          )}
                                          {getHandoverStatusBadge(donation.handover_status, donation.total_handed_over || 0, donation.amount)}
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        onClick={() => openHandoverDialog(donation)}
                                        className="flex items-center gap-1"
                                      >
                                        <Truck className="w-3 h-3" />
                                        تسليم
                                      </Button>
                                    </div>

                                    {/* Amount Breakdown */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg">
                                      <div>
                                        <p className="text-xs text-muted-foreground">المبلغ الإجمالي</p>
                                        <p className="font-semibold text-sm">{donation.amount.toLocaleString()} ج.م</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">المسلم</p>
                                        <p className="font-semibold text-sm text-blue-600">
                                          {(donation.total_handed_over || 0).toLocaleString()} ج.م
                                        </p>
                                        {donation.amount > 0 && (
                                          <p className="text-xs text-muted-foreground">
                                            ({handedOverPercentage}%)
                                          </p>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">المتبقي</p>
                                        <p className="font-semibold text-sm text-orange-600">
                                          {remainingAmount.toLocaleString()} ج.م
                                        </p>
                                        {donation.amount > 0 && (
                                          <p className="text-xs text-muted-foreground">
                                            ({100 - parseFloat(handedOverPercentage)}%)
                                          </p>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">جاهز للتسليم</p>
                                        <p className="font-semibold text-sm text-green-600">
                                          {remainingAmount.toLocaleString()} ج.م
                                        </p>
                                      </div>
                                    </div>

                                    {/* Payment & Dates Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">كود الدفع:</span>
                                          <span className="font-mono font-medium">{donation.payment_code}</span>
                                        </div>
                                        {donation.payment_reference && (
                                          <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground">مرجع الدفع:</span>
                                            <span className="font-medium">{donation.payment_reference}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                                          <span>{new Date(donation.created_at).toLocaleDateString('ar-EG', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}</span>
                                        </div>
                                        {donation.confirmed_at && (
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span className="text-muted-foreground">تاريخ التأكيد:</span>
                                            <span>{new Date(donation.confirmed_at).toLocaleDateString('ar-EG', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Admin Notes */}
                                    {donation.admin_notes && (
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs font-medium text-blue-900 mb-1">ملاحظات الإدارة:</p>
                                        <p className="text-sm text-blue-800 whitespace-pre-wrap">{donation.admin_notes}</p>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
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
          {/* Search and Sort Controls */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs mb-1">بحث بالاسم أو الحالة</Label>
                <Input
                  placeholder="ابحث..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs mb-1">بحث بالمبلغ</Label>
                <Input
                  type="number"
                  placeholder="المبلغ..."
                  value={searchAmount}
                  onChange={(e) => setSearchAmount(e.target.value)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs mb-1">ترتيب</Label>
                <Select value={sortByDate} onValueChange={(value: "desc" | "asc") => setSortByDate(value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">الأحدث أولاً</SelectItem>
                    <SelectItem value="asc">الأقدم أولاً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

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
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{group.case.title_ar}</h3>
                              <div className="flex items-center gap-4 mt-1 flex-wrap">
                                <p className="text-sm text-muted-foreground">
                                  {group.records.length} عملية تسليم
                                </p>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-muted-foreground">
                                    إجمالي المسلم: <span className="font-semibold text-green-600">
                                      {group.records.reduce((sum, r) => sum + r.handover_amount, 0).toLocaleString()} ج.م
                                    </span>
                                  </span>
                                  <span className="text-muted-foreground">
                                    من {new Set(group.records.map(r => r.donation_id)).size} تبرع
                                  </span>
                                </div>
                              </div>
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
                            {group.records.map((record) => {
                              const originalAmount = record.donations.amount;
                              const handoverPercentage = originalAmount > 0 ? (record.handover_amount / originalAmount * 100).toFixed(1) : 0;

                              return (
                                <Card key={record.id} className="p-4 border-2 border-green-200 bg-green-50/30">
                                  <div className="space-y-4">
                                    {/* Header with Donor Info */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-lg">{record.donations.donor_name || "متبرع مجهول"}</p>
                                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                            ✓ مسلم
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            كود: {record.donations.payment_code}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Amount Breakdown */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-green-200">
                                      <div>
                                        <p className="text-xs text-muted-foreground">المبلغ الأصلي</p>
                                        <p className="font-semibold text-sm">{originalAmount.toLocaleString()} ج.م</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">المبلغ المسلم</p>
                                        <p className="font-semibold text-sm text-green-600">
                                          {record.handover_amount.toLocaleString()} ج.م
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          ({handoverPercentage}% من المبلغ الأصلي)
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">تاريخ التسليم</p>
                                        <p className="font-semibold text-sm">
                                          {new Date(record.handover_date).toLocaleDateString('ar-EG', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                          })}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Timeline & Payment Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground">التواريخ:</p>
                                        <div className="space-y-1">
                                          {record.donations.created_at && (
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-3 h-3 text-muted-foreground" />
                                              <span className="text-muted-foreground text-xs">الإنشاء:</span>
                                              <span className="text-xs">{new Date(record.donations.created_at).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                              })}</span>
                                            </div>
                                          )}
                                          {record.donations.confirmed_at && (
                                            <div className="flex items-center gap-2">
                                              <CheckCircle className="w-3 h-3 text-green-500" />
                                              <span className="text-muted-foreground text-xs">التأكيد:</span>
                                              <span className="text-xs">{new Date(record.donations.confirmed_at).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                              })}</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-2">
                                            <Truck className="w-3 h-3 text-blue-500" />
                                            <span className="text-muted-foreground text-xs">التسليم:</span>
                                            <span className="text-xs font-medium">{new Date(record.handover_date).toLocaleDateString('ar-EG', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric'
                                            })}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground">معلومات إضافية:</p>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <Package className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-muted-foreground text-xs">مسلم إلى:</span>
                                            <span className="text-xs">{group.case.title_ar}</span>
                                          </div>
                                          {/* Show original case if cross-case handover */}
                                          {record.original_case_id && record.original_case_id !== record.case_id && record.original_case && (
                                            <div className="flex items-center gap-2 bg-amber-50 p-1.5 rounded border border-amber-200">
                                              <AlertCircle className="w-3 h-3 text-amber-600" />
                                              <span className="text-amber-700 text-xs font-medium">تحويل من:</span>
                                              <span className="text-xs text-amber-800">{record.original_case.title_ar || record.original_case.title}</span>
                                            </div>
                                          )}
                                          {record.handover_notes && (
                                            <div className="mt-2">
                                              <p className="text-xs font-medium text-muted-foreground mb-1">ملاحظات التسليم:</p>
                                              <p className="text-xs text-muted-foreground italic bg-white p-2 rounded border">
                                                {record.handover_notes}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
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

                <div>
                  <Label htmlFor="handover-date">تاريخ التسليم</Label>
                  <Input
                    id="handover-date"
                    type="date"
                    value={handoverDate}
                    onChange={(e) => setHandoverDate(e.target.value)}
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