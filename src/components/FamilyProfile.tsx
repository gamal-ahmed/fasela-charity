import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar, Heart } from "lucide-react";

interface FamilyMember {
  name: string;
  age: number;
  relation: string;
}

interface FamilyProfileProps {
  familyName: string;
  location: string;
  familySize: number;
  members: FamilyMember[];
  story: string;
  image: string;
}

export const FamilyProfile = ({ 
  familyName, 
  location, 
  familySize, 
  members, 
  story,
  image 
}: FamilyProfileProps) => {
  return (
    <Card className="p-4 sm:p-6 lg:p-8 shadow-soft">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="lg:w-1/3">
          <div className="relative overflow-hidden rounded-xl">
            <img 
              src={image} 
              alt={`صورة عائلة ${familyName}`}
              className="w-full h-60 sm:h-72 lg:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="bg-white/90 text-primary text-xs sm:text-sm">
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                عائلة محتاجة
              </Badge>
            </div>
          </div>
        </div>

        <div className="lg:w-2/3 space-y-4 sm:space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gradient mb-4">
              عائلة {familyName}
            </h2>
            
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
              {location && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{location}</span>
                </div>
              )}
              {familySize > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{familySize} أفراد</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>متاحة للكفالة</span>
              </div>
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-4">أفراد العائلة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.map((member, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-accent/50 rounded-lg gap-1 sm:gap-0">
                    <span className="font-medium text-sm sm:text-base">{member.name}</span>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      <span>{member.relation}</span>
                      <span className="mx-2">•</span>
                      <span>{member.age} سنة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {story && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-4">قصة العائلة</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {story}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};