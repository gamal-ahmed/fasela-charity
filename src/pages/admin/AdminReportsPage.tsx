import ReportForm from "@/components/admin/ReportForm";
import ReportsList from "@/components/admin/ReportsList";

const AdminReportsPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">التقارير الشهرية</h2>
                <ReportForm />
            </div>
            <ReportsList />
        </div>
    );
};

export default AdminReportsPage;
