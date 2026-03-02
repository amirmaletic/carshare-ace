import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KvkResult {
  kvkNummer: string;
  naam: string;
  adres: string | null;
  type: string | null;
}

interface KvkSearchProps {
  value: string;
  kvkNummer: string;
  bedrijfAdres: string;
  onChange: (bedrijf: string, kvkNummer: string, bedrijfAdres: string) => void;
}

export function KvkSearch({ value, kvkNummer, bedrijfAdres, onChange }: KvkSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<KvkResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("kvk-search", {
        body: { query: q },
      });
      if (error) throw error;
      setResults(data?.resultaten || []);
      setShowDropdown(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    onChange(val, kvkNummer, bedrijfAdres);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const selectResult = (r: KvkResult) => {
    setQuery(r.naam);
    onChange(r.naam, r.kvkNummer, r.adres || "");
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="space-y-1.5">
      <Label>Bedrijf (optioneel)</Label>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Zoek bedrijf op naam..."
          className="pr-8"
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.kvkNummer}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                onClick={() => selectResult(r)}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.naam}</p>
                    <p className="text-xs text-muted-foreground">KVK: {r.kvkNummer}{r.adres ? ` • ${r.adres}` : ""}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      {kvkNummer && (
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>KVK: {kvkNummer}</span>
          {bedrijfAdres && <span>• {bedrijfAdres}</span>}
        </div>
      )}
    </div>
  );
}
