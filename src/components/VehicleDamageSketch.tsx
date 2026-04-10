import { useState, useRef } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface DamagePoint {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  label: string;
  ernst: "licht" | "middel" | "zwaar";
  grootte: "klein" | "middel" | "groot";
}

interface VehicleDamageSketchProps {
  points: DamagePoint[];
  onChange: (points: DamagePoint[]) => void;
  readOnly?: boolean;
}

const ernstColors = {
  licht: "bg-yellow-500",
  middel: "bg-orange-500",
  zwaar: "bg-red-500",
};

const ernstBorderColors = {
  licht: "border-yellow-500",
  middel: "border-orange-500",
  zwaar: "border-red-500",
};

export function VehicleDamageSketch({ points, onChange, readOnly = false }: VehicleDamageSketchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newErnst, setNewErnst] = useState<"licht" | "middel" | "zwaar">("licht");

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: DamagePoint = {
      id: crypto.randomUUID(),
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      label: "",
      ernst: newErnst,
      grootte: "klein",
    };

    onChange([...points, newPoint]);
    setSelectedPoint(newPoint.id);
    setNewLabel("");
  };

  const updatePoint = (id: string, updates: Partial<DamagePoint>) => {
    onChange(points.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePoint = (id: string) => {
    onChange(points.filter(p => p.id !== id));
    if (selectedPoint === id) setSelectedPoint(null);
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-foreground">Ernst:</span>
          {(["licht", "middel", "zwaar"] as const).map(e => (
            <button
              key={e}
              onClick={() => setNewErnst(e)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                newErnst === e
                  ? `${ernstColors[e]} text-white border-transparent`
                  : `bg-background ${ernstBorderColors[e]} text-foreground`
              )}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">
            Klik op de auto om schade te markeren
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        onClick={handleClick}
        className={cn(
          "relative bg-muted rounded-xl border-2 border-dashed border-border overflow-hidden select-none",
          !readOnly && "cursor-crosshair"
        )}
        style={{ aspectRatio: "2.2 / 1" }}
      >
        {/* Top-down car outline SVG */}
        <svg
          viewBox="0 0 440 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="absolute inset-0 w-full h-full p-4 text-muted-foreground/40"
        >
          {/* Body outline */}
          <path d="M80,40 Q60,40 50,60 L40,80 Q35,100 40,120 L50,140 Q60,160 80,160 L360,160 Q380,160 390,140 L400,120 Q405,100 400,80 L390,60 Q380,40 360,40 Z" strokeWidth="2" />
          {/* Windshield */}
          <path d="M130,45 L130,155" strokeDasharray="4 4" />
          {/* Rear window */}
          <path d="M330,45 L330,155" strokeDasharray="4 4" />
          {/* Wheels */}
          <ellipse cx="110" cy="35" rx="25" ry="8" strokeWidth="2" />
          <ellipse cx="110" cy="165" rx="25" ry="8" strokeWidth="2" />
          <ellipse cx="330" cy="35" rx="25" ry="8" strokeWidth="2" />
          <ellipse cx="330" cy="165" rx="25" ry="8" strokeWidth="2" />
          {/* Center line */}
          <line x1="80" y1="100" x2="360" y2="100" strokeDasharray="2 6" strokeWidth="0.5" />
          {/* Labels */}
          <text x="60" y="103" fontSize="10" fill="currentColor" opacity="0.3" textAnchor="middle">VOOR</text>
          <text x="380" y="103" fontSize="10" fill="currentColor" opacity="0.3" textAnchor="middle">ACHTER</text>
          <text x="220" y="30" fontSize="10" fill="currentColor" opacity="0.3" textAnchor="middle">LINKS</text>
          <text x="220" y="185" fontSize="10" fill="currentColor" opacity="0.3" textAnchor="middle">RECHTS</text>
        </svg>

        {/* Damage points */}
        {points.map((point, i) => (
          <button
            key={point.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPoint(selectedPoint === point.id ? null : point.id);
            }}
            className={cn(
              "absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white transition-transform",
              ernstColors[point.ernst],
              selectedPoint === point.id && "scale-125 ring-2 ring-primary"
            )}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            title={point.label || `Punt ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Point details */}
      {points.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Gemarkeerde schade ({points.length})</p>
          <div className="grid gap-2">
            {points.map((point, i) => (
              <div
                key={point.id}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-lg border transition-colors",
                  selectedPoint === point.id ? "border-primary bg-primary/5" : "border-border"
                )}
                onClick={() => setSelectedPoint(point.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0", ernstColors[point.ernst])}>
                    {i + 1}
                  </div>
                  {!readOnly ? (
                    <Input
                      value={point.label}
                      onChange={e => updatePoint(point.id, { label: e.target.value })}
                      placeholder="Beschrijving schade... (verplicht)"
                      className={cn("h-8 text-sm flex-1", !point.label.trim() && "border-destructive focus-visible:ring-destructive")}
                      onClick={e => e.stopPropagation()}
                      required
                    />
                  ) : (
                    <span className="text-sm text-foreground flex-1">{point.label || "Geen beschrijving"}</span>
                  )}
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); removePoint(point.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <span className="text-xs text-muted-foreground">Grootte:</span>
                  {(["klein", "middel", "groot"] as const).map(g => (
                    readOnly ? (
                      point.grootte === g && (
                        <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-foreground">
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </span>
                      )
                    ) : (
                      <button
                        key={g}
                        type="button"
                        onClick={e => { e.stopPropagation(); updatePoint(point.id, { grootte: g }); }}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium transition-colors border",
                          (point.grootte || "klein") === g
                            ? "bg-primary text-primary-foreground border-transparent"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    )
                  ))}
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium text-white flex-shrink-0 ml-auto", ernstColors[point.ernst])}>
                    {point.ernst}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
