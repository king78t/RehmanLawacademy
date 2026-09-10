import { createSuperdevClient } from "npm:@superdevhq/client@0.1.56";

const appId = Deno.env.get("SUPERDEV_APP_ID") ?? "";
const whatsappNumber = "923128891288";

class RequestError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = "request_failed") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function clientFor(token?: string) {
  const client = createSuperdevClient({ appId });
  if (token) client.auth.setToken(token);
  return client;
}

function response(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function safeCourse(course: any) {
  return {
    id: String(course.id),
    slug: String(course.slug || ""),
    title: String(course.title || ""),
    short_description: String(course.short_description || ""),
    description: String(course.description || ""),
    instructor: String(course.instructor || ""),
    duration_label: String(course.duration_label || ""),
    lecture_count: Number(course.lecture_count || 0),
    test_count: Number(course.test_count || 0),
    currency: String(course.currency || "PKR"),
    price_pkr: Number(course.price_pkr || 0),
    price_configured: Boolean(course.price_configured && Number(course.price_pkr || 0) > 0),
    is_published: Boolean(course.is_published),
    thumbnail_url: String(course.thumbnail_url || ""),
    curriculum_summary: String(course.curriculum_summary || ""),
  };
}

function safePayment(item: any) {
  return {
    id: String(item.id),
    course_id: String(item.course_id || ""),
    course_slug: String(item.course_slug || ""),
    course_title: String(item.course_title || ""),
    amount_pkr: Number(item.amount_pkr || 0),
    currency: String(item.currency || "PKR"),
    payment_provider: String(item.payment_provider || "whatsapp_manual"),
    payment_status: String(item.payment_status || "pending"),
    transaction_reference: String(item.transaction_reference || ""),
    payment_note: String(item.payment_note || ""),
    requested_at: String(item.requested_at || item.created_at || ""),
    reviewed_at: item.reviewed_at ? String(item.reviewed_at) : "",
  };
}

function safeEnrollment(item: any) {
  return {
    id: String(item.id),
    course_id: String(item.course_id || ""),
    course_slug: String(item.course_slug || ""),
    course_title: String(item.course_title || ""),
    enrollment_status: String(item.enrollment_status || "pending"),
    payment_request_id: String(item.payment_request_id || ""),
    amount_pkr: Number(item.amount_pkr || 0),
    currency: String(item.currency || "PKR"),
    enrolled_at: String(item.enrolled_at || item.created_at || ""),
    activated_at: item.activated_at ? String(item.activated_at) : "",
    last_activity_at: item.last_activity_at ? String(item.last_activity_at) : "",
  };
}

function safeProgress(item: any) {
  return {
    id: String(item.id),
    course_id: String(item.course_id || ""),
    course_slug: String(item.course_slug || ""),
    enrollment_id: String(item.enrollment_id || ""),
    completed_lesson_ids: Array.isArray(item.completed_lesson_ids) ? item.completed_lesson_ids.map(String) : [],
    completed_lessons: Number(item.completed_lessons || 0),
    total_lessons: Number(item.total_lessons || 0),
    progress_percentage: Number(item.progress_percentage || 0),
    last_lesson_id: item.last_lesson_id ? String(item.last_lesson_id) : "",
    last_activity_at: item.last_activity_at ? String(item.last_activity_at) : "",
  };
}

async function requireStudent(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) throw new RequestError(401, "Sign in to access paid courses.", "authentication_required");
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new RequestError(401, "Sign in to access paid courses.", "authentication_required");
  const caller = clientFor(token);
  try {
    const user = await caller.auth.me();
    if (!user?.email) throw new Error("Missing user email");
    return { caller, user };
  } catch {
    throw new RequestError(401, "Your paid-course session has expired. Sign in again.", "authentication_required");
  }
}

async function findCourse(service: any, slug: string, publishedOnly = false) {
  const rows = await service.entities.Course.filter(publishedOnly ? { slug, is_published: true } : { slug }, "sort_order", 5);
  return rows?.[0] ?? null;
}

async function requireEnrollment(service: any, email: string, courseId: string) {
  const rows = await service.entities.CourseEnrollment.filter({ student_email: email, course_id: courseId }, "-created_at", 20);
  const active = rows?.find((item: any) => item.enrollment_status === "active");
  if (!active) throw new RequestError(403, "This course is locked. Please purchase the course to access the lessons.", "course_locked");
  return active;
}

async function handleDashboard(service: any, user: any) {
  const email = String(user.email);
  const [courses, payments, enrollments, progressRows] = await Promise.all([
    service.entities.Course.filter({ is_published: true }, "sort_order", 100),
    service.entities.CoursePaymentRequest.filter({ student_email: email }, "-created_at", 100),
    service.entities.CourseEnrollment.filter({ student_email: email }, "-created_at", 100),
    service.entities.CourseProgress.filter({ student_email: email }, "-created_at", 100),
  ]);
  return {
    user: { id: String(user.id || ""), full_name: String(user.full_name || ""), email },
    courses: (courses || []).map(safeCourse),
    payments: (payments || []).map(safePayment),
    enrollments: (enrollments || []).map(safeEnrollment),
    progress: (progressRows || []).map(safeProgress),
  };
}

async function handleRequest(service: any, caller: any, user: any, body: any) {
  const slug = String(body.course_slug || "").trim();
  if (!slug) throw new RequestError(400, "A course is required.");
  const course = await findCourse(service, slug, true);
  if (!course) throw new RequestError(404, "That course is not available for purchase.", "course_not_found");
  const existingRows = await service.entities.CoursePaymentRequest.filter({ student_email: String(user.email), course_id: String(course.id), payment_status: "pending" }, "-created_at", 5);
  const existing = existingRows?.[0];
  const request = existing
    ? await service.entities.CoursePaymentRequest.update(existing.id, {
        course_title: String(course.title),
        amount_pkr: Number(course.price_pkr || 0),
        currency: String(course.currency || "PKR"),
      })
    : await caller.entities.CoursePaymentRequest.create({
        student_user_id: String(user.id || ""),
        student_email: String(user.email),
        course_id: String(course.id),
        course_slug: String(course.slug),
        course_title: String(course.title),
        amount_pkr: Number(course.price_pkr || 0),
        currency: String(course.currency || "PKR"),
        payment_provider: "whatsapp_manual",
        payment_status: "pending",
        transaction_reference: "",
        payment_note: "Awaiting manual WhatsApp payment review.",
        requested_at: new Date().toISOString(),
      });
  const priceLine = course.price_configured && Number(course.price_pkr || 0) > 0
    ? `Configured course amount: PKR ${Number(course.price_pkr).toLocaleString("en-PK")}`
    : "Course amount: To be set by the academy administrator";
  const message = `Assalam-o-Alaikum, I want to request access to ${String(course.title)}.\nRegistered email: ${String(user.email)}\n${priceLine}\nPlease share payment instructions and confirm my request after manual review.`;
  return { request: safePayment(request), reused: Boolean(existingRows?.[0]), whatsapp_url: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}` };
}

async function handleCurriculum(service: any, user: any, body: any) {
  const course = await findCourse(service, String(body.course_slug || ""));
  if (!course) throw new RequestError(404, "Course not found.", "course_not_found");
  const enrollment = await requireEnrollment(service, String(user.email), String(course.id));
  const [modules, lessons, progressRows] = await Promise.all([
    service.entities.CourseModule.filter({ course_id: String(course.id), is_published: true }, "sort_order", 200),
    service.entities.CourseLesson.filter({ course_id: String(course.id), is_published: true }, "sort_order", 500),
    service.entities.CourseProgress.filter({ student_email: String(user.email), course_id: String(course.id) }, "-created_at", 5),
  ]);
  const lessonRows = (lessons || []).map((lesson: any) => ({ id: String(lesson.id), module_id: String(lesson.module_id || ""), title: String(lesson.title || ""), description: String(lesson.description || ""), duration_seconds: Number(lesson.duration_seconds || 0), sort_order: Number(lesson.sort_order || 0) }));
  return { course: safeCourse(course), enrollment: safeEnrollment(enrollment), modules: (modules || []).map((item: any) => ({ id: String(item.id), title: String(item.title || ""), description: String(item.description || ""), sort_order: Number(item.sort_order || 0) })), lessons: lessonRows, progress: progressRows?.[0] ? safeProgress(progressRows[0]) : null };
}

async function handleLesson(service: any, user: any, body: any) {
  const course = await findCourse(service, String(body.course_slug || ""));
  if (!course) throw new RequestError(404, "Course not found.", "course_not_found");
  const enrollment = await requireEnrollment(service, String(user.email), String(course.id));
  const lesson = await service.entities.CourseLesson.get(String(body.lesson_id || ""));
  if (!lesson || String(lesson.course_id) !== String(course.id) || lesson.is_published !== true) throw new RequestError(404, "That lesson is not available.", "lesson_not_found");
  const module = await service.entities.CourseModule.get(String(lesson.module_id || ""));
  if (!module || String(module.course_id) !== String(course.id)) throw new RequestError(404, "That lesson is not attached to this course.", "lesson_not_found");
  const lessons = await service.entities.CourseLesson.filter({ module_id: String(module.id), course_id: String(course.id), is_published: true }, "sort_order", 200);
  const index = (lessons || []).findIndex((item: any) => String(item.id) === String(lesson.id));
  const progressRows = await service.entities.CourseProgress.filter({ student_email: String(user.email), course_id: String(course.id) }, "-created_at", 5);
  await service.entities.CourseEnrollment.update(enrollment.id, { last_activity_at: new Date().toISOString() });
  const protectedLesson = { id: String(lesson.id), title: String(lesson.title || ""), description: String(lesson.description || ""), notes: String(lesson.notes || ""), attachment_url: String(lesson.attachment_url || ""), video_provider: String(lesson.video_provider || ""), video_reference: String(lesson.video_reference || ""), duration_seconds: Number(lesson.duration_seconds || 0), sort_order: Number(lesson.sort_order || 0) };
  const linkFor = (item: any) => item ? { id: String(item.id), title: String(item.title || "") } : null;
  return { course: safeCourse(course), enrollment: safeEnrollment(enrollment), module: { id: String(module.id), title: String(module.title || "") }, lesson: protectedLesson, previous_lesson: linkFor(index > 0 ? lessons[index - 1] : null), next_lesson: linkFor(index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : null), progress: progressRows?.[0] ? safeProgress(progressRows[0]) : null };
}

async function handleProgress(service: any, user: any, body: any) {
  const course = await findCourse(service, String(body.course_slug || ""));
  if (!course) throw new RequestError(404, "Course not found.", "course_not_found");
  const enrollment = await requireEnrollment(service, String(user.email), String(course.id));
  const lesson = await service.entities.CourseLesson.get(String(body.lesson_id || ""));
  if (!lesson || String(lesson.course_id) !== String(course.id) || lesson.is_published !== true) throw new RequestError(404, "That lesson is not available.", "lesson_not_found");
  const lessons = await service.entities.CourseLesson.filter({ course_id: String(course.id), is_published: true }, "sort_order", 500);
  const existing = (await service.entities.CourseProgress.filter({ student_email: String(user.email), course_id: String(course.id) }, "-created_at", 5))?.[0];
  const completedIds = Array.isArray(existing?.completed_lesson_ids) ? existing.completed_lesson_ids.map(String) : [];
  if (body.completed === true && !completedIds.includes(String(lesson.id))) completedIds.push(String(lesson.id));
  const now = new Date().toISOString();
  const data = { student_user_id: String(user.id || ""), student_email: String(user.email), course_id: String(course.id), course_slug: String(course.slug), enrollment_id: String(enrollment.id), completed_lesson_ids: completedIds, completed_lessons: completedIds.length, total_lessons: lessons?.length || 0, progress_percentage: lessons?.length ? Math.round((completedIds.length / lessons.length) * 100) : 0, last_lesson_id: String(lesson.id), last_activity_at: now };
  const saved = existing ? await service.entities.CourseProgress.update(existing.id, data) : await service.entities.CourseProgress.create(data);
  await service.entities.CourseEnrollment.update(enrollment.id, { last_activity_at: now });
  return { progress: safeProgress(saved) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return response({}, 204);
  try {
    const { caller, user } = await requireStudent(req);
    const serviceKey = Deno.env.get("SUPERDEV_SERVICE_ROLE_KEY");
    if (!serviceKey) throw new RequestError(500, "Secure course access is not configured.", "server_configuration");
    const service = clientFor(serviceKey);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    if (action === "dashboard") return response(await handleDashboard(service, user));
    if (action === "request") return response(await handleRequest(service, caller, user, body));
    if (action === "curriculum") return response(await handleCurriculum(service, user, body));
    if (action === "lesson") return response(await handleLesson(service, user, body));
    if (action === "progress") return response(await handleProgress(service, user, body));
    throw new RequestError(400, "Unsupported course action.");
  } catch (error) {
    const requestError = error instanceof RequestError ? error : new RequestError(500, "The paid-course service could not complete that request.", "server_error");
    if (!(error instanceof RequestError)) console.error("course-access failed", error);
    return response({ error: requestError.message, code: requestError.code }, requestError.status);
  }
});
