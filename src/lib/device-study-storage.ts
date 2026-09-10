import type { OptionKey, QuizAttempt, StudentProgress, StudyQuestion } from "@/lib/study-types";

export const DEVICE_STUDY_STORAGE_KEY = "rehman-law-academy:device-study:v1";
export const DEVICE_STUDY_SCHEMA_VERSION = 1;
export const DEVICE_STUDY_UPDATED_EVENT = "rla:study-updated";

export interface LocalPracticeAnswer {
  id: string;
  question_id: string;
  exam_slug: string;
  subject_slug: string;
  part_slug: string;
  selected_answer: OptionKey;
  is_correct: boolean;
  answered_at: string;
  updated_at: string;
}

export interface LocalBookmark {
  id: string;
  question_id: string;
  exam_slug: string;
  subject_slug: string;
  part_slug: string;
  created_at: string;
  updated_at: string;
}

export interface LocalWrongQuestion {
  id: string;
  question_id: string;
  exam_slug: string;
  subject_slug: string;
  part_slug: string;
  last_answer?: OptionKey;
  times_wrong: number;
  resolved: boolean;
  last_attempt_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LocalQuizAttempt extends QuizAttempt {
  created_at: string;
  updated_at: string;
  current_index: number;
  answers: Record<string, OptionKey>;
  answer_results: Record<string, boolean>;
}

export interface DeviceStudyState {
  schemaVersion: number;
  practiceAnswers: Record<string, LocalPracticeAnswer>;
  progress: Record<string, StudentProgress>;
  bookmarks: Record<string, LocalBookmark>;
  wrongQuestions: Record<string, LocalWrongQuestion>;
  quizAttempts: Record<string, LocalQuizAttempt>;
  recentAttemptIds: string[];
}

export interface StorageMutation<T> {
  value: T;
  persisted: boolean;
}

const optionKeys: OptionKey[] = ["A", "B", "C", "D"];

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asOption(value: unknown): OptionKey | null {
  return optionKeys.includes(value as OptionKey) ? value as OptionKey : null;
}

function uniqueStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => String(value || "")).filter(Boolean))];
}

function createEmptyState(): DeviceStudyState {
  return {
    schemaVersion: DEVICE_STUDY_SCHEMA_VERSION,
    practiceAnswers: {},
    progress: {},
    bookmarks: {},
    wrongQuestions: {},
    quizAttempts: {},
    recentAttemptIds: [],
  };
}

function normalizeState(input: unknown): DeviceStudyState {
  if (!isRecord(input) || Number(input.schemaVersion) !== DEVICE_STUDY_SCHEMA_VERSION) return createEmptyState();
  const state = createEmptyState();

  if (isRecord(input.practiceAnswers)) {
    Object.entries(input.practiceAnswers).forEach(([key, raw]) => {
      if (!isRecord(raw) || !raw.question_id || !asOption(raw.selected_answer)) return;
      const now = new Date().toISOString();
      state.practiceAnswers[key] = {
        id: String(raw.id || key),
        question_id: String(raw.question_id),
        exam_slug: String(raw.exam_slug || "lat"),
        subject_slug: String(raw.subject_slug || ""),
        part_slug: String(raw.part_slug || ""),
        selected_answer: asOption(raw.selected_answer) as OptionKey,
        is_correct: Boolean(raw.is_correct),
        answered_at: String(raw.answered_at || now),
        updated_at: String(raw.updated_at || now),
      };
    });
  }

  if (isRecord(input.progress)) {
    Object.entries(input.progress).forEach(([key, raw]) => {
      if (!isRecord(raw) || !raw.exam_slug || !raw.subject_slug || !raw.part_slug) return;
      state.progress[key] = {
        id: String(raw.id || key),
        exam_slug: String(raw.exam_slug),
        subject_slug: String(raw.subject_slug),
        part_slug: String(raw.part_slug),
        total_questions: Math.max(0, Number(raw.total_questions || 0)),
        answered_count: uniqueStrings(raw.answered_question_ids).length,
        correct_count: uniqueStrings(raw.correct_question_ids).length,
        answered_question_ids: uniqueStrings(raw.answered_question_ids),
        correct_question_ids: uniqueStrings(raw.correct_question_ids),
        last_question_id: raw.last_question_id ? String(raw.last_question_id) : undefined,
        last_activity_at: raw.last_activity_at ? String(raw.last_activity_at) : undefined,
      };
    });
  }

  if (isRecord(input.bookmarks)) {
    Object.entries(input.bookmarks).forEach(([key, raw]) => {
      if (!isRecord(raw) || !raw.question_id) return;
      const now = new Date().toISOString();
      state.bookmarks[key] = {
        id: String(raw.id || key),
        question_id: String(raw.question_id),
        exam_slug: String(raw.exam_slug || "lat"),
        subject_slug: String(raw.subject_slug || ""),
        part_slug: String(raw.part_slug || ""),
        created_at: String(raw.created_at || now),
        updated_at: String(raw.updated_at || now),
      };
    });
  }

  if (isRecord(input.wrongQuestions)) {
    Object.entries(input.wrongQuestions).forEach(([key, raw]) => {
      if (!isRecord(raw) || !raw.question_id) return;
      const now = new Date().toISOString();
      state.wrongQuestions[key] = {
        id: String(raw.id || key),
        question_id: String(raw.question_id),
        exam_slug: String(raw.exam_slug || "lat"),
        subject_slug: String(raw.subject_slug || ""),
        part_slug: String(raw.part_slug || ""),
        last_answer: asOption(raw.last_answer) || undefined,
        times_wrong: Math.max(1, Number(raw.times_wrong || 1)),
        resolved: Boolean(raw.resolved),
        last_attempt_id: raw.last_attempt_id ? String(raw.last_attempt_id) : undefined,
        created_at: String(raw.created_at || now),
        updated_at: String(raw.updated_at || now),
      };
    });
  }

  if (isRecord(input.quizAttempts)) {
    Object.entries(input.quizAttempts).forEach(([key, raw]) => {
      if (!isRecord(raw) || !raw.question_ids || !Array.isArray(raw.question_ids)) return;
      const now = new Date().toISOString();
      const answers: Record<string, OptionKey> = {};
      if (isRecord(raw.answers)) Object.entries(raw.answers).forEach(([questionId, value]) => { const option = asOption(value); if (option) answers[questionId] = option; });
      const answerResults: Record<string, boolean> = {};
      if (isRecord(raw.answer_results)) Object.entries(raw.answer_results).forEach(([questionId, value]) => { answerResults[questionId] = Boolean(value); });
      const status = raw.status === "completed" || raw.status === "timed_out" ? raw.status : "in_progress";
      state.quizAttempts[key] = {
        id: String(raw.id || key),
        quiz_id: String(raw.quiz_id || "starter-part-1"),
        title: String(raw.title || "Pakistan Studies · Part 1 Quiz"),
        exam_slug: String(raw.exam_slug || "lat"),
        subject_slug: String(raw.subject_slug || "pakistan-studies"),
        part_slug: String(raw.part_slug || "part-1"),
        question_ids: uniqueStrings(raw.question_ids),
        question_count: Math.max(0, Number(raw.question_count || raw.question_ids.length)),
        time_limit_seconds: Math.max(0, Number(raw.time_limit_seconds || 0)),
        started_at: String(raw.started_at || now),
        submitted_at: raw.submitted_at ? String(raw.submitted_at) : undefined,
        status,
        score: raw.score === undefined ? undefined : Number(raw.score || 0),
        percentage: raw.percentage === undefined ? undefined : Number(raw.percentage || 0),
        attempted_count: raw.attempted_count === undefined ? undefined : Number(raw.attempted_count || 0),
        correct_count: raw.correct_count === undefined ? undefined : Number(raw.correct_count || 0),
        wrong_count: raw.wrong_count === undefined ? undefined : Number(raw.wrong_count || 0),
        unattempted_count: raw.unattempted_count === undefined ? undefined : Number(raw.unattempted_count || 0),
        time_taken_seconds: raw.time_taken_seconds === undefined ? undefined : Number(raw.time_taken_seconds || 0),
        created_at: String(raw.created_at || now),
        updated_at: String(raw.updated_at || now),
        current_index: Math.max(0, Number(raw.current_index || 0)),
        answers,
        answer_results: answerResults,
      };
    });
  }

  state.recentAttemptIds = uniqueStrings(input.recentAttemptIds).filter((id) => state.quizAttempts[id]);
  return state;
}

function readState(): DeviceStudyState {
  if (typeof window === "undefined") return createEmptyState();
  try {
    const raw = window.localStorage.getItem(DEVICE_STUDY_STORAGE_KEY);
    if (!raw) return createEmptyState();
    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);
    if (!isRecord(parsed) || Number(parsed.schemaVersion) !== DEVICE_STUDY_SCHEMA_VERSION) {
      window.localStorage.removeItem(DEVICE_STUDY_STORAGE_KEY);
    }
    return normalized;
  } catch (error) {
    console.warn("Device study storage was reset after an unreadable value.", error);
    try { window.localStorage.removeItem(DEVICE_STUDY_STORAGE_KEY); } catch { /* private browsing may reject removal */ }
    return createEmptyState();
  }
}

function writeState(state: DeviceStudyState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(DEVICE_STUDY_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(DEVICE_STUDY_UPDATED_EVENT));
    return true;
  } catch (error) {
    console.error("Device study data could not be saved.", error);
    return false;
  }
}

function mutate<T>(mutator: (state: DeviceStudyState) => T): StorageMutation<T> {
  const state = readState();
  const value = mutator(state);
  const persisted = writeState(state);
  return { value, persisted };
}

function createId(prefix: string): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  } catch { /* use the fallback below */ }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function progressKey(question: Pick<StudyQuestion, "exam_slug" | "subject_slug" | "part_slug">): string {
  return `${question.exam_slug}:${question.subject_slug}:${question.part_slug}`;
}

function applyOutcome(state: DeviceStudyState, question: StudyQuestion, selectedAnswer: OptionKey, isCorrect: boolean, totalQuestions: number, attemptId?: string, timestamp = new Date().toISOString()) {
  const key = progressKey(question);
  const existing = state.progress[key] || {
    id: key,
    exam_slug: question.exam_slug,
    subject_slug: question.subject_slug,
    part_slug: question.part_slug,
    total_questions: 0,
    answered_count: 0,
    correct_count: 0,
    answered_question_ids: [],
    correct_question_ids: [],
  };
  const answeredIds = uniqueStrings(existing.answered_question_ids);
  const correctIds = uniqueStrings(existing.correct_question_ids);
  if (!answeredIds.includes(question.id)) answeredIds.push(question.id);
  const nextCorrect = isCorrect ? [...new Set([...correctIds, question.id])] : correctIds.filter((id) => id !== question.id);
  state.progress[key] = {
    ...existing,
    total_questions: Math.max(Number(existing.total_questions || 0), Number(totalQuestions || 0)),
    answered_count: answeredIds.length,
    correct_count: nextCorrect.length,
    answered_question_ids: answeredIds,
    correct_question_ids: nextCorrect,
    last_question_id: question.id,
    last_activity_at: timestamp,
  };

  const wrong = state.wrongQuestions[question.id];
  if (isCorrect) {
    if (wrong) {
      wrong.resolved = true;
      wrong.last_answer = selectedAnswer;
      wrong.last_attempt_id = attemptId;
      wrong.updated_at = timestamp;
    }
  } else {
    state.wrongQuestions[question.id] = {
      id: wrong?.id || question.id,
      question_id: question.id,
      exam_slug: question.exam_slug,
      subject_slug: question.subject_slug,
      part_slug: question.part_slug,
      last_answer: selectedAnswer,
      times_wrong: Number(wrong?.times_wrong || 0) + 1,
      resolved: false,
      last_attempt_id: attemptId,
      created_at: wrong?.created_at || timestamp,
      updated_at: timestamp,
    };
  }
}

export function getDeviceStudyState(): DeviceStudyState { return readState(); }

export function isDeviceStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const probe = `${DEVICE_STUDY_STORAGE_KEY}:probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch { return false; }
}

export function getLocalProgress(examSlug = "lat", subjectSlug = "pakistan-studies", partSlug = "part-1"): StudentProgress | null {
  return readState().progress[`${examSlug}:${subjectSlug}:${partSlug}`] || null;
}

export function listLocalPracticeAnswers(partSlug?: string): LocalPracticeAnswer[] {
  return Object.values(readState().practiceAnswers).filter((item) => !partSlug || item.part_slug === partSlug).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function recordLocalPracticeAnswer(question: StudyQuestion, selectedAnswer: OptionKey, totalQuestions: number): StorageMutation<LocalPracticeAnswer> {
  const timestamp = new Date().toISOString();
  return mutate((state) => {
    const record: LocalPracticeAnswer = {
      id: question.id,
      question_id: question.id,
      exam_slug: question.exam_slug,
      subject_slug: question.subject_slug,
      part_slug: question.part_slug,
      selected_answer: selectedAnswer,
      is_correct: selectedAnswer === question.correct_answer,
      answered_at: timestamp,
      updated_at: timestamp,
    };
    state.practiceAnswers[question.id] = record;
    applyOutcome(state, question, selectedAnswer, record.is_correct, totalQuestions, undefined, timestamp);
    return record;
  });
}

export function recordLocalAnswerOutcome(question: StudyQuestion, selectedAnswer: OptionKey, isCorrect: boolean, totalQuestions: number, attemptId?: string): StorageMutation<boolean> {
  return mutate((state) => {
    applyOutcome(state, question, selectedAnswer, isCorrect, totalQuestions, attemptId);
    return isCorrect;
  });
}

export function listLocalBookmarks(): LocalBookmark[] {
  return Object.values(readState().bookmarks).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function toggleLocalBookmark(question: StudyQuestion): StorageMutation<boolean> {
  const timestamp = new Date().toISOString();
  return mutate((state) => {
    if (state.bookmarks[question.id]) {
      delete state.bookmarks[question.id];
      return false;
    }
    state.bookmarks[question.id] = {
      id: question.id,
      question_id: question.id,
      exam_slug: question.exam_slug,
      subject_slug: question.subject_slug,
      part_slug: question.part_slug,
      created_at: timestamp,
      updated_at: timestamp,
    };
    return true;
  });
}

export function deleteLocalBookmark(id: string): StorageMutation<boolean> {
  return mutate((state) => {
    const key = Object.keys(state.bookmarks).find((bookmarkId) => bookmarkId === id || state.bookmarks[bookmarkId].question_id === id);
    if (!key) return false;
    delete state.bookmarks[key];
    return true;
  });
}

export function listLocalWrongQuestions(): LocalWrongQuestion[] {
  return Object.values(readState().wrongQuestions).filter((item) => !item.resolved).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function deleteLocalWrongQuestion(id: string): StorageMutation<boolean> {
  return mutate((state) => {
    const key = Object.keys(state.wrongQuestions).find((wrongId) => wrongId === id || state.wrongQuestions[wrongId].question_id === id);
    if (!key) return false;
    delete state.wrongQuestions[key];
    return true;
  });
}

export function createLocalQuizAttempt(input: Omit<LocalQuizAttempt, "id" | "created_at" | "updated_at" | "started_at" | "status" | "current_index" | "answers" | "answer_results">): StorageMutation<LocalQuizAttempt> {
  const timestamp = new Date().toISOString();
  return mutate((state) => {
    const attempt: LocalQuizAttempt = {
      ...input,
      id: createId("quiz"),
      started_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      status: "in_progress",
      current_index: 0,
      answers: {},
      answer_results: {},
    };
    state.quizAttempts[attempt.id] = attempt;
    state.recentAttemptIds = [attempt.id, ...state.recentAttemptIds.filter((id) => id !== attempt.id)].slice(0, 100);
    return attempt;
  });
}

export function getLocalQuizAttempt(attemptId: string): LocalQuizAttempt | null {
  return readState().quizAttempts[attemptId] || null;
}

export function listLocalQuizAttempts(): LocalQuizAttempt[] {
  return Object.values(readState().quizAttempts).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveLocalQuizAnswer(attemptId: string, question: StudyQuestion, selectedAnswer: OptionKey): StorageMutation<{ attempt: LocalQuizAttempt; isCorrect: boolean }> {
  const timestamp = new Date().toISOString();
  return mutate((state) => {
    const attempt = state.quizAttempts[attemptId];
    if (!attempt || attempt.status !== "in_progress") throw new Error("This quiz is no longer accepting answers.");
    if (!attempt.question_ids.includes(question.id)) throw new Error("This question does not belong to the quiz.");
    const isCorrect = selectedAnswer === question.correct_answer;
    attempt.answers[question.id] = selectedAnswer;
    attempt.answer_results[question.id] = isCorrect;
    attempt.updated_at = timestamp;
    return { attempt, isCorrect };
  });
}

export function saveLocalQuizPosition(attemptId: string, currentIndex: number): StorageMutation<boolean> {
  return mutate((state) => {
    const attempt = state.quizAttempts[attemptId];
    if (!attempt || attempt.status !== "in_progress") return false;
    attempt.current_index = Math.max(0, Math.min(Number(currentIndex || 0), Math.max(attempt.question_ids.length - 1, 0)));
    attempt.updated_at = new Date().toISOString();
    return true;
  });
}

export function submitLocalQuiz(attemptId: string, questions: StudyQuestion[], timedOut = false, progressTotal = questions.length): StorageMutation<LocalQuizAttempt | null> {
  return mutate((state) => {
    const attempt = state.quizAttempts[attemptId];
    if (!attempt) return null;
    if (attempt.status !== "in_progress") return attempt;
    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const attemptedIds = attempt.question_ids.filter((id) => Boolean(attempt.answers[id]));
    let correct = 0;
    attemptedIds.forEach((questionId) => {
      const question = questionMap.get(questionId);
      if (!question) return;
      const selected = attempt.answers[questionId];
      const isCorrect = selected === question.correct_answer;
      attempt.answer_results[questionId] = isCorrect;
      if (isCorrect) correct += 1;
      applyOutcome(state, question, selected, isCorrect, progressTotal, attempt.id);
    });
    const total = Math.max(0, Number(attempt.question_count || attempt.question_ids.length));
    const started = Date.parse(attempt.started_at);
    const elapsed = Number.isFinite(started) ? Math.max(0, Math.round((Date.now() - started) / 1000)) : 0;
    const timeLimit = Math.max(0, Number(attempt.time_limit_seconds || 0));
    const didTimeOut = timedOut || (timeLimit > 0 && elapsed >= timeLimit);
    attempt.status = didTimeOut ? "timed_out" : "completed";
    attempt.submitted_at = new Date().toISOString();
    attempt.score = correct;
    attempt.percentage = total ? Math.round((correct / total) * 100) : 0;
    attempt.attempted_count = attemptedIds.length;
    attempt.correct_count = correct;
    attempt.wrong_count = Math.max(0, attemptedIds.length - correct);
    attempt.unattempted_count = Math.max(0, total - attemptedIds.length);
    attempt.time_taken_seconds = timeLimit ? Math.min(elapsed, timeLimit) : elapsed;
    attempt.updated_at = new Date().toISOString();
    state.recentAttemptIds = [attempt.id, ...state.recentAttemptIds.filter((id) => id !== attempt.id)].slice(0, 100);
    return attempt;
  });
}
