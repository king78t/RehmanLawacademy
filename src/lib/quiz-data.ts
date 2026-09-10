import { QuizDefinition } from "@/entities";
import {
  createLocalQuizAttempt,
  getLocalQuizAttempt,
  isDeviceStorageAvailable,
  listLocalQuizAttempts,
  saveLocalQuizAnswer,
  saveLocalQuizPosition,
  submitLocalQuiz,
} from "@/lib/device-study-storage";
import { allQuestionsForPart, publishedQuestions } from "@/lib/study-data";
import type { OptionKey, QuizAnswerRecord, QuizAttempt as QuizAttemptType, StudyQuestion } from "@/lib/study-types";

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export async function startQuiz() {
  if (!isDeviceStorageAvailable()) throw new Error("Browser storage is unavailable for this quiz.");
  const questions = await publishedQuestions("part-1");
  const defs = await QuizDefinition.filter(
    { exam_slug: "lat", subject_slug: "pakistan-studies", part_slug: "part-1", is_published: true },
    "-created_at",
    5,
  );
  const definition: any = defs?.[0] || { title: "Pakistan Studies · Part 1 Practice Quiz", time_limit_seconds: 30 * 60, randomize: true };
  const selected = definition.randomize === false ? [...questions] : shuffle(questions);
  const requestedCount = Number(definition.question_count || selected.length);
  const limited = selected.slice(0, Math.max(0, requestedCount));
  if (!limited.length) throw new Error("No published questions are available for this quiz.");
  const result = createLocalQuizAttempt({
    quiz_id: String(definition.id || "starter-part-1"),
    title: String(definition.title || "Pakistan Studies · Part 1 Practice Quiz"),
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_ids: limited.map((question) => question.id),
    question_count: limited.length,
    time_limit_seconds: Math.max(60, Number(definition.time_limit_seconds || 1800)),
  });
  if (!result.persisted) throw new Error("Browser storage could not save this quiz attempt.");
  return result.value as QuizAttemptType;
}

export async function loadAttempt(attemptId: string) {
  return getLocalQuizAttempt(attemptId) as QuizAttemptType | null;
}

export async function loadAttemptAnswers(attemptId: string) {
  const attempt = getLocalQuizAttempt(attemptId);
  if (!attempt) return [];
  return Object.entries(attempt.answers || {}).map(([questionId, selectedAnswer]) => ({
    id: `${attemptId}:${questionId}`,
    attempt_id: attemptId,
    question_id: questionId,
    selected_answer: selectedAnswer,
    is_correct: Boolean(attempt.answer_results?.[questionId]),
    answered_at: attempt.updated_at || attempt.created_at,
  })) as QuizAnswerRecord[];
}

export async function saveQuizAnswer(attemptId: string, question: StudyQuestion, selectedAnswer: OptionKey) {
  const result = saveLocalQuizAnswer(attemptId, question, selectedAnswer);
  if (!result.persisted) console.warn("Quiz answer was updated, but browser storage did not confirm the save.");
  return {
    attempt: result.value.attempt as QuizAttemptType,
    attempt_id: attemptId,
    question_id: question.id,
    selected_answer: selectedAnswer,
    is_correct: result.value.isCorrect,
    answered_at: result.value.attempt.updated_at,
    persisted: result.persisted,
  };
}

export async function saveQuizPosition(attemptId: string, currentIndex: number) {
  return saveLocalQuizPosition(attemptId, currentIndex);
}

export async function submitQuiz(attempt: QuizAttemptType, questions: StudyQuestion[], timedOut = false) {
  const currentAttempt = getLocalQuizAttempt(attempt.id);
  if (!currentAttempt || currentAttempt.status !== "in_progress") return currentAttempt;
  let progressTotal = questions.length;
  try {
    const published = await publishedQuestions(currentAttempt.part_slug);
    progressTotal = Math.max(progressTotal, published.length);
  } catch (error) {
    console.error("Failed to refresh local progress total:", error);
  }
  const result = submitLocalQuiz(currentAttempt.id, questions, timedOut, progressTotal);
  if (!result.persisted) console.warn("Quiz result was calculated, but browser storage did not confirm the save.");
  return result.value as QuizAttemptType | null;
}

export async function loadQuestionsByIds(ids: string[], partSlug = "part-1") {
  const questions = await allQuestionsForPart(partSlug);
  const lookup = new Map(questions.map((question) => [question.id, question]));
  return ids.map((id) => lookup.get(id)).filter(Boolean) as StudyQuestion[];
}

export async function listAttempts() {
  return listLocalQuizAttempts();
}
