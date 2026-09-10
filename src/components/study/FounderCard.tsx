import { CheckCircle2, Facebook, Instagram, Mail, MessageCircle, Scale, Video } from "lucide-react";
import { getBrandConfig, getGeneralWhatsAppUrl, getEmailMailto } from "@/lib/brand-config";

interface FounderCardProps {
  compact?: boolean;
  className?: string;
}

export function FounderCard({ compact = false, className = "" }: FounderCardProps) {
  const brand = getBrandConfig();
  const { founder, whatsapp, email, socials } = brand;

  const waInquiryUrl = getGeneralWhatsAppUrl(
    "Assalam-o-Alaikum Adv. AbdulRehman Yaseen, I am a law student seeking academic guidance for LAT / Law GAT."
  );

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md ${className}`}
      id="founder-profile-card"
    >
      {/* Decorative subtle accent bar */}
      <div className="h-2 w-full bg-gradient-to-r from-[#14294d] via-[#1766a9] to-[#ddc275]" />

      <div className={`p-6 sm:p-8 ${compact ? "!p-5" : ""}`}>
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Founder Avatar / Photograph */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-2xl border-2 border-slate-100 bg-[#0f2349] shadow-inner sm:h-28 sm:w-28">
              <img
                src={founder.imageUrl}
                alt={founder.name}
                className="h-full w-full object-cover object-top"
                onError={(e) => {
                  // Fallback to high-contrast advocate monogram if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement?.classList.add("flex", "items-center", "justify-center");
                  const fallbackDiv = document.createElement("div");
                  fallbackDiv.className = "flex flex-col items-center justify-center text-white p-2 text-center";
                  fallbackDiv.innerHTML = `<span class="font-display font-bold text-2xl text-[#ddc275]">ARY</span><span class="text-[9px] text-blue-200 tracking-wider uppercase font-semibold">Advocate</span>`;
                  target.parentElement?.appendChild(fallbackDiv);
                }}
              />
            </div>
            <span
              className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#14294d] text-[#ddc275] shadow-md ring-2 ring-white"
              title="Verified High Court Advocate"
            >
              <Scale size={14} />
            </span>
          </div>

          {/* Founder Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-slate-600">
                Founder
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.68rem] font-bold text-emerald-700">
                <CheckCircle2 size={12} /> High Court Advocate
              </span>
            </div>

            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#14294d]">
              {founder.name}
            </h3>
            <p className="text-sm font-semibold text-[#1766a9]">
              {founder.designation}
            </p>

            <p className="mt-3 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
              {founder.bio}
            </p>

            {/* Direct Connect Actions & Socials */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={waInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-emerald-400"
                id="founder-whatsapp-btn"
              >
                <MessageCircle size={15} />
                <span>Contact on WhatsApp</span>
              </a>

              <a
                href={getEmailMailto("Academic Inquiry for Adv. AbdulRehman Yaseen")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-[#14294d]"
                id="founder-email-btn"
              >
                <Mail size={15} className="text-slate-500" />
                <span>Email Advocate</span>
              </a>

              {/* Social Channels */}
              <div className="ml-auto flex items-center gap-1.5 pt-2 sm:pt-0">
                <a
                  href={socials.facebook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Adv. AbdulRehman Yaseen on Facebook"
                  title="Visit Facebook Page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Facebook size={16} />
                </a>
                <a
                  href={socials.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Adv. AbdulRehman Yaseen on Instagram"
                  title="Follow on Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600"
                >
                  <Instagram size={16} />
                </a>
                <a
                  href={socials.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Adv. AbdulRehman Yaseen on TikTok"
                  title="Follow on TikTok"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  <Video size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
