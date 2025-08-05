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
    <Card className="p-8 shadow-soft">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3">
          <div className="relative overflow-hidden rounded-xl">
            <img 
              src={image} 
              alt={`صورة عائلة ${familyName}`}
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 right-4">
              <Badge variant="secondary" className="bg-white/90 text-primary">
                <Heart className="w-4 h-4 ml-2" />
                عائلة محتاجة
              </Badge>
            </div>
          </div>
        </div>

        <div className="lg:w-2/3 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gradient mb-4">
              عائلة {familyName}
            </h2>
            
            <div className="flex flex-wrap gap-4 mb-6">
              {location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  <span>{location}</span>
                </div>
              )}
              {familySize > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                  <span>{familySize} أفراد</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>متاحة للكفالة</span>
              </div>
            </div>
          </div>

          {members.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">أفراد العائلة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {members.map((member, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                    <span className="font-medium">{member.name}</span>
                    <div className="text-sm text-muted-foreground">
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
              <h3 className="text-xl font-semibold mb-4">قصة العائلة</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {story}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};