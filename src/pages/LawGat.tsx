import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  FileCheck,
  GraduationCap,
  MessageCircle,
  Scale,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FounderCard } from "@/components/study/FounderCard";
import { StudyShell } from "@/components/study/StudyShell";
import { getBrandConfig, getGeneralWhatsAppUrl } from "@/lib/brand-config";

export default function LawGat() {
  const brand = getBrandConfig();

  const gatSubjects = [
    {
      title: "Constitution of Pakistan (1973)",
      marks: "15 Marks",
      desc: "Fundamental rights, principles of policy, judicature, and writ jurisdiction under Article 199.",
    },
    {
      title: "Civil Law & CPC (1908)",
      marks: "20 Marks",
      desc: "Pleadings, plaints, written statements, execution of decrees, appeals, and revision procedures.",
    },
    {
      title: "Criminal Law & PPC / CrPC",
      marks: "20 Marks",
      desc: "Offences against human body, property offences, FIR, investigation, bail, and trial proceedings.",
    },
    {
      title: "Qanun-e-Shahadat Order (1984)",
      marks: "20 Marks",
      desc: "Law of evidence, relevance of facts, admissions, confessions, documentary evidence, and examination of witnesses.",
    },
    {
      title: "Jurisprudence (English & Islamic)",
      marks: "10 Marks",
      desc: "Salmond, Austin, sources of law, and principles of Islamic jurisprudence.",
    },
    {
      title: "Professional Ethics & Legal Rules",
      marks: "15 Marks",
      desc: "Canons of professional conduct, advocate-client relationship, and Pakistan Legal Practitioners Act.",
    },
  ];

  return (
    <StudyShell>
      <main className="page-wrap py-10 sm:py-16">
        <div className="max-w-3xl">
          <span className="eyebrow">HEC Law GAT Examination</span>
          <h1 className="page-heading mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Law GAT Preparation
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Complete syllabus breakdown and targeted MCQ strategy for the HEC Law Graduate Assessment Test (Law GAT), mandatory for obtaining your Pakistan Bar Council practice license.
          </p>
        </div>

        {/* Highlight Card */}
        <section className="mt-10 rounded-2xl border border-[#cddbea] bg-[#0f2349] p-6 text-white sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#ddc275]">
                <Scale size={20} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Bar Licensing Portal
                </span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold">
                Join the Dedicated Law GAT Mentorship Batch
              </h2>
              <p className="mt-2 max-w-xl text-xs leading-5 text-blue-100/80 sm:text-sm">
                Under the direct supervision of {brand.founder.name} ({brand.founder.designation}), study bare acts, key case laws, and high-frequency past paper MCQs.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={getGeneralWhatsAppUrl(
                  "Assalam-o-Alaikum Adv. AbdulRehman Yaseen, I want to inquire about the Law GAT preparation session and study material."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary inline-flex items-center justify-center gap-2 !bg-[#25D366] text-xs font-bold text-white hover:!bg-[#20bd5a]"
              >
                <MessageCircle size={15} /> Inquire on WhatsApp
              </a>
              <Link
                to="/paid-courses"
                className="button-secondary inline-flex items-center justify-center gap-2 !border-white/20 !bg-white/10 text-xs font-bold text-white hover:!bg-white/20"
              >
                View Online Courses
              </Link>
            </div>
          </div>
        </section>

        {/* Syllabus Weightage Grid */}
        <section className="mt-14">
          <div>
            <p className="eyebrow">HEC Official Weightage</p>
            <h2 className="font-display text-2xl font-bold text-[#14294d]">
              100 Marks Law GAT Distribution
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              Passing threshold: 50%. Focus heavily on QSO, CPC, and PPC/CrPC to secure high marks.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gatSubjects.map((sub, i) => (
              <motion.div
                key={sub.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="surface p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#1766a9]">
                    {sub.marks}
                  </span>
                  <FileCheck size={16} className="text-emerald-600" />
                </div>
                <h3 className="mt-3 font-display text-base font-bold text-[#14294d]">
                  {sub.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {sub.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Founder Guidance Card */}
        <section className="mt-16">
          <div className="mb-4">
            <p className="eyebrow">Direct Guidance</p>
            <h2 className="font-display text-xl font-bold text-[#14294d]">
              Course Mentor &amp; Advocate
            </h2>
          </div>
          <FounderCard />
        </section>
      </main>
    </StudyShell>
  );
}
