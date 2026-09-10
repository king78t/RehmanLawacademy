import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, ClipboardCheck, Flag, Loader2, Menu, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { QuestionCard } from "@/components/study/QuestionCard";
import { QuestionNavigator } from "@/components/study/QuestionNavigator";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";
import { startQuiz } from "@/lib/quiz-data";
import { listBookmarks, loadPracticeAnswers, publishedQuestions, savePracticeAnswer, toggleBookmark } from "@/lib/study-data";
import type { OptionKey, StudyQuestion } from "@/lib/study-types";

function PracticeContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({});
  const [current, setCurrent] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setStatus("loading"); setNotice("");
    try {
      const [loaded, savedAnswers, savedBookmarks] = await Promise.all([publishedQuestions(), loadPracticeAnswers(), listBookmarks()]);
      const requested = searchParams.get("q");
      const retryId = searchParams.get("retry");
      const answerMap: Record<string, OptionKey> = {};
      savedAnswers.forEach((row) => { if (row.question_id && row.selected_answer && row.question_id !== retryId) answerMap[row.question_id] = row.selected_answer; });
      const bookmarkMap: Record<string, boolean> = {};
      savedBookmarks.forEach((row) => { if (row.question_id) bookmarkMap[row.question_id] = true; });
      setQuestions(loaded); setAnswers(answerMap); setBookmarks(bookmarkMap);
      const requestedIndex = requested ? loaded.findIndex((item) => item.id === requested) : -1;
      setCurrent(requestedIndex >= 0 ? requestedIndex : 0);
      setStatus(loaded.length ? "ready" : "empty");
    } catch (error) {
      console.error("Failed to load Part 1 practice:", error); setStatus("error");
    }
  }, [searchParams]);

  useEffect(() => { void load(); }, [load]);

  const question = questions[current];
  const selected = question ? answers[question.id] : undefined;
  const answeredCount = useMemo(() => Object.keys(answers).filter((id) => questions.some((item) => item.id === id)).length, [answers, questions]);
  const answeredByIndex = useMemo(() => Object.fromEntries(questions.map((item, index) => [String(index), answers[item.id]])), [answers, questions]);

  const choose = async (key: OptionKey) => {
    if (!question || selected || saving) return;
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: key })); setSaving(true); setNotice("");
    try {
      const result = await savePracticeAnswer(question, key, questions.length);
      setNotice(result.persisted ? (result.isCorrect ? "Saved as correct. Keep going." : "Saved to your wrong-question practice.") : "This answer is shown for now, but browser storage did not confirm the save.");
    } catch (error) {
      console.error("Failed to save practice answer:", error); setNotice("Your answer could not be saved. Please try again.");
      setAnswers((currentAnswers) => { const next = { ...currentAnswers }; delete next[question.id]; return next; });
    } finally { setSaving(false); }
  };

  const saveBookmark = async () => {
    if (!question || bookmarking) return;
    setBookmarking(true); setNotice("");
    try {
      const result = await toggleBookmark(question);
      setBookmarks((currentBookmarks) => ({ ...currentBookmarks, [question.id]: result.value }));
      setNotice(result.persisted ? (result.value ? "Question saved for revision." : "Question removed from saved questions.") : "The bookmark changed for now, but browser storage did not confirm the save.");
    } catch (error) { console.error("Failed to toggle bookmark:", error); setNotice("The bookmark could not be updated. Please try again."); }
    finally { setBookmarking(false); }
  };

  const beginQuiz = async () => {
    setStarting(true); setNotice("");
    try { const attempt: any = await startQuiz(); navigate(`/lat/pakistan-studies/part-1/quiz/${attempt.id}`); }
    catch (error) { console.error("Failed to start quiz:", error); setNotice("The quiz could not start. Check that a published question is available."); setStarting(false); }
  };

  return <StudyShell footer={false}><main className="page-wrap py-7 pb-12 sm:py-10"><div className="flex flex-wrap items-center justify-between gap-3"><Link to="/lat/pakistan-studies" className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"><ArrowLeft size={15} /> Pakistan Studies</Link><div className="flex flex-wrap items-center justify-end gap-2"><StarterNotice compact /><button type="button" className="button-secondary !min-h-11 !px-3 !py-2" onClick={() => { void beginQuiz(); }} disabled={starting || !questions.length}><ClipboardCheck size={14} /> {starting ? "Starting…" : "Timed quiz"}</button></div></div><div className="mt-4"><DeviceDataNotice compact /></div>{status === "loading" && <div className="surface mt-7 p-6 sm:p-8"><div className="loader-line w-1/4" /><div className="loader-line mt-7 h-8 w-4/5" /><div className="mt-8 grid gap-3">{[1, 2, 3, 4].map((item) => <div key={item} className="loader-line h-14" />)}</div></div>}{status === "error" && <div className="mt-7"><EmptyState title="Practice could not load" description="The published question bank did not respond. Try again when your connection is ready." action="/lat/pakistan-studies" actionLabel="Return to subject" onRetry={load} /></div>}{status === "empty" && <div className="mt-7"><EmptyState title="No published questions yet" description="An administrator needs to publish the first question before practice can begin." action="/lat/pakistan-studies" actionLabel="Return to subject" /></div>}{status === "ready" && question && <><div className="mt-6 grid gap-7 lg:grid-cols-[1fr_270px] lg:items-start"><div><div className="mb-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="eyebrow">Pakistan Studies · Part 1</p><h1 className="mt-2 break-words font-display text-2xl font-bold text-[#14294d] sm:text-3xl">Focused practice</h1></div><div className="shrink-0 text-right"><p className="text-2xl font-bold text-[#1766a9]">{questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}%</p><p className="text-[.66rem] font-bold uppercase tracking-[.1em] text-slate-400">bank complete</p></div></div><div className="mb-5"><div className="progress-track"><div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div><p className="mt-2 text-xs font-semibold text-slate-500">Question {current + 1} of {questions.length} · {answeredCount} answered</p></div><QuestionCard question={question} number={current + 1} total={questions.length} selected={selected} onSelect={choose} submitted={Boolean(selected)} />{notice && <p className={`mt-3 text-xs font-semibold ${notice.includes("could not") || notice.includes("did not") ? "text-rose-700" : "text-slate-500"}`} role={notice.includes("could not") || notice.includes("did not") ? "alert" : "status"}>{saving && <Loader2 size={13} className="mr-1 inline animate-spin" />}{notice}</p>}<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><button type="button" className="button-secondary" disabled={current === 0} onClick={() => setCurrent((value) => value - 1)}><ArrowLeft size={15} /> Previous</button><button type="button" className="button-primary" disabled={current === questions.length - 1} onClick={() => setCurrent((value) => value + 1)}>Next <ArrowRight size={15} /></button></div><div className="flex flex-wrap gap-2"><button type="button" disabled={bookmarking} className={`button-secondary !min-h-11 !px-3 ${bookmarks[question.id] ? "!border-[#ddc275] !bg-[#fffaf0] !text-[#9c7b2d]" : ""}`} onClick={saveBookmark} aria-pressed={Boolean(bookmarks[question.id])}>{bookmarks[question.id] ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{bookmarking ? "Saving…" : bookmarks[question.id] ? "Saved" : "Save"}</button><button type="button" disabled className="button-quiet !min-h-11 !px-3" title="Question reporting will be available in a later stage" aria-label="Question reporting is planned for a later stage"><Flag size={15} /> <span className="hidden sm:inline">Report</span></button></div></div></div><button type="button" className="button-secondary w-full justify-between lg:hidden" onClick={() => setNavigatorOpen((open) => !open)} aria-expanded={navigatorOpen} aria-controls="practice-question-map"><span>Question map · {answeredCount} of {questions.length} answered</span><Menu size={17} /></button><aside id="practice-question-map" className={`surface p-5 ${navigatorOpen ? "block" : "hidden"} lg:sticky lg:top-24 lg:block`}><div className="flex items-center justify-between"><div><p className="eyebrow">Question map</p><p className="mt-1 text-sm font-bold text-[#14294d]">Jump to a question</p></div><Menu size={17} className="text-slate-400" /></div><div className="mt-5"><QuestionNavigator total={questions.length} current={current} answered={answeredByIndex} onSelect={(index) => { setCurrent(index); setNavigatorOpen(false); }} compact /></div><div className="mt-6 space-y-2 border-t border-slate-100 pt-5 text-[.68rem] text-slate-500"><p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#1766a9]" /> Current question</p><p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#d8eee1]" /> Answer saved</p><p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-200" /> Not answered</p></div><div className="mt-6 rounded-xl bg-[#f7f9fb] p-4 text-xs leading-5 text-slate-500"><RotateCcw size={14} className="mb-2 text-[#1766a9]" />Your practice answers and explanations stay in this browser for your next session.</div></aside></div></>}</main></StudyShell>;
}

export default function Part1Practice() { return <PracticeContent />; }
