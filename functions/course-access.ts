import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? "";

class RequestError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = "request_failed") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getAdminClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new RequestError(500, "Supabase service role client is not configured.", "server_configuration");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

function response(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    },
  });
}

async function authenticateStudent(req: Request, admin: SupabaseClient) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    throw new RequestError(401, "Sign in to access paid courses.", "authentication_required");
  }
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    throw new RequestError(401, "Sign in to access paid courses.", "authentication_required");
  }

  // Handle local dev preview tokens gracefully
  if (token === "local-session-token" || token.startsWith("demo-")) {
    return {
      id: "preview-user",
      email: "student@rehmanlawacademy.pk",
      full_name: "Enrolled Student",
      role: "student",
      mobile_number: "0300-1234567",
    };
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.email) {
    throw new RequestError(401, "Your session has expired. Please sign in again.", "session_expired");
  }

  const u = data.user;
  return {
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || u.email?.split("@")[0] || "Student",
    role: u.user_metadata?.role || "student",
    mobile_number: u.user_metadata?.mobile_number || "",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return response({}, 204);

  try {
    const admin = getAdminClient();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    // Public payment settings retrieval
    if (action === "get_payment_settings") {
      const { data } = await admin.from("PaymentSettings").select("*").limit(1).single();
      return response(data || {});
    }

    // Require authenticated user for course actions
    const user = await authenticateStudent(req, admin);
    const userEmail = String(user.email).toLowerCase();
    const isAdmin = user.role === "administrator" || userEmail === "admin@rehmanlawacademy.pk";

    // 1. DASHBOARD
    if (action === "dashboard") {
      const [coursesRes, paymentsRes, enrollmentsRes, progressRes, testsRes] = await Promise.all([
        admin.from("Course").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
        admin.from("CoursePaymentRequest").select("*").eq("student_email", userEmail).order("requested_at", { ascending: false }),
        admin.from("CourseEnrollment").select("*").eq("student_email", userEmail).order("created_at", { ascending: false }),
        admin.from("CourseProgress").select("*").eq("student_email", userEmail),
        admin.from("CourseTestResult").select("*").eq("student_email", userEmail).order("submitted_at", { ascending: false }),
      ]);

      return response({
        user,
        courses: coursesRes.data || [],
        payments: paymentsRes.data || [],
        enrollments: enrollmentsRes.data || [],
        progress: progressRes.data || [],
        test_results: testsRes.data || [],
      });
    }

    // 2. PAYMENT DETAILS FOR A COURSE
    if (action === "payment_details") {
      const courseSlug = String(body.course_slug || "").trim();
      const { data: course } = await admin.from("Course").select("*").eq("slug", courseSlug).single();
      if (!course) throw new RequestError(404, "Course not found.", "course_not_found");

      const [settingsRes, paymentRes, enrollmentRes] = await Promise.all([
        admin.from("PaymentSettings").select("*").limit(1).single(),
        admin.from("CoursePaymentRequest").select("*").eq("student_email", userEmail).eq("course_id", course.id).order("requested_at", { ascending: false }).limit(1).maybeSingle(),
        admin.from("CourseEnrollment").select("*").eq("student_email", userEmail).eq("course_id", course.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      return response({
        course,
        settings: settingsRes.data || null,
        payment: paymentRes.data || null,
        enrollment: enrollmentRes.data || null,
      });
    }

    // 3. SUBMIT PAYMENT PROOF
    if (action === "submit_payment_proof") {
      const courseSlug = String(body.course_slug || "").trim();
      const { data: course } = await admin.from("Course").select("*").eq("slug", courseSlug).single();
      if (!course) throw new RequestError(404, "Course not found.", "course_not_found");

      const proofImage = String(body.proof_image || "").trim();
      if (!proofImage) {
        throw new RequestError(400, "Payment proof screenshot is required.", "missing_proof");
      }

      const paymentMethod = String(body.payment_method || "bank").toLowerCase();
      const transactionReference = String(body.transaction_reference || "").trim();
      const paymentNote = String(body.payment_note || "").trim();
      const studentMobile = String(body.student_mobile || user.mobile_number || "").trim();

      // Check existing pending request
      const { data: existingRequests } = await admin
        .from("CoursePaymentRequest")
        .select("*")
        .eq("student_email", userEmail)
        .eq("course_id", course.id)
        .order("requested_at", { ascending: false })
        .limit(1);

      let savedRequest: any;
      const now = new Date().toISOString();

      if (existingRequests && existingRequests.length > 0 && existingRequests[0].payment_status !== "approved") {
        const { data: updated } = await admin
          .from("CoursePaymentRequest")
          .update({
            student_user_id: user.id,
            student_name: user.full_name,
            student_mobile: studentMobile,
            amount_pkr: Number(course.price_pkr || 0),
            currency: course.currency || "PKR",
            payment_method: paymentMethod,
            payment_provider: paymentMethod,
            payment_status: "pending",
            transaction_reference: transactionReference,
            proof_image: proofImage,
            payment_note: paymentNote,
            rejection_reason: null,
            requested_at: now,
            updated_at: now,
          })
          .eq("id", existingRequests[0].id)
          .select()
          .single();
        savedRequest = updated;
      } else {
        const { data: created } = await admin
          .from("CoursePaymentRequest")
          .insert({
            student_user_id: user.id,
            student_name: user.full_name,
            student_email: userEmail,
            student_mobile: studentMobile,
            course_id: course.id,
            course_slug: course.slug,
            course_title: course.title,
            amount_pkr: Number(course.price_pkr || 0),
            currency: course.currency || "PKR",
            payment_method: paymentMethod,
            payment_provider: paymentMethod,
            payment_status: "pending",
            transaction_reference: transactionReference,
            proof_image: proofImage,
            payment_note: paymentNote,
            requested_at: now,
          })
          .select()
          .single();
        savedRequest = created;
      }

      // Record pending enrollment entry if not already enrolled
      const { data: existingEnrollments } = await admin
        .from("CourseEnrollment")
        .select("*")
        .eq("student_email", userEmail)
        .eq("course_id", course.id)
        .limit(1);

      if (!existingEnrollments || existingEnrollments.length === 0) {
        await admin.from("CourseEnrollment").insert({
          student_user_id: user.id,
          student_email: userEmail,
          student_name: user.full_name,
          student_mobile: studentMobile,
          course_id: course.id,
          course_slug: course.slug,
          course_title: course.title,
          enrollment_status: "pending",
          payment_request_id: savedRequest?.id,
          amount_pkr: Number(course.price_pkr || 0),
          currency: course.currency || "PKR",
          enrolled_at: now,
        });
      }

      return response({ success: true, request: savedRequest });
    }

    // 4. CURRICULUM (STRICT BACKEND ENFORCEMENT)
    if (action === "curriculum") {
      const courseSlug = String(body.course_slug || "").trim();
      const { data: course } = await admin.from("Course").select("*").eq("slug", courseSlug).single();
      if (!course) throw new RequestError(404, "Course not found.", "course_not_found");

      // Verify active enrollment in database
      const { data: enrollment } = await admin
        .from("CourseEnrollment")
        .select("*")
        .eq("student_email", userEmail)
        .eq("course_id", course.id)
        .eq("enrollment_status", "active")
        .maybeSingle();

      if (!enrollment && !isAdmin) {
        throw new RequestError(403, "Access Denied: You do not have an active, approved enrollment for this course. Please submit your payment receipt for admin approval.", "enrollment_required");
      }

      const [modulesRes, lessonsRes, progressRes, testsRes] = await Promise.all([
        admin.from("CourseModule").select("id, title, description, sort_order").eq("course_id", course.id).eq("is_published", true).order("sort_order", { ascending: true }),
        admin.from("CourseLesson").select("id, module_id, title, description, duration_seconds, sort_order").eq("course_id", course.id).eq("is_published", true).order("sort_order", { ascending: true }),
        admin.from("CourseProgress").select("*").eq("student_email", userEmail).eq("course_id", course.id).maybeSingle(),
        admin.from("CourseTest").select("id, title, description, time_limit_minutes, passing_score").eq("course_id", course.id).eq("is_published", true),
      ]);

      return response({
        course,
        enrollment,
        modules: modulesRes.data || [],
        lessons: lessonsRes.data || [],
        progress: progressRes.data || null,
        tests: testsRes.data || [],
      });
    }

    // 5. LESSON DETAILS (STRICT BACKEND ENFORCEMENT)
    if (action === "lesson") {
      const courseSlug = String(body.course_slug || "").trim();
      const lessonId = String(body.lesson_id || "").trim();
      const { data: course } = await admin.from("Course").select("*").eq("slug", courseSlug).single();
      if (!course) throw new RequestError(404, "Course not found.", "course_not_found");

      // Check active enrollment
      const { data: enrollment } = await admin
        .from("CourseEnrollment")
        .select("*")
        .eq("student_email", userEmail)
        .eq("course_id", course.id)
        .eq("enrollment_status", "active")
        .maybeSingle();

      if (!enrollment && !isAdmin) {
        throw new RequestError(403, "Access Denied: Active paid enrollment is required to view this lesson.", "enrollment_required");
      }

      const { data: lesson } = await admin.from("CourseLesson").select("*").eq("id", lessonId).eq("course_id", course.id).eq("is_published", true).single();
      if (!lesson) throw new RequestError(404, "Lesson not found.", "lesson_not_found");

      const { data: module } = await admin.from("CourseModule").select("id, title").eq("id", lesson.module_id).single();
      const { data: allLessons } = await admin.from("CourseLesson").select("id, title").eq("course_id", course.id).eq("is_published", true).order("sort_order", { ascending: true });
      const index = (allLessons || []).findIndex((l) => l.id === lesson.id);

      const { data: progress } = await admin.from("CourseProgress").select("*").eq("student_email", userEmail).eq("course_id", course.id).maybeSingle();

      return response({
        course,
        enrollment,
        module,
        lesson,
        previous_lesson: index > 0 ? allLessons![index - 1] : null,
        next_lesson: index >= 0 && index < (allLessons?.length || 0) - 1 ? allLessons![index + 1] : null,
        progress: progress || null,
      });
    }

    // 6. RECORD PROGRESS
    if (action === "progress") {
      const courseSlug = String(body.course_slug || "").trim();
      const lessonId = String(body.lesson_id || "").trim();
      const { data: course } = await admin.from("Course").select("*").eq("slug", courseSlug).single();
      if (!course) throw new RequestError(404, "Course not found.", "course_not_found");

      const { data: enrollment } = await admin.from("CourseEnrollment").select("id").eq("student_email", userEmail).eq("course_id", course.id).eq("enrollment_status", "active").single();
      if (!enrollment && !isAdmin) throw new RequestError(403, "Active enrollment required.", "enrollment_required");

      const { data: allLessons } = await admin.from("CourseLesson").select("id").eq("course_id", course.id).eq("is_published", true);
      const { data: existingProgress } = await admin.from("CourseProgress").select("*").eq("student_email", userEmail).eq("course_id", course.id).maybeSingle();

      const completedIds: string[] = Array.isArray(existingProgress?.completed_lesson_ids) ? [...existingProgress.completed_lesson_ids] : [];
      if (body.completed === true && !completedIds.includes(lessonId)) {
        completedIds.push(lessonId);
      }

      const totalLessons = allLessons?.length || 1;
      const progressPercentage = Math.round((completedIds.length / totalLessons) * 100);
      const now = new Date().toISOString();

      let savedProgress: any;
      if (existingProgress) {
        const { data } = await admin.from("CourseProgress").update({
          completed_lesson_ids: completedIds,
          completed_lessons: completedIds.length,
          total_lessons: totalLessons,
          progress_percentage: progressPercentage,
          last_lesson_id: lessonId,
          last_activity_at: now,
          updated_at: now,
        }).eq("id", existingProgress.id).select().single();
        savedProgress = data;
      } else {
        const { data } = await admin.from("CourseProgress").insert({
          student_user_id: user.id,
          student_email: userEmail,
          course_id: course.id,
          course_slug: course.slug,
          enrollment_id: enrollment?.id,
          completed_lesson_ids: completedIds,
          completed_lessons: completedIds.length,
          total_lessons: totalLessons,
          progress_percentage: progressPercentage,
          last_lesson_id: lessonId,
          last_activity_at: now,
        }).select().single();
        savedProgress = data;
      }

      return response({ progress: savedProgress });
    }

    // 7. ADMIN ACTIONS (ADMIN ONLY)
    if (action.startsWith("admin_") || action === "update_payment_settings") {
      if (!isAdmin) {
        throw new RequestError(403, "Administrator privilege required.", "admin_required");
      }

      if (action === "update_payment_settings") {
        const updates = body.settings || {};
        const { data: existing } = await admin.from("PaymentSettings").select("id").limit(1).maybeSingle();
        let saved: any;
        if (existing) {
          const { data } = await admin.from("PaymentSettings").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
          saved = data;
        } else {
          const { data } = await admin.from("PaymentSettings").insert({ ...updates }).select().single();
          saved = data;
        }
        return response(saved);
      }

      if (action === "admin_get_payments") {
        const { data: payments } = await admin.from("CoursePaymentRequest").select("*").order("requested_at", { ascending: false });
        return response(payments || []);
      }

      if (action === "admin_approve_payment") {
        const paymentId = String(body.payment_id || "").trim();
        const { data: payment } = await admin.from("CoursePaymentRequest").select("*").eq("id", paymentId).single();
        if (!payment) throw new RequestError(404, "Payment request not found.", "not_found");

        const now = new Date().toISOString();

        // 1. Mark payment approved
        const { data: updatedPayment } = await admin.from("CoursePaymentRequest").update({
          payment_status: "approved",
          reviewed_at: now,
          reviewed_by: userEmail,
          updated_at: now,
        }).eq("id", paymentId).select().single();

        // 2. Check existing enrollment to prevent duplicates
        const { data: existingEnrollments } = await admin
          .from("CourseEnrollment")
          .select("*")
          .eq("student_email", payment.student_email)
          .eq("course_id", payment.course_id);

        let activeEnrollment: any;
        if (existingEnrollments && existingEnrollments.length > 0) {
          const { data: updated } = await admin.from("CourseEnrollment").update({
            enrollment_status: "active",
            payment_request_id: paymentId,
            amount_pkr: Number(payment.amount_pkr || 0),
            activated_at: now,
            approved_by: userEmail,
            updated_at: now,
          }).eq("id", existingEnrollments[0].id).select().single();
          activeEnrollment = updated;
        } else {
          const { data: created } = await admin.from("CourseEnrollment").insert({
            student_user_id: payment.student_user_id,
            student_email: payment.student_email,
            student_name: payment.student_name,
            student_mobile: payment.student_mobile,
            course_id: payment.course_id,
            course_slug: payment.course_slug,
            course_title: payment.course_title,
            enrollment_status: "active",
            payment_request_id: paymentId,
            amount_pkr: Number(payment.amount_pkr || 0),
            currency: payment.currency || "PKR",
            enrolled_at: payment.requested_at || now,
            activated_at: now,
            approved_by: userEmail,
          }).select().single();
          activeEnrollment = created;
        }

        return response({ payment: updatedPayment, enrollment: activeEnrollment });
      }

      if (action === "admin_reject_payment") {
        const paymentId = String(body.payment_id || "").trim();
        const reason = String(body.rejection_reason || "Payment proof could not be verified.").trim();
        const now = new Date().toISOString();

        const { data: updatedPayment } = await admin.from("CoursePaymentRequest").update({
          payment_status: "rejected",
          rejection_reason: reason,
          reviewed_at: now,
          reviewed_by: userEmail,
          updated_at: now,
        }).eq("id", paymentId).select().single();

        await admin.from("CourseEnrollment").update({
          enrollment_status: "rejected",
          updated_at: now,
        }).eq("student_email", updatedPayment.student_email).eq("course_id", updatedPayment.course_id);

        return response(updatedPayment);
      }
    }

    throw new RequestError(400, `Unsupported action: ${action}`);
  } catch (err: any) {
    const error = err instanceof RequestError ? err : new RequestError(500, err?.message || "Internal server error");
    return response({ error: error.message, code: error.code }, error.status);
  }
});
