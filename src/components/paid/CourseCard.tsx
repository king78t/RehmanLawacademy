import { ArrowRight, BookOpen, Clock3, GraduationCap, MessageCircle, PlayCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { PaidCourse } from "@/lib/paid-course-types";
import { formatPkr } from "@/lib/paid-course-types";
import { getCourseWhatsAppUrl } from "@/lib/brand-config";

function optimizedImageUrl(url: string) {
  if (!url.includes("/storage/v1/object/public/")) return url;
  if (url.includes("/storage/v1/render/image/public/")) return url.includes("?") ? url : `${url}?width=720&resize=contain&quality=75`;
  return `${url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/")}${url.includes("?") ? "&" : "?"}width=720&resize=contain&quality=75`;
}

export function CourseCard({ course, index = 0 }: { course: PaidCourse; index?: number }) {
  const imageUrl = course.thumbnail_url ? optimizedImageUrl(course.thumbnail_url) : "";
  const waEnrollUrl = getCourseWhatsAppUrl(course.title);

  return <motion.article initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .16 }} transition={{ duration: .4, delay: index * .06 }} className="surface surface-hover overflow-hidden">
    <Link to={`/paid-courses/${course.slug}`} className="block" aria-label={`View ${course.title}`}>
      <div className="relative aspect-[16/8.5] overflow-hidden bg-[#0f2349]">
        {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" width="720" height="382" /> : <div className="hero-grid flex h-full flex-col justify-between p-5 text-white"><div className="flex items-center justify-between"><span className="rounded-full border border-white/20 px-2.5 py-1 text-[.58rem] font-extrabold uppercase tracking-[.14em] text-[#ddc275]">Paid course</span><Sparkles size={18} className="text-[#ddc275]" /></div><div><p className="max-w-[16rem] font-display text-2xl font-bold leading-tight">{course.title}</p><p className="mt-2 text-xs text-blue-100/60">A guided RehmanLawAcademy learning path</p></div></div>}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/[.92] px-2.5 py-1 text-[.6rem] font-extrabold uppercase tracking-[.08em] text-[#17315e]"><span className="h-1.5 w-1.5 rounded-full bg-[#2e8a65]" /> {course.is_published ? "Published" : "Draft"}</span>
      </div>
    </Link>
    <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="break-words font-display text-xl font-bold text-[#14294d]">{course.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{course.short_description || "A structured course with guided lessons and practice."}</p></div><div className="hidden shrink-0 rounded-xl bg-[#fffaf0] p-2.5 text-[#b28d37] sm:block"><GraduationCap size={20} /></div></div><div className="mt-5 grid grid-cols-2 gap-2 border-y border-slate-100 py-4 text-xs font-semibold text-slate-500 sm:grid-cols-3"><span className="flex items-center gap-2"><Clock3 size={14} className="text-[#1766a9]" /> {course.duration_label || "Set by admin"}</span><span className="flex items-center gap-2"><BookOpen size={14} className="text-[#1766a9]" /> {Number(course.lecture_count || 0)} lectures</span><span className="flex items-center gap-2"><PlayCircle size={14} className="text-[#1766a9]" /> {Number(course.test_count || 0)} tests</span></div>
    
    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[.63rem] font-extrabold uppercase tracking-[.13em] text-slate-400">Course price</p>
        <p className="mt-1 break-words text-lg font-bold text-[#14294d]">{formatPkr(course)}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={waEnrollUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="button-secondary flex items-center justify-center gap-1.5 text-xs font-bold text-[#25D366] hover:bg-emerald-50 hover:border-emerald-300"
          title="Contact on WhatsApp regarding enrollment"
        >
          <MessageCircle size={14} /> Contact on WhatsApp
        </a>
        <Link to={`/paid-courses/${course.slug}/purchase`} className="button-primary w-full sm:w-auto">
          Buy Course <ArrowRight size={16} />
        </Link>
      </div>
    </div>
    <p className="mt-4 text-[.68rem] font-semibold text-slate-400">Instructor: {course.instructor || "Adv. AbdulRehman Yaseen"}</p></div>
  </motion.article>;
}
