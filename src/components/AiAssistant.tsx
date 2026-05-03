import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Trash2, Sparkles, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAiChat } from "@/hooks/useAiChat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  CopilotActions,
  parseCopilotMessage,
  type CopilotActionPrimary,
  type CopilotActionVehicle,
} from "./CopilotActions";

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, send, clearMessages } = useAiChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput("");
  };

  const suggesties = [
    "Welke voertuigen zijn morgen vrij?",
    "Welke bestelbus is komende week 3 dagen vrij?",
    "Toon contracten die binnen 30 dagen aflopen",
    "Wat was mijn omzet vorige maand?",
    "Welke APK's verlopen binnenkort?",
    "Geef me de vlootstatistieken",
  ];

  const handleOpenVehicle = (v: CopilotActionVehicle) => {
    setOpen(false);
    navigate(`/voertuigen?kenteken=${encodeURIComponent(v.kenteken)}`);
  };

  const handlePrimary = (p: CopilotActionPrimary) => {
    setOpen(false);
    if (p.href) {
      navigate(p.href);
      return;
    }
    if (p.type === "reserveer") {
      const params = new URLSearchParams();
      params.set("nieuw", "1");
      if (p.voertuig_id) params.set("voertuig", p.voertuig_id);
      if (p.klant_id) params.set("klant", p.klant_id);
      if (p.start_datum) params.set("start", p.start_datum);
      if (p.eind_datum) params.set("eind", p.eind_datum);
      navigate(`/reserveringen?${params.toString()}`);
      return;
    }
    if (p.type === "open_voertuig" && p.kenteken) {
      navigate(`/voertuigen?kenteken=${encodeURIComponent(p.kenteken)}`);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-12 px-4 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 hover:scale-105"
          aria-label="Open Vloot-Copilot"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">Copilot</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-foreground">Vloot-Copilot</h3>
                <p className="text-xs text-muted-foreground">Live data uit jouw vloot</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearMessages}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="py-2">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 mx-auto mb-3 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Hoi, ik ben jouw Copilot</h4>
                  <p className="text-xs text-muted-foreground mt-1">Ik kijk live in je voertuigen, contracten, ritten en facturen.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">Probeer eens:</p>
                  {suggesties.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={isLoading}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => {
              const parsed = msg.role === "assistant" ? parseCopilotMessage(msg.content) : null;
              return (
                <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[90%] rounded-xl px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    {msg.role === "assistant" && parsed ? (
                      <>
                        {parsed.text && (
                          <div className="prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
                            <ReactMarkdown>{parsed.text}</ReactMarkdown>
                          </div>
                        )}
                        {parsed.actions && (
                          <CopilotActions
                            data={parsed.actions}
                            onOpenVehicle={handleOpenVehicle}
                            onPrimary={handlePrimary}
                          />
                        )}
                      </>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-3 h-3 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-border">
            <form
              onSubmit={e => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Vraag iets over je vloot..."
                className="flex-1 h-9 text-sm"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" className="h-9 w-9" disabled={!input.trim() || isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
