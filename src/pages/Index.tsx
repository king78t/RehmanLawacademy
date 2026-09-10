import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Bookmark, BookOpen, CheckCircle2, Clock3, FileText, HardDrive, RotateCcw, Sparkles, Target, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { appIconUrl } from "@/components/study/BrandLogo";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";
import { FounderCard } from "@/components/study/FounderCard";
import { getBrandConfig } from "@/lib/brand-config";

const quickAccess = [
  { title: "LAT preparation", description: "Build a steady routine with focused subject practice.", icon: BookOpen, action: "Open preparation", to: "/lat", active: true },
  { title: "Law GAT preparation", description: "Syllabus breakdown, weightage, and high-frequency MCQs.", icon: Target, action: "Explore Law GAT", to: "/law-gat", active: true },
  { title: "Online quizzes", description: "Test your recall with timed practice built from your bank.", icon: Clock3, action: "Try Part 1 quiz", to: "/lat/pakistan-studies", active: true },
  { title: "Exam Information", description: "Syllabus guides, test patterns, and official FAQs.", icon: FileText, action: "Read guidelines", to: "/information", active: true },
];

const benefits = [
  { title: "Focused question sets", text: "Start with a clear, bounded set so each session has a finish line.", icon: Target },
  { title: "Timed practice", text: "Use a calm practice timer without claiming an official exam pattern.", icon: Clock3 },
  { title: "Detailed results", text: "See correct, wrong and unattempted answers in one honest view.", icon: BarChart3 },
  { title: "Progress on this device", text: "Your answers, bookmarks and history stay in this browser for the next session.", icon: HardDrive },
  { title: "Saved questions", text: "Keep useful questions close for a focused revision session.", icon: Bookmark },
  { title: "Wrong-question practice", text: "Return to questions you missed and make the explanation count.", icon: RotateCcw },
];

const Index = () => <StudyShell><main>
  <section className="hero-panel hero-grid text-white">
    <div className="page-wrap grid min-h-[620px] items-center gap-12 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }} className="relative z-10">
        <div className="flex flex-wrap items-center gap-3"><span className="eyebrow !text-[#ddc275]">A focused start for Pakistani law students</span><span className="rounded-full border border-white/20 px-3 py-1 text-[.63rem] font-bold text-white/[.65]">Phase 1 is live</span></div>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-.035em] sm:text-6xl">Prepare Smart.<br /><span className="text-[#ddc275]">Practice More.</span><br />Succeed in LAT &amp; Law GAT.</h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-blue-100/75 sm:text-lg">RehmanLawAcademy gives you a calm, accountable place to practise law MCQs, take timed quizzes and see what to work on next.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link to="/lat" className="button-primary !bg-[#ddc275] !text-[#14294d] hover:!bg-[#e5ce88]"><Sparkles size={16} /> Start LAT preparation</Link><Link to="/lat/pakistan-studies" className="button-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/[.15]">Explore starter MCQs <ArrowRight size={16} /></Link></div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-blue-100/60"><span className="flex items-center gap-2"><HardDrive size={14} className="text-[#ddc275]" /> Progress saved on this browser</span><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#ddc275]" /> Academic review labels included</span></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7, delay: .12 }} className="relative mx-auto w-full max-w-[470px] lg:justify-self-end">
        <div className="absolute -left-5 top-10 h-24 w-24 rounded-full border border-[#ddc275]/[.35]" /><div className="absolute -right-8 bottom-8 h-40 w-40 rounded-full border border-white/10" />
        <div className="relative rounded-[28px] border border-white/[.15] bg-white/[.08] p-4 shadow-2xl backdrop-blur-sm sm:p-6"><div className="rounded-[21px] border border-white/10 bg-[#112951] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[.62rem] font-bold uppercase tracking-[.15em] text-white/[.45]">Your study desk</p><p className="mt-1 font-display text-xl font-bold">Pakistan Studies</p></div><img src={appIconUrl} alt="" className="h-12 w-12 rounded-xl" width="48" height="48" /></div><div className="mt-8 rounded-2xl border border-white/10 bg-white/[.06] p-4"><div className="flex items-center justify-between text-xs"><span className="font-bold text-white/[.65]">Part 1 progress</span><span className="font-bold text-[#ddc275]">Ready when you are</span></div><div className="mt-3 h-2 rounded-full bg-white/10"><div className="h-full w-[36%] rounded-full bg-[#ddc275]" /></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white/[.06] p-3"><p className="text-lg font-bold">Live</p><p className="mt-1 text-[.62rem] text-white/[.45]">published bank</p></div><div className="rounded-xl bg-white/[.06] p-3"><p className="text-lg font-bold">Timed</p><p className="mt-1 text-[.62rem] text-white/[.45]">practice session</p></div><div className="rounded-xl bg-white/[.06] p-3"><p className="text-lg font-bold">Part 1</p><p className="mt-1 text-[.62rem] text-white/[.45]">current focus</p></div></div></div><div className="mt-5 flex items-center gap-3 text-xs text-white/55"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ddc275]/15 text-[#ddc275]"><Trophy size={15} /></div><span>Small sessions become strong preparation.</span></div></div></div>
      </motion.div>
    </div>
  </section>
  <section className="page-wrap relative z-10 -mt-10"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{quickAccess.map((item, index) => { const Icon = item.icon; const content = <div className={`surface surface-hover h-full p-5 ${!item.active ? "opacity-80" : ""}`}><div className="flex items-start justify-between"><div className="icon-tile"><Icon size={19} /></div>{!item.active ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[.6rem] font-extrabold uppercase tracking-[.08em] text-slate-500">Soon</span> : <ArrowRight size={17} className="text-slate-400" />}</div><h2 className="mt-6 font-display text-lg font-bold text-[#14294d]">{item.title}</h2><p className="mt-2 min-h-[48px] text-xs leading-5 text-slate-500">{item.description}</p><p className={`mt-5 text-xs font-extrabold ${item.active ? "text-[#1766a9]" : "text-slate-400"}`}>{item.action}</p></div>; return item.to ? <Link key={item.title} to={item.to}>{content}</Link> : <div key={item.title}>{content}</div>; })}</div></section>
  <section className="page-wrap py-24"><div className="max-w-2xl"><p className="eyebrow">A better study rhythm</p><h2 className="page-heading mt-3 text-3xl font-bold sm:text-4xl">Everything you need to make practice count.</h2><p className="mt-5 text-base leading-7 text-slate-500">RehmanLawAcademy is designed around the moments that decide whether preparation sticks: choosing one clear target, answering without distraction and returning to the questions that need another look.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{benefits.map((benefit, index) => { const Icon = benefit.icon; return <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: index * .04 }} key={benefit.title} className="surface p-5"><div className="icon-tile"><Icon size={18} /></div><h3 className="mt-5 font-display text-lg font-bold text-[#14294d]">{benefit.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{benefit.text}</p></motion.div>; })}</div></section>

  {/* Founder Introduction Section */}
  <section className="page-wrap pb-20">
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">Academic Direction &amp; Mentorship</p>
        <h2 className="font-display text-2xl font-bold text-[#14294d] sm:text-3xl">
          Mentorship Under Adv. AbdulRehman Yaseen
        </h2>
      </div>
      <Link to="/about" className="inline-flex items-center gap-1 text-xs font-bold text-[#1766a9] hover:underline">
        Read full academy background <ArrowRight size={14} />
      </Link>
    </div>
    <FounderCard />
  </section>
  <section className="page-wrap pb-24"><div className="surface grid gap-7 overflow-hidden bg-[#eef5fa] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><StarterNotice /><h2 className="mt-4 font-display text-2xl font-bold text-[#14294d]">A clear starting point, with honest labels.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">The first Pakistan Studies bank is intentionally small and provisional. Every starter question carries the same academic-review notice, so you always know what you are practising while the platform grows.</p></div><Link to="/lat/pakistan-studies" className="button-primary w-full sm:w-fit">View Pakistan Studies <ArrowRight size={16} /></Link></div></section>
</main></StudyShell>;

export default Index;
