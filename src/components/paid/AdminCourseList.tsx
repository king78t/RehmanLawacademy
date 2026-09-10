import { CheckCircle2, Edit3, Eye, EyeOff, Layers3, Plus, Trash2 } from "lucide-react";
import type { PaidCourse } from "@/lib/paid-course-types";
import { formatPkr } from "@/lib/paid-course-types";

interface AdminCourseListProps {
  courses: PaidCourse[];
  selectedCourseId: string;
  onSelect: (course: PaidCourse) => void;
  onAdd: () => void;
  onEdit: (course: PaidCourse) => void;
  onDelete: (course: PaidCourse) => void;
  onTogglePublish: (course: PaidCourse) => void;
}

export function AdminCourseList({ courses, selectedCourseId, onSelect, onAdd, onEdit, onDelete, onTogglePublish }: AdminCourseListProps) {
  const sorted = [...courses].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Course catalog</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">{courses.length} course{courses.length === 1 ? "" : "s"}</h2>
        </div>
        <button type="button" className="button-primary !min-h-11 !px-3" onClick={onAdd}><Plus size={15} /> Add course</button>
      </div>
      {!sorted.length ? (
        <div className="empty-panel mt-5">
          <Layers3 size={26} className="mx-auto text-slate-400" />
          <p className="mt-3 font-display text-lg font-bold text-[#14294d]">No paid courses yet</p>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">Create the first course, then add modules and protected lessons to its curriculum.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {sorted.map((course) => {
            const selected = course.id === selectedCourseId;
            return (
              <article key={course.id} className={`surface p-4 transition ${selected ? "border-[#8eb1d1] ring-2 ring-[#eaf4fb]" : ""}`}>
                <button type="button" className="block w-full text-left" onClick={() => onSelect(course)} aria-pressed={selected}>
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-[#1766a9] text-white" : "bg-[#eaf4fb] text-[#1766a9]"}`}><Layers3 size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="break-words font-display text-lg font-bold text-[#14294d]">{course.title}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[.6rem] font-extrabold uppercase tracking-[.08em] ${course.is_published ? "bg-[#effaf4] text-[#2e7655]" : "bg-slate-100 text-slate-500"}`}>
                          {course.is_published && <CheckCircle2 size={12} />}{course.is_published ? "Published" : "Draft"}
                        </span>
                      </span>
                      <span className="mt-1 block break-words text-xs text-slate-500">{course.slug} · {formatPkr(course)} · order {course.sort_order || 1}</span>
                    </span>
                  </div>
                </button>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[.68rem] font-semibold text-slate-400">{course.lecture_count || 0} lectures · {course.test_count || 0} tests</span>
                  <div className="flex items-center gap-1">
                    <button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2" onClick={() => onTogglePublish(course)} aria-label={course.is_published ? `Unpublish ${course.title}` : `Publish ${course.title}`} title={course.is_published ? "Unpublish course" : "Publish course"}>{course.is_published ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                    <button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2" onClick={() => onEdit(course)} aria-label={`Edit ${course.title}`} title="Edit course"><Edit3 size={15} /></button>
                    <button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2 !text-rose-500" onClick={() => onDelete(course)} aria-label={`Delete ${course.title}`} title="Delete course"><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
