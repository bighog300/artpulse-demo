import { notFound } from "next/navigation";
import { PersonalizationLabClient } from "./personalization-lab-client";

export default function PersonalizationLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <PersonalizationLabClient />;
}
