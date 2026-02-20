"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  initialEmail?: string;
  requestsEnabled: boolean;
};

export function BetaPageClient({ initialEmail = "", requestsEnabled }: Props) {
  const [requestEmail, setRequestEmail] = useState(initialEmail);
  const [requestNote, setRequestNote] = useState("");
  const [requestResult, setRequestResult] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState(initialEmail);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackResult, setFeedbackResult] = useState("");

  async function submitRequestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestResult("");
    const response = await fetch("/api/beta/request-access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: requestEmail, note: requestNote }),
    });
    setRequestResult(response.ok ? "Request submitted." : "Could not submit request.");
  }

  async function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedbackResult("");
    const response = await fetch("/api/beta/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: feedbackEmail || undefined,
        message: feedbackMessage,
        pagePath: window.location.pathname,
      }),
    });
    if (response.ok) {
      setFeedbackMessage("");
      setFeedbackResult("Feedback sent.");
      return;
    }
    setFeedbackResult("Could not send feedback.");
  }

  return (
    <div className="space-y-8">
      {requestsEnabled ? (
        <section className="space-y-3 rounded-md border p-4">
          <h2 className="text-lg font-semibold">Request access</h2>
          <form onSubmit={submitRequestAccess} className="space-y-3">
            <label className="block text-sm">
              Email
              <Input required type="email" value={requestEmail} onChange={(event) => setRequestEmail(event.target.value)} />
            </label>
            <label className="block text-sm">
              Note (optional)
              <textarea className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" maxLength={1000} value={requestNote} onChange={(event) => setRequestNote(event.target.value)} />
            </label>
            <Button type="submit">Request access</Button>
            <p aria-live="polite" className="text-sm text-zinc-700">{requestResult}</p>
          </form>
        </section>
      ) : null}

      <section className="space-y-3 rounded-md border p-4">
        <h2 className="text-lg font-semibold">Send feedback</h2>
        <form onSubmit={submitFeedback} className="space-y-3">
          <label className="block text-sm">
            Email (optional)
            <Input type="email" value={feedbackEmail} onChange={(event) => setFeedbackEmail(event.target.value)} />
          </label>
          <label className="block text-sm">
            Feedback
            <textarea required className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" maxLength={2000} value={feedbackMessage} onChange={(event) => setFeedbackMessage(event.target.value)} />
          </label>
          <Button type="submit">Send feedback</Button>
          <p aria-live="polite" className="text-sm text-zinc-700">{feedbackResult}</p>
        </form>
      </section>
    </div>
  );
}
