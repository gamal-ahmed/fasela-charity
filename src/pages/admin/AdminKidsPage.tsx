import KidsListAdmin from "@/components/admin/KidsListAdmin";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Baby } from "lucide-react";

const AdminKidsPage = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">إدارة الأطفال</h2>
                <Button asChild>
                    <Link to="/kids">
                        <Baby className="w-4 h-4 ml-2" />
                        عرض جميع الأطفال (واجهة المستخدم)
                    </Link>
                </Button>
            </div>
            <KidsListAdmin />
        </div>
    );
};

export default AdminKidsPage;
