import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Building2, ArrowRight } from "lucide-react";

export function OrgSelectionModal() {
    const { userOrgs, showSelectionModal, setShowSelectionModal, setCurrentOrg } = useOrganization();

    return (
        <Dialog open={showSelectionModal} onOpenChange={setShowSelectionModal}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">اختر منظمة</DialogTitle>
                    <DialogDescription className="text-center">
                        لديك حساب في أكثر من منظمة، يرجى اختيار المنظمة التي تود العمل عليها الآن.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {userOrgs.map((org) => (
                        <Button
                            key={org.id}
                            variant="outline"
                            className="h-auto flex items-center justify-between p-4 hover:border-primary hover:bg-primary/5 group"
                            onClick={() => setCurrentOrg(org)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <Building2 className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg">{org.name}</div>
                                    <div className="text-sm text-muted-foreground capitalize">بصلاحية: {
                                        org.role === 'admin' ? 'مدير' : org.role === 'volunteer' ? 'متطوع' : 'مستخدم'
                                    }</div>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
