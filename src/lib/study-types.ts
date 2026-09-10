export type OptionKey = "A" | "B" | "C" | "D";

export interface StudyQuestion {
  id: string;
  exam_slug: string;
  subject_slug: string;
  part_slug: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: OptionKey;
  explanation: string;
  difficulty: string;
  is_published: boolean;
  starter_review: boolean;
  review_label: string;
  sort_order: number;
}

export interface StudentProgress {
  id?: string;
  exam_slug: string;
  subject_slug: string;
  part_slug: string;
  total_questions: number;
  answered_count: number;
  correct_count: number;
  answered_question_ids: string[];
  correct_question_ids: string[];
  last_question_id?: string;
  last_activity_at?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  title: string;
  exam_slug: string;
  subject_slug: string;
  part_slug: string;
  question_ids: string[];
  question_count: number;
  time_limit_seconds: number;
  started_at: string;
  created_at?: string;
  submitted_at?: string;
  status: "in_progress" | "completed" | "timed_out";
  score?: number;
  percentage?: number;
  attempted_count?: number;
  correct_count?: number;
  wrong_count?: number;
  unattempted_count?: number;
  time_taken_seconds?: number;
  current_index?: number;
  answers?: Record<string, OptionKey>;
  answer_results?: Record<string, boolean>;
}

export interface QuizAnswerRecord {
  id?: string;
  attempt_id: string;
  question_id: string;
  selected_answer: OptionKey;
  is_correct: boolean;
  answered_at: string;
}

export interface SubjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  question_count: number;
}

export const answerOptions: Array<{ key: OptionKey; label: string }> = [
  { key: "A", label: "Option A" },
  { key: "B", label: "Option B" },
  { key: "C", label: "Option C" },
  { key: "D", label: "Option D" },
];

export const starterReviewLabel = "Starter Content — For Academic Review";
