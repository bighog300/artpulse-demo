"use client";

import Link from "next/link";
import { ErrorCard } from "@/components/ui/error-card";
import { LoadingCard } from "@/components/ui/loading-card";
import type { GetStartedProgress } from "@/lib/get-started";
import { useGetStartedState } from "@/components/onboarding/get-started-state";

export function GetStartedWizardContent({ progress }: { progress: GetStartedProgress }) {
  if (progress.completedAll) {
    return (
      <section className="rounded border bg-emerald-50 p-4">
        <h2 className="text-lg font-semibold">You’re all set 🎉</h2>
        <p className="mt-1 text-sm text-zinc-700">Your personalization setup is complete.</p>
        <Link href="/for-you" className="mt-3 inline-block rounded border bg-white px-3 py-1 text-sm">Go to For You</Link>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <p className="text-sm text-zinc-700">
        Progress: {progress.completedCount}/{progress.totalCount} completed · Step {progress.currentStepNumber}/{progress.totalCount}
      </p>

      {progress.steps.map((step, idx) => (
        <article key={step.key} className="rounded border bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-500">Step {idx + 1}</p>
              <h2 className="font-semibold">{step.title}</h2>
              <p className="text-sm text-zinc-700">{step.description}</p>
            </div>
            <span className="rounded border px-2 py-1 text-xs">{step.done ? "Done" : "Not started"}</span>
          </div>
          {!step.done ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {step.ctas.map((cta) => (
                <Link key={cta.href} href={cta.href} className="rounded border px-3 py-1 text-sm hover:bg-zinc-50">{cta.label}</Link>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function GetStartedWizard() {
  const { loading, error, progress, reload } = useGetStartedState();

  if (loading) return <LoadingCard lines={5} label="Loading onboarding wizard" />;
  if (error || !progress) return <ErrorCard message={error ?? "Unable to load onboarding wizard."} onRetry={() => void reload()} />;

  return <GetStartedWizardContent progress={progress} />;
}
