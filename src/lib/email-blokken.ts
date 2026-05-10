// Block-based email content. Used by the visual editor and by the
// renderer that produces final HTML. Keep this file dependency-free so
// the same shape can be used in edge functions later.

export type EmailBlok =
  | { id: string; type: "heading"; tekst: string; niveau: 1 | 2 | 3 }
  | { id: string; type: "tekst"; tekst: string }
  | { id: string; type: "knop"; tekst: string; url: string }
  | { id: string; type: "afbeelding"; src: string; alt?: string; breedte?: number }
  | { id: string; type: "divider" }
  | { id: string; type: "spacer"; hoogte: number };

export type EmailBlokType = EmailBlok["type"];

export interface EmailTemplateContent {
  blokken: EmailBlok[];
  achtergrond_kleur: string;
  accent_kleur: string;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Replace {{variabele}} placeholders with values from data, leaving unknown ones intact. */
export function vulVariabelen(tekst: string, data: Record<string, string | number | undefined>): string {
  return tekst.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const v = data[key];
    return v === undefined || v === null ? `{{${key}}}` : String(v);
  });
}

/** Render a single block to HTML (already-escaped). */
function renderBlok(b: EmailBlok, accent: string, data: Record<string, string | number | undefined>): string {
  switch (b.type) {
    case "heading": {
      const tag = `h${b.niveau}`;
      const fontSize = b.niveau === 1 ? "26px" : b.niveau === 2 ? "20px" : "16px";
      return `<${tag} style="margin:0 0 16px;font-family:Arial,sans-serif;color:#0f172a;font-size:${fontSize};line-height:1.25;font-weight:600;">${escape(vulVariabelen(b.tekst, data))}</${tag}>`;
    }
    case "tekst":
      return `<p style="margin:0 0 16px;font-family:Arial,sans-serif;color:#334155;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escape(vulVariabelen(b.tekst, data))}</p>`;
    case "knop": {
      const url = escape(vulVariabelen(b.url, data));
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="border-radius:8px;background:${escape(accent)};"><a href="${url}" style="display:inline-block;padding:12px 22px;font-family:Arial,sans-serif;font-size:15px;color:#ffffff;text-decoration:none;font-weight:600;border-radius:8px;">${escape(vulVariabelen(b.tekst, data))}</a></td></tr></table>`;
    }
    case "afbeelding": {
      const src = escape(b.src);
      const alt = escape(b.alt ?? "");
      const w = b.breedte ? ` width="${b.breedte}"` : "";
      return `<img src="${src}" alt="${alt}"${w} style="max-width:100%;height:auto;display:block;margin:0 0 16px;border-radius:6px;" />`;
    }
    case "divider":
      return `<hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;" />`;
    case "spacer":
      return `<div style="height:${Math.max(0, b.hoogte)}px;line-height:${Math.max(0, b.hoogte)}px;">&nbsp;</div>`;
  }
}

/** Render the full template (without the system unsubscribe footer, that is added by the sender). */
export function renderTemplateHtml(
  content: EmailTemplateContent,
  data: Record<string, string | number | undefined> = {},
): string {
  const body = content.blokken.map((b) => renderBlok(b, content.accent_kleur, data)).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8" /></head><body style="margin:0;padding:0;background:#f1f5f9;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${escape(content.achtergrond_kleur)};border-radius:12px;"><tr><td style="padding:32px 28px;">${body}</td></tr></table></td></tr></table></body></html>`;
}

export const NIEUW_BLOK_DEFAULTS: Record<EmailBlokType, Omit<EmailBlok, "id">> = {
  heading: { type: "heading", tekst: "Nieuwe titel", niveau: 2 },
  tekst: { type: "tekst", tekst: "Schrijf hier je tekst. Gebruik {{naam}} voor variabelen." },
  knop: { type: "knop", tekst: "Klik hier", url: "https://" },
  afbeelding: { type: "afbeelding", src: "https://placehold.co/560x240", alt: "" },
  divider: { type: "divider" },
  spacer: { type: "spacer", hoogte: 24 },
};

export const BESCHIKBARE_VARIABELEN: { sleutel: string; voorbeeld: string }[] = [
  { sleutel: "naam", voorbeeld: "Klantnaam" },
  { sleutel: "bedrijf", voorbeeld: "Eigen bedrijfsnaam" },
  { sleutel: "factuur_nr", voorbeeld: "F-2026-00123" },
  { sleutel: "bedrag", voorbeeld: "€ 1.234,56" },
  { sleutel: "vervaldatum", voorbeeld: "12-06-2026" },
  { sleutel: "kenteken", voorbeeld: "AB-123-C" },
  { sleutel: "betaal_link", voorbeeld: "https://..." },
];