import { HardDrive } from "lucide-react";

export function DeviceDataNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`device-notice ${compact ? "device-notice-compact" : ""}`} role="note">
      <HardDrive size={compact ? 15 : 17} className="shrink-0 text-[#1766a9]" aria-hidden="true" />
      <p><span className="font-bold text-[#14294d]">Saved on this device.</span> Your progress, bookmarks and quiz history stay in this browser. They will not follow you to another device and can be cleared with browser storage.</p>
    </div>
  );
}
