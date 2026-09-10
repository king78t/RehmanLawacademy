import { Part, Question, Subject } from "@/entities";
import {
  deleteLocalBookmark,
  deleteLocalWrongQuestion,
  getLocalProgress,
  listLocalBookmarks,
  listLocalPracticeAnswers,
  listLocalWrongQuestions,
  recordLocalAnswerOutcome,
  recordLocalPracticeAnswer,
  toggleLocalBookmark,
} from "@/lib/device-study-storage";
import type { OptionKey, StudentProgress, StudyQuestion } from "@/lib/study-types";

const asQuestion = (record: any): StudyQuestion => record as StudyQuestion;

export async function publishedQuestions(partSlug = "part-1") {
  const records = await Question.filter(
    { exam_slug: "lat", subject_slug: "pakistan-studies", part_slug: partSlug, is_published: true },
    "sort_order",
    500,
  );
  return (records || []).filter((record: any) => record?.is_published === true).map(asQuestion);
}

export async function allQuestionsForPart(partSlug = "part-1") {
  const records = await Question.filter(
    { exam_slug: "lat", subject_slug: "pakistan-studies", part_slug: partSlug },
    "sort_order",
    500,
  );
  return (records || []).map(asQuestion);
}

export async function loadParts() {
  return (await Part.filter({ exam_slug: "lat", subject_slug: "pakistan-studies", is_active: true }, "sort_order", 100)) || [];
}

export async function loadSubjects() {
  return (await Subject.filter({ exam_slug: "lat", is_active: true }, "sort_order", 100)) || [];
}

export async function loadProgress(partSlug = "part-1") {
  return getLocalProgress("lat", "pakistan-studies", partSlug) as StudentProgress | null;
}

export async function loadPracticeAnswers(partSlug = "part-1") {
  return listLocalPracticeAnswers(partSlug);
}

export async function recordAnswerOutcome(
  question: StudyQuestion,
  selectedAnswer: OptionKey,
  isCorrect: boolean,
  totalQuestions: number,
  attemptId?: string,
) {
  return recordLocalAnswerOutcome(question, selectedAnswer, isCorrect, totalQuestions, attemptId);
}

export async function savePracticeAnswer(question: StudyQuestion, selectedAnswer: OptionKey, totalQuestions: number) {
  const result = recordLocalPracticeAnswer(question, selectedAnswer, totalQuestions);
  return { isCorrect: result.value.is_correct, persisted: result.persisted };
}

export async function toggleBookmark(question: StudyQuestion) {
  const result = toggleLocalBookmark(question);
  return { value: result.value, persisted: result.persisted };
}

export async function listBookmarks() {
  return listLocalBookmarks();
}

export async function listWrongQuestions() {
  return listLocalWrongQuestions();
}

export async function deleteBookmark(bookmarkId: string) {
  return deleteLocalBookmark(bookmarkId);
}

export async function deleteWrongQuestion(recordId: string) {
  return deleteLocalWrongQuestion(recordId);
}

export async function deleteQuestion(questionId: string) {
  return Question.delete(questionId);
}
