import { useActiviteitenLog } from "@/hooks/useActiviteitenLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Car, FileText, User, Settings, RotateCcw, Route, CalendarRange, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

const iconMap: Record<string, React.ElementType> = {
  voertuig: Car,
  contract: FileText,
  klant: User,
  instelling: Settings,
  terugmelding: RotateCcw,
  rit: Route,
  reservering: CalendarRange,
  schade: AlertTriangle,
};

export function ActiviteitenLog() {
  const { activiteiten, isLoading } = useActiviteitenLog(30);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="w-4 h-4" />
            Activiteitenlog
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="w-4 h-4" />
          Activiteitenlog
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {activiteiten.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nog geen activiteiten geregistreerd
            </p>
          ) : (
            <div className="space-y-1">
              {activiteiten.map((a) => {
                const Icon = iconMap[a.entiteit_type || ""] || Activity;
                return (
                  <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium">{a.actie}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.beschrijving}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0 mt-0.5">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: nl })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
