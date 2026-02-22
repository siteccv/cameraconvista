import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Resend } from "resend";

const router = Router();

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

const eventRequestSchema = z.object({
  eventType: z.enum(["aperitivo", "cena", "esclusivo"]),
  subOption: z.enum(["convivialis", "riserva-ccv", "riserva-jazz"]).optional(),
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

const SUB_OPTION_LABELS: Record<string, string> = {
  convivialis: "Tavolo Convivialis",
  "riserva-ccv": "Riserva Camera con Vista",
  "riserva-jazz": "Riserva Camera Jazz Club",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtmlEmail(data: z.infer<typeof eventRequestSchema>): string {
  const rows = [
    ["Tipo Evento", EVENT_TYPE_LABELS[data.eventType] || data.eventType],
    ...(data.subOption ? [["Formula", SUB_OPTION_LABELS[data.subOption] || data.subOption]] : []),
    ["Data", escapeHtml(data.date)],
    ["Orario", `${escapeHtml(data.time)}${data.timeApproximate ? " (indicativo)" : ""}`],
    ["Ospiti", `${data.guests}${data.guestsApproximate ? " (circa)" : ""}`],
    ...(data.notes ? [["Note", escapeHtml(data.notes)]] : []),
    ["Nome", escapeHtml(`${data.firstName} ${data.lastName}`)],
    ["Email", escapeHtml(data.email)],
    ["Telefono", escapeHtml(data.phone)],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;background:#f8f9fa;width:35%">${label}</td><td style="padding:8px 12px;border:1px solid #ddd">${value}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Nuova richiesta evento privato</title></head>
<body style="margin:0;padding:20px;font-family:Arial,sans-serif;background:#f5f5f5">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
<div style="background:#1a1a2e;padding:24px;text-align:center">
<h1 style="color:#fff;margin:0;font-size:22px">Camera con Vista</h1>
<p style="color:#ccc;margin:4px 0 0;font-size:14px">Nuova richiesta evento privato</p>
</div>
<div style="padding:24px">
<table style="width:100%;border-collapse:collapse;font-size:14px">${tableRows}</table>
<p style="margin-top:20px;font-size:12px;color:#888">Questa email è stata generata automaticamente dal sito web.</p>
</div>
</div>
</body></html>`;
}

function buildTextEmail(data: z.infer<typeof eventRequestSchema>): string {
  const lines = [
    "NUOVA RICHIESTA EVENTO PRIVATO - Camera con Vista",
    "=".repeat(50),
    "",
    `Tipo Evento: ${EVENT_TYPE_LABELS[data.eventType] || data.eventType}`,
    ...(data.subOption ? [`Formula: ${SUB_OPTION_LABELS[data.subOption] || data.subOption}`] : []),
    `Data: ${data.date}`,
    `Orario: ${data.time}${data.timeApproximate ? " (indicativo)" : ""}`,
    `Ospiti: ${data.guests}${data.guestsApproximate ? " (circa)" : ""}`,
    ...(data.notes ? [`Note: ${data.notes}`] : []),
    "",
    `Nome: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Telefono: ${data.phone}`,
    "",
    "---",
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

  const apiKey = process.env.RESEND_API_KEY;
  const recipientEmail = process.env.EVENT_REQUEST_EMAIL || "info@cameraconvista.it";

  if (!apiKey) {
    console.error("[event-request] RESEND_API_KEY not configured");
    res.status(500).json({ error: "Email service not configured" });
    return;
  }

  try {
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: "Camera con Vista <noreply@cameraconvista.it>",
      to: [recipientEmail],
      replyTo: data.email,
      subject: `Richiesta evento: ${EVENT_TYPE_LABELS[data.eventType]} — ${data.firstName} ${data.lastName}`,
      html: buildHtmlEmail(data),
      text: buildTextEmail(data),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("[event-request] Email send failed:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
