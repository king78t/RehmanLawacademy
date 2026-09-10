import { Course, CourseModule } from "@/entities";
import { courseAccess } from "@/functions";
import type { PaidCourse, PaidDashboard, PaidLesson, PaidModule, PaidPaymentRequest, PaidProgress } from "@/lib/paid-course-types";

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
  return await courseAccess({ action: "dashboard" }) as PaidDashboard;
}

export async function requestCourseAccess(courseSlug: string) {
  return await courseAccess({ action: "request", course_slug: courseSlug }) as { request: PaidPaymentRequest; reused: boolean; whatsapp_url: string };
}

export async function loadEnrolledCurriculum(courseSlug: string) {
  return await courseAccess({ action: "curriculum", course_slug: courseSlug }) as { course: PaidCourse; enrollment: any; modules: PaidModule[]; lessons: PaidLesson[]; progress: PaidProgress | null };
}

export async function loadProtectedLesson(courseSlug: string, lessonId: string) {
  return await courseAccess({ action: "lesson", course_slug: courseSlug, lesson_id: lessonId }) as { course: PaidCourse; enrollment: any; module: PaidModule; lesson: PaidLesson; previous_lesson: Pick<PaidLesson, "id" | "title"> | null; next_lesson: Pick<PaidLesson, "id" | "title"> | null; progress: PaidProgress | null };
}

export async function markProtectedLessonComplete(courseSlug: string, lessonId: string) {
  return await courseAccess({ action: "progress", course_slug: courseSlug, lesson_id: lessonId, completed: true }) as { progress: PaidProgress };
}
