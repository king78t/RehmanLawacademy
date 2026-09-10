export interface PaidCourse {
  id: string;
  slug: string;
  title: string;
  short_description?: string;
  description?: string;
  instructor?: string;
  duration_label?: string;
  lecture_count?: number;
  test_count?: number;
  currency?: string;
  price_pkr?: number;
  price_configured?: boolean;
  publication_status?: string;
  is_published?: boolean;
  thumbnail_url?: string;
  curriculum_summary?: string;
  sort_order?: number;
}

export interface PaidModule {
  id: string;
  course_id?: string;
  course_slug?: string;
  title: string;
  description?: string;
  sort_order?: number;
  is_published?: boolean;
}

export interface PaidLesson {
  id: string;
  module_id?: string;
  title: string;
  description?: string;
  notes?: string;
  attachment_url?: string;
  video_provider?: string;
  video_reference?: string;
  duration_seconds?: number;
  sort_order?: number;
  is_published?: boolean;
}

export interface PaidProgress {
  id?: string;
  course_id: string;
  course_slug?: string;
  enrollment_id?: string;
  completed_lesson_ids: string[];
  completed_lessons: number;
  total_lessons: number;
  progress_percentage: number;
  last_lesson_id?: string;
  last_activity_at?: string;
}

export interface PaidPaymentRequest {
  id: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  amount_pkr: number;
  currency: string;
  payment_provider: string;
  payment_status: "pending" | "approved" | "rejected" | "refunded" | string;
  transaction_reference?: string;
  payment_note?: string;
  requested_at?: string;
  reviewed_at?: string;
}

export interface PaidEnrollment {
  id: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  enrollment_status: "active" | "pending" | "suspended" | "removed" | string;
  payment_request_id?: string;
  amount_pkr?: number;
  currency?: string;
  enrolled_at?: string;
  activated_at?: string;
  last_activity_at?: string;
}

export interface PaidDashboard {
  user: { id: string; full_name: string; email: string };
  courses: PaidCourse[];
  payments: PaidPaymentRequest[];
  enrollments: PaidEnrollment[];
  progress: PaidProgress[];
}

export function formatPkr(course?: Pick<PaidCourse, "price_pkr" | "price_configured" | "currency"> | null) {
  if (!course?.price_configured || !Number(course.price_pkr || 0)) return "Price set by admin";
  return `${course.currency || "PKR"} ${Number(course.price_pkr).toLocaleString("en-PK")}`;
}

export function formatDuration(seconds?: number) {
  const value = Number(seconds || 0);
  if (!value) return "Admin to configure";
  const minutes = Math.round(value / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`;
}
