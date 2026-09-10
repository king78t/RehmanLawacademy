import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { StudyShell } from "@/components/study/StudyShell";
import { FounderCard } from "@/components/study/FounderCard";
import { getBrandConfig, getGeneralWhatsAppUrl } from "@/lib/brand-config";

export default function Contact() {
  const brand = getBrandConfig();
  const { socials, whatsapp, email, founder } = brand;

  const [name, setName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("LAT Preparation");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Pre-fill WhatsApp message directly so student gets an instant reply
    const text = `Assalam-o-Alaikum ${brand.name},
My name is ${name || "Student"}.
Inquiry regarding: ${inquiryType}
Phone: ${phone || "N/A"}
Email: ${studentEmail || "N/A"}

Message: ${message || "I want to inquire about upcoming sessions."}`;

    const url = getGeneralWhatsAppUrl(text);
    window.open(url, "_blank");
    setSubmitted(true);
  };

  return (
    <StudyShell>
      <main className="page-wrap py-10 sm:py-16">
        {/* Header */}
        <div className="max-w-3xl">
          <span className="eyebrow">Official Academy Support</span>
          <h1 className="page-heading mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Contact RehmanLawAcademy
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Connect directly with {founder.name} ({founder.designation}) and the academy coordinator team for test guidance, manual payment support, and course enrollment.
          </p>
        </div>

        {/* Quick Contact Cards */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          {/* WhatsApp */}
          <div className="surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-[#25D366]">
                <MessageCircle size={22} />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-[#14294d]">
                Official WhatsApp
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Direct helpline for enrollments, fee confirmation &amp; urgent inquiries.
              </p>
              <p className="mt-3 font-mono text-sm font-bold text-[#14294d]">
                {whatsapp.display}
              </p>
            </div>
            <a
              href={whatsapp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="button-primary mt-5 inline-flex w-full items-center justify-center gap-2 !bg-[#25D366] text-xs font-bold text-white hover:!bg-[#20bd5a]"
            >
              <MessageCircle size={15} /> Open WhatsApp Chat
            </a>
          </div>

          {/* Email */}
          <div className="surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#1766a9]">
                <Mail size={22} />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-[#14294d]">
                Official Email
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                For academic inquiries, formal verifications, and student records.
              </p>
              <p className="mt-3 font-mono text-xs font-bold break-all text-[#14294d]">
                {email}
              </p>
            </div>
            <a
              href={`mailto:${email}`}
              className="button-secondary mt-5 inline-flex w-full items-center justify-center gap-2 text-xs font-bold text-[#1766a9]"
            >
              <Mail size={15} /> Send Email
            </a>
          </div>

          {/* Operational Hours */}
          <div className="surface p-6 flex flex-col justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-[#b28d37]">
                <Clock3 size={22} />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-[#14294d]">
                Office &amp; Support Hours
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Coordination desk availability for manual payment reviews:
              </p>
              <div className="mt-3 space-y-1 text-xs font-semibold text-slate-700">
                <p>Mon – Sat: 09:00 AM – 10:00 PM</p>
                <p>Sunday: 12:00 PM – 08:00 PM</p>
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-slate-50 p-2.5 text-center text-[.72rem] font-bold text-slate-500">
              Avg. Verification Time: 1–4 Hours
            </div>
          </div>
        </section>

        {/* Founder Guidance Section */}
        <section className="mt-14">
          <div className="mb-4">
            <p className="eyebrow">Academic Mentor</p>
            <h2 className="font-display text-xl font-bold text-[#14294d]">
              Direct Guidance from Founder
            </h2>
          </div>
          <FounderCard />
        </section>

        {/* Contact Form & Socials Grid */}
        <section className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          {/* Inquiry Form */}
          <div className="surface p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[#1766a9]">
              <Send size={18} />
              <h2 className="font-display text-xl font-bold text-[#14294d]">
                Send a Direct Message
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Fill in your details below. Submitting will immediately open our official WhatsApp coordinator desk with your formatted question.
            </p>

            {submitted && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
                WhatsApp chat initiated! Our coordinator will respond promptly.
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="cf-name">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="cf-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1766a9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="cf-phone">
                    WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="cf-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0300-1234567"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1766a9]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="cf-email">
                    Email Address
                  </label>
                  <input
                    id="cf-email"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="e.g. student@gmail.com"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1766a9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="cf-type">
                    Subject / Area of Inquiry
                  </label>
                  <select
                    id="cf-type"
                    value={inquiryType}
                    onChange={(e) => setInquiryType(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1766a9]"
                  >
                    <option value="LAT Preparation">LAT (Law Admission Test)</option>
                    <option value="Law GAT Preparation">Law GAT Preparation</option>
                    <option value="Paid Course Enrollment">Paid Course Enrollment</option>
                    <option value="Payment Verification Issue">Payment Verification Issue</option>
                    <option value="General Question">General Inquiry</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="cf-msg">
                  Message / Questions
                </label>
                <textarea
                  id="cf-msg"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with (syllabus, enrollment, schedule)..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1766a9]"
                />
              </div>

              <button
                type="submit"
                className="button-primary flex w-full items-center justify-center gap-2 !bg-[#25D366] text-sm font-bold text-white hover:!bg-[#20bd5a]"
              >
                <MessageCircle size={16} /> Send to Official WhatsApp
              </button>
            </form>
          </div>

          {/* Social Communities & Address Card */}
          <div className="space-y-6">
            <div className="surface p-6 sm:p-7">
              <h3 className="font-display text-lg font-bold text-[#14294d]">
                Join Our Student Community
              </h3>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                Follow our official social profiles for daily law quiz updates, HEC date announcements, and live Q&amp;A sessions.
              </p>

              <div className="mt-5 space-y-3">
                {/* Facebook */}
                <a
                  href={socials.facebook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-[#1877F2] hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1877F2]/10 text-[#1877F2]">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#14294d]">Facebook Official Page</p>
                      <p className="text-[.68rem] text-slate-500">{socials.facebook.audience}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1877F2]">Follow →</span>
                </a>

                {/* Instagram */}
                <a
                  href={socials.instagram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-[#E4405F] hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E4405F]/10 text-[#E4405F]">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#14294d]">Instagram Community</p>
                      <p className="text-[.68rem] text-slate-500">{socials.instagram.audience}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#E4405F]">Follow →</span>
                </a>

                {/* TikTok */}
                <a
                  href={socials.tiktok.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-800 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900/10 text-slate-900">
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#14294d]">TikTok Legal Insights</p>
                      <p className="text-[.68rem] text-slate-500">Legal short-form lectures</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900">Watch →</span>
                </a>
              </div>
            </div>

            {/* Verification Guarantee */}
            <div className="surface p-6 border-l-4 border-l-[#1766a9]">
              <h4 className="font-display text-sm font-bold text-[#14294d]">
                Payment Proof Processing
              </h4>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Uploaded payment receipts for Bank Transfer, Easypaisa, and JazzCash are authenticated against bank ledger accounts by our admissions desk. Once verified, student accounts are immediately granted full access.
              </p>
            </div>
          </div>
        </section>
      </main>
    </StudyShell>
  );
}
