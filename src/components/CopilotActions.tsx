import { ChevronRight, Car, Check, Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CopilotActionVehicle {
  id?: string;
  kenteken: string;
  label?: string;
  sub?: string;
  status?: string;
  href?: string;
}

export interface CopilotActionPrimary {
  type: "reserveer" | "open_voertuig" | "link";
  href?: string;
  label: string;
  kenteken?: string;
  voertuig_id?: string;
  klant_id?: string;
  klant_naam?: string;
  start_datum?: string;
  eind_datum?: string;
}

export interface CopilotVoorstel {
  kind: "reservering" | "rit" | "onderhoud" | "klant";
  summary: string;
  payload: Record<string, any>;
  confirm_label?: string;
  open_after?: string;
}

export type CopilotFormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "datetime"
  | "select";

export interface CopilotFormField {
  name: string;
  label: string;
  type: CopilotFormFieldType;
  placeholder?: string;
  required?: boolean;
  default?: string | number;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  helper?: string;
}

export interface CopilotForm {
  id?: string;
  title?: string;
  intro?: string;
  fields: CopilotFormField[];
  submit_label?: string;
}

export interface CopilotActionsData {
  intro?: string;
  vehicles?: CopilotActionVehicle[];
  primary?: CopilotActionPrimary;
  voorstel?: CopilotVoorstel;
  form?: CopilotForm;
}

interface Props {
  data: CopilotActionsData;
  onOpenVehicle: (v: CopilotActionVehicle) => void;
  onPrimary: (p: CopilotActionPrimary) => void;
  onConfirmVoorstel?: (v: CopilotVoorstel) => Promise<{ ok?: boolean; href?: string; error?: string }>;
  onSubmitForm?: (form: CopilotForm, values: Record<string, string>) => void;
}

export function CopilotActions({ data, onOpenVehicle, onPrimary, onConfirmVoorstel, onSubmitForm }: Props) {
  const [voorstelStatus, setVoorstelStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [voorstelError, setVoorstelError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data.form?.fields) {
      const init: Record<string, string> = {};
      for (const f of data.form.fields) {
        if (f.default !== undefined && f.default !== null) init[f.name] = String(f.default);
      }
      setFormValues(init);
    }
  }, [data.form]);

  const handleConfirm = async () => {
    if (!data.voorstel || !onConfirmVoorstel) return;
    setVoorstelStatus("loading");
    setVoorstelError(null);
    try {
      const res = await onConfirmVoorstel(data.voorstel);
      if (res?.error) throw new Error(res.error);
      setVoorstelStatus("done");
    } catch (e: any) {
      setVoorstelStatus("error");
      setVoorstelError(e?.message || "Mislukt");
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.form || !onSubmitForm) return;
    const missing = data.form.fields.filter(f => f.required && !String(formValues[f.name] ?? "").trim());
    if (missing.length > 0) {
      setFormError(`Vul nog in: ${missing.map(m => m.label).join(", ")}`);
      return;
    }
    setFormError(null);
    setFormSubmitted(true);
    onSubmitForm(data.form, formValues);
  };

  return (
    <div className="space-y-2 mt-2">
      {data.intro && (
        <p className="text-sm text-foreground">{data.intro}</p>
      )}
      {data.vehicles && data.vehicles.length > 0 && (
        <div className="space-y-1.5">
          {data.vehicles.map((v, i) => (
            <button
              key={`${v.kenteken}-${i}`}
              onClick={() => onOpenVehicle(v)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-background border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors text-left group"
            >
              <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-yellow-300 text-black font-mono text-xs font-bold tracking-wider whitespace-nowrap">
                {v.kenteken}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {v.label || (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Car className="w-3 h-3" /> Voertuig
                    </span>
                  )}
                </p>
                {v.sub && (
                  <p className="text-xs text-muted-foreground truncate">{v.sub}</p>
                )}
              </div>
              {v.status && (
                <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">
                  · {v.status}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
      {data.form && data.form.fields?.length > 0 && (
        <form
          onSubmit={handleFormSubmit}
          className="rounded-lg border border-border bg-background p-3 space-y-2.5"
        >
          {data.form.title && (
            <div className="text-xs font-semibold text-foreground">{data.form.title}</div>
          )}
          {data.form.intro && (
            <p className="text-xs text-muted-foreground">{data.form.intro}</p>
          )}
          {data.form.fields.map((f) => {
            const val = formValues[f.name] ?? "";
            const setVal = (v: string) => setFormValues(prev => ({ ...prev, [f.name]: v }));
            return (
              <div key={f.name} className="space-y-1">
                <Label className="text-xs">
                  {f.label}
                  {f.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    placeholder={f.placeholder}
                    disabled={formSubmitted}
                    className="text-sm min-h-[60px]"
                  />
                ) : f.type === "select" ? (
                  <Select value={val} onValueChange={setVal} disabled={formSubmitted}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={f.placeholder || "Kies..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={
                      f.type === "date" ? "date" :
                      f.type === "time" ? "time" :
                      f.type === "datetime" ? "datetime-local" :
                      f.type === "number" ? "number" : "text"
                    }
                    value={val}
                    onChange={e => setVal(e.target.value)}
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    disabled={formSubmitted}
                    className="h-9 text-sm"
                  />
                )}
                {f.helper && <p className="text-[10px] text-muted-foreground">{f.helper}</p>}
              </div>
            );
          })}
          {formError && <p className="text-xs text-destructive">{formError}</p>}
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={formSubmitted}
          >
            {formSubmitted ? (
              <><Check className="w-3 h-3 mr-2" /> Verstuurd</>
            ) : (
              <><Send className="w-3 h-3 mr-2" /> {data.form.submit_label || "Versturen"}</>
            )}
          </Button>
        </form>
      )}
      {data.voorstel && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Voorstel · {data.voorstel.kind}
            </span>
          </div>
          <p className="text-sm text-foreground">{data.voorstel.summary}</p>
          {voorstelStatus === "done" ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <Check className="w-4 h-4" /> Aangemaakt
            </div>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={voorstelStatus === "loading"}
              className="w-full"
              size="sm"
            >
              {voorstelStatus === "loading" ? (
                <><Loader2 className="w-3 h-3 mr-2 animate-spin" /> Bezig...</>
              ) : (
                data.voorstel.confirm_label || "Bevestig en maak aan"
              )}
            </Button>
          )}
          {voorstelError && (
            <p className="text-xs text-destructive">{voorstelError}</p>
          )}
        </div>
      )}
      {data.primary && (
        <div className="pt-1">
          <Button
            onClick={() => onPrimary(data.primary!)}
            className="w-full"
            variant={data.voorstel ? "outline" : "default"}
            size="sm"
          >
            {data.primary.label}
          </Button>
        </div>
      )}
    </div>
  );
}

const ACTION_REGEX = /\[\[fleeflo:actions\s*([\s\S]*?)\]\]/;

export function parseCopilotMessage(content: string): {
  text: string;
  actions: CopilotActionsData | null;
} {
  const match = content.match(ACTION_REGEX);
  if (!match) return { text: content, actions: null };
  const text = content.replace(ACTION_REGEX, "").trim();
  try {
    const json = JSON.parse(match[1].trim());
    return { text, actions: json };
  } catch {
    return { text: content, actions: null };
  }
}