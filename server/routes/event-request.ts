import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Resend } from "resend";
import { storage } from "../storage";

const router = Router();

const HEADER_COLOR = "#6F2A36";

const ITALIAN_MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

const ENGLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDateItalian(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${day} ${ITALIAN_MONTHS[month - 1]} ${year}`;
}

function formatDateEnglish(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return `${ENGLISH_MONTHS[month - 1]} ${day}, ${year}`;
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getRateLimitKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

const LOCATION_LABELS: Record<string, string> = {
  interno: "Interno",
  dehors: "All'aperto — Dehors",
};

const eventRequestSchema = z.object({
  eventType: z.enum(["aperitivo", "cena", "esclusivo"]),
  subOption: z.enum(["convivialis", "riserva-ccv", "riserva-jazz"]).optional(),
  location: z.enum(["interno", "dehors"]).optional(),
  language: z.enum(["it", "en"]).default("it"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  timeApproximate: z.boolean(),
  guests: z.number().int().min(1).max(500),
  guestsApproximate: z.boolean(),
  notes: z.string().max(2000).default(""),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().email().max(200),
  termsAccepted: z.literal(true),
});

const EVENT_TYPE_LABELS: Record<string, string> = {
  aperitivo: "Aperitivo Privato",
  cena: "Cena Privata",
  esclusivo: "Evento Privato Esclusivo",
};

const EVENT_TYPE_LABELS_EN: Record<string, string> = {
  aperitivo: "Private Aperitivo",
  cena: "Private Dinner",
  esclusivo: "Exclusive Private Event",
};

const SUB_OPTION_LABELS: Record<string, string> = {
  convivialis: "Tavolo Convivialis",
  "riserva-ccv": "Riserva Camera con Vista",
  "riserva-jazz": "Riserva Camera Jazz Club",
};

const SUB_OPTION_LABELS_EN: Record<string, string> = {
  convivialis: "Convivialis Table",
  "riserva-ccv": "Reserve Camera con Vista",
  "riserva-jazz": "Reserve Camera Jazz Club",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type ParsedData = z.infer<typeof eventRequestSchema>;

function buildHtmlEmail(data: ParsedData): string {
  const rows = [
    ["Tipo Evento", EVENT_TYPE_LABELS[data.eventType] || data.eventType],
    ...(data.subOption ? [["Formula", SUB_OPTION_LABELS[data.subOption] || data.subOption]] : []),
    ...(data.location ? [["Location", LOCATION_LABELS[data.location] || data.location]] : []),
    ["Data", formatDateItalian(data.date)],
    ["Orario", `${escapeHtml(data.time)}${data.timeApproximate ? " (indicativo)" : ""}`],
    ["Ospiti", `${data.guests}${data.guestsApproximate ? " (circa)" : ""}`],
    ...(data.notes ? [["Note", escapeHtml(data.notes), "pre"]] : []),
    ["Nome", escapeHtml(`${data.firstName} ${data.lastName}`)],
    ["Email", escapeHtml(data.email)],
    ["Telefono", escapeHtml(data.phone)],
    ["Lingua", data.language === "en" ? "English" : "Italiano"],
  ];

  const tableRows = rows
    .map(
      ([label, value, isPreformatted]) =>
        `<tr><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;vertical-align:top;width:140px">${label}</td><td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;color:#111827;word-break:break-word${isPreformatted ? ";white-space:pre-wrap" : ""}">${value}</td></tr>`,
    )
    .join("");

  const logoHtml = `<h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:400;letter-spacing:1px;font-family:'Playfair Display',Georgia,'Times New Roman',serif">Camera con Vista</h1>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nuova richiesta evento privato</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f3f4f6;-webkit-text-size-adjust:100%">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6">
<tr><td style="padding:16px 8px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:1120px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
<tr><td style="background:${HEADER_COLOR};padding:20px 24px">
${logoHtml}
<p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px">Nuova richiesta evento privato</p>
</td></tr>
<tr><td style="padding:8px 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px;line-height:1.5">${tableRows}</table>
</td></tr>
<tr><td style="padding:12px 16px 16px;border-top:1px solid #e5e7eb">
<p style="margin:0;font-size:11px;color:#9ca3af">Email generata automaticamente dal sito web <a href="https://www.cameraconvista.it" style="color:#9ca3af">www.cameraconvista.it</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function buildTextEmail(data: ParsedData): string {
  const lines = [
    "NUOVA RICHIESTA EVENTO PRIVATO - Camera con Vista",
    "=".repeat(50),
    "",
    `Tipo Evento: ${EVENT_TYPE_LABELS[data.eventType] || data.eventType}`,
    ...(data.subOption ? [`Formula: ${SUB_OPTION_LABELS[data.subOption] || data.subOption}`] : []),
    ...(data.location ? [`Location: ${LOCATION_LABELS[data.location] || data.location}`] : []),
    `Data: ${formatDateItalian(data.date)}`,
    `Orario: ${data.time}${data.timeApproximate ? " (indicativo)" : ""}`,
    `Ospiti: ${data.guests}${data.guestsApproximate ? " (circa)" : ""}`,
    ...(data.notes ? [`Note: ${data.notes}`] : []),
    "",
    `Nome: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Telefono: ${data.phone}`,
    `Lingua: ${data.language === "en" ? "English" : "Italiano"}`,
    "",
    "Email generata automaticamente dal sito web.",
  ];
  return lines.join("\n");
}

router.post("/", async (req: Request, res: Response) => {
  const key = getRateLimitKey(req);
  if (!checkRateLimit(key)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }

  if (req.body?.honeypot || req.body?.website) {
    res.status(200).json({ success: true });
    return;
  }

  const parseResult = eventRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid data", details: parseResult.error.flatten() });
    return;
  }

  const data = parseResult.data;

  if (data.eventType === "esclusivo" && !data.subOption) {
    res.status(400).json({ error: "Sub-option required for exclusive events" });
    return;
  }

  let apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const setting = await storage.getSiteSetting("resend_api_key");
    apiKey = setting?.valueIt ?? undefined;
  }
  const recipientEmail = process.env.EVENT_REQUEST_EMAIL || "info@cameraconvista.it"; // Note: Also update server/seo.ts if this changes

  if (!apiKey) {
    console.error(
      "[event-request] RESEND_API_KEY not configured — NODE_ENV:",
      process.env.NODE_ENV,
    );
    res.status(500).json({ error: "Email service not configured" });
    return;
  }

  try {
    const resend = new Resend(apiKey);

    const senderDomain = process.env.RESEND_SENDER_DOMAIN || "resend.dev";
    const senderEmail =
      senderDomain === "resend.dev" ? "onboarding@resend.dev" : `noreply@${senderDomain}`;

    console.log(
      `[event-request] Sending from=${senderEmail} to=${recipientEmail} type=${data.eventType}`,
    );

    const result = await resend.emails.send({
      from: `Camera con Vista <${senderEmail}>`,
      to: [recipientEmail],
      replyTo: data.email,
      subject: `Richiesta evento: ${EVENT_TYPE_LABELS[data.eventType]} — ${data.firstName} ${data.lastName}`,
      html: buildHtmlEmail(data),
      text: buildTextEmail(data),
    });

    if (result.error) {
      console.error("[event-request] Resend API error:", JSON.stringify(result.error));
      res.status(500).json({ error: "Failed to send email" });
      return;
    }

    console.log("[event-request] Email sent successfully, id:", result.data?.id);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(
      "[event-request] Email send exception:",
      err instanceof Error ? err.message : String(err),
    );
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
