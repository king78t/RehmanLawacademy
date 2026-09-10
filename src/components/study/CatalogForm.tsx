import { Save, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type CatalogRecord = { id?: string; name?: string; slug?: string; description?: string; sort_order?: number; is_active?: boolean; subject_slug?: string; question_limit?: number };
type Option = { slug: string; name: string };
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateBase(form: CatalogRecord, label: string) {
  if (!String(form.name || "").trim() || !String(form.slug || "").trim()) return `Add a ${label} name and stable slug.`;
  if (!slugPattern.test(String(form.slug).trim())) return "Use lowercase letters, numbers and single hyphens in the slug.";
  const order = Number(form.sort_order);
  if (!Number.isInteger(order) || order < 1) return "Display order must be a whole number greater than zero.";
  return "";
}

export function SubjectForm({ editing, onSaved, onCancel }: { editing?: CatalogRecord | null; onSaved: (record: any) => void | Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<CatalogRecord>({ name: "", slug: "", description: "", sort_order: 1, is_active: true });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm({ name: "", slug: "", description: "", sort_order: 1, is_active: true, ...editing }); setError(""); }, [editing]);
  const update = (key: keyof CatalogRecord, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateBase(form, "subject");
    if (validation) { setError(validation); return; }
    setSaving(true); setError("");
    try { await onSaved({ name: String(form.name).trim(), slug: String(form.slug).trim(), description: String(form.description || "").trim(), sort_order: Number(form.sort_order), is_active: Boolean(form.is_active), exam_slug: "lat" }); }
    catch (err) { console.error("Failed to save subject:", err); setError("The subject could not be saved. Check your administrator access and try again."); }
    finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="surface p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">{editing ? "Edit subject" : "New subject"}</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">LAT subject</h2></div><button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2" onClick={onCancel} aria-label="Close subject form"><X size={18} /></button></div>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700" role="alert">{error}</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><label htmlFor="subject-name" className="text-xs font-bold text-slate-600">Name<input id="subject-name" value={form.name || ""} onChange={(event) => update("name", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label htmlFor="subject-slug" className="text-xs font-bold text-slate-600">Stable slug<input id="subject-slug" value={form.slug || ""} onChange={(event) => update("slug", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label></div><label htmlFor="subject-description" className="mt-4 block text-xs font-bold text-slate-600">Description<textarea id="subject-description" rows={3} value={form.description || ""} onChange={(event) => update("description", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-400" /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label htmlFor="subject-order" className="text-xs font-bold text-slate-600">Display order<input id="subject-order" type="number" min="1" step="1" value={form.sort_order} onChange={(event) => update("sort_order", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label htmlFor="subject-active" className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-600"><input id="subject-active" type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => update("is_active", event.target.checked)} className="h-4 w-4 accent-[#1766a9]" /> Available to students</label></div><button type="submit" disabled={saving} className="button-primary mt-5 w-full sm:w-fit"><Save size={15} /> {saving ? "Saving…" : editing ? "Save subject" : "Add subject"}</button></form>;
}

export function PartForm({ editing, subjects, onSaved, onCancel }: { editing?: CatalogRecord | null; subjects: Option[]; onSaved: (record: any) => void | Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<CatalogRecord>({ name: "", slug: "", subject_slug: subjects[0]?.slug || "", question_limit: 100, sort_order: 1, is_active: true });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm({ name: "", slug: "", subject_slug: subjects[0]?.slug || "", question_limit: 100, sort_order: 1, is_active: true, ...editing }); setError(""); }, [editing, subjects]);
  const update = (key: keyof CatalogRecord, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validateBase(form, "part");
    const limit = Number(form.question_limit);
    if (validation) { setError(validation); return; }
    if (!form.subject_slug || !subjects.some((subject) => subject.slug === form.subject_slug)) { setError("Choose the subject that owns this part."); return; }
    if (!Number.isInteger(limit) || limit < 1) { setError("Question limit must be a whole number greater than zero."); return; }
    setSaving(true); setError("");
    try { await onSaved({ name: String(form.name).trim(), slug: String(form.slug).trim(), subject_slug: form.subject_slug, question_limit: limit, sort_order: Number(form.sort_order), is_active: Boolean(form.is_active), exam_slug: "lat" }); }
    catch (err) { console.error("Failed to save part:", err); setError("The part could not be saved. Check your administrator access and try again."); }
    finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="surface p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">{editing ? "Edit part" : "New part"}</p><h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">LAT study part</h2></div><button type="button" className="button-quiet !min-h-10 !min-w-10 !p-2" onClick={onCancel} aria-label="Close part form"><X size={18} /></button></div>{error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700" role="alert">{error}</p>}<div className="mt-5 grid gap-3 sm:grid-cols-2"><label htmlFor="part-subject" className="text-xs font-bold text-slate-600">Subject<select id="part-subject" value={form.subject_slug || ""} onChange={(event) => update("subject_slug", event.target.value)} disabled={!subjects.length} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400"><option value="">Choose subject</option>{subjects.map((subject) => <option key={subject.slug} value={subject.slug}>{subject.name}</option>)}</select></label><label htmlFor="part-name" className="text-xs font-bold text-slate-600">Name<input id="part-name" value={form.name || ""} onChange={(event) => update("name", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label htmlFor="part-slug" className="text-xs font-bold text-slate-600">Stable slug<input id="part-slug" value={form.slug || ""} onChange={(event) => update("slug", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label htmlFor="part-limit" className="text-xs font-bold text-slate-600">Question limit<input id="part-limit" type="number" min="1" step="1" value={form.question_limit} onChange={(event) => update("question_limit", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label htmlFor="part-order" className="text-xs font-bold text-slate-600">Display order<input id="part-order" type="number" min="1" step="1" value={form.sort_order} onChange={(event) => update("sort_order", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" /></label><label htmlFor="part-active" className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-600"><input id="part-active" type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => update("is_active", event.target.checked)} className="h-4 w-4 accent-[#1766a9]" /> Available to students</label></div><button type="submit" disabled={saving || !subjects.length} className="button-primary mt-5 w-full sm:w-fit"><Save size={15} /> {saving ? "Saving…" : editing ? "Save part" : "Add part"}</button></form>;
}
