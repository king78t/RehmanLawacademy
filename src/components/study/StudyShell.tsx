import type { ReactNode } from "react";
import { StudyHeader } from "@/components/study/StudyHeader";
import { SiteFooter } from "@/components/study/SiteFooter";

export function StudyShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#14294d] flex flex-col justify-between">
      <div>
        <StudyHeader />
        {children}
      </div>
      {footer && <SiteFooter />}
    </div>
  );
}
