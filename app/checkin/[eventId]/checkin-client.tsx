"use client";

import { FormEvent, useState } from "react";

type Props = {
  eventId: string;
  eventTitle: string;
  eventDate: string;
};

type CheckinResult = {
  guestName: string;
  tierName: string;
  checkedInAt: string;
};

export default function CheckinClient({ eventId, eventTitle, eventDate }: Props) {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  async function submitCode(code: string) {
    setError(null);
    setResult(null);

    const res = await fetch(`/api/checkin/${eventId}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmationCode: code.trim() }),
    });

    const body = await res.json();
    if (!res.ok) {
      setError(body?.error?.message ?? "Check-in failed");
      return;
    }

    setResult({
      guestName: body.guestName,
      tierName: body.tierName,
      checkedInAt: body.checkedInAt,
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCode(confirmationCode);
  }

  async function scanQrCode() {
    if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) return;

    setScanning(true);
    setError(null);

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    const BarcodeDetectorCtor = window.BarcodeDetector as {
      new (options: { formats: string[] }): { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>> };
    };
    const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

    let found = "";
    for (let i = 0; i < 20 && !found; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const codes = await detector.detect(video);
      found = codes.find((item) => Boolean(item.rawValue))?.rawValue ?? "";
    }

    stream.getTracks().forEach((track) => track.stop());
    setScanning(false);

    if (!found) {
      setError("No QR code detected. Try manual entry.");
      return;
    }

    setConfirmationCode(found);
    await submitCode(found);
  }

  const canScan = typeof window !== "undefined" && "BarcodeDetector" in window && Boolean(navigator.mediaDevices?.getUserMedia);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Check in attendees</h1>
        <p className="text-sm text-muted-foreground">{eventTitle} · {new Date(eventDate).toLocaleString()}</p>
      </header>

      <form onSubmit={(event) => { void onSubmit(event); }} className="space-y-3 rounded-md border p-4">
        <label className="block text-sm font-medium" htmlFor="confirmationCode">Confirmation code</label>
        <input
          id="confirmationCode"
          value={confirmationCode}
          onChange={(event) => setConfirmationCode(event.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="AP-2X9K"
          autoComplete="off"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">Check In</button>
      </form>

      <div>
        {canScan ? (
          <button type="button" className="rounded border px-4 py-2" disabled={scanning} onClick={() => { void scanQrCode(); }}>
            {scanning ? "Scanning…" : "Scan QR"}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Use manual entry on this device</p>
        )}
      </div>

      {result ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-6xl text-green-600">✓</p>
          <p className="text-lg font-semibold">{result.guestName}</p>
          <p className="text-sm">{result.tierName}</p>
        </div>
      ) : null}

      {error ? <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
