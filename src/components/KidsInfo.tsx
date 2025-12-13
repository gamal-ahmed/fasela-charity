import { Users, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Kid {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  description?: string;
  hobbies?: string[];
}

interface KidsInfoProps {
  kids: Kid[];
}

export const KidsInfo = ({ kids }: KidsInfoProps) => {
  if (!kids || kids.length === 0) {
    return null;
  }

  const getGenderIcon = (gender: 'male' | 'female') => {
    return gender === 'male' ? '👦' : '👧';
  };

  const getGenderText = (gender: 'male' | 'female') => {
    return gender === 'male' ? 'ذكر' : 'أنثى';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          الأطفال ({kids.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {kids.map((kid) => (
            <Link to={`/kid/${kid.id}`} key={kid.id} className="block transition-transform hover:scale-[1.01]">
              <div className="p-4 border rounded-lg bg-background/50 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getGenderIcon(kid.gender)}
                    </div>
                    <div>
                      <h4 className="font-medium text-lg">{kid.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {kid.age} سنة
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getGenderText(kid.gender)}
                        </Badge>
                      </div>

                      {kid.hobbies && kid.hobbies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {kid.hobbies.slice(0, 3).map((hobby, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-100">
                              {hobby}
                            </Badge>
                          ))}
                          {kid.hobbies.length > 3 && (
                            <span className="text-[10px] text-muted-foreground self-center">+{kid.hobbies.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {kid.description && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {kid.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};