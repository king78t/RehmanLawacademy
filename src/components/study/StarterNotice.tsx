import { ShieldCheck } from "lucide-react";
import { starterReviewLabel } from "@/lib/study-types";

export function StarterNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`starter-badge ${compact ? "text-[.65rem]" : ""}`} role="note">
      <ShieldCheck size={14} aria-hidden="true" />
      <span>{starterReviewLabel}</span>
    </div>
  );
}
