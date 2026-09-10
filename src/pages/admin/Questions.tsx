import { CheckCircle2, Edit3, Eye, EyeOff, ExternalLink, Plus, Search, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Part, Question, Subject } from "@/entities";
import { AuthGuard } from "@/components/study/AuthGate";
import { EmptyState } from "@/components/study/EmptyState";
import { QuestionForm } from "@/components/study/QuestionForm";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";

function QuestionActions({ question, busy, onPublish, onEdit, onDelete }: { question: any; busy: boolean; onPublish: () => void; onEdit: () => void; onDelete: () => void }) {
  return <div className="flex flex-wrap items-center gap-1"><button type="button" disabled={busy} className="button-quiet !min-h-11 !min-w-11 !p-2" onClick={onPublish} title={question.is_published ? "Unpublish question" : "Publish question"} aria-label={question.is_published ? "Unpublish question" : "Publish question"}>{question.is_published ? <EyeOff size={15} /> : <Eye size={15} />}</button><button type="button" disabled={busy} className="button-quiet !min-h-11 !min-w-11 !p-2" onClick={onEdit} title="Edit question" aria-label="Edit question"><Edit3 size={15} /></button><button type="button" disabled={busy} className="button-quiet !min-h-11 !min-w-11 !p-2 !text-rose-500" onClick={onDelete} title="Delete question" aria-label="Delete question"><Trash2 size={15} /></button></div>;
}

function StatusBadge({ published }: { published: boolean }) {
  return published ? <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2e7655]"><CheckCircle2 size={14} /> Published</span> : <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400"><XCircle size={14} /> Draft</span>;
}

function AdminQuestionsContent() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [partFilter, setPartFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] = useState("all");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const [questionRows, subjectRows, partRows] = await Promise.all([
        Question.filter({ exam_slug: "lat" }, "sort_order", 500),
        Subject.filter({ exam_slug: "lat" }, "sort_order", 100),
        Part.filter({ exam_slug: "lat" }, "sort_order", 200),
      ]);
      setQuestions((questionRows || []) as any[]);
      setSubjects((subjectRows || []) as any[]);
      setParts((partRows || []) as any[]);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load admin questions:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const subjectName = (slug: string) => subjects.find((subject) => subject.slug === slug)?.name || slug || "Unassigned";
  const partName = (subjectSlug: string, slug: string) => parts.find((part) => part.subject_slug === subjectSlug && part.slug === slug)?.name || slug || "Unassigned";
  const filteredParts = useMemo(() => subjectFilter === "all" ? parts : parts.filter((part) => part.subject_slug === subjectFilter), [parts, subjectFilter]);
  const visible = useMemo(() => questions
    .filter((question) => subjectFilter === "all" || question.subject_slug === subjectFilter)
    .filter((question) => partFilter === "all" || question.part_slug === partFilter)
    .filter((question) => publicationFilter === "all" || (publicationFilter === "published" ? question.is_published : !question.is_published))
    .filter((question) => String(question.question_text || "").toLowerCase().includes(search.toLowerCase())), [questions, subjectFilter, partFilter, publicationFilter, search]);

  const save = async (record: any) => {
    try {
      if (editing?.id) await Question.update(editing.id, record);
      else await Question.create(record);
      setMessage(editing ? "Question changes saved." : "Question added to the catalog.");
      setFormOpen(false); setEditing(null); await load();
    } catch (error) {
      console.error("Failed to save question:", error);
      setMessage("The question could not be saved. Check your administrator access and try again.");
      throw error;
    }
  };

  const remove = async (question: any) => {
    if (!window.confirm("Delete this question from the catalog? This cannot be undone.")) return;
    setBusyId(question.id); setMessage("");
    try { await Question.delete(question.id); setQuestions((current) => current.filter((item) => item.id !== question.id)); setMessage("Question deleted."); }
    catch (error) { console.error("Failed to delete question:", error); setMessage("The question could not be deleted. Try again."); }
    finally { setBusyId(null); }
  };

  const togglePublished = async (question: any) => {
    setBusyId(question.id); setMessage("");
    try { const nextPublished = !question.is_published; await Question.update(question.id, { is_published: nextPublished }); setQuestions((current) => current.map((item) => item.id === question.id ? { ...item, is_published: nextPublished } : item)); setMessage(nextPublished ? "Question published for students." : "Question unpublished from new practice sessions."); }
    catch (error) { console.error("Failed to update publication:", error); setMessage("Publication status could not be updated. Try again."); }
    finally { setBusyId(null); }
  };

  const messageIsError = message.includes("could not") || message.includes("couldn't");
  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">Administrator workspace</p><StarterNotice compact /></div><h1 className="page-heading mt-3 break-words text-4xl font-bold">Question management</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Manage the LAT catalog across its published subjects and parts. Only the verified administrator can change shared questions.</p></div><div className="flex flex-wrap items-center gap-2"><Link to="/admin/catalog" className="button-secondary"><ExternalLink size={15} /> Subjects &amp; parts</Link><Link to="/admin/paid-courses" className="button-secondary"><ExternalLink size={15} /> Paid courses</Link><div className="flex items-center gap-2 rounded-xl border border-[#b8dcc7] bg-[#effaf4] px-3 py-2 text-xs font-bold text-[#2e7655]"><ShieldCheck size={15} /> Protected route</div></div></div>
    {message && <div className={`mt-6 rounded-xl p-3 text-xs font-semibold ${messageIsError ? "border border-rose-100 bg-rose-50 text-rose-700" : "border border-sky-100 bg-sky-50 text-sky-800"}`} role={messageIsError ? "alert" : "status"} aria-live="polite">{message}</div>}
    {formOpen && <div className="mt-7"><QuestionForm editing={editing} subjects={subjects} parts={parts} onSaved={save} onCancel={() => { setFormOpen(false); setEditing(null); }} /></div>}
    <div className="mt-10 flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end"><div><p className="eyebrow">LAT catalog</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">{questions.length} questions in this workspace</h2></div><button type="button" disabled={!subjects.length || !parts.length} className="button-primary w-full sm:w-fit" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} /> Add question</button></div>
    {(!subjects.length || !parts.length) && status === "ready" && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900">Create at least one LAT subject and one part in the catalog before adding a question.</p>}
    {status === "loading" && <div className="mt-6"><div className="surface p-6"><div className="loader-line w-1/3" /><div className="loader-line mt-5 h-24 w-full" /></div></div>}
    {status === "error" && <div className="mt-6"><EmptyState title="Questions could not load" description="The administrator catalog did not respond. Confirm your access and try again." onRetry={load} /></div>}
    {status === "ready" && <><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]"><label htmlFor="question-search" className="relative sm:col-span-2 lg:col-span-1"><Search size={16} className="absolute left-3 top-3.5 text-slate-400" aria-hidden="true" /><input id="question-search" aria-label="Search question text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question text" className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-sky-400" /></label><label htmlFor="subject-filter" className="sr-only">Filter by subject</label><select id="subject-filter" aria-label="Filter questions by subject" value={subjectFilter} onChange={(event) => { setSubjectFilter(event.target.value); setPartFilter("all"); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none focus:border-sky-400"><option value="all">All subjects</option>{subjects.map((subject) => <option key={subject.slug} value={subject.slug}>{subject.name}</option>)}</select><label htmlFor="part-filter" className="sr-only">Filter by part</label><select id="part-filter" aria-label="Filter questions by part" value={partFilter} onChange={(event) => setPartFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none focus:border-sky-400"><option value="all">All parts</option>{filteredParts.map((part) => <option key={`${part.subject_slug}:${part.slug}`} value={part.slug}>{part.name}</option>)}</select><label htmlFor="publication-filter" className="sr-only">Filter questions by publication status</label><select id="publication-filter" aria-label="Filter questions by publication status" value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 outline-none focus:border-sky-400"><option value="all">All publication states</option><option value="published">Published</option><option value="draft">Unpublished</option></select></div>{visible.length === 0 ? <div className="mt-6"><EmptyState title="No questions match" description="Adjust the filters or add a new question to the catalog." /></div> : <><div className="mt-6 grid gap-3 md:hidden">{visible.map((question) => <article key={question.id} className="surface p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-bold leading-6 text-[#14294d]">{question.question_text}</p><p className="mt-2 break-words text-[.68rem] text-slate-400">{subjectName(question.subject_slug)} · {partName(question.subject_slug, question.part_slug)} · {question.difficulty} · order {question.sort_order}</p></div><StatusBadge published={Boolean(question.is_published)} /></div><div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4"><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Answer {question.correct_answer}</span>{question.starter_review && <span className="break-words text-[.68rem] font-bold text-[#9c7b2d]">{question.review_label || "Starter Content — For Academic Review"}</span>}</div><div className="mt-3 flex justify-end"><QuestionActions question={question} busy={busyId === question.id} onPublish={() => void togglePublished(question)} onEdit={() => { setEditing(question); setFormOpen(true); }} onDelete={() => void remove(question)} /></div></article>)}</div><div className="table-wrap mt-6 hidden md:block"><table><thead><tr><th>Question</th><th>Location</th><th>Answer</th><th>Status</th><th>Review</th><th>Actions</th></tr></thead><tbody>{visible.map((question) => <tr key={question.id}><td><p className="max-w-[330px] font-semibold text-[#14294d]">{question.question_text}</p><p className="mt-1 text-[.68rem] text-slate-400">{question.difficulty} · order {question.sort_order}</p></td><td><p className="font-semibold text-slate-600">{subjectName(question.subject_slug)}</p><p className="mt-1 text-[.68rem] text-slate-400">{partName(question.subject_slug, question.part_slug)}</p></td><td><span className="rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-600">{question.correct_answer}</span></td><td><StatusBadge published={Boolean(question.is_published)} /></td><td>{question.starter_review ? <span className="text-[.68rem] font-bold text-[#9c7b2d]">{question.review_label || "Starter Content — For Academic Review"}</span> : <span className="text-[.68rem] text-slate-400">Practice bank</span>}</td><td><QuestionActions question={question} busy={busyId === question.id} onPublish={() => void togglePublished(question)} onEdit={() => { setEditing(question); setFormOpen(true); }} onDelete={() => void remove(question)} /></td></tr>)}</tbody></table></div></>}</>}
  </main></StudyShell>;
}

export default function AdminQuestions() { return <AuthGuard admin><AdminQuestionsContent /></AuthGuard>; }
