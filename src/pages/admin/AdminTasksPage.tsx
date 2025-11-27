import FollowupActionsDashboard from "@/components/admin/FollowupActionsDashboard";

const AdminTasksPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">المهام والمتابعة</h2>
            </div>
            <FollowupActionsDashboard />
        </div>
    );
};

export default AdminTasksPage;
