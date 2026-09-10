import { Save, ShieldCheck, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { starterReviewLabel, type OptionKey, type StudyQuestion } from "@/lib/study-types";

const answerKeys: OptionKey[] = ["A", "B", "C", "D"];
const difficulties = ["introductory", "intermediate", "advanced"] as const;
const examOptions = [{ slug: "lat", name: "LAT · Law Admission Test" }];
const emptyQuestion = {
  exam_slug: "lat",
  subject_slug: "",
  part_slug: "",
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "A" as OptionKey,
  explanation: "",
  difficulty: "introductory",
  starter_review: true,
  review_label: starterReviewLabel,
  is_published: true,
  sort_order: 1,
};

type CatalogOption = { slug: string; name: string; subject_slug?: string };

type QuestionFormProps = {
  editing?: StudyQuestion | null;
  subjects: CatalogOption[];
  parts: CatalogOption[];
  onSaved: (record: any) => void | Promise<void>;
  onCancel: () => void;
};

export function QuestionForm({ editing, subjects, parts, onSaved, onCancel }: QuestionFormProps) {
  const [form, setForm] = useState<any>(emptyQuestion);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const firstSubject = subjects[0]?.slug || "";
    const firstPart = parts.find((part) => part.subject_slug === (editing?.subject_slug || firstSubject))?.slug || "";
    setForm(editing ? {
      ...emptyQuestion,
      ...editing,
      exam_slug: editing.exam_slug || "lat",
      starter_review: editing.starter_review !== false,
      review_label: editing.review_label || starterReviewLabel,
    } : { ...emptyQuestion, subject_slug: firstSubject, part_slug: firstPart });
    setError("");
  }, [editing, subjects, parts]);

  const update = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  const updateSubject = (subjectSlug: string) => setForm((current: any) => {
    const subjectParts = parts.filter((part) => part.subject_slug === subjectSlug);
    const currentPartStillFits = subjectParts.some((part) => part.slug === current.part_slug);
    return { ...current, subject_slug: subjectSlug, part_slug: currentPartStillFits ? current.part_slug : subjectParts[0]?.slug || "" };
  });
  const availableParts = parts.filter((part) => part.subject_slug === form.subject_slug);
  const selectedSubject = subjects.find((subject) => subject.slug === form.subject_slug)?.name || "Choose a subject";
  const selectedPart = availableParts.find((part) => part.slug === form.part_slug)?.name || "Choose a part";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const requiredFields = ["question_text", "option_a", "option_b", "option_c", "option_d", "explanation", "subject_slug", "part_slug"];
    if (requiredFields.some((key) => !String(form[key] || "").trim())) {
      setError("Choose the catalog location, then add the question, all four choices and an explanation.");
      return;
    }
    if (!availableParts.some((part) => part.slug === form.part_slug)) {
      setError("Choose a part belonging to the selected subject.");
      return;
    }
    if (!answerKeys.includes(form.correct_answer)) {
      setError("Choose a valid correct answer from A, B, C or D.");
      return;
    }
    const sortOrder = Number(form.sort_order);
    if (!Number.isInteger(sortOrder) || sortOrder < 1) {
      setError("Display order must be a whole number greater than zero.");
      return;
    }
    if (!difficulties.includes(form.difficulty)) {
      setError("Choose a valid difficulty before saving.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSaved({
        exam_slug: form.exam_slug || "lat",
        subject_slug: form.subject_slug,
        part_slug: form.part_slug,
        question_text: form.question_text.trim(),
        option_a: form.option_a.trim(),
        option_b: form.option_b.trim(),
        option_c: form.option_c.trim(),
        option_d: form.option_d.trim(),
        correct_answer: form.correct_answer as OptionKey,
        explanation: form.explanation.trim(),
        difficulty: form.difficulty,
        sort_order: sortOrder,
        starter_review: Boolean(form.starter_review),
        is_published: Boolean(form.is_published),
        review_label: form.starter_review ? starterReviewLabel : "",
      });
    } catch (err) {
      console.error("Failed to save question:", err);
      setError("The question could not be saved. Check your administrator access and try again.");
    } finally {
      setSaving(false);
    }
  };

  return <form onSubmit={submit} className="surface p-5 sm:p-7">
    <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="eyebrow">{editing ? "Edit question" : "Add question"}</p><h2 className="mt-2 break-words font-display text-2xl font-bold text-[#14294d]">{selectedSubject} · {selectedPart}</h2><p className="mt-2 text-xs leading-5 text-slate-500">Choose the catalog location so future banks can grow without changing the student experience.</p></div><button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2" onClick={onCancel} aria-label="Close question form"><X size={18} /></button></div>
    <div className="mt-5 flex gap-3 rounded-xl border border-[#eadba7] bg-[#fffaf0] p-3 text-xs leading-5 text-[#765d1e]" role="note"><ShieldCheck size={15} className="mt-0.5 shrink-0" /> <span>Questions marked “{starterReviewLabel}” are practice content and are not presented as officially verified HEC or LAT questions.</span></div>
    {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700" role="alert">{error}</p>}
    <div className="mt-6 grid gap-3 sm:grid-cols-3"><label htmlFor="question-exam" className="block text-xs font-bold text-slate-600">Exam<select id="question-exam" value={form.exam_slug} onChange={(event) => update("exam_slug", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400">{examOptions.map((exam) => <option key={exam.slug} value={exam.slug}>{exam.name}</option>)}</select></label><label htmlFor="question-subject" className="block text-xs font-bold text-slate-600">Subject<select id="question-subject" value={form.subject_slug} onChange={(event) => updateSubject(event.target.value)} disabled={!subjects.length} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400"><option value="">Choose subject</option>{subjects.map((subject) => <option key={subject.slug} value={subject.slug}>{subject.name}</option>)}</select></label><label htmlFor="question-part" className="block text-xs font-bold text-slate-600">Part<select id="question-part" value={form.part_slug} onChange={(event) => update("part_slug", event.target.value)} disabled={!availableParts.length} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400"><option value="">Choose part</option>{availableParts.map((part) => <option key={part.slug} value={part.slug}>{part.name}</option>)}</select></label></div>
    <label htmlFor="question-text" className="mt-5 block text-xs font-bold text-slate-600">Question text<textarea id="question-text" required value={form.question_text} onChange={(event) => update("question_text", event.target.value)} rows={3} className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-400" placeholder="Write the question prompt" /></label>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">{(["a", "b", "c", "d"] as const).map((key) => <label key={key} htmlFor={`option-${key}`} className="block text-xs font-bold text-slate-600">Option {key.toUpperCase()}<input id={`option-${key}`} required type="text" value={form[`option_${key}`]} onChange={(event) => update(`option_${key}`, event.target.value)} className="mt-2 h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label>)}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3"><label htmlFor="correct-answer" className="block text-xs font-bold text-slate-600">Correct answer<select id="correct-answer" value={form.correct_answer} onChange={(event) => update("correct_answer", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400"><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></label><label htmlFor="difficulty" className="block text-xs font-bold text-slate-600">Difficulty<select id="difficulty" value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400"><option value="introductory">Introductory</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label><label htmlFor="display-order" className="block text-xs font-bold text-slate-600">Display order<input id="display-order" required type="number" min="1" step="1" value={form.sort_order} onChange={(event) => update("sort_order", event.target.value)} className="mt-2 h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label></div>
    <label htmlFor="explanation" className="mt-5 block text-xs font-bold text-slate-600">Explanation<textarea id="explanation" required value={form.explanation} onChange={(event) => update("explanation", event.target.value)} rows={4} className="mt-2 w-full min-w-0 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-400" placeholder="Explain why the correct choice is right" /></label>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><label htmlFor="starter-review" className="flex min-h-11 items-center gap-3 rounded-xl border border-[#eadba7] bg-[#fffaf0] p-3 text-xs font-bold text-[#765d1e]"><input id="starter-review" type="checkbox" checked={Boolean(form.starter_review)} onChange={(event) => update("starter_review", event.target.checked)} className="h-4 w-4 accent-[#1766a9]" /> Mark as {starterReviewLabel}</label><label htmlFor="published" className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-600"><input id="published" type="checkbox" checked={Boolean(form.is_published)} onChange={(event) => update("is_published", event.target.checked)} className="h-4 w-4 accent-[#1766a9]" /> Published for students</label></div>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="submit" disabled={saving || !subjects.length || !parts.length} className="button-primary"><Save size={15} /> {saving ? "Saving…" : editing ? "Save changes" : "Add question"}</button><button type="button" className="button-secondary" onClick={onCancel}>Cancel</button></div>
  </form>;
}
