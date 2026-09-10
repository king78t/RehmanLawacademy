import { Bookmark, Filter, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { QuestionListItem } from "@/components/study/QuestionListItem";
import { StudyShell } from "@/components/study/StudyShell";
import { DEVICE_STUDY_UPDATED_EVENT, isDeviceStorageAvailable } from "@/lib/device-study-storage";
import { deleteBookmark, listBookmarks, publishedQuestions } from "@/lib/study-data";

export default function SavedQuestions() {
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
      const [bookmarks, all] = await Promise.all([listBookmarks(), publishedQuestions()]);
      setRows(bookmarks);
      setQuestions(all);
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load saved questions:", error);
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
      const result = await deleteBookmark(id);
      setRows((current) => current.filter((row) => row.id !== id && row.question_id !== id));
      setMessage(result.persisted ? "Question removed from your saved shelf." : "The question was removed on screen, but browser storage could not confirm the change.");
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
      setMessage("The saved question could not be removed. Try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const messageIsError = message.includes("could not") || message.includes("couldn't") || message.includes("could not confirm");
  return <StudyShell><main className="page-wrap py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow">Revision shelf</p><h1 className="page-heading mt-3 break-words text-4xl font-bold">Saved questions</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Keep the questions you want to understand twice. This shelf belongs to the current browser only.</p></div><div className="icon-tile"><Bookmark size={21} /></div></div>
    <div className="mt-6"><DeviceDataNotice compact /></div>
    {!storageAvailable && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900" role="alert">Browser storage is unavailable, so saved questions cannot survive a refresh. Check private-browsing settings and try again.</p>}
    {message && <p className={`mt-5 rounded-xl border p-3 text-xs font-semibold ${messageIsError ? "border-rose-100 bg-rose-50 text-rose-700" : "border-sky-100 bg-sky-50 text-sky-800"}`} role={messageIsError ? "alert" : "status"}>{message}</p>}
    {status === "ready" && rows.length > 0 && <div className="mt-8 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><input aria-label="Search saved questions" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search saved questions" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-sky-400" /></label><div className="button-secondary !justify-start !text-slate-500"><Filter size={15} /> {visible.length} shown</div></div>}
    {status === "loading" && <div className="mt-8 grid gap-4">{[1, 2, 3].map((item) => <div key={item} className="surface p-5"><div className="loader-line w-2/3" /><div className="loader-line mt-4 w-full" /></div>)}</div>}
    {status === "error" && <div className="mt-8"><EmptyState title="Saved questions could not load" description="Your browser-only saved records could not be read. Try again when storage is available." onRetry={load} /></div>}
    {status === "ready" && rows.length === 0 && <div className="mt-8"><EmptyState title="Your saved shelf is empty" description="Tap the bookmark control during practice to keep a question here for revision." action="/lat/pakistan-studies/part-1" actionLabel="Open Part 1 practice" /></div>}
    {status === "ready" && rows.length > 0 && visible.length === 0 && <div className="mt-8"><EmptyState title="No saved question matches" description={hiddenCount ? "Some saved records are no longer published in the public study bank." : "Try a shorter search or clear the search field."} /></div>}
    {status === "ready" && visible.length > 0 && <div className="mt-6 grid gap-4">{visible.map(({ row, question }) => <div key={row.id} className={removingId === row.id ? "opacity-60" : ""}><QuestionListItem question={question} onRemove={() => void remove(row.id)} /></div>)}</div>}
  </main></StudyShell>;
}
