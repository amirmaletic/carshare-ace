import { useState } from "react";
import { Bell, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNotificaties, type Notificatie } from "@/hooks/useNotificaties";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

function TypeIcon({ type }: { type: Notificatie["type"] }) {
  if (type === "succes") return <CheckCircle2 className="w-4 h-4 text-success" />;
  if (type === "waarschuwing") return <AlertTriangle className="w-4 h-4 text-amber-500" />;
  if (type === "fout") return <XCircle className="w-4 h-4 text-destructive" />;
  return <Info className="w-4 h-4 text-primary" />;
}

export function NotificatieBell() {
  const [open, setOpen] = useState(false);
  const { notificaties, ongelezen, markeerGelezen, markeerAllesGelezen, verwijder } = useNotificaties();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Meldingen">
          <Bell className="w-5 h-5" />
          {ongelezen > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-[10px] bg-primary text-primary-foreground">
              {ongelezen > 9 ? "9+" : ongelezen}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Meldingen</h3>
          {ongelezen > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markeerAllesGelezen.mutate()}
            >
              <CheckCheck className="w-3 h-3" /> Alles gelezen
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-[480px]">
          {notificaties.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nog geen meldingen
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notificaties.map((n) => {
                const inhoud = (
                  <div className="flex items-start gap-3 p-3">
                    <div className="mt-0.5"><TypeIcon type={n.type} /></div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm font-medium leading-tight", !n.gelezen && "text-foreground", n.gelezen && "text-muted-foreground")}>
                        {n.titel}
                      </p>
                      {n.bericht && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.bericht}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        verwijder.mutate(n.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
                return (
                  <li key={n.id} className={cn("hover:bg-accent/50 transition-colors", !n.gelezen && "bg-primary/5")}>
                    {n.link_url ? (
                      <Link
                        to={n.link_url}
                        onClick={() => {
                          if (!n.gelezen) markeerGelezen.mutate(n.id);
                          setOpen(false);
                        }}
                        className="block"
                      >
                        {inhoud}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => !n.gelezen && markeerGelezen.mutate(n.id)}
                        className="block w-full text-left"
                      >
                        {inhoud}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}