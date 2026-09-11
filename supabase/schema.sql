-- ==============================================================================
-- REHMAN LAW ACADEMY - SUPABASE POSTGRESQL FULL SCHEMA & RLS POLICIES
-- Compatible with Supabase SQL Editor
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Administrator Helper Function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt() ->> 'email', '') ILIKE 'rehmanlawacademy@gmail.com' OR
    coalesce(auth.jwt() ->> 'email', '') = 'admin@rehmanlawacademy.pk' OR
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'administrator' OR
    coalesce(auth.jwt() ->> 'role', '') = 'service_role'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. CORE CATALOG TABLES
-- ==============================================================================

-- Exam
CREATE TABLE IF NOT EXISTS "Exam" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subject
CREATE TABLE IF NOT EXISTS "Subject" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_slug TEXT NOT NULL REFERENCES "Exam"(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_subject_exam_slug UNIQUE (exam_slug, slug)
);

-- Part
CREATE TABLE IF NOT EXISTS "Part" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  question_limit INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_part_exam_subject_slug UNIQUE (exam_slug, subject_slug, slug)
);

-- Question
CREATE TABLE IF NOT EXISTS "Question" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  part_slug TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(2) NOT NULL,
  explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  is_published BOOLEAN NOT NULL DEFAULT true,
  starter_review BOOLEAN NOT NULL DEFAULT false,
  review_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QuizDefinition
CREATE TABLE IF NOT EXISTS "QuizDefinition" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  exam_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  part_slug TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 20,
  time_limit_seconds INTEGER NOT NULL DEFAULT 900,
  randomize BOOLEAN NOT NULL DEFAULT true,
  passing_score NUMERIC NOT NULL DEFAULT 50,
  is_published BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 5. STUDENT LAT PRACTICE & STUDY ATTEMPTS
-- ==============================================================================

-- QuizAttempt
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL,
  quiz_id UUID REFERENCES "QuizDefinition"(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  exam_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  part_slug TEXT NOT NULL,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  question_count INTEGER NOT NULL DEFAULT 0,
  time_limit_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress',
  score INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  attempted_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  unattempted_count INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QuizAnswer
CREATE TABLE IF NOT EXISTS "QuizAnswer" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL,
  attempt_id UUID NOT NULL REFERENCES "QuizAttempt"(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookmark
CREATE TABLE IF NOT EXISTS "Bookmark" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
  exam_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  part_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_bookmark_student_question UNIQUE (student_email, question_id)
);

-- WrongQuestion
CREATE TABLE IF NOT EXISTS "WrongQuestion" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
  exam_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  part_slug TEXT NOT NULL,
  last_answer TEXT,
  times_wrong INTEGER NOT NULL DEFAULT 1,
  resolved BOOLEAN NOT NULL DEFAULT false,
  last_attempt_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_wrong_question_student_question UNIQUE (student_email, question_id)
);

-- Progress
CREATE TABLE IF NOT EXISTS "Progress" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL,
  exam_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  part_slug TEXT NOT NULL,
  total_questions INTEGER NOT NULL DEFAULT 0,
  answered_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  answered_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_question_id TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_progress_student_part UNIQUE (student_email, exam_slug, subject_slug, part_slug)
);

-- PracticeAnswer
CREATE TABLE IF NOT EXISTS "PracticeAnswer" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES "Question"(id) ON DELETE CASCADE,
  exam_slug TEXT NOT NULL,
  subject_slug TEXT NOT NULL,
  part_slug TEXT NOT NULL,
  practice_session TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. PAID COURSE SYSTEM & ACCESS ENFORCEMENT
-- ==============================================================================

-- Course
CREATE TABLE IF NOT EXISTS "Course" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  instructor TEXT,
  duration_label TEXT,
  lecture_count INTEGER NOT NULL DEFAULT 0,
  test_count INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PKR',
  price_pkr NUMERIC NOT NULL DEFAULT 0,
  price_configured BOOLEAN NOT NULL DEFAULT false,
  publication_status TEXT NOT NULL DEFAULT 'published',
  is_published BOOLEAN NOT NULL DEFAULT true,
  thumbnail_url TEXT,
  curriculum_summary TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CourseModule
CREATE TABLE IF NOT EXISTS "CourseModule" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CourseLesson (Protected Content)
CREATE TABLE IF NOT EXISTS "CourseLesson" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  module_id UUID NOT NULL REFERENCES "CourseModule"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  attachment_url TEXT,
  video_provider TEXT,
  video_reference TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CoursePaymentRequest (Manual verification workflow)
CREATE TABLE IF NOT EXISTS "CoursePaymentRequest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id TEXT,
  student_name TEXT,
  student_email TEXT NOT NULL,
  student_mobile TEXT,
  course_id UUID NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  amount_pkr NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PKR',
  payment_method TEXT NOT NULL DEFAULT 'bank', -- 'bank', 'easypaisa', 'jazzcash'
  payment_provider TEXT DEFAULT 'manual',
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'refunded'
  transaction_reference TEXT,
  proof_image TEXT NOT NULL,
  payment_note TEXT,
  rejection_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CourseEnrollment (Strict Access Authorization Token)
CREATE TABLE IF NOT EXISTS "CourseEnrollment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id TEXT,
  student_name TEXT,
  student_email TEXT NOT NULL,
  student_mobile TEXT,
  course_id UUID NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  enrollment_status TEXT NOT NULL DEFAULT 'pending', -- 'active', 'pending', 'suspended', 'rejected'
  payment_request_id UUID REFERENCES "CoursePaymentRequest"(id) ON DELETE SET NULL,
  amount_pkr NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'PKR',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  approved_by TEXT,
  last_activity_at TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_enrollment_student_course UNIQUE (student_email, course_id)
);

-- CourseProgress
CREATE TABLE IF NOT EXISTS "CourseProgress" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id TEXT,
  student_email TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  enrollment_id UUID REFERENCES "CourseEnrollment"(id) ON DELETE SET NULL,
  completed_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  progress_percentage NUMERIC NOT NULL DEFAULT 0,
  last_lesson_id TEXT,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_course_progress_student UNIQUE (student_email, course_id)
);

-- CourseTest
CREATE TABLE IF NOT EXISTS "CourseTest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER NOT NULL DEFAULT 15,
  passing_score NUMERIC NOT NULL DEFAULT 50,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CourseTestQuestion
CREATE TABLE IF NOT EXISTS "CourseTestQuestion" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES "CourseTest"(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer VARCHAR(2) NOT NULL,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CourseTestResult
CREATE TABLE IF NOT EXISTS "CourseTestResult" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES "CourseTest"(id) ON DELETE CASCADE,
  test_title TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_user_id TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PaymentSettings (Admin Configured Pakistan Payment Accounts)
CREATE TABLE IF NOT EXISTS "PaymentSettings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL DEFAULT 'Habib Bank Limited (HBL)',
  account_title TEXT NOT NULL DEFAULT 'Rehman Law Academy',
  account_number TEXT NOT NULL DEFAULT '00427991823103',
  iban TEXT NOT NULL DEFAULT 'PK36HABB0000427991823103',
  bank_instructions TEXT DEFAULT 'Transfer the course fee via 1Link or Raast. Save the digital transaction receipt or screenshot.',
  easypaisa_title TEXT NOT NULL DEFAULT 'Rehman Law Academy (Official)',
  easypaisa_number TEXT NOT NULL DEFAULT '0312-8891288',
  easypaisa_instructions TEXT DEFAULT 'Send the exact course fee to our official Easypaisa merchant wallet.',
  jazzcash_title TEXT NOT NULL DEFAULT 'Rehman Law Academy (Official)',
  jazzcash_number TEXT NOT NULL DEFAULT '0312-8891288',
  jazzcash_instructions TEXT DEFAULT 'Send fee to JazzCash wallet and upload clear confirmation receipt.',
  whatsapp_number TEXT NOT NULL DEFAULT '923128891288',
  whatsapp_url TEXT NOT NULL DEFAULT 'https://wa.me/923128891288',
  whatsapp_message TEXT DEFAULT 'Assalam-o-Alaikum Rehman Law Academy, I have submitted a payment request.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================

ALTER TABLE "Exam" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subject" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Part" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bookmark" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WrongQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PracticeAnswer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Course" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseModule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseLesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoursePaymentRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseProgress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseTest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseTestQuestion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CourseTestResult" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentSettings" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- Public Read Catalog Policies
CREATE POLICY "Public read Exam" ON "Exam" FOR SELECT USING (true);
CREATE POLICY "Admin write Exam" ON "Exam" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read Subject" ON "Subject" FOR SELECT USING (true);
CREATE POLICY "Admin write Subject" ON "Subject" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read Part" ON "Part" FOR SELECT USING (true);
CREATE POLICY "Admin write Part" ON "Part" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read Question" ON "Question" FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "Admin write Question" ON "Question" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read QuizDefinition" ON "QuizDefinition" FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "Admin write QuizDefinition" ON "QuizDefinition" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read Course" ON "Course" FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "Admin write Course" ON "Course" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read CourseModule" ON "CourseModule" FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "Admin write CourseModule" ON "CourseModule" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- STRICT BACKEND ENFORCEMENT: CourseLesson can ONLY be read by active enrolled students or admin
CREATE POLICY "Lessons restricted to active enrolled students or admin" ON "CourseLesson"
FOR SELECT USING (
  is_admin() OR (
    is_published = true AND EXISTS (
      SELECT 1 FROM "CourseEnrollment"
      WHERE "CourseEnrollment".course_id = "CourseLesson".course_id
        AND "CourseEnrollment".student_email = coalesce(auth.jwt() ->> 'email', '')
        AND "CourseEnrollment".enrollment_status = 'active'
    )
  )
);
CREATE POLICY "Admin write CourseLesson" ON "CourseLesson" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- CourseTests restricted to active enrolled students or admin
CREATE POLICY "Tests restricted to active enrolled students or admin" ON "CourseTest"
FOR SELECT USING (
  is_admin() OR (
    is_published = true AND EXISTS (
      SELECT 1 FROM "CourseEnrollment"
      WHERE "CourseEnrollment".course_id = "CourseTest".course_id
        AND "CourseEnrollment".student_email = coalesce(auth.jwt() ->> 'email', '')
        AND "CourseEnrollment".enrollment_status = 'active'
    )
  )
);
CREATE POLICY "Admin write CourseTest" ON "CourseTest" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Questions restricted to enrolled students or admin" ON "CourseTestQuestion"
FOR SELECT USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM "CourseTest" t
    JOIN "CourseEnrollment" e ON e.course_id = t.course_id
    WHERE t.id = "CourseTestQuestion".test_id
      AND e.student_email = coalesce(auth.jwt() ->> 'email', '')
      AND e.enrollment_status = 'active'
  )
);
CREATE POLICY "Admin write CourseTestQuestion" ON "CourseTestQuestion" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- CoursePaymentRequest Policies
-- Students can submit payment requests with status = 'pending'
CREATE POLICY "Students can submit pending payment request" ON "CoursePaymentRequest"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  student_email = coalesce(auth.jwt() ->> 'email', student_email) AND
  payment_status = 'pending'
);

-- Students view only their own payments; admin views all
CREATE POLICY "Students view own payments or admin view all" ON "CoursePaymentRequest"
FOR SELECT USING (
  is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', '')
);

-- ONLY Admin can approve or update payment request status!
CREATE POLICY "Admin only modify payment requests" ON "CoursePaymentRequest"
FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admin only delete payment requests" ON "CoursePaymentRequest"
FOR DELETE USING (is_admin());

-- CourseEnrollment Policies (CRITICAL: Student accounts CANNOT unlock themselves)
CREATE POLICY "Students view own enrollments or admin view all" ON "CourseEnrollment"
FOR SELECT USING (
  is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', '')
);

-- ONLY Admin can insert, update or activate enrollments!
CREATE POLICY "Admin only manage enrollments" ON "CourseEnrollment"
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Student Study & Progress Data Policies (Owner access)
CREATE POLICY "Owner access QuizAttempt" ON "QuizAttempt"
FOR ALL USING (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''))
WITH CHECK (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''));

CREATE POLICY "Owner access QuizAnswer" ON "QuizAnswer"
FOR ALL USING (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''))
WITH CHECK (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''));

CREATE POLICY "Owner access Bookmark" ON "Bookmark"
FOR ALL USING (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''))
WITH CHECK (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''));

CREATE POLICY "Owner access WrongQuestion" ON "WrongQuestion"
FOR ALL USING (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''))
WITH CHECK (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''));

CREATE POLICY "Owner access Progress" ON "Progress"
FOR ALL USING (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''))
WITH CHECK (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''));

CREATE POLICY "Owner access PracticeAnswer" ON "PracticeAnswer"
FOR ALL USING (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''))
WITH CHECK (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''));

CREATE POLICY "Owner access CourseProgress" ON "CourseProgress"
FOR ALL USING (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''))
WITH CHECK (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''));

CREATE POLICY "Owner access CourseTestResult" ON "CourseTestResult"
FOR ALL USING (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''))
WITH CHECK (is_admin() OR student_email = coalesce(auth.jwt() ->> 'email', ''));

-- PaymentSettings Policies
CREATE POLICY "Public read PaymentSettings" ON "PaymentSettings" FOR SELECT USING (true);
CREATE POLICY "Admin write PaymentSettings" ON "PaymentSettings" FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ==============================================================================
-- 9. SEED INITIAL PAYMENT SETTINGS
-- ==============================================================================
INSERT INTO "PaymentSettings" (
  id, bank_name, account_title, account_number, iban, bank_instructions,
  easypaisa_title, easypaisa_number, easypaisa_instructions,
  jazzcash_title, jazzcash_number, jazzcash_instructions,
  whatsapp_number, whatsapp_url, whatsapp_message
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Habib Bank Limited (HBL)',
  'Rehman Law Academy',
  '00427991823103',
  'PK36HABB0000427991823103',
  'Transfer fee via online banking / Raast / ATM. Take a clear screenshot of the successful transaction and upload it below.',
  'Rehman Law Academy (Official)',
  '0312-8891288',
  'Transfer fee to Easypaisa account. Upload receipt screenshot or note transaction ID.',
  'Rehman Law Academy (Official)',
  '0312-8891288',
  'Send via JazzCash mobile app to 0312-8891288 and upload receipt proof.',
  '923128891288',
  'https://wa.me/923128891288',
  'Assalam-o-Alaikum Rehman Law Academy, I submitted my course fee payment receipt.'
)
ON CONFLICT (id) DO NOTHING;
