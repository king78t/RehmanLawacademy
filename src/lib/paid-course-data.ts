import { Course, CourseModule } from "@/entities";
import { courseAccess } from "@/functions";
import type {
  PaidCourse,
  PaidDashboard,
  PaidLesson,
  PaidModule,
  PaidPaymentRequest,
  PaidProgress,
  PaymentSettings,
  CourseTest,
  CourseTestResult,
} from "@/lib/paid-course-types";
import { localStore } from "@/lib/superdev/local-store";

export async function loadPublishedCourses() {
  const rows = await Course.filter({ is_published: true, publication_status: "published" }, "sort_order", 100);
  return (rows || []) as PaidCourse[];
}

export async function loadPublishedCourse(slug: string) {
  const rows = await Course.filter({ slug, is_published: true, publication_status: "published" }, "sort_order", 5);
  return ((rows || [])[0] || null) as PaidCourse | null;
}

export async function loadPublicModules(courseId: string) {
  const rows = await CourseModule.filter({ course_id: courseId, is_published: true }, "sort_order", 200);
  return (rows || []) as PaidModule[];
}

export async function loadAdminModules(courseId: string) {
  const rows = await CourseModule.filter({ course_id: courseId }, "sort_order", 200);
  return (rows || []) as PaidModule[];
}

export async function loadPaidDashboard() {
  return (await courseAccess({ action: "dashboard" })) as PaidDashboard & { test_results?: CourseTestResult[] };
}

export async function loadPaymentDetails(courseSlug: string) {
  return (await courseAccess({ action: "payment_details", course_slug: courseSlug })) as {
    course: PaidCourse;
    settings: PaymentSettings;
    payment: PaidPaymentRequest | null;
    enrollment: any | null;
  };
}

export async function submitPaymentProof(data: {
  course_slug: string;
  payment_method: string;
  transaction_reference?: string;
  proof_image: string;
  payment_note?: string;
  student_mobile?: string;
}) {
  return (await courseAccess({
    action: "submit_payment_proof",
    ...data,
  })) as { success: boolean; request: PaidPaymentRequest };
}

export async function loadPaymentSettings(): Promise<PaymentSettings> {
  return (await courseAccess({ action: "get_payment_settings" })) as PaymentSettings;
}

export async function updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
  return (await courseAccess({ action: "update_payment_settings", settings })) as PaymentSettings;
}

export async function loadAdminPaymentRequests(): Promise<PaidPaymentRequest[]> {
  return (await courseAccess({ action: "admin_get_payments" })) as PaidPaymentRequest[];
}

export async function adminApprovePayment(paymentId: string) {
  return (await courseAccess({ action: "admin_approve_payment", payment_id: paymentId })) as {
    success: boolean;
    payment: PaidPaymentRequest;
    enrollment: any;
  };
}

export async function adminRejectPayment(paymentId: string, rejectionReason: string) {
  return (await courseAccess({
    action: "admin_reject_payment",
    payment_id: paymentId,
    rejection_reason: rejectionReason,
  })) as { success: boolean; payment: PaidPaymentRequest };
}

export async function loadCourseTests(courseSlug: string) {
  return (await courseAccess({ action: "course_tests", course_slug: courseSlug })) as {
    course: PaidCourse;
    tests: (CourseTest & { question_count: number; questions: any[] })[];
  };
}

export async function submitCourseTest(courseSlug: string, testId: string, answers: Record<string, string>) {
  return (await courseAccess({
    action: "submit_course_test",
    course_slug: courseSlug,
    test_id: testId,
    answers,
  })) as {
    result: CourseTestResult;
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    passing_score: number;
  };
}

export async function requestCourseAccess(courseSlug: string) {
  return (await courseAccess({ action: "request", course_slug: courseSlug })) as {
    request: PaidPaymentRequest;
    reused: boolean;
    whatsapp_url: string;
  };
}

export async function loadEnrolledCurriculum(courseSlug: string) {
  return (await courseAccess({ action: "curriculum", course_slug: courseSlug })) as {
    course: PaidCourse;
    enrollment: any;
    modules: PaidModule[];
    lessons: PaidLesson[];
    progress: PaidProgress | null;
    tests?: CourseTest[];
  };
}

export async function loadProtectedLesson(courseSlug: string, lessonId: string) {
  return (await courseAccess({
    action: "lesson",
    course_slug: courseSlug,
    lesson_id: lessonId,
  })) as {
    course: PaidCourse;
    enrollment: any;
    module: PaidModule;
    lesson: PaidLesson;
    previous_lesson: Pick<PaidLesson, "id" | "title"> | null;
    next_lesson: Pick<PaidLesson, "id" | "title"> | null;
    progress: PaidProgress | null;
  };
}

export async function markProtectedLessonComplete(courseSlug: string, lessonId: string) {
  return (await courseAccess({
    action: "progress",
    course_slug: courseSlug,
    lesson_id: lessonId,
    completed: true,
  })) as { progress: PaidProgress };
}

// Student Auth Helpers
export function studentLogin(email: string, pass: string) {
  return localStore.login(email, pass);
}

export function studentSignup(fullName: string, email: string, mobileNumber: string, pass: string) {
  return localStore.signup(fullName, email, mobileNumber, pass);
}

export function studentLogout() {
  localStore.logout();
}

export function getActiveStudent() {
  return localStore.getCurrentUser();
}

