import type { APIRoute } from "astro";
import { transporter } from "../../lib/mailer";
import { escapeHtml } from "../../lib/escapeHtml";
import { SITE } from "../../data/site";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FILL_MS = 3000;

// Best-effort per-instance rate limit (serverless instances don't share this,
// but it still throttles low-and-slow abuse against a warm function).
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 1000) {
    // Drop stale entries so the map can't grow unbounded.
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_MAX;
}

type Fields = {
  name: string;
  email: string;
  message: string;
  company: string;
  startedAt: number;
};

async function parseFields(request: Request): Promise<Fields> {
  const contentType = request.headers.get("content-type") ?? "";
  let raw: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    raw = (await request.json()) as Record<string, unknown>;
  } else {
    raw = Object.fromEntries(await request.formData());
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    name: str(raw.name),
    email: str(raw.email),
    message: str(raw.message),
    company: str(raw.company),
    startedAt: Number(raw.startedAt) || 0,
  };
}

function validate({ name, email, message }: Fields): string | null {
  if (!name || !email || !message) return "All fields are required.";
  if (name.length > 100) return "Name is too long.";
  if (email.length > 200 || !EMAIL_RE.test(email))
    return "Please enter a valid email address.";
  if (message.length > 5000) return "Message is too long (5000 char max).";
  return null;
}

type Payload = {
  success: boolean;
  error?: string;
  /** Machine-readable code, used for the no-JS redirect (never free text in a URL) */
  code?: "validation" | "send" | "rate";
};

function respond(request: Request, status: number, payload: Payload): Response {
  // Native (no-JS) form posts get redirected back to the page instead of raw JSON.
  const accept = request.headers.get("accept") ?? "";
  const wantsHtml =
    !accept.includes("application/json") && accept.includes("text/html");

  if (wantsHtml) {
    const location = payload.success
      ? "/?sent=1#contact"
      : `/?error=${payload.code ?? "send"}#contact`;
    return new Response(null, { status: 303, headers: { Location: location } });
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let ip = "unknown";
  try {
    ip = clientAddress;
  } catch {
    // clientAddress can throw in odd local setups; rate limit then keys on "unknown"
  }
  if (rateLimited(ip)) {
    return respond(request, 429, {
      success: false,
      error: "Too many messages — please try again later.",
      code: "rate",
    });
  }

  let fields: Fields;
  try {
    fields = await parseFields(request);
  } catch {
    return respond(request, 400, {
      success: false,
      error: "Malformed request body.",
      code: "validation",
    });
  }

  // Bot traps: filled honeypot or a sub-3-second submit. Pretend success.
  if (
    fields.company ||
    (fields.startedAt && Date.now() - fields.startedAt < MIN_FILL_MS)
  ) {
    return respond(request, 200, { success: true });
  }

  const error = validate(fields);
  if (error) {
    return respond(request, 400, { success: false, error, code: "validation" });
  }

  const { name, email, message } = fields;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

  try {
    await Promise.all([
      // Notification to me
      transporter.sendMail({
        from: `"New Contact" <${process.env.SMTP_USER}>`,
        to: SITE.email,
        replyTo: email,
        subject: "New Contact Form Submission",
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong></p>
          <p>${safeMessage}</p>
        `,
      }),
      // Confirmation to the sender. Deliberately static: no user-supplied text,
      // so the endpoint can't be used to relay attacker-authored email.
      transporter.sendMail({
        from: `"${SITE.name}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Message Received ✅",
        text: `Hi,

Thanks for reaching out through phillipcantu.com! I've received your message and will get back to you as soon as possible.

If you didn't submit this form, you can safely ignore this email.

Talk soon,
${SITE.name}
${SITE.email}`,
        html: `
          <p>Hi,</p>
          <p>Thanks for reaching out through phillipcantu.com! I've received your message and will get back to you as soon as possible.</p>
          <p>If you didn't submit this form, you can safely ignore this email.</p>
          <p>Talk soon,<br/>${SITE.name}<br/>${SITE.email}</p>
        `,
      }),
    ]);

    return respond(request, 200, { success: true });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return respond(request, 500, {
      success: false,
      error: "Email failed to send. Please try again later.",
      code: "send",
    });
  }
};
