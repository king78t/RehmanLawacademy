import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  MessageCircle,
  Scale,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FounderCard } from "@/components/study/FounderCard";
import { StudyShell } from "@/components/study/StudyShell";
import { getBrandConfig, getGeneralWhatsAppUrl } from "@/lib/brand-config";

export default function About() {
  const brand = getBrandConfig();
  const { socials, whatsapp, email } = brand;

  const coreFocusAreas = [
    {
      title: "LAT (Law Admission Test)",
      description:
        "Comprehensive preparation for HEC's Law Admission Test covering Pakistan Studies, Islamic Studies, General Knowledge, Urdu, English, and analytical reasoning.",
      icon: Target,
      badge: "Pre-Law Entrance",
    },
    {
      title: "Law GAT (Graduate Assessment Test)",
      description:
        "Specialized syllabus-aligned preparation for law graduates seeking Pakistan Bar Council license certification through HEC Law GAT.",
      icon: Scale,
      badge: "Bar License",
    },
    {
      title: "LLB Examinations",
      description:
        "Exam-focused academic guidance, past-paper analysis, and structured practice tailored for 5-Year LLB university exams across Pakistan.",
      icon: GraduationCap,
      badge: "University Degree",
    },
    {
      title: "Law Subjects & Statutes",
      description:
        "Deep conceptual mastery of major statutes: Constitution of Pakistan, Pakistan Penal Code (PPC), CrPC, CPC, Law of Evidence (Qanun-e-Shahadat), and Jurisprudence.",
      icon: BookOpen,
      badge: "Core Law Curriculum",
    },
    {
      title: "Legal Education & Advocacy",
      description:
        "Nurturing analytical legal thinking, case research methodology, and practical drafting acumen to build high-standard Pakistani legal professionals.",
      icon: Sparkles,
      badge: "Professional Excellence",
    },
  ];

  return (
    <StudyShell>
      <main className="page-wrap py-10 sm:py-16">
        {/* Top Header Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[#0f2349] p-8 text-white shadow-xl sm:p-12">
          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#ddc275]/20 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#ddc275]">
                About {brand.brandName}
              </span>
              <span className="text-xs font-semibold text-blue-200/80">
                Official Law Mentorship & Test Preparation
              </span>
            </div>

            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Dedicated to the Future of <br className="hidden sm:inline" />
              <span className="text-[#ddc275]">Pakistani Legal Education</span>
            </h1>

            <p className="mt-5 text-base leading-7 text-blue-100/80 sm:text-lg">
              {brand.brandName} is founded on a singular mission: providing Pakistani law aspirants
              with transparent, high-yield exam preparation, authentic MCQ banks, and mentorship
              rooted in active High Court legal practice.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={getGeneralWhatsAppUrl(
                  "Assalam-o-Alaikum, I would like to learn more about RehmanLawAcademy courses and enrollment."
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#20bd5a]"
              >
                <MessageCircle size={16} /> Contact on WhatsApp
              </a>

              <Link
                to="/paid-courses"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white transition-colors hover:bg-white/20"
              >
                Explore Paid Courses
              </Link>
            </div>
          </div>

          {/* Decorative background watermark */}
          <div className="pointer-events-none absolute -bottom-10 -right-10 opacity-10">
            <Scale size={320} className="text-white" />
          </div>
        </section>

        {/* Founder Profile Section */}
        <section className="mt-14" id="founder-section">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Academic Leadership</p>
              <h2 className="font-display text-2xl font-bold text-[#14294d] sm:text-3xl">
                Meet the Founder
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Personalized guidance direct from the bar
            </p>
          </div>

          <FounderCard />
        </section>

        {/* What We Prepare Students For */}
        <section className="mt-20">
          <div className="max-w-2xl">
            <p className="eyebrow">Comprehensive Law Training</p>
            <h2 className="font-display text-2xl font-bold text-[#14294d] sm:text-3xl">
              Who RehmanLawAcademy Serves
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Our curriculum and question banks are engineered specifically for Pakistani law students
              at every milestone of their legal journey:
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coreFocusAreas.map((area, idx) => {
              const Icon = area.icon;
              return (
                <motion.div
                  key={area.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="surface flex flex-col justify-between p-6 transition-all hover:border-[#1766a9]/30"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-[#1766a9]">
                        <Icon size={20} />
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.62rem] font-bold text-slate-600">
                        {area.badge}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold text-[#14294d]">
                      {area.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                      {area.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-[#1766a9]">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Structured Modules & Practice</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Social Presence & Official Community */}
        <section className="mt-20 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
          <div className="max-w-2xl">
            <p className="eyebrow">Verified Social Channels</p>
            <h2 className="font-display text-2xl font-bold text-[#14294d] sm:text-3xl">
              Connect with Our Growing Community
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Follow our verified platforms for daily legal updates, LAT/GAT exam notifications,
              and live instructional sessions.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {/* Facebook Card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{socials.facebook.platform}</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.65rem] font-bold text-blue-800">
                  {socials.facebook.audience}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Official academy announcements, legal case studies, and student reviews.
              </p>
              <a
                href={socials.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary mt-4 inline-flex w-full items-center justify-center gap-2 !bg-[#1877F2] text-xs font-bold text-white hover:!bg-blue-700"
              >
                {socials.facebook.buttonText}
              </a>
            </div>

            {/* Instagram Card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{socials.instagram.platform}</span>
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[0.65rem] font-bold text-pink-800">
                  {socials.instagram.audience}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Daily law MCQs, visual mnemonics, and test-taking tips by Adv. AbdulRehman Yaseen.
              </p>
              <a
                href={socials.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary mt-4 inline-flex w-full items-center justify-center gap-2 !bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-xs font-bold text-white hover:opacity-95"
              >
                {socials.instagram.buttonText}
              </a>
            </div>

            {/* TikTok Card */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{socials.tiktok.platform}</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[0.65rem] font-bold text-slate-700">
                  Short Form
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Bite-sized legal explanations, courtroom advice, and high-frequency exam questions.
              </p>
              <a
                href={socials.tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                className="button-primary mt-4 inline-flex w-full items-center justify-center gap-2 !bg-black text-xs font-bold text-white hover:!bg-slate-800"
              >
                {socials.tiktok.buttonText}
              </a>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mt-16 rounded-2xl bg-gradient-to-br from-[#14294d] to-[#1c3e74] p-8 text-white text-center sm:p-12">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            Ready to Begin Your Legal Journey?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100/80">
            Start with our free starter question bank or enroll in our premium online courses with
            one-on-one WhatsApp mentorship.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/lat"
              className="button-primary !bg-[#ddc275] !text-[#14294d] hover:!bg-[#e5ce88] font-bold"
            >
              Start LAT Practice Free
            </Link>
            <Link
              to="/contact"
              className="button-secondary !border-white/30 !bg-white/10 !text-white hover:!bg-white/20 font-bold"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>
    </StudyShell>
  );
}
