import { createSignal, onMount, Show } from "solid-js";

type Status = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = createSignal<Status>("idle");
  const [errorMsg, setErrorMsg] = createSignal("");
  const [startedAt, setStartedAt] = createSignal(0);

  onMount(() => {
    setStartedAt(Date.now());
    // No-JS fallback paths: the endpoint 303-redirects native posts to
    // /?sent=1#contact on success or /?error=<code>#contact on failure.
    const params = new URLSearchParams(window.location.search);
    if (params.has("sent")) {
      setStatus("success");
    } else if (params.has("error")) {
      const messages: Record<string, string> = {
        validation: "Something was off with the form — please check the fields and try again.",
        rate: "Too many messages — please try again later.",
        send: "Email failed to send. Please try again, or email me directly.",
      };
      setStatus("error");
      setErrorMsg(messages[params.get("error") ?? ""] ?? messages.send!);
    }
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;

    if (!form.reportValidity()) return;

    const body = new FormData(form);
    body.set("startedAt", String(startedAt()));

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as { success: boolean; error?: string };

      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg(
        "Couldn't reach the server. Please try again, or email me directly.",
      );
    }
  }

  return (
    <Show
      when={status() !== "success"}
      fallback={
        <div
          class="form-success"
          role="status"
          tabindex={-1}
          // Focus the panel when it replaces the form: restores a keyboard
          // focus point and makes screen readers announce the confirmation.
          ref={(el) => queueMicrotask(() => el.focus())}
        >
          <p class="form-success-title">Message sent.</p>
          <p>
            Thanks for reaching out — I'll get back to you soon. A confirmation
            is on its way to your inbox.
          </p>
        </div>
      }
    >
      <form
        class="contact-form"
        method="post"
        action="/api/contact"
        onSubmit={handleSubmit}
      >
        <div class="field">
          <label for="cf-name">Name</label>
          <input
            id="cf-name"
            name="name"
            type="text"
            autocomplete="name"
            required
            maxlength={100}
          />
        </div>

        <div class="field">
          <label for="cf-email">Email</label>
          <input
            id="cf-email"
            name="email"
            type="email"
            autocomplete="email"
            required
            maxlength={200}
          />
        </div>

        <div class="field">
          <label for="cf-message">Message</label>
          <textarea
            id="cf-message"
            name="message"
            rows={6}
            required
            maxlength={5000}
          />
        </div>

        {/* Honeypot — hidden from real users, tempting to bots */}
        <div class="hp" aria-hidden="true">
          <label for="cf-company">Company</label>
          <input
            id="cf-company"
            name="company"
            type="text"
            tabindex={-1}
            autocomplete="off"
          />
        </div>

        <button class="pill" type="submit" disabled={status() === "submitting"}>
          {status() === "submitting" ? "Sending…" : "Send message"}
        </button>

        <p class="form-status" role="status" aria-live="polite">
          <Show when={status() === "error"}>
            <span class="form-error">{errorMsg()}</span>
          </Show>
        </p>
      </form>
    </Show>
  );
}
