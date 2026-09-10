import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, Menu, Send, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DeviceDataNotice } from "@/components/study/DeviceDataNotice";
import { EmptyState } from "@/components/study/EmptyState";
import { QuestionCard } from "@/components/study/QuestionCard";
import { QuestionNavigator } from "@/components/study/QuestionNavigator";
import { StarterNotice } from "@/components/study/StarterNotice";
import { StudyShell } from "@/components/study/StudyShell";
import { loadAttempt, loadAttemptAnswers, loadQuestionsByIds, saveQuizAnswer, saveQuizPosition, startQuiz, submitQuiz } from "@/lib/quiz-data";
import type { OptionKey, QuizAttempt, StudyQuestion } from "@/lib/study-types";

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${Math.max(0, seconds % 60).toString().padStart(2, "0")}`;

function QuizContent() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "empty" | "start-error">("loading");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [startError, setStartError] = useState("");
  const submitLock = useRef(false);
  const startPromiseRef = useRef<Promise<void> | null>(null);
  const savingRef = useRef(false);
  const finishRef = useRef<(timedOut?: boolean) => Promise<void>>(async () => undefined);

  const startNewQuiz = useCallback(async () => {
    if (startPromiseRef.current) return startPromiseRef.current;
    setStatus("loading");
    setStartError("");
    const promise = (async () => {
      try {
        const newAttempt = await startQuiz();
        if (!newAttempt?.id) throw new Error("The new quiz attempt did not receive an id.");
        navigate(`/lat/pakistan-studies/part-1/quiz/${newAttempt.id}`, { replace: true });
      } catch (error) {
        console.error("Failed to start quiz:", error);
        const message = error instanceof Error ? error.message : "";
        const normalizedMessage = message.toLowerCase();
        setStartError(normalizedMessage.includes("published questions")
          ? "No published questions are available for this quiz yet. Return to Pakistan Studies and try again after starter content is published."
          : normalizedMessage.includes("browser storage")
            ? "This browser could not save a local quiz attempt. Enable browser storage, then try again."
            : "The quiz could not start right now. Check your connection and try again.");
        setStatus("start-error");
        startPromiseRef.current = null;
      }
    })();
    startPromiseRef.current = promise;
    return promise;
  }, [navigate]);

  const load = useCallback(async () => {
    if (!attemptId) { await startNewQuiz(); return; }
    setStatus("loading"); setNotice(""); submitLock.current = false;
    try {
      const loadedAttempt = await loadAttempt(attemptId);
      if (!loadedAttempt) { setStatus("error"); return; }
      if (loadedAttempt.status !== "in_progress") { navigate(`/results/${attemptId}`, { replace: true }); return; }
      const [savedAnswers, loadedQuestions] = await Promise.all([loadAttemptAnswers(attemptId), loadQuestionsByIds(loadedAttempt.question_ids || [], loadedAttempt.part_slug)]);
      const answerMap: Record<string, OptionKey> = {};
      savedAnswers.forEach((answer) => { if (answer.question_id && answer.selected_answer) answerMap[answer.question_id] = answer.selected_answer; });
      setAttempt(loadedAttempt); setQuestions(loadedQuestions); setAnswers(answerMap);
      const restoredIndex = Number(loadedAttempt.current_index || 0);
      setCurrent(Math.min(Math.max(restoredIndex, 0), Math.max(loadedQuestions.length - 1, 0)));
      const started = Date.parse(loadedAttempt.started_at);
      const elapsed = Number.isFinite(started) ? Math.floor((Date.now() - started) / 1000) : 0;
      setTimeLeft(Math.max(0, Number(loadedAttempt.time_limit_seconds || 0) - elapsed));
      setStatus(loadedQuestions.length ? "ready" : "empty");
    } catch (error) { console.error("Failed to load quiz:", error); setStatus("error"); }
  }, [attemptId, navigate, startNewQuiz]);

  useEffect(() => { void load(); }, [load]);

  const finish = useCallback(async (timedOut = false) => {
    if (!attempt || !questions.length || submitLock.current) return;
    if (savingRef.current) { if (timedOut) { setNotice("Saving your last answer before submitting…"); window.setTimeout(() => { if (!submitLock.current) void finishRef.current(true); }, 250); } return; }
    submitLock.current = true; setSubmitting(true); setNotice(timedOut ? "Time is up. Saving your result…" : "");
    try { await submitQuiz(attempt, questions, timedOut); navigate(`/results/${attempt.id}`, { replace: true, state: { timedOut } }); }
    catch (error) { console.error("Failed to submit quiz:", error); submitLock.current = false; setSubmitting(false); setNotice("The quiz could not be submitted. Your saved answers are safe. Try again."); }
  }, [attempt, navigate, questions]);

  finishRef.current = finish;

  useEffect(() => {
    if (status !== "ready" || !attempt || submitting) return;
    const tick = () => { const started = Date.parse(attempt.started_at); const elapsed = Number.isFinite(started) ? Math.floor((Date.now() - started) / 1000) : 0; const remaining = Math.max(0, Number(attempt.time_limit_seconds || 0) - elapsed); setTimeLeft(remaining); if (remaining <= 0) void finish(true); };
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, [attempt, finish, status, submitting]);

  const question = questions[current];
  const selected = question ? answers[question.id] : undefined;
  const answeredCount = Object.keys(answers).filter((id) => questions.some((item) => item.id === id)).length;
  const answeredByIndex = useMemo(() => Object.fromEntries(questions.map((item, index) => [String(index), answers[item.id]])), [answers, questions]);

  const goTo = async (index: number) => {
    setCurrent(index); setNavigatorOpen(false);
    if (!attempt) return;
    try { const result = await saveQuizPosition(attempt.id, index); if (!result.persisted) setNotice("This position is shown for now, but browser storage did not confirm the save."); }
    catch (error) { console.error("Failed to save quiz position:", error); setNotice("Your question position could not be saved. You can continue this session."); }
  };

  const choose = async (key: OptionKey) => {
    if (!question || saving || submitting || !attempt) return;
    const previous = answers[question.id]; setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: key })); setSaving(true); savingRef.current = true; setNotice("");
    try { const result = await saveQuizAnswer(attempt.id, question, key); setNotice(result.persisted ? "Answer saved to this quiz attempt." : "Answer shown for now, but browser storage did not confirm the save."); }
    catch (error) { console.error("Failed to save quiz answer:", error); setAnswers((currentAnswers) => { const next = { ...currentAnswers }; if (previous) next[question.id] = previous; else delete next[question.id]; return next; }); setNotice("Your answer could not be saved. Please try again."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  return <StudyShell footer={false}><main className="min-h-[calc(100vh-72px)] bg-[#f6f8fb] py-5 sm:py-8"><div className="page-wrap">
    {status === "loading" && <div className="surface p-7"><div className="loader-line w-1/3" /><div className="loader-line mt-5 h-8 w-2/3" /><div className="loader-line mt-8 h-48 w-full" /></div>}
    {status === "error" && <EmptyState title="Quiz could not load" description="The saved attempt was not available. Return to Pakistan Studies and start a new quiz." action="/lat/pakistan-studies" actionLabel="Return to subject" onRetry={load} />}
    {status === "start-error" && <EmptyState title="Quiz could not start" description={startError || "The quiz could not start. Check your browser storage and try again."} action="/lat/pakistan-studies" actionLabel="Return to subject" onRetry={load} />}
    {status === "empty" && <EmptyState title="This quiz has no available questions" description="The published bank changed before the attempt could open. Start a new practice quiz." action="/lat/pakistan-studies" actionLabel="Start again" />}
    {status === "ready" && question && attempt && <><div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">Timed practice</p><StarterNotice compact /></div><h1 className="mt-2 break-words font-display text-2xl font-bold text-[#14294d] sm:text-3xl">{attempt.title}</h1><p className="mt-1 text-xs text-slate-500">Question {current + 1} of {questions.length} · {answeredCount} answered</p></div><div className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 ${timeLeft < 60 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-[#eadba7] bg-[#fffaf0] text-[#765d1e]"}`} role="timer" aria-live={timeLeft < 60 ? "assertive" : "polite"} aria-label={`Time remaining ${formatTime(timeLeft)}`}><Clock3 size={17} aria-hidden="true" /><span className="text-lg font-bold tabular-nums">{formatTime(timeLeft)}</span></div></div><div className="mt-4"><DeviceDataNotice compact /></div>{notice && <p className={`mt-4 rounded-xl px-3 py-2 text-xs font-semibold ${notice.includes("could not") || notice.includes("did not") ? "bg-rose-50 text-rose-700" : "bg-sky-50 text-sky-800"}`} role={notice.includes("could not") || notice.includes("did not") ? "alert" : "status"}>{notice}</p>}<button type="button" className="button-secondary mt-5 flex w-full justify-between lg:hidden" onClick={() => setNavigatorOpen((open) => !open)} aria-expanded={navigatorOpen} aria-controls="quiz-question-map"><span>Question map · {answeredCount} of {questions.length} answered</span><Menu size={17} aria-hidden="true" /></button><div className="mt-5 grid gap-6 lg:grid-cols-[1fr_270px] lg:items-start"><div><QuestionCard question={question} number={current + 1} total={questions.length} selected={selected} onSelect={choose} submitted={false} />{saving && <p className="mt-3 text-xs font-semibold text-slate-500" role="status"><Loader2 size={13} className="mr-1 inline animate-spin" />Saving your answer…</p>}<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><button type="button" className="button-secondary" disabled={current === 0 || submitting || saving} onClick={() => { void goTo(current - 1); }}><ArrowLeft size={15} /> Previous</button><button type="button" className="button-primary" disabled={current === questions.length - 1 || submitting || saving} onClick={() => { void goTo(current + 1); }}>Next <ArrowRight size={15} /></button></div><button type="button" className="button-secondary !border-rose-200 !text-rose-700 hover:!bg-rose-50" disabled={submitting || saving} onClick={() => { if (window.confirm("Submit this quiz now? Unanswered questions will remain unattempted.")) void finish(false); }}>{submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : <><Send size={15} /> Submit quiz</>}</button></div></div><aside id="quiz-question-map" className={`surface p-5 ${navigatorOpen ? "block" : "hidden"} lg:sticky lg:top-24 lg:block`}><div className="flex items-center justify-between"><div><p className="eyebrow">Question map</p><p className="mt-1 text-sm font-bold text-[#14294d]">{answeredCount} of {questions.length} answered</p></div><Menu size={17} className="text-slate-400" aria-hidden="true" /></div><div className="mt-5"><QuestionNavigator total={questions.length} current={current} answered={answeredByIndex} onSelect={(index) => { void goTo(index); }} compact /></div><div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-5 text-[.68rem] text-slate-500"><CheckCircle2 size={14} className="text-[#36805d]" /> Saved answer states update as you move.</div><div className="mt-4 flex gap-2 rounded-xl bg-[#f7f9fb] p-3 text-[.68rem] leading-5 text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#1766a9]" />This is a practice timer configured for the starter bank, not an official LAT pattern.</div><div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-[.68rem] leading-5 text-amber-800"><AlertTriangle size={14} className="mt-0.5 shrink-0" />Submitting ends this attempt and saves it to local history.</div></aside></div></>}
  </div></main></StudyShell>;
}

export default function Part1Quiz() { return <QuizContent />; }
