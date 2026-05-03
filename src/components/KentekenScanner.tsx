import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Props {
  onDetected: (kenteken: string) => void;
  buttonClassName?: string;
  iconOnly?: boolean;
}

// Strict NL kenteken patterns (no spaces/dashes)
const NL_PATTERNS = [
  /\b[A-Z]{2}\d{2}[A-Z]{2}\b/, // sidecode 6: AB12CD
  /\b\d{2}[A-Z]{2}\d{2}\b/,    // sidecode 5: 12AB34
  /\b\d{2}[A-Z]{3}\d\b/,       // sidecode 7: 12ABC3
  /\b\d[A-Z]{3}\d{2}\b/,       // sidecode 8
  /\b[A-Z]{2}\d{3}[A-Z]\b/,    // sidecode 9
  /\b[A-Z]\d{3}[A-Z]{2}\b/,    // sidecode 10
  /\b[A-Z]{3}\d{2}[A-Z]\b/,    // sidecode 11
  /\b\d[A-Z]{2}\d{3}\b/,       // sidecode 12
];

function extractKenteken(raw: string): string | null {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9\s]/g, "").replace(/\s+/g, "");
  // Try patterns on collapsed string
  for (const re of NL_PATTERNS) {
    const m = cleaned.match(re);
    if (m) return m[0];
  }
  // Fallback: 6 alphanumerics with at least one letter and one digit
  const fallback = cleaned.match(/[A-Z0-9]{6}/);
  if (fallback && /[A-Z]/.test(fallback[0]) && /\d/.test(fallback[0])) {
    return fallback[0];
  }
  return null;
}

export function KentekenScanner({ onDetected, buttonClassName, iconOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [hint, setHint] = useState("Richt op het kenteken");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<any>(null);
  const loopRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  const stop = () => {
    stoppedRef.current = true;
    if (loopRef.current) {
      window.clearTimeout(loopRef.current);
      loopRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate?.().catch(() => {});
      workerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (!open) return;
    stoppedRef.current = false;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        toast.error("Geen toegang tot camera", { description: err?.message || "Sta camera-toegang toe" });
        setOpen(false);
        return;
      }

      try {
        const Tesseract = await import("tesseract.js");
        const worker = await Tesseract.createWorker("eng", 1, {
          // CDN-hosted worker assets (no bundler config needed)
        });
        await worker.setParameters({
          tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          tessedit_pageseg_mode: "7" as any, // single text line
        });
        if (cancelled) {
          await worker.terminate();
          return;
        }
        workerRef.current = worker;
        setScanning(true);
        runLoop();
      } catch (err) {
        toast.error("Kon OCR niet laden");
        stop();
      }
    })();

    return () => {
      cancelled = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const runLoop = async () => {
    if (stoppedRef.current || !workerRef.current || !videoRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0) {
      loopRef.current = window.setTimeout(runLoop, 300);
      return;
    }
    try {
      // Grab the central horizontal strip (license plate area)
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cropW = Math.floor(vw * 0.8);
      const cropH = Math.floor(vh * 0.18);
      const cx = Math.floor((vw - cropW) / 2);
      const cy = Math.floor((vh - cropH) / 2);

      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, cx, cy, cropW, cropH, 0, 0, cropW, cropH);

      const { data } = await workerRef.current.recognize(canvas);
      if (stoppedRef.current) return;

      const kenteken = extractKenteken(data.text || "");
      if (kenteken && (data.confidence ?? 0) > 55) {
        setHint(`Gevonden: ${kenteken}`);
        toast.success(`Kenteken herkend: ${kenteken}`);
        onDetected(kenteken);
        setOpen(false);
        return;
      }
      setHint("Bezig met scannen...");
    } catch {
      // ignore frame errors
    }
    loopRef.current = window.setTimeout(runLoop, 600);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={iconOnly ? "icon" : "default"}
        className={buttonClassName}
        onClick={() => setOpen(true)}
        title="Scan kenteken met camera"
      >
        <Camera className="w-4 h-4" />
        {!iconOnly && <span className="ml-2">Scan</span>}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) stop(); setOpen(v); }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />
              Kenteken scannen
            </DialogTitle>
          </DialogHeader>
          <div className="relative bg-black aspect-[4/3]">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Overlay frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] h-[18%] border-2 border-primary rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
            <div className="absolute top-3 right-3">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="rounded-full h-8 w-8"
                onClick={() => { stop(); setOpen(false); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <div className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-2">
                {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Loader2 className="w-3 h-3 animate-spin" />}
                {hint}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground p-3 text-center">
            Houd het kenteken stil binnen het kader. Werkt het beste bij goed licht.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}