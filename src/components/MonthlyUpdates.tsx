import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Image, CheckCircle, Clock } from "lucide-react";

interface Update {
  id: string;
  date: string;
  title: string;
  description: string;
  images?: string[];
  status: 'completed' | 'pending';
  category: 'education' | 'health' | 'housing' | 'food' | 'general';
}

interface MonthlyUpdatesProps {
  updates: Update[];
}

const categoryColors = {
  education: 'bg-blue-100 text-blue-700',
  health: 'bg-red-100 text-red-700',
  housing: 'bg-green-100 text-green-700',
  food: 'bg-orange-100 text-orange-700',
  general: 'bg-gray-100 text-gray-700'
};

const categoryLabels = {
  education: 'تعليم',
  health: 'صحة',
  housing: 'سكن',
  food: 'طعام',
  general: 'عام'
};

export const MonthlyUpdates = ({ updates }: MonthlyUpdatesProps) => {
  return (
    <Card className="p-4 sm:p-6 lg:p-8 shadow-soft">
      <div className="text-center mb-6 sm:mb-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-2">التقارير الشهرية</h3>
        <p className="text-muted-foreground text-sm sm:text-base">
          متابعة دورية لأحوال العائلة واستخدام التبرعات
        </p>
      </div>

      <div className="space-y-6">
        {updates.map((update, index) => (
          <div key={update.id} className="relative">
            {/* خط التوصيل */}
            {index < updates.length - 1 && (
              <div className="absolute right-6 top-12 w-0.5 h-20 bg-border" />
            )}
            
            <div className="flex gap-3 sm:gap-4">
              {/* أيقونة الحالة */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
                  ${update.status === 'completed' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {update.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
              </div>

              {/* محتوى التحديث */}
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-semibold">{update.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-muted-foreground">{update.date}</span>
                      <Badge 
                        variant="secondary" 
                        className={`${categoryColors[update.category]} text-xs`}
                      >
                        {categoryLabels[update.category]}
                      </Badge>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={update.status === 'completed' ? 'default' : 'secondary'}
                    className={`${update.status === 'completed' ? 'bg-primary' : ''} text-xs flex-shrink-0`}
                  >
                    {update.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                  </Badge>
                </div>

                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  {update.description}
                </p>

                {/* الصور إن وجدت */}
                {update.images && update.images.length > 0 && (
                  <div className="flex gap-2">
                    <Image className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {update.images.map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={image}
                          alt={`صورة ${imgIndex + 1} من التحديث`}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {updates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium mb-2">لا توجد تحديثات حتى الآن</h4>
          <p className="text-muted-foreground">
            سيتم إضافة التقارير الشهرية هنا بمجرد بدء الكفالة
          </p>
        </div>
      )}

      <div className="mt-8 p-4 bg-charity-light rounded-lg">
        <div className="flex items-center gap-2 text-charity">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">التزامنا بالشفافية</span>
        </div>
        <p className="text-sm text-charity mt-2">
          نلتزم بإرسال تقرير شهري مفصل يتضمن صور وتفاصيل عن استخدام التبرعات وأحوال العائلة.
        </p>
      </div>
    </Card>
  );
};