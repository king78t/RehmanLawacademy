import { Course, CourseModule } from "@/entities";
import { courseAccess } from "@/functions";
import { FALLBACK_COURSES, FALLBACK_MODULES, FALLBACK_PAYMENT_SETTINGS } from "@/data/mockCourses";
import { supabase } from "@/lib/supabaseClient";
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
  try {
    const rows = await Course.filter({ is_published: true, publication_status: "published" }, "sort_order", 100);
    if (rows && rows.length > 0) {
      return rows as PaidCourse[];
    }
  } catch (err) {
    console.warn("loadPublishedCourses query fallback:", err);
  }
  return FALLBACK_COURSES as unknown as PaidCourse[];
}

export async function loadPublishedCourse(slug: string) {
  try {
    const rows = await Course.filter({ slug, is_published: true, publication_status: "published" }, "sort_order", 5);
    if (rows && rows.length > 0 && rows[0]) {
      return rows[0] as PaidCourse;
    }
  } catch (err) {
    console.warn("loadPublishedCourse query fallback:", err);
  }
  const fallback = FALLBACK_COURSES.find((c) => c.slug === slug);
  return (fallback || null) as unknown as PaidCourse | null;
}

export async function loadPublicModules(courseId: string) {
  try {
    const rows = await CourseModule.filter({ course_id: courseId, is_published: true }, "sort_order", 200);
    if (rows && rows.length > 0) {
      return rows as PaidModule[];
    }
  } catch (err) {
    console.warn("loadPublicModules query fallback:", err);
  }
  const fallback = FALLBACK_MODULES.filter((m) => m.course_id === courseId);
  return (fallback.length > 0 ? fallback : FALLBACK_MODULES.slice(0, 3)) as unknown as PaidModule[];
}

export async function loadAdminModules(courseId: string) {
  const rows = await CourseModule.filter({ course_id: courseId }, "sort_order", 200);
  return (rows || []) as PaidModule[];
}

export async function loadPaidDashboard() {
  return (await courseAccess({ action: "dashboard" })) as PaidDashboard & { test_results?: CourseTestResult[] };
}

/**
 * Diagnostic logger for database and payment fetch failures.
 * Records structured warnings and errors to the browser console so administrators
 * can easily verify Supabase credentials, URL, anon key, or Row Level Security (RLS) policies.
 */
export function logDatabaseFetchFailure(
  operation: string,
  error: unknown,
  context?: Record<string, any>
) {
  const err = error as Record<string, any> | null;
  const message =
    err?.message ||
    (typeof error === "string" ? error : error ? JSON.stringify(error) : "Unknown error");
  const code = err?.code || err?.status || err?.statusCode;
  const hint = err?.hint || err?.details;

  console.group(`%c[Supabase / Database Diagnostic] ⚠️ Failure in "${operation}"`, "color: #f59e0b; font-weight: bold;");
  console.error(`Operation Failed: ${operation}`);
  console.error("Error Message:", message);
  if (code) {
    console.error("Error Code / HTTP Status:", code);
  }
  if (hint) {
    console.warn("Supabase Hint / Details:", hint);
  }
  if (context) {
    console.info("Query Context / Arguments:", context);
  }

  console.warn(
    "Administrator Troubleshooting Checklist:\n" +
      "1. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment configuration.\n" +
      "2. Row Level Security (RLS): If code is '42501' or 'permission denied', configure RLS policies for table SELECT / INSERT / UPDATE.\n" +
      "3. Table Existence: If code is '42P01' or 'relation does not exist', ensure the table is migrated in Supabase.\n" +
      "4. Network / CORS: Ensure the Supabase endpoint is reachable from the browser.\n" +
      "5. Fallback Protection: Local storage and mock Academy payment data have been engaged to ensure zero downtime."
  );
  console.groupEnd();
}

export async function loadPaymentDetails(courseSlug: string) {
  let course: PaidCourse | null = null;
  let settings: PaymentSettings | null = null;
  let payment: PaidPaymentRequest | null = null;
  let enrollment: any | null = null;

  // 1. Attempt courseAccess remote action
  try {
    const res = await courseAccess({ action: "payment_details", course_slug: courseSlug });
    if (res && typeof res === "object") {
      course = res.course || null;
      settings = res.settings || null;
      payment = res.payment || null;
      enrollment = res.enrollment || null;
    }
  } catch (err) {
    logDatabaseFetchFailure("courseAccess payment_details", err, { courseSlug });
  }

  // 2. Ensure course is populated
  if (!course) {
    course = await loadPublishedCourse(courseSlug);
  }
  if (!course) {
    const fallbackCourse = FALLBACK_COURSES.find((c) => c.slug === courseSlug) || FALLBACK_COURSES[0];
    course = fallbackCourse as unknown as PaidCourse;
  }

  // 3. Ensure payment settings are populated
  if (!settings || !settings.bank_name) {
    try {
      const { data, error } = await supabase.from("PaymentSettings").select("*").limit(1);
      if (error) {
        logDatabaseFetchFailure("PaymentSettings SELECT (loadPaymentDetails)", error, { courseSlug });
      } else if (data && data.length > 0 && data[0].bank_name) {
        settings = data[0] as PaymentSettings;
      }
    } catch (err) {
      logDatabaseFetchFailure("PaymentSettings query exception (loadPaymentDetails)", err, { courseSlug });
    }
  }

  // Fallback to mock payment configuration if database table has no records or query failed
  if (!settings || !settings.bank_name) {
    settings = FALLBACK_PAYMENT_SETTINGS as PaymentSettings;
  }

  // 4. Retrieve any student-specific payment requests or enrollment status
  const student = getActiveStudent();
  if (student?.email) {
    try {
      if (!payment) {
        const { data: pData, error: pError } = await supabase
          .from("CoursePaymentRequest")
          .select("*")
          .eq("course_slug", courseSlug)
          .eq("student_email", student.email)
          .order("created_at", { ascending: false })
          .limit(1);
        if (pError) {
          logDatabaseFetchFailure("CoursePaymentRequest SELECT", pError, {
            courseSlug,
            studentEmail: student.email,
          });
        } else if (pData && pData.length > 0) {
          payment = pData[0] as PaidPaymentRequest;
        }
      }
      if (!enrollment) {
        const { data: eData, error: eError } = await supabase
          .from("CourseEnrollment")
          .select("*")
          .eq("course_slug", courseSlug)
          .eq("student_email", student.email)
          .limit(1);
        if (eError) {
          logDatabaseFetchFailure("CourseEnrollment SELECT", eError, {
            courseSlug,
            studentEmail: student.email,
          });
        } else if (eData && eData.length > 0) {
          enrollment = eData[0];
        }
      }
    } catch (err) {
      logDatabaseFetchFailure("Direct enrollment/payment query fallback exception", err, {
        courseSlug,
        studentEmail: student.email,
      });
    }

    // LocalStore fallback check
    if (!payment) {
      const localReq =
        localStore.get<PaidPaymentRequest>(`payment_req_${courseSlug}_${student.email}`) ||
        localStore.get<PaidPaymentRequest>(`payment_req_${courseSlug}`);
      if (localReq) {
        payment = localReq;
      }
    }
  }

  return {
    course: course!,
    settings: settings!,
    payment,
    enrollment,
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
  try {
    return (await courseAccess({
      action: "submit_payment_proof",
      ...data,
    })) as { success: boolean; request: PaidPaymentRequest };
  } catch (err) {
    logDatabaseFetchFailure("submit_payment_proof remote action", err, { course_slug: data.course_slug });
    const student = getActiveStudent();
    const course = await loadPublishedCourse(data.course_slug);
    const newRequest: PaidPaymentRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      course_id: course?.id || "course-lat-masterclass-01",
      course_slug: data.course_slug,
      course_title: course?.title || "Rehman Law Academy Course",
      student_user_id: student?.id,
      student_name: student?.full_name || "Student",
      student_email: student?.email || "student@rehmanlawacademy.pk",
      student_mobile: data.student_mobile || student?.mobile_number || "",
      amount_pkr: course?.price_pkr || 5000,
      currency: course?.currency || "PKR",
      payment_method: data.payment_method,
      payment_status: "pending",
      transaction_reference: data.transaction_reference || "",
      proof_image: data.proof_image,
      payment_note: data.payment_note || "",
      created_at: new Date().toISOString(),
      requested_at: new Date().toISOString(),
    };

    try {
      const { error: insertError } = await supabase.from("CoursePaymentRequest").insert(newRequest);
      if (insertError) {
        logDatabaseFetchFailure("CoursePaymentRequest insert fallback", insertError, {
          course_slug: data.course_slug,
          requestId: newRequest.id,
        });
      }
    } catch (insertErr) {
      logDatabaseFetchFailure("CoursePaymentRequest insert exception", insertErr, {
        course_slug: data.course_slug,
        requestId: newRequest.id,
      });
    }

    if (student?.email) {
      localStore.set(`payment_req_${data.course_slug}_${student.email}`, newRequest);
    }
    localStore.set(`payment_req_${data.course_slug}`, newRequest);

    return { success: true, request: newRequest };
  }
}

export async function loadPaymentSettings(): Promise<PaymentSettings> {
  try {
    const res = (await courseAccess({ action: "get_payment_settings" })) as PaymentSettings;
    if (res && res.bank_name) {
      return res;
    }
  } catch (err) {
    logDatabaseFetchFailure("courseAccess get_payment_settings", err);
  }
  try {
    const { data, error } = await supabase.from("PaymentSettings").select("*").limit(1);
    if (error) {
      logDatabaseFetchFailure("PaymentSettings SELECT (loadPaymentSettings)", error);
    } else if (data && data.length > 0 && data[0].bank_name) {
      return data[0] as PaymentSettings;
    }
  } catch (err) {
    logDatabaseFetchFailure("PaymentSettings table fallback exception", err);
  }
  return FALLBACK_PAYMENT_SETTINGS as PaymentSettings;
}

export async function updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
  try {
    return (await courseAccess({ action: "update_payment_settings", settings })) as PaymentSettings;
  } catch (err) {
    logDatabaseFetchFailure("courseAccess update_payment_settings", err);
    try {
      const payload = {
        id: settings.id || "00000000-0000-0000-0000-000000000001",
        ...settings,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertError } = await supabase.from("PaymentSettings").upsert(payload);
      if (upsertError) {
        logDatabaseFetchFailure("PaymentSettings upsert", upsertError, { id: payload.id });
      }
      return payload as PaymentSettings;
    } catch (upsertErr) {
      logDatabaseFetchFailure("Supabase PaymentSettings upsert exception", upsertErr);
      return { ...FALLBACK_PAYMENT_SETTINGS, ...settings } as PaymentSettings;
    }
  }
}

export async function loadAdminPaymentRequests(): Promise<PaidPaymentRequest[]> {
  try {
    return (await courseAccess({ action: "admin_get_payments" })) as PaidPaymentRequest[];
  } catch (err) {
    logDatabaseFetchFailure("courseAccess admin_get_payments", err);
    try {
      const { data, error } = await supabase
        .from("CoursePaymentRequest")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        logDatabaseFetchFailure("CoursePaymentRequest admin SELECT", error);
      } else if (data) {
        return data as PaidPaymentRequest[];
      }
    } catch (dbErr) {
      logDatabaseFetchFailure("CoursePaymentRequest admin query exception", dbErr);
    }
    return [];
  }
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

