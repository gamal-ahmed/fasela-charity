import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonationAuditDelivery } from "@/components/admin/DonationAuditDelivery";
import { MonthlyDonationsView } from "@/components/admin/MonthlyDonationsView";
import { CreditCard, Heart } from "lucide-react";

const AdminDonationsPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">إدارة التبرعات</h2>
            </div>

            <Tabs defaultValue="audit" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="audit" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        مراجعة وتسليم التبرعات
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        التبرعات الشهرية
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="audit">
                    <DonationAuditDelivery />
                </TabsContent>

                <TabsContent value="monthly">
                    <MonthlyDonationsView />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminDonationsPage;
