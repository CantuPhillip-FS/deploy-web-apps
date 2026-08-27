import type { APIRoute } from "astro";
import { transporter } from "../../lib/mailer";
import { escapeHtml } from "../../lib/escapeHtml";
import { SITE } from "../../data/site";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FILL_MS = 3000;

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

function respond(
  request: Request,
  status: number,
  payload: { success: boolean; error?: string },
): Response {
  // Native (no-JS) form posts get redirected back to the page instead of raw JSON.
  const wantsHtml =
    !request.headers.get("accept")?.includes("application/json") &&
    request.headers.get("accept")?.includes("text/html");

  if (wantsHtml && payload.success) {
    return new Response(null, {
      status: 303,
      headers: { Location: "/?sent=1#contact" },
    });
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let fields: Fields;
  try {
    fields = await parseFields(request);
  } catch {
    return respond(request, 400, {
      success: false,
      error: "Malformed request body.",
    });
  }

  // Bot traps: filled honeypot or a sub-3-second submit. Pretend success.
  if (fields.company || (fields.startedAt && Date.now() - fields.startedAt < MIN_FILL_MS)) {
    return respond(request, 200, { success: true });
  }

  const error = validate(fields);
  if (error) {
    return respond(request, 400, { success: false, error });
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
      // Confirmation to the sender
      transporter.sendMail({
        from: `"${SITE.name}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Message Received ✅",
        text: `Hi ${name},

Thanks for reaching out! I've received your message and will get back to you as soon as possible.

Here's a copy of your message:

"${message}"

Talk soon,
${SITE.name}
${SITE.email}`,
        html: `
          <p>Hi ${safeName},</p>
          <p>Thanks for reaching out! I've received your message and will get back to you as soon as possible.</p>
          <p><strong>Your message:</strong></p>
          <blockquote>${safeMessage}</blockquote>
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
    });
  }
};
