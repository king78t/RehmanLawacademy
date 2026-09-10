import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  RotateCcw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { loadCourseTests, submitCourseTest } from "@/lib/paid-course-data";
import type { CourseTest, CourseTestQuestion, CourseTestResult } from "@/lib/paid-course-types";

interface CourseTestRunnerProps {
  courseSlug: string;
  onClose: () => void;
  onFinished?: () => void;
}

export function CourseTestRunner({ courseSlug, onClose, onFinished }: CourseTestRunnerProps) {
  const [tests, setTests] = useState<CourseTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<CourseTest | null>(null);
  const [loading, setLoading] = useState(true);

  // Active quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const handleFinishQuiz = useCallback(async () => {
    if (!selectedTest || submitting) return;
    setSubmitting(true);
    try {
      const res = await submitCourseTest(courseSlug, selectedTest.id, selectedAnswers);
      setTestResult(res);
      if (onFinished) onFinished();
    } catch (err) {
      console.error("Failed to submit test", err);
    } finally {
      setSubmitting(false);
    }
  }, [courseSlug, onFinished, selectedAnswers, selectedTest, submitting]);

  useEffect(() => {
    loadCourseTests(courseSlug)
      .then((data) => {
        setTests(data.tests || []);
        if (data.tests?.length > 0) {
          const first = data.tests[0];
          setSelectedTest(first);
          setTimeLeft((first.time_limit_minutes || 15) * 60);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load tests", err);
        setLoading(false);
      });
  }, [courseSlug]);

  // Countdown timer
  useEffect(() => {
    if (!selectedTest || testResult || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleFinishQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedTest, testResult, timeLeft, handleFinishQuiz]);

  const handleSelectOption = (questionId: string, optionKey: string) => {
    if (testResult) return; // Locked once evaluated
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setTestResult(null);
    setCurrentIndex(0);
    if (selectedTest) {
      setTimeLeft((selectedTest.time_limit_minutes || 15) * 60);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl">
          <div className="loader-line mx-auto w-1/3" />
          <p className="mt-4 text-xs font-semibold text-slate-500">Loading course practice test...</p>
        </div>
      </div>
    );
  }

  if (!selectedTest || !selectedTest.questions?.length) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
          <HelpCircle size={36} className="mx-auto text-slate-400" />
          <h3 className="mt-3 font-display text-lg font-bold text-[#14294d]">No Practice Tests Ready</h3>
          <p className="mt-1 text-xs text-slate-500">
            Tests are being prepared by the academy instructors for this course.
          </p>
          <button type="button" onClick={onClose} className="button-secondary mt-5 text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    );
  }

  const questions = selectedTest.questions;
  const currentQ = questions[currentIndex];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isAnswered = Boolean(selectedAnswers[currentQ?.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#14294d] px-5 py-4 text-white">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#ddc275] px-2 py-0.5 text-[.62rem] font-black uppercase text-[#14294d]">
                Enrolled Test
              </span>
              <p className="truncate text-xs font-bold text-white/80">{selectedTest.title}</p>
            </div>
            <p className="mt-1 text-xs text-blue-100/70">
              Question {currentIndex + 1} of {questions.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!testResult && (
              <div className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1 font-mono text-xs font-bold text-[#ddc275]">
                <Clock size={14} />
                <span>
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {/* RESULT VIEW */}
          {testResult ? (
            <div className="space-y-6">
              <div
                className={`rounded-2xl border p-6 text-center shadow-sm ${
                  testResult.passed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
                }`}
              >
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
                    testResult.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <Award size={32} />
                </div>

                <h3 className="mt-4 font-display text-2xl font-bold text-[#14294d]">
                  {testResult.passed ? "Congratulations! Test Passed" : "Keep Practicing!"}
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  Passing criterion was {testResult.passing_score}%.
                </p>

                <div className="mt-5 inline-flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm">
                  <div>
                    <span className="text-[.65rem] font-bold uppercase text-slate-400">Score</span>
                    <p className="text-xl font-black text-[#14294d]">
                      {testResult.score} / {testResult.total}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <span className="text-[.65rem] font-bold uppercase text-slate-400">Percentage</span>
                    <p className="text-xl font-black text-[#1766a9]">
                      {testResult.percentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="button-secondary flex items-center gap-1.5 text-xs font-bold"
                  >
                    <RotateCcw size={14} /> Retake Test
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="button-primary text-xs font-bold"
                  >
                    Return to Course
                  </button>
                </div>
              </div>

              {/* Review Questions */}
              <div className="space-y-4">
                <h4 className="font-display text-base font-bold text-[#14294d]">
                  Detailed Answer Review
                </h4>
                {questions.map((q, idx) => {
                  const studentAns = selectedAnswers[q.id];
                  const isCorrect = studentAns === q.correct_option;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 text-xs ${
                        isCorrect ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-[#14294d]">
                          {idx + 1}. {q.question_text}
                        </span>
                        {isCorrect ? (
                          <span className="flex shrink-0 items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 size={15} /> Correct
                          </span>
                        ) : (
                          <span className="flex shrink-0 items-center gap-1 font-bold text-rose-700">
                            <XCircle size={15} /> Incorrect
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-slate-600">
                        <p>
                          <span className="font-semibold">Your Answer: </span>
                          <span className="font-bold uppercase">
                            Option {studentAns || "None"}
                          </span>
                          {studentAns && ` - ${q.options[studentAns as keyof typeof q.options]}`}
                        </p>
                        <p className="mt-0.5 text-emerald-800">
                          <span className="font-semibold">Correct Answer: </span>
                          <span className="font-bold uppercase">Option {q.correct_option}</span>
                          {` - ${q.options[q.correct_option as keyof typeof q.options]}`}
                        </p>
                      </div>

                      {q.explanation && (
                        <div className="mt-2.5 rounded-lg bg-white/80 p-2.5 text-slate-600">
                          <span className="font-bold text-[#1766a9]">Explanation: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* QUESTION RUNNER VIEW */
            <div>
              {/* Question Progress Dots */}
              <div className="mb-5 flex flex-wrap gap-1.5">
                {questions.map((q, idx) => {
                  const answered = Boolean(selectedAnswers[q.id]);
                  const active = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition ${
                        active
                          ? "bg-[#1766a9] text-white shadow"
                          : answered
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Current Question */}
              <div className="surface border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-[.68rem] font-extrabold uppercase tracking-wider text-[#1766a9]">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <h3 className="mt-2 text-base font-bold leading-snug text-[#14294d]">
                  {currentQ.question_text}
                </h3>

                {/* Options */}
                <div className="mt-5 space-y-2.5">
                  {(["a", "b", "c", "d"] as const).map((optKey) => {
                    const text = currentQ.options[optKey];
                    if (!text) return null;
                    const selected = selectedAnswers[currentQ.id] === optKey;

                    return (
                      <button
                        key={optKey}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, optKey)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                          selected
                            ? "border-[#1766a9] bg-[#eaf4fb] text-[#14294d] shadow-sm ring-1 ring-[#1766a9]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold uppercase ${
                            selected
                              ? "bg-[#1766a9] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {optKey}
                        </span>
                        <span className="text-xs font-semibold sm:text-sm leading-relaxed">
                          {text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="button-secondary text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>

                {currentIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    className="button-primary flex items-center gap-1.5 text-xs font-bold"
                  >
                    Next Question <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinishQuiz}
                    className="button-primary flex items-center gap-1.5 !bg-[#245e46] text-xs font-bold text-white hover:!bg-[#1b4e38]"
                  >
                    <CheckCircle2 size={15} /> {submitting ? "Evaluating..." : "Submit & Evaluate Test"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
