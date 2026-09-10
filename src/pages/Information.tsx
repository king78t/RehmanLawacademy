import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  HelpCircle,
  MessageCircle,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StudyShell } from "@/components/study/StudyShell";
import { getBrandConfig, getGeneralWhatsAppUrl } from "@/lib/brand-config";

export default function Information() {
  const brand = getBrandConfig();

  const faqs = [
    {
      q: "What is LAT (Law Admission Test)?",
      a: "LAT is a mandatory entrance assessment conducted by the Higher Education Commission (HEC) of Pakistan for candidates seeking admission to 5-Year LLB degree programs in all public and recognized private universities.",
    },
    {
      q: "What is Law GAT?",
      a: "Law GAT (Graduate Assessment Test) is conducted by HEC under the rules of the Pakistan Bar Council. Passing Law GAT (minimum 50 marks) is mandatory to obtain license as an Advocate from your respective Provincial Bar Council.",
    },
    {
      q: "How does RehmanLawAcademy help students?",
      a: "Founded by Adv. AbdulRehman Yaseen (High Court Advocate), the academy provides topic-wise practice MCQs, timed mock examinations, comprehensive paid video courses, and direct WhatsApp mentoring.",
    },
    {
      q: "How are course payments verified?",
      a: "Payments are made via Bank Transfer (1Link/Raast), Easypaisa, or JazzCash. Students upload their payment receipt screenshot and transaction reference, which is manually verified by the academy administration within 2–6 hours.",
    },
  ];

  return (
    <StudyShell>
      <main className="page-wrap py-10 sm:py-16">
        <div className="max-w-3xl">
          <span className="eyebrow">HEC Updates &amp; Guidance</span>
          <h1 className="page-heading mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Examination Information &amp; FAQ
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Essential guidelines, test patterns, and official notifications for Pakistani law examinations.
          </p>
        </div>

        {/* LAT Overview Card */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-[#1766a9]">
            <FileText size={20} />
            <h2 className="font-display text-xl font-bold text-[#14294d]">
              LAT Test Pattern (100 Marks)
            </h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="font-bold text-slate-800">Essay Writing (15 Marks)</p>
              <p className="text-slate-500 mt-1">Either in English or Urdu (approx. 200 words).</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="font-bold text-slate-800">Personal Statement (10 Marks)</p>
              <p className="text-slate-500 mt-1">Either in English or Urdu (approx. 200 words).</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="font-bold text-slate-800">MCQ Section (75 Marks)</p>
              <p className="text-slate-500 mt-1">
                English (20), General Knowledge (20), Islamic Studies (10), Pak Studies (10), Urdu (10), Math (5).
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
              <p className="font-bold text-slate-800">Passing Criteria</p>
              <p className="text-slate-500 mt-1">50% marks (50 out of 100). Valid for 2 years.</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-14">
          <div>
            <p className="eyebrow">Answers to Common Inquiries</p>
            <h2 className="font-display text-2xl font-bold text-[#14294d]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="surface p-6">
                <h3 className="flex items-start gap-2.5 font-display text-base font-bold text-[#14294d]">
                  <HelpCircle size={18} className="mt-0.5 shrink-0 text-[#1766a9]" />
                  <span>{f.q}</span>
                </h3>
                <p className="mt-2.5 text-xs leading-6 text-slate-600 sm:text-sm pl-7">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Support CTA */}
        <section className="mt-16 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-lg font-bold text-emerald-950">
              Still have questions about your eligibility or dates?
            </h3>
            <p className="text-xs text-emerald-800 mt-1">
              Connect with our admissions desk on WhatsApp ({brand.whatsapp.display}).
            </p>
          </div>
          <a
            href={getGeneralWhatsAppUrl("Assalam-o-Alaikum, I need information regarding test schedules.")}
            target="_blank"
            rel="noopener noreferrer"
            className="button-primary shrink-0 !bg-[#25D366] text-xs font-bold text-white hover:!bg-[#20bd5a]"
          >
            <MessageCircle size={15} /> Chat on WhatsApp
          </a>
        </section>
      </main>
    </StudyShell>
  );
}
