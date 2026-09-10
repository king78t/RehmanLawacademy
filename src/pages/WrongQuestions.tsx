import { AlertCircle, Filter, RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { QuestionListItem } from "@/components/study/QuestionListItem";
import { StudyShell } from "@/components/study/StudyShell";
import { DEVICE_STUDY_UPDATED_EVENT, isDeviceStorageAvailable } from "@/lib/device-study-storage";
import { deleteWrongQuestion, listWrongQuestions, publishedQuestions } from "@/lib/study-data";

export default function WrongQuestions() {
  const [rows, setRows] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);

  const load = useCallback(async () => {
    setStatus("loading");
    setStorageAvailable(isDeviceStorageAvailable());
    try {
      const [wrong, all] = await Promise.all([listWrongQuestions(), publishedQuestions()]);
      setRows(wrong);
      setQuestions(all);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load wrong questions:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener(DEVICE_STUDY_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(DEVICE_STUDY_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [load]);

  const visible = useMemo(() => rows
    .map((row) => ({ row, question: questions.find((question) => question.id === row.question_id) }))
    .filter((item) => item.question)
    .filter(({ question }) => `${question.question_text} ${question.explanation}`.toLowerCase().includes(search.toLowerCase())), [rows, questions, search]);
  const hiddenCount = Math.max(0, rows.length - visible.length);

  const remove = async (id: string) => {
    setRemovingId(id);
    setMessage("");
    try {
      const result = await deleteWrongQuestion(id);
      setRows((current) => current.filter((row) => row.id !== id && row.question_id !== id));
      setMessage(result.persisted ? "Question cleared from your wrong-question queue." : "The question was cleared on screen, but browser storage could not confirm the change.");
    } catch (error) {
      console.error("Failed to clear wrong question:", error);
      setMessage("The wrong question could not be cleared. Try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const messageIsError = message.includes("could not") || message.includes("couldn't") || message.includes("could not confirm");
  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Remedial practice</p><h1 className="page-heading mt-3 break-words text-4xl font-bold">Wrong questions</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Missed questions stay here until a correct retry marks the gap resolved. The queue is private to this browser.</p></div><div className="icon-tile bg-rose-50 text-rose-500"><AlertCircle size={21} /></div></div>
    <div className="mt-6"><DeviceDataNotice compact /></div>
    {!storageAvailable && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900" role="alert">Browser storage is unavailable, so wrong-question practice cannot survive a refresh. Check private-browsing settings and try again.</p>}
    {message && <p className={`mt-5 rounded-xl border p-3 text-xs font-semibold ${messageIsError ? "border-rose-100 bg-rose-50 text-rose-700" : "border-sky-100 bg-sky-50 text-sky-800"}`} role={messageIsError ? "alert" : "status"}>{message}</p>}
    {status === "ready" && rows.length > 0 && <div className="mt-8 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><input aria-label="Search wrong questions" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search wrong questions" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-sky-400" /></label><div className="button-secondary !justify-start !text-slate-500"><Filter size={15} /> {visible.length} open records</div></div>}
    {status === "loading" && <div className="mt-8 grid gap-4">{[1, 2, 3].map((item) => <div key={item} className="surface p-5"><div className="loader-line w-2/3" /><div className="loader-line mt-4 w-full" /></div>)}</div>}
    {status === "error" && <div className="mt-8"><EmptyState title="Wrong questions could not load" description="Your browser-only remedial records could not be read. Try again when storage is available." onRetry={load} /></div>}
    {status === "ready" && rows.length === 0 && <div className="mt-8"><EmptyState title="No wrong questions yet" description="That is a strong start. When you miss a question, it will appear here for focused practice." action="/lat/pakistan-studies/part-1" actionLabel="Practise Part 1" /></div>}
    {status === "ready" && rows.length > 0 && visible.length === 0 && <div className="mt-8"><EmptyState title="No wrong question matches" description={hiddenCount ? "Some records are no longer published in the public study bank." : "Try a shorter search or clear the search field."} /></div>}
    {status === "ready" && visible.length > 0 && <><div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs leading-5 text-rose-800"><RotateCcw size={16} className="shrink-0" /> Practise these records again, then use the explanation to close the gap.</div><div className="mt-4 grid gap-4">{visible.map(({ row, question }) => <div key={row.id} className={removingId === row.id ? "opacity-60" : ""}><QuestionListItem question={question} wrong meta={`${row.times_wrong || 1} incorrect ${Number(row.times_wrong || 1) === 1 ? "attempt" : "attempts"}`} onRemove={() => void remove(row.id)} /></div>)}</div></>}
  </main></StudyShell>;
}
