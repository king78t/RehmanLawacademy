import { ArrowLeft, BookOpen, Edit3, ExternalLink, Layers3, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Part, Question, Subject } from "@/entities";
import { AuthGuard } from "@/components/study/AuthGate";
import { PartForm, SubjectForm } from "@/components/study/CatalogForm";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";

type CatalogRecord = any;

function AdminCatalogContent() {
  const [subjects, setSubjects] = useState<CatalogRecord[]>([]);
  const [parts, setParts] = useState<CatalogRecord[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<"subject" | "part" | null>(null);
  const [editingSubject, setEditingSubject] = useState<CatalogRecord | null>(null);
  const [editingPart, setEditingPart] = useState<CatalogRecord | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [subjectRows, partRows] = await Promise.all([Subject.filter({ exam_slug: "lat" }, "sort_order", 100), Part.filter({ exam_slug: "lat" }, "sort_order", 200)]);
      setSubjects((subjectRows || []) as CatalogRecord[]);
      setParts((partRows || []) as CatalogRecord[]);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load catalog:", error);
      setStatus("error");
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const sortedSubjects = useMemo(() => [...subjects].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)), [subjects]);
  const sortedParts = useMemo(() => [...parts].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)), [parts]);
  const closeForm = () => { setForm(null); setEditingSubject(null); setEditingPart(null); };
  const showError = (error: unknown, fallback: string) => { const text = error instanceof Error ? error.message : fallback; setMessage(text || fallback); };

  const saveSubject = async (record: any) => {
    try {
      const duplicate = subjects.some((subject) => subject.slug === record.slug && subject.id !== editingSubject?.id);
      if (duplicate) throw new Error("That subject slug is already in use.");
      if (editingSubject?.id && editingSubject.slug !== record.slug && parts.some((part) => part.subject_slug === editingSubject.slug)) throw new Error("This subject already has parts. Keep its slug stable so question relationships remain intact.");
      if (editingSubject?.id) await Subject.update(editingSubject.id, record); else await Subject.create(record);
      setMessage(editingSubject ? "Subject changes saved." : "Subject added to the LAT catalog."); closeForm(); await load();
    } catch (error) { console.error("Failed to save subject:", error); showError(error, "The subject could not be saved. Try again."); throw error; }
  };

  const savePart = async (record: any) => {
    try {
      const duplicate = parts.some((part) => part.subject_slug === record.subject_slug && part.slug === record.slug && part.id !== editingPart?.id);
      if (duplicate) throw new Error("That part slug is already in use for this subject.");
      if (editingPart?.id && (editingPart.slug !== record.slug || editingPart.subject_slug !== record.subject_slug)) {
        const linked = await Question.filter({ exam_slug: "lat", subject_slug: editingPart.subject_slug, part_slug: editingPart.slug }, "sort_order", 1);
        if (linked?.length) throw new Error("This part already has questions. Keep its subject and slug stable, or move its questions first.");
      }
      if (editingPart?.id) await Part.update(editingPart.id, record); else await Part.create(record);
      setMessage(editingPart ? "Part changes saved." : "Part added to the LAT catalog."); closeForm(); await load();
    } catch (error) { console.error("Failed to save part:", error); showError(error, "The part could not be saved. Try again."); throw error; }
  };

  const removeSubject = async (subject: CatalogRecord) => {
    if (!window.confirm(`Delete ${subject.name}? Subjects with parts or questions cannot be removed.`)) return;
    try {
      if (parts.some((part) => part.subject_slug === subject.slug)) throw new Error("Remove or move this subject's parts before deleting the subject.");
      const linked = await Question.filter({ exam_slug: "lat", subject_slug: subject.slug }, "sort_order", 1);
      if (linked?.length) throw new Error("This subject still has questions. Move or delete them before removing the subject.");
      await Subject.delete(subject.id); setSubjects((current) => current.filter((item) => item.id !== subject.id)); setMessage("Subject deleted.");
    } catch (error) { console.error("Failed to delete subject:", error); showError(error, "The subject could not be deleted. Try again."); }
  };

  const removePart = async (part: CatalogRecord) => {
    if (!window.confirm(`Delete ${part.name}? This cannot be undone.`)) return;
    try {
      const linked = await Question.filter({ exam_slug: "lat", subject_slug: part.subject_slug, part_slug: part.slug }, "sort_order", 1);
      if (linked?.length) throw new Error("This part still has questions. Delete or reassign them before removing the part.");
      await Part.delete(part.id); setParts((current) => current.filter((item) => item.id !== part.id)); setMessage("Part deleted.");
    } catch (error) { console.error("Failed to delete part:", error); showError(error, "The part could not be deleted. Try again."); }
  };

  const messageIsError = message.includes("could not") || message.includes("already") || message.includes("before") || message.includes("stable") || message.includes("still");
  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><Link to="/admin/questions" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> Question management</Link><div className="mt-6 flex flex-wrap items-center gap-3"><p className="eyebrow">Administrator workspace</p><span className="inline-flex items-center gap-2 rounded-full border border-[#b8dcc7] bg-[#effaf4] px-3 py-1 text-[.68rem] font-bold text-[#2e7655]"><ShieldCheck size={14} /> Protected catalog</span></div><h1 className="page-heading mt-3 break-words text-4xl font-bold">Subjects &amp; parts</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Create the LAT study structure first, then place questions into a stable subject and part. Display order and question limits are editable without changing student routes.</p></div><div className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row"><Link to="/admin/questions" className="button-secondary w-full sm:w-fit"><ExternalLink size={15} /> Manage questions</Link><Link to="/admin/paid-courses" className="button-secondary w-full sm:w-fit"><ExternalLink size={15} /> Paid courses</Link></div></div>
    {message && <p className={`mt-6 rounded-xl border p-3 text-xs font-semibold ${messageIsError ? "border-rose-100 bg-rose-50 text-rose-700" : "border-sky-100 bg-sky-50 text-sky-800"}`} role={messageIsError ? "alert" : "status"}>{message}</p>}
    {form === "subject" && <div className="mt-7"><SubjectForm editing={editingSubject} onSaved={saveSubject} onCancel={closeForm} /></div>}
    {form === "part" && <div className="mt-7"><PartForm editing={editingPart} subjects={subjects} onSaved={savePart} onCancel={closeForm} /></div>}
    {status === "loading" && <div className="mt-8 surface p-6"><div className="loader-line w-1/3" /><div className="loader-line mt-5 h-28 w-full" /></div>}
    {status === "error" && <div className="mt-8"><EmptyState title="Catalog could not load" description="The LAT catalog did not respond. Confirm administrator access and try again." onRetry={load} /></div>}
    {status === "ready" && <div className="mt-10 grid gap-8 lg:grid-cols-[.9fr_1.1fr]"><section><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Subject structure</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">{subjects.length} subjects</h2></div><button type="button" className="button-primary !min-h-11 !px-3" onClick={() => { setEditingSubject(null); setEditingPart(null); setForm("subject"); }}><Plus size={15} /> Add</button></div><div className="mt-5 grid gap-3">{sortedSubjects.length ? sortedSubjects.map((subject) => <article key={subject.id} className="surface p-4"><div className="flex items-start gap-3"><div className="icon-tile shrink-0"><BookOpen size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-display text-lg font-bold text-[#14294d]">{subject.name}</h3><span className={`rounded-full px-2 py-1 text-[.62rem] font-extrabold uppercase tracking-[.08em] ${subject.is_active ? "bg-[#edf8f1] text-[#2e7655]" : "bg-slate-100 text-slate-500"}`}>{subject.is_active ? "Active" : "Hidden"}</span></div><p className="mt-1 break-words text-xs text-slate-500">{subject.slug} · order {subject.sort_order} · {parts.filter((part) => part.subject_slug === subject.slug).length} parts</p><p className="mt-2 text-xs leading-5 text-slate-500">{subject.description || "No description yet."}</p></div></div><div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3"><button type="button" className="button-quiet !min-h-11 !min-w-11 !p-2" onClick={() => { setEditingSubject(subject); setEditingPart(null); setForm("subject"); }} aria-label={`Edit ${subject.name}`}><Edit3 size={15} /></button><button type="button" className="button-quiet !min-h-11 !min-w-11 !p-2 !text-rose-500" onClick={() => void removeSubject(subject)} aria-label={`Delete ${subject.name}`}><Trash2 size={15} /></button></div></article>) : <EmptyState title="No LAT subjects yet" description="Add the first subject before creating its study parts." />}</div></section><section><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">Part structure</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">{parts.length} parts</h2></div><button type="button" disabled={!subjects.length} className="button-primary !min-h-11 !px-3" onClick={() => { setEditingSubject(null); setEditingPart(null); setForm("part"); }}><Plus size={15} /> Add</button></div><div className="mt-5 grid gap-3">{sortedParts.length ? sortedParts.map((part) => <article key={part.id} className="surface p-4"><div className="flex items-start gap-3"><div className="icon-tile shrink-0 bg-[#fffaf0] text-[#9c7b2d]"><Layers3 size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words font-display text-lg font-bold text-[#14294d]">{part.name}</h3><span className={`rounded-full px-2 py-1 text-[.62rem] font-extrabold uppercase tracking-[.08em] ${part.is_active ? "bg-[#edf8f1] text-[#2e7655]" : "bg-slate-100 text-slate-500"}`}>{part.is_active ? "Active" : "Hidden"}</span></div><p className="mt-1 break-words text-xs text-slate-500">{subjects.find((subject) => subject.slug === part.subject_slug)?.name || part.subject_slug} · {part.slug}</p><p className="mt-2 text-xs text-slate-500">{part.question_limit || 0} question limit · order {part.sort_order}</p></div></div><div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-3"><button type="button" className="button-quiet !min-h-11 !min-w-11 !p-2" onClick={() => { setEditingPart(part); setEditingSubject(null); setForm("part"); }} aria-label={`Edit ${part.name}`}><Edit3 size={15} /></button><button type="button" className="button-quiet !min-h-11 !min-w-11 !p-2 !text-rose-500" onClick={() => void removePart(part)} aria-label={`Delete ${part.name}`}><Trash2 size={15} /></button></div></article>) : <EmptyState title="No LAT parts yet" description="Add a subject first, then create its first focused part." />}</div></section></div>}
  </main></StudyShell>;
}

export default function AdminCatalog() { return <AuthGuard admin><AdminCatalogContent /></AuthGuard>; }
