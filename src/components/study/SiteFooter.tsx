import { Facebook, Instagram, Mail, MessageCircle, Scale, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { getBrandConfig, getGeneralWhatsAppUrl } from "@/lib/brand-config";

export function SiteFooter() {
  const brand = getBrandConfig();
  const { founder, whatsapp, email, socials } = brand;

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white" id="site-footer">
      {/* Top Banner / Core Brand Intro */}
      <div className="page-wrap py-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* Col 1: Brand & Founder */}
          <div className="space-y-4">
            <Link to="/" className="font-display text-xl font-bold tracking-tight text-[#14294d]">
              {brand.brandName}
            </Link>
            <p className="text-sm font-semibold text-slate-700">
              {brand.tagline}
            </p>
            <p className="text-xs leading-5 text-slate-500 max-w-sm">
              A specialized Pakistani law education platform dedicated to LAT, Law GAT, and LLB academic excellence.
            </p>

            {/* Founder Block */}
            <div className="rounded-xl border border-slate-100 bg-[#f8fafc] p-3.5">
              <p className="text-[0.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                Founder
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#14294d]">
                <Scale size={13} className="text-[#ddc275]" />
                <span>{founder.name}</span>
                <span className="text-slate-400">—</span>
                <span className="text-[#1766a9]">{founder.designation}</span>
              </p>
            </div>
          </div>

          {/* Col 2: Academic Nav Links */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-400">
              Exam Preparation
            </p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm font-medium text-slate-600" aria-label="Footer study links">
              <Link to="/lat" className="transition-colors hover:text-[#1766a9]">
                LAT Preparation
              </Link>
              <Link to="/law-gat" className="transition-colors hover:text-[#1766a9]">
                Law GAT Preparation
              </Link>
              <Link to="/lat/pakistan-studies" className="transition-colors hover:text-[#1766a9]">
                Law MCQs
              </Link>
              <Link to="/lat/pakistan-studies/part-1/quiz" className="transition-colors hover:text-[#1766a9]">
                Online Quizzes
              </Link>
              <Link to="/paid-courses" className="transition-colors hover:text-[#1766a9]">
                Paid Courses
              </Link>
            </nav>
          </div>

          {/* Col 3: Academy & Information */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-400">
              Academy
            </p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm font-medium text-slate-600" aria-label="Footer academy links">
              <Link to="/" className="transition-colors hover:text-[#1766a9]">
                Home
              </Link>
              <Link to="/about" className="transition-colors hover:text-[#1766a9]">
                About
              </Link>
              <Link to="/contact" className="transition-colors hover:text-[#1766a9]">
                Contact
              </Link>
              <Link to="/information" className="transition-colors hover:text-[#1766a9]">
                Information
              </Link>
              <Link to="/dashboard" className="transition-colors hover:text-[#1766a9]">
                Student Progress
              </Link>
            </nav>
          </div>

          {/* Col 4: Contact & Socials */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.14em] text-slate-400">
              Official Contact
            </p>

            <div className="mt-4 space-y-2.5 text-sm">
              <a
                href={whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 font-medium text-slate-600 transition-colors hover:text-[#25D366]"
                title="Chat on WhatsApp"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                  <MessageCircle size={14} />
                </div>
                <span>{whatsapp.display}</span>
              </a>

              <a
                href={email.mailto}
                className="group flex items-center gap-2 font-medium text-slate-600 transition-colors hover:text-[#1766a9]"
                title="Send official email"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-[#1766a9] group-hover:text-white transition-colors">
                  <Mail size={14} />
                </div>
                <span className="truncate">{email.address}</span>
              </a>
            </div>

            {/* Social Icons */}
            <p className="mt-6 text-[0.68rem] font-extrabold uppercase tracking-wider text-slate-400">
              Follow Us
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              {/* Facebook */}
              <a
                href={socials.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Page (9,498 Likes)"
                title={`Facebook (${socials.facebook.audience})`}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-blue-400 hover:bg-[#1877F2] hover:text-white shadow-xs"
              >
                <Facebook size={16} />
              </a>

              {/* Instagram */}
              <a
                href={socials.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Profile (16,460 Followers)"
                title={`Instagram (${socials.instagram.audience})`}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-pink-400 hover:bg-gradient-to-tr hover:from-[#fd1d1d] hover:to-[#833ab4] hover:text-white shadow-xs"
              >
                <Instagram size={16} />
              </a>

              {/* TikTok */}
              <a
                href={socials.tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok Profile"
                title="TikTok (@abdulrehmanyaseenadv)"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-slate-800 hover:bg-black hover:text-white shadow-xs"
              >
                <Video size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-100 py-6">
        <div className="page-wrap flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>{brand.copyright}</span>
          <span>Founder: {founder.fullTitle}</span>
        </div>
      </div>
    </footer>
  );
}
