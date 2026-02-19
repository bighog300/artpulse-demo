import { cn } from "@/lib/utils";

export type OnboardingStepStatus = {
  key: "follow" | "saved_search" | "saved_event" | "location";
  label: string;
  detail: string;
  done: boolean;
};

export function OnboardingProgress({ steps }: { steps: OnboardingStepStatus[] }) {
  return (
    <ul className="space-y-2" aria-label="Onboarding progress checklist">
      {steps.map((step) => (
        <li key={step.key} className={cn("rounded-lg border p-2 text-sm", step.done ? "border-emerald-300 bg-emerald-50" : "border-border bg-background")}>
          <p className="font-medium">{step.done ? "✓ " : ""}{step.label}</p>
          <p className="text-muted-foreground">{step.detail}</p>
        </li>
      ))}
    </ul>
  );
}
