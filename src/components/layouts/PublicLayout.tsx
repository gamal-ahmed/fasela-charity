import { Outlet } from "react-router-dom";
import Navigation from "@/components/Navigation";

const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-background font-cairo">
            {/* Standardized Navigation Header */}
            <header className="gradient-hero text-white py-4 shadow-md z-50 relative">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src="/lovable-uploads/1377342f-e772-4165-b1d5-8f6cbc909fa4.png"
                                alt="فَسِيلَة خير"
                                className="h-12 w-auto object-contain bg-white/10 rounded-lg p-1"
                            />
                            <span className="text-xl font-bold text-white">فَسِيلَة خير</span>
                        </div>
                        <Navigation />
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main>
                <Outlet />
            </main>

            {/* Optional: Standard Footer could go here */}
        </div>
    );
};

export default PublicLayout;
