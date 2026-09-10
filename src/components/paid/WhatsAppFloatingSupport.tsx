import { MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { getBrandConfig, getCourseWhatsAppUrl, getGeneralWhatsAppUrl } from "@/lib/brand-config";

interface WhatsAppFloatingSupportProps {
  courseTitle?: string;
  studentName?: string;
  phoneNumber?: string;
}

export function WhatsAppFloatingSupport({
  courseTitle,
  studentName,
  phoneNumber,
}: WhatsAppFloatingSupportProps) {
  const [showTooltip, setShowTooltip] = useState(true);
  const brand = getBrandConfig();

  const waUrl = courseTitle
    ? getCourseWhatsAppUrl(courseTitle)
    : studentName
      ? getGeneralWhatsAppUrl(`Assalam-o-Alaikum RehmanLawAcademy, I am ${studentName}. I need assistance regarding course admissions.`)
      : getGeneralWhatsAppUrl();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {showTooltip && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white p-3 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <MessageCircle size={16} />
          </div>
          <div className="text-left">
            <p className="text-[.7rem] font-bold uppercase tracking-wider text-emerald-800">
              {brand.name} Helpline
            </p>
            <p className="text-xs font-semibold text-slate-700">
              Need help with payment or admission?
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowTooltip(false)}
            className="ml-1 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#20bd5a] focus:outline-none focus:ring-4 focus:ring-emerald-300"
        title={`Chat on WhatsApp with ${brand.name}`}
      >
        <MessageCircle size={22} className="fill-white group-hover:animate-pulse" />
        <span className="text-xs font-bold sm:text-sm">WhatsApp Helpline</span>
      </a>
    </div>
  );
}
