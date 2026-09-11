import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  CreditCard,
  BookOpen,
  GraduationCap,
  Settings,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Plus,
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Eye,
  Trash2,
  Edit3,
  Filter,
  ArrowUpRight,
  Phone,
  MessageSquare,
  Building,
  DollarSign,
  AlertTriangle,
  FileText,
  Layers,
  HelpCircle,
  Save,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { FALLBACK_COURSES, FALLBACK_MODULES } from '../data/mockCourses';

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface PaymentRequest {
  id: string;
  student_user_id?: string;
  student_name: string;
  student_email: string;
  student_mobile?: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  amount_pkr: number;
  currency?: string;
  payment_method: string;
  payment_provider?: string;
  payment_status: 'pending' | 'approved' | 'rejected' | 'refunded';
  transaction_reference?: string;
  proof_image: string;
  payment_note?: string;
  rejection_reason?: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

interface Enrollment {
  id: string;
  student_user_id?: string;
  student_name: string;
  student_email: string;
  student_mobile?: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  enrollment_status: string;
  amount_pkr: number;
  enrolled_at: string;
  activated_at?: string;
  approved_by?: string;
}

interface Course {
  id: string;
  slug: string;
  title: string;
  short_description?: string;
  description?: string;
  instructor?: string;
  duration_label?: string;
  lecture_count: number;
  test_count: number;
  currency: string;
  price_pkr: number;
  is_published: boolean;
  thumbnail_url?: string;
  created_at: string;
}

interface CourseModule {
  id: string;
  course_id: string;
  course_slug: string;
  title: string;
  description?: string;
  sort_order: number;
  is_published: boolean;
}

interface Question {
  id: string;
  exam_slug: string;
  subject_slug: string;
  part_slug: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  sort_order?: number;
  created_at?: string;
}

interface PaymentSettingsData {
  id: string;
  bank_name: string;
  account_title: string;
  account_number: string;
  iban: string;
  bank_instructions: string;
  easypaisa_title: string;
  easypaisa_number: string;
  easypaisa_instructions?: string;
  jazzcash_title: string;
  jazzcash_number: string;
  jazzcash_instructions?: string;
  whatsapp_number: string;
  whatsapp_url?: string;
  whatsapp_message?: string;
  updated_at?: string;
}

interface AdminUser {
  id: string;
  email: string;
  role?: string;
  full_name?: string;
}

const DEFAULT_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

// ==========================================
// MAIN ADMIN DASHBOARD COMPONENT
// ==========================================
export default function AdminDashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'questions' | 'courses' | 'settings'>('overview');

  // Auth State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('RehmanLawacademy@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Rehman898#');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Global App State
  const [loading, setLoading] = useState(false);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalEnrollments: 0,
    pendingPayments: 0,
    totalCourses: 0,
    totalQuestions: 0,
  });

  // Data Collections
  const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([]);
  const [allPayments, setAllPayments] = useState<PaymentRequest[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsData>({
    id: DEFAULT_SETTINGS_ID,
    bank_name: 'Habib Bank Limited (HBL)',
    account_title: 'Rehman Law Academy',
    account_number: '00427991823103',
    iban: 'PK36HABB0000427991823103',
    bank_instructions: 'Transfer fee via 1Link or Raast. Save digital receipt screenshot.',
    easypaisa_title: 'Rehman Law Academy (Official)',
    easypaisa_number: '0312-8891288',
    jazzcash_title: 'Rehman Law Academy (Official)',
    jazzcash_number: '0312-8891288',
    whatsapp_number: '923128891288',
    whatsapp_message: 'Assalam-o-Alaikum Rehman Law Academy, I submitted my course fee receipt.',
  });

  // Modals & Popups
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Payment receipt could not be verified in academy bank statement.');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Question Form State
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState<Partial<Question>>({
    exam_slug: 'lat',
    subject_slug: 'pakistan-studies',
    part_slug: 'part-1',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A',
    explanation: '',
    difficulty: 'medium',
    is_published: true,
  });

  // Filters for Questions
  const [examFilter, setExamFilter] = useState('lat');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [partFilter, setPartFilter] = useState('all');
  const [questionSearch, setQuestionSearch] = useState('');

  // Course Inspection Modal
  const [selectedCourseForView, setSelectedCourseForView] = useState<Course | null>(null);

  // Auto-dismiss alerts
  useEffect(() => {
    if (globalMessage) {
      const timer = setTimeout(() => setGlobalMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage]);

  // ----------------------------------------------------
  // SECTION A: AUTHENTICATION CHECK & LOGIN
  // ----------------------------------------------------
  const checkSession = useCallback(async () => {
    setAuthChecking(true);
    try {
      const res = await supabase.auth.getUser();
      if (res?.data?.user) {
        const u = res.data.user;
        const email = (u.email || '').toLowerCase();
        const role = u.user_metadata?.role;
        if (
          email === 'rehmanlawacademy@gmail.com' ||
          email === 'admin@rehmanlawacademy.pk' ||
          role === 'administrator'
        ) {
          setCurrentUser({
            id: u.id,
            email: u.email || 'RehmanLawacademy@gmail.com',
            role: 'administrator',
            full_name: u.user_metadata?.full_name || 'Academy Administrator',
          });
        }
      }
    } catch (err) {
      console.warn('Session check error:', err);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const email = loginEmail.trim();
    const password = loginPassword.trim();

    if (!email || !password) {
      setAuthError('Please provide both administrator email and password.');
      setAuthLoading(false);
      return;
    }

    try {
      const res = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (res.error) {
        throw res.error;
      }

      const u = res.data?.user;
      setCurrentUser({
        id: u?.id || 'admin-user',
        email: u?.email || email,
        role: 'administrator',
        full_name: u?.user_metadata?.full_name || 'Academy Administrator',
      });
      setGlobalMessage({ type: 'success', text: 'Welcome, Administrator. Session authorized.' });
    } catch (err: any) {
      console.error('Admin Login failed:', err);
      setAuthError(err?.message || 'Invalid administrator credentials. Please check your password.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setGlobalMessage({ type: 'success', text: 'Signed out from Admin Dashboard.' });
  };

  // ----------------------------------------------------
  // SECTION B, C, D, E, F: FETCH ALL DATA
  // ----------------------------------------------------
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      // 1. Fetch Payment Requests
      const paymentsRes = await supabase
        .from('CoursePaymentRequest')
        .select('*')
        .order('requested_at', { ascending: false });

      const payData: PaymentRequest[] = paymentsRes.data || [];
      setAllPayments(payData);
      const pending = payData.filter((p) => p.payment_status === 'pending');
      setPendingPayments(pending);

      // 2. Fetch Enrollments
      const enrollmentsRes = await supabase
        .from('CourseEnrollment')
        .select('*')
        .order('enrolled_at', { ascending: false });
      const enrollData: Enrollment[] = enrollmentsRes.data || [];
      setEnrollments(enrollData);

      // 3. Fetch Courses & Modules
      const coursesRes = await supabase
        .from('Course')
        .select('*')
        .order('sort_order', { ascending: true });
      const rawCourses: Course[] = coursesRes.data || [];
      const effectiveCourses = rawCourses.length > 0 ? rawCourses : (FALLBACK_COURSES as Course[]);
      setCourses(effectiveCourses);

      const modulesRes = await supabase
        .from('CourseModule')
        .select('*')
        .order('sort_order', { ascending: true });
      const rawModules: CourseModule[] = modulesRes.data || [];
      const effectiveModules = rawModules.length > 0 ? rawModules : (FALLBACK_MODULES as CourseModule[]);
      setModules(effectiveModules);

      // 4. Fetch Question Bank
      const questionsRes = await supabase
        .from('Question')
        .select('*')
        .order('sort_order', { ascending: true });
      const qData: Question[] = questionsRes.data || [];
      setQuestions(qData);

      // 5. Fetch Payment Gateway Settings
      const settingsRes = await supabase
        .from('PaymentSettings')
        .select('*')
        .limit(1);

      if (settingsRes.data && settingsRes.data.length > 0) {
        setPaymentSettings(settingsRes.data[0]);
      }

      // Update Metrics
      setMetrics({
        totalEnrollments: enrollData.filter((e) => e.enrollment_status === 'active').length,
        pendingPayments: pending.length,
        totalCourses: effectiveCourses.filter((c) => c.is_published).length,
        totalQuestions: qData.length,
      });
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setGlobalMessage({ type: 'error', text: 'Failed to synchronize data with Supabase.' });
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      void fetchDashboardData();
    }
  }, [currentUser, fetchDashboardData]);

  // ----------------------------------------------------
  // SECTION C: FEE APPROVAL & REJECTION ACTIONS
  // ----------------------------------------------------
  const handleApprovePayment = async (payment: PaymentRequest) => {
    setProcessingAction(payment.id);
    try {
      const now = new Date().toISOString();
      const adminEmail = currentUser?.email || 'RehmanLawacademy@gmail.com';

      // 1. Update Payment Request status to approved
      await supabase
        .from('CoursePaymentRequest')
        .update({
          payment_status: 'approved',
          reviewed_at: now,
          reviewed_by: adminEmail,
        })
        .eq('id', payment.id);

      // 2. Automatically upsert/create active CourseEnrollment
      const existingEnrollment = enrollments.find(
        (e) =>
          e.student_email.toLowerCase() === payment.student_email.toLowerCase() &&
          (e.course_id === payment.course_id || e.course_slug === payment.course_slug)
      );

      if (existingEnrollment) {
        await supabase
          .from('CourseEnrollment')
          .update({
            enrollment_status: 'active',
            payment_request_id: payment.id,
            amount_pkr: payment.amount_pkr,
            activated_at: now,
            approved_by: adminEmail,
          })
          .eq('id', existingEnrollment.id);
      } else {
        await supabase
          .from('CourseEnrollment')
          .insert({
            student_user_id: payment.student_user_id || 'user-' + Date.now(),
            student_name: payment.student_name,
            student_email: payment.student_email,
            student_mobile: payment.student_mobile || '',
            course_id: payment.course_id,
            course_slug: payment.course_slug,
            course_title: payment.course_title,
            enrollment_status: 'active',
            payment_request_id: payment.id,
            amount_pkr: payment.amount_pkr,
            currency: payment.currency || 'PKR',
            enrolled_at: payment.requested_at || now,
            activated_at: now,
            approved_by: adminEmail,
          });
      }

      setGlobalMessage({
        type: 'success',
        text: `Successfully approved fee payment for ${payment.student_name}. Course access unlocked!`,
      });

      // Refresh data
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Approve failed:', err);
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to approve payment request.' });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectingPayment) return;
    setProcessingAction(rejectingPayment.id);

    try {
      const now = new Date().toISOString();
      const adminEmail = currentUser?.email || 'RehmanLawacademy@gmail.com';

      // 1. Update Payment Request status to rejected
      await supabase
        .from('CoursePaymentRequest')
        .update({
          payment_status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: now,
          reviewed_by: adminEmail,
        })
        .eq('id', rejectingPayment.id);

      // 2. If enrollment was pending, mark rejected
      const existingEnrollment = enrollments.find(
        (e) =>
          e.student_email.toLowerCase() === rejectingPayment.student_email.toLowerCase() &&
          (e.course_id === rejectingPayment.course_id || e.course_slug === rejectingPayment.course_slug)
      );

      if (existingEnrollment) {
        await supabase
          .from('CourseEnrollment')
          .update({
            enrollment_status: 'rejected',
          })
          .eq('id', existingEnrollment.id);
      }

      setGlobalMessage({
        type: 'success',
        text: `Payment request for ${rejectingPayment.student_name} marked rejected. Reason logged.`,
      });

      setRejectingPayment(null);
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Reject failed:', err);
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to reject payment request.' });
    } finally {
      setProcessingAction(null);
    }
  };

  // ----------------------------------------------------
  // SECTION D: QUESTION BANK CRUD
  // ----------------------------------------------------
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchExam = examFilter === 'all' || q.exam_slug === examFilter;
      const matchSubject = subjectFilter === 'all' || q.subject_slug === subjectFilter;
      const matchPart = partFilter === 'all' || q.part_slug === partFilter;
      const matchSearch =
        !questionSearch ||
        q.question_text.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.option_a.toLowerCase().includes(questionSearch.toLowerCase()) ||
        q.option_b.toLowerCase().includes(questionSearch.toLowerCase());
      return matchExam && matchSubject && matchPart && matchSearch;
    });
  }, [questions, examFilter, subjectFilter, partFilter, questionSearch]);

  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionForm({
      exam_slug: examFilter !== 'all' ? examFilter : 'lat',
      subject_slug: subjectFilter !== 'all' ? subjectFilter : 'pakistan-studies',
      part_slug: partFilter !== 'all' ? partFilter : 'part-1',
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'A',
      explanation: '',
      difficulty: 'medium',
      is_published: true,
      sort_order: questions.length + 1,
    });
    setQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setQuestionForm({ ...q });
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question_text || !questionForm.option_a || !questionForm.option_b) {
      setGlobalMessage({ type: 'error', text: 'Please fill in question text and at least options A and B.' });
      return;
    }

    try {
      if (editingQuestion) {
        // Update
        await supabase
          .from('Question')
          .update({
            exam_slug: questionForm.exam_slug,
            subject_slug: questionForm.subject_slug,
            part_slug: questionForm.part_slug,
            question_text: questionForm.question_text,
            option_a: questionForm.option_a,
            option_b: questionForm.option_b,
            option_c: questionForm.option_c || '',
            option_d: questionForm.option_d || '',
            correct_answer: questionForm.correct_answer,
            explanation: questionForm.explanation || '',
            difficulty: questionForm.difficulty || 'medium',
            is_published: questionForm.is_published ?? true,
          })
          .eq('id', editingQuestion.id);

        setGlobalMessage({ type: 'success', text: 'Question updated successfully.' });
      } else {
        // Insert
        await supabase
          .from('Question')
          .insert({
            exam_slug: questionForm.exam_slug || 'lat',
            subject_slug: questionForm.subject_slug || 'pakistan-studies',
            part_slug: questionForm.part_slug || 'part-1',
            question_text: questionForm.question_text,
            option_a: questionForm.option_a,
            option_b: questionForm.option_b,
            option_c: questionForm.option_c || '',
            option_d: questionForm.option_d || '',
            correct_answer: questionForm.correct_answer || 'A',
            explanation: questionForm.explanation || '',
            difficulty: questionForm.difficulty || 'medium',
            is_published: questionForm.is_published ?? true,
            sort_order: questions.length + 1,
          });

        setGlobalMessage({ type: 'success', text: 'New question added to Question Bank.' });
      }

      setQuestionModalOpen(false);
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Save question failed:', err);
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to save question.' });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      await supabase.from('Question').delete().eq('id', id);
      setGlobalMessage({ type: 'success', text: 'Question deleted from bank.' });
      await fetchDashboardData();
    } catch (err: any) {
      console.error('Delete question failed:', err);
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to delete question.' });
    }
  };

  const handleToggleQuestionPublish = async (q: Question) => {
    try {
      await supabase
        .from('Question')
        .update({ is_published: !q.is_published })
        .eq('id', q.id);
      await fetchDashboardData();
    } catch (err) {
      console.error('Toggle status failed:', err);
    }
  };

  // ----------------------------------------------------
  // SECTION F: PAYMENT GATEWAY SETTINGS SAVE
  // ----------------------------------------------------
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        id: paymentSettings.id || DEFAULT_SETTINGS_ID,
        bank_name: paymentSettings.bank_name,
        account_title: paymentSettings.account_title,
        account_number: paymentSettings.account_number,
        iban: paymentSettings.iban,
        bank_instructions: paymentSettings.bank_instructions,
        easypaisa_title: paymentSettings.easypaisa_title,
        easypaisa_number: paymentSettings.easypaisa_number,
        jazzcash_title: paymentSettings.jazzcash_title,
        jazzcash_number: paymentSettings.jazzcash_number,
        whatsapp_number: paymentSettings.whatsapp_number,
        whatsapp_message: paymentSettings.whatsapp_message,
        updated_at: new Date().toISOString(),
      };

      // Check if row exists, then update or insert
      const existing = await supabase.from('PaymentSettings').select('id').limit(1);
      if (existing.data && existing.data.length > 0) {
        await supabase
          .from('PaymentSettings')
          .update(payload)
          .eq('id', existing.data[0].id);
      } else {
        await supabase.from('PaymentSettings').insert(payload);
      }

      setGlobalMessage({ type: 'success', text: 'Payment gateway account details saved and updated.' });
    } catch (err: any) {
      console.error('Failed to save payment settings:', err);
      setGlobalMessage({ type: 'error', text: err?.message || 'Failed to update payment settings.' });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // RENDER: AUTHENTICATION GUARD (Section A)
  // ----------------------------------------------------
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-semibold tracking-wide text-slate-400">Verifying Administrative Access...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="bg-gradient-to-r from-emerald-900/60 via-slate-900 to-emerald-950/60 p-6 border-b border-slate-800 text-center relative">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 mb-3 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Rehman Law Academy</h1>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mt-1">
              Academic Controller & Admin Portal
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
            {authError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="login-email">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="RehmanLawacademy@gmail.com"
                  className="w-full h-10 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-9 pr-3 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50 mt-2"
            >
              {authLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Sign In to Admin Portal
                </>
              )}
            </button>

            {/* Quick Demo Credentials Reminder */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-500">Configured Master Credentials:</p>
              <div className="mt-2 inline-flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-300">
                <span>RehmanLawacademy@gmail.com</span>
                <span className="text-slate-600">•</span>
                <span>Rehman898#</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: MAIN ADMIN DASHBOARD (Sections B - F)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* ==================================================== */}
      {/* SIDEBAR NAVIGATION */}
      {/* ==================================================== */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col flex-shrink-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white leading-tight">Rehman Law Academy</h2>
            <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Control Panel</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-3 space-y-1 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4" />
              <span>Overview Analytics</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'payments'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4" />
              <span>Fee Verifications</span>
            </div>
            {metrics.pendingPayments > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {metrics.pendingPayments}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'questions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4" />
              <span>Question Bank (LAT)</span>
            </div>
            <span className="text-[11px] text-slate-500">{metrics.totalQuestions}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'courses'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-4 h-4" />
              <span>Courses & Students</span>
            </div>
            <span className="text-[11px] text-slate-500">{metrics.totalCourses}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4" />
              <span>Payment Gateway</span>
            </div>
          </button>
        </nav>

        {/* User Badge & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{currentUser.email}</p>
              <p className="text-[10px] font-medium text-emerald-400">Principal Admin</p>
            </div>
            <button
              type="button"
              onClick={handleAdminLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ==================================================== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top App Bar */}
        <header className="h-16 px-6 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white tracking-tight">
              {activeTab === 'overview' && 'Academy Analytics & Health'}
              {activeTab === 'payments' && 'Pending Fee Verifications'}
              {activeTab === 'questions' && 'LAT Examination Question Bank'}
              {activeTab === 'courses' && 'Paid Courses & Enrolled Students'}
              {activeTab === 'settings' && 'Pakistan Payment Gateway Accounts'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Student View</span>
            </a>
          </div>
        </header>

        {/* Global Toast / Alert */}
        {globalMessage && (
          <div className="p-4 px-6">
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-lg transition-all ${
                globalMessage.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {globalMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{globalMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalMessage(null)}
                className="text-slate-400 hover:text-white ml-3"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* View Container */}
        <div className="p-6 space-y-6 flex-1">
          {/* ==================================================== */}
          {/* TAB 1: OVERVIEW & ANALYTICS (Section B) */}
          {/* ==================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 4 Analytics KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Enrolled Students */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Active Enrollments
                    </span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-white">{metrics.totalEnrollments}</span>
                    <p className="text-xs text-slate-500 mt-1">Verified Paid Students</p>
                  </div>
                </div>

                {/* 2. Pending Fee Verifications */}
                <div
                  onClick={() => setActiveTab('payments')}
                  className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden cursor-pointer hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Pending Approvals
                    </span>
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-3xl font-black text-amber-400">{metrics.pendingPayments}</span>
                    {metrics.pendingPayments > 0 && (
                      <span className="text-[11px] font-bold text-amber-400/90 underline">Review Now &rarr;</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Awaiting Receipt Verification</p>
                </div>

                {/* 3. Total Published Courses */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Published Courses
                    </span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-white">{metrics.totalCourses}</span>
                    <p className="text-xs text-slate-500 mt-1">Online LAT & Law Programs</p>
                  </div>
                </div>

                {/* 4. Total Questions Bank */}
                <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Question Bank
                    </span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-black text-white">{metrics.totalQuestions}</span>
                    <p className="text-xs text-slate-500 mt-1">MCQs for Practice & Mock Tests</p>
                  </div>
                </div>
              </div>

              {/* Pending Queue Fast-Action Banner */}
              {pendingPayments.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-200">
                        {pendingPayments.length} Student Payment Request{pendingPayments.length > 1 ? 's' : ''} Require
                        Verification
                      </h4>
                      <p className="text-xs text-amber-300/80 mt-0.5">
                        Students have submitted transfer receipts via Bank Transfer or Easypaisa. Verify receipts to
                        unlock course curriculum.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('payments')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex-shrink-0"
                  >
                    Open Verification Queue
                  </button>
                </div>
              )}

              {/* Recent Activity Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Payments Box */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      Recent Payment Transactions
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('payments')}
                      className="text-xs text-emerald-400 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {allPayments.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No payment records found.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {allPayments.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-white">{p.student_name}</p>
                            <p className="text-slate-400 text-[11px]">{p.course_title}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-400">PKR {Number(p.amount_pkr).toLocaleString()}</span>
                            <div className="mt-0.5">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  p.payment_status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : p.payment_status === 'rejected'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {p.payment_status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* System Configuration Status */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-400" />
                    Academy Payment Accounts Overview
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                      <div className="flex justify-between font-semibold text-slate-300">
                        <span>Bank Title:</span>
                        <span className="text-white">{paymentSettings.bank_name}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 mt-1">
                        <span>Account / IBAN:</span>
                        <span className="font-mono text-emerald-300">{paymentSettings.iban}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                      <div className="flex justify-between font-semibold text-slate-300">
                        <span>Easypaisa Merchant:</span>
                        <span className="text-white">{paymentSettings.easypaisa_title}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 mt-1">
                        <span>Mobile Wallet:</span>
                        <span className="font-mono text-emerald-300">{paymentSettings.easypaisa_number}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                      <div className="flex justify-between font-semibold text-slate-300">
                        <span>WhatsApp Official Desk:</span>
                        <span className="font-mono text-emerald-300">+{paymentSettings.whatsapp_number}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors"
                    >
                      Update Bank & Wallet Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: PENDING FEE APPROVAL WORKFLOW (Section C) */}
          {/* ==================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Table Header / Subtitle */}
                <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-white">Pending Fee Verifications</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verify bank receipts and approve student access to video lectures and mock examinations.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold">
                      {pendingPayments.length} Pending Verification
                    </span>
                  </div>
                </div>

                {/* Table */}
                {pendingPayments.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">No Pending Payment Requests</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      All submitted student payment requests have been reviewed and approved or addressed.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4">Student Info</th>
                          <th className="py-3 px-4">Course Title</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Method & Ref</th>
                          <th className="py-3 px-4">Proof Receipt</th>
                          <th className="py-3 px-4">Date Requested</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {pendingPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-white">{p.student_name}</p>
                              <p className="text-slate-400 text-[11px] font-mono">{p.student_email}</p>
                              {p.student_mobile && (
                                <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3" /> {p.student_mobile}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-slate-200">{p.course_title}</span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-emerald-400 whitespace-nowrap">
                              PKR {Number(p.amount_pkr).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="capitalize px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[11px] font-medium border border-slate-700">
                                {p.payment_method || 'Bank Transfer'}
                              </span>
                              {p.transaction_reference && (
                                <p className="text-[11px] text-slate-400 font-mono mt-1">
                                  TxID: {p.transaction_reference}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              {p.proof_image ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(p.proof_image)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                  View Receipt
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[11px]">No image attached</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                              {p.requested_at ? new Date(p.requested_at).toLocaleDateString() : 'Today'}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleApprovePayment(p)}
                                  disabled={processingAction === p.id}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingPayment(p);
                                    setRejectionReason('Payment receipt could not be verified in academy bank statement.');
                                  }}
                                  disabled={processingAction === p.id}
                                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold rounded-lg text-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Historical Records Toggle / Past Approvals */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  All History ({allPayments.length} records)
                </h3>
                <div className="space-y-2">
                  {allPayments
                    .filter((p) => p.payment_status !== 'pending')
                    .slice(0, 5)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">{item.student_name}</span>
                          <span className="text-slate-500 ml-2">({item.course_title})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-300">PKR {Number(item.amount_pkr).toLocaleString()}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.payment_status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {item.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: QUESTION BANK MANAGER (Section D) */}
          {/* ==================================================== */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              {/* Controls & Filter Bar */}
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Exam Filter */}
                  <select
                    value={examFilter}
                    onChange={(e) => setExamFilter(e.target.value)}
                    className="h-10 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  >
                    <option value="lat">Exam: LAT (Law Admission Test)</option>
                    <option value="all">All Exams</option>
                  </select>

                  {/* Subject Filter */}
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="h-10 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Subjects</option>
                    <option value="pakistan-studies">Pakistan Studies</option>
                    <option value="islamic-studies">Islamic Studies</option>
                    <option value="general-knowledge">General Knowledge</option>
                    <option value="english">English</option>
                    <option value="urdu">Urdu</option>
                    <option value="maths">Basic Math</option>
                  </select>

                  {/* Part Filter */}
                  <select
                    value={partFilter}
                    onChange={(e) => setPartFilter(e.target.value)}
                    className="h-10 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Parts</option>
                    <option value="part-1">Part 1</option>
                    <option value="part-2">Part 2</option>
                    <option value="part-3">Part 3</option>
                  </select>

                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="Search questions..."
                      className="h-10 pl-9 pr-3 w-full text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddQuestion}
                  className="w-full md:w-auto h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center justify-center gap-2 shadow-lg transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add New Question
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>Showing {filteredQuestions.length} of {questions.length} questions</span>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                    <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">No questions matched your filter.</p>
                    <p className="text-xs text-slate-500 mt-1">Try changing filters or click &ldquo;Add New Question&rdquo;.</p>
                  </div>
                ) : (
                  filteredQuestions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] rounded font-bold">
                            #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded font-bold uppercase">
                            {q.subject_slug}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded uppercase font-semibold">
                            {q.part_slug}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded font-bold uppercase ${
                              q.difficulty === 'easy'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : q.difficulty === 'hard'
                                ? 'text-rose-400 bg-rose-500/10'
                                : 'text-amber-400 bg-amber-500/10'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                              q.is_published ? 'text-emerald-300 bg-emerald-950/60' : 'text-slate-400 bg-slate-800'
                            }`}
                          >
                            {q.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleQuestionPublish(q)}
                            title={q.is_published ? 'Unpublish' : 'Publish'}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(q)}
                            title="Edit Question"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            title="Delete Question"
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <p className="text-sm font-semibold text-white leading-relaxed">{q.question_text}</p>

                      {/* 4 Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div
                          className={`p-2.5 rounded-xl border ${
                            q.correct_answer === 'A'
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-bold mr-1.5">A.</span> {q.option_a}
                        </div>
                        <div
                          className={`p-2.5 rounded-xl border ${
                            q.correct_answer === 'B'
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-bold mr-1.5">B.</span> {q.option_b}
                        </div>
                        <div
                          className={`p-2.5 rounded-xl border ${
                            q.correct_answer === 'C'
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-bold mr-1.5">C.</span> {q.option_c || '-'}
                        </div>
                        <div
                          className={`p-2.5 rounded-xl border ${
                            q.correct_answer === 'D'
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-bold'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-bold mr-1.5">D.</span> {q.option_d || '-'}
                        </div>
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                          <span className="font-bold text-slate-300">Explanation:</span> {q.explanation}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 4: COURSES & ENROLLED STUDENTS (Section E) */}
          {/* ==================================================== */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map((course) => {
                  const courseEnrollments = enrollments.filter(
                    (e) => (e.course_id === course.id || e.course_slug === course.slug) && e.enrollment_status === 'active'
                  );
                  const courseModules = modules.filter(
                    (m) => m.course_id === course.id || m.course_slug === course.slug
                  );

                  return (
                    <div
                      key={course.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              course.is_published ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {course.is_published ? 'Active' : 'Draft'}
                          </span>
                          <span className="text-xs font-bold text-emerald-400">
                            PKR {Number(course.price_pkr).toLocaleString()}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white mt-2 leading-snug">{course.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {course.short_description || course.description || 'Complete Preparation Module for Law Students.'}
                        </p>

                        {/* Course Stats */}
                        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <span className="block font-bold text-white">{courseModules.length}</span>
                            <span className="text-[10px] text-slate-500">Modules</span>
                          </div>
                          <div>
                            <span className="block font-bold text-white">{course.lecture_count || 0}</span>
                            <span className="text-[10px] text-slate-500">Lectures</span>
                          </div>
                          <div>
                            <span className="block font-bold text-emerald-400">{courseEnrollments.length}</span>
                            <span className="text-[10px] text-slate-500">Students</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCourseForView(course)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        View Enrolled Students ({courseEnrollments.length})
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 5: PAYMENT GATEWAY SETTINGS (Section F) */}
          {/* ==================================================== */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-6">
              <form onSubmit={handleSavePaymentSettings} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-white">Pakistan Payment Accounts & Instructions</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    These account numbers and instructions appear on the student payment checkout page.
                    Manage Meezan/HBL bank accounts, Easypaisa, JazzCash, and official WhatsApp desk.
                  </p>
                </div>

                {/* Bank Details Section */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Building className="w-4 h-4" /> Bank Account Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">Bank Name</label>
                      <input
                        type="text"
                        value={paymentSettings.bank_name}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_name: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">Account Title</label>
                      <input
                        type="text"
                        value={paymentSettings.account_title}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, account_title: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">Account / IBAN Number</label>
                      <input
                        type="text"
                        value={paymentSettings.iban}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, iban: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">Account Number (Local)</label>
                      <input
                        type="text"
                        value={paymentSettings.account_number}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, account_number: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">Bank Transfer Instructions</label>
                      <textarea
                        rows={2}
                        value={paymentSettings.bank_instructions}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_instructions: e.target.value })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Digital Wallets Section */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Mobile Wallets (Easypaisa / JazzCash)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">Easypaisa Title</label>
                      <input
                        type="text"
                        value={paymentSettings.easypaisa_title}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, easypaisa_title: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">Easypaisa Number</label>
                      <input
                        type="text"
                        value={paymentSettings.easypaisa_number}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, easypaisa_number: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">JazzCash Title</label>
                      <input
                        type="text"
                        value={paymentSettings.jazzcash_title}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, jazzcash_title: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">JazzCash Number</label>
                      <input
                        type="text"
                        value={paymentSettings.jazzcash_number}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, jazzcash_number: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* WhatsApp Support Section */}
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> WhatsApp Support Desk
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">WhatsApp Number (e.g. 923128891288)</label>
                      <input
                        type="text"
                        value={paymentSettings.whatsapp_number}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, whatsapp_number: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1 font-semibold">Default WhatsApp Message</label>
                      <input
                        type="text"
                        value={paymentSettings.whatsapp_message || ''}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, whatsapp_message: e.target.value })}
                        className="w-full h-9 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Payment Gateway Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* ==================================================== */}
      {/* MODAL 1: RECEIPT IMAGE PREVIEW */}
      {/* ==================================================== */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Payment Transfer Receipt</h3>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-950 rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center border border-slate-800">
              <img
                src={previewImageUrl}
                alt="Payment proof receipt"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
            <div className="flex justify-between items-center text-xs">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                Open Original in New Tab <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: REJECT PAYMENT PROMPT */}
      {/* ==================================================== */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Reject Payment Request
              </h3>
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Rejecting payment for <strong className="text-white">{rejectingPayment.student_name}</strong> (
              {rejectingPayment.course_title}). Please specify the reason:
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                placeholder="Reason provided to student..."
              />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectPayment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: ADD/EDIT QUESTION MODAL */}
      {/* ==================================================== */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingQuestion ? 'Edit LAT Question' : 'Add New Question to Question Bank'}
              </h3>
              <button
                type="button"
                onClick={() => setQuestionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Exam</label>
                  <input
                    type="text"
                    value={questionForm.exam_slug || 'lat'}
                    onChange={(e) => setQuestionForm({ ...questionForm, exam_slug: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Subject</label>
                  <select
                    value={questionForm.subject_slug || 'pakistan-studies'}
                    onChange={(e) => setQuestionForm({ ...questionForm, subject_slug: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="pakistan-studies">Pakistan Studies</option>
                    <option value="islamic-studies">Islamic Studies</option>
                    <option value="general-knowledge">General Knowledge</option>
                    <option value="english">English</option>
                    <option value="urdu">Urdu</option>
                    <option value="maths">Basic Math</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Part / Module</label>
                  <input
                    type="text"
                    value={questionForm.part_slug || 'part-1'}
                    onChange={(e) => setQuestionForm({ ...questionForm, part_slug: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Question Statement / Text</label>
                <textarea
                  rows={3}
                  value={questionForm.question_text || ''}
                  onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                  placeholder="Enter the complete MCQ question here..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Option A</label>
                  <input
                    type="text"
                    value={questionForm.option_a || ''}
                    onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Option B</label>
                  <input
                    type="text"
                    value={questionForm.option_b || ''}
                    onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Option C</label>
                  <input
                    type="text"
                    value={questionForm.option_c || ''}
                    onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Option D</label>
                  <input
                    type="text"
                    value={questionForm.option_d || ''}
                    onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Correct Answer</label>
                  <select
                    value={questionForm.correct_answer || 'A'}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-emerald-400"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty</label>
                  <select
                    value={questionForm.difficulty || 'medium'}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value as any })}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionForm.is_published ?? true}
                      onChange={(e) => setQuestionForm({ ...questionForm, is_published: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-emerald-500 w-4 h-4"
                    />
                    Published in Exam
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Explanation / Law Reference</label>
                <textarea
                  rows={2}
                  value={questionForm.explanation || ''}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Optional academic explanation or statute reference..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition-colors"
                >
                  {editingQuestion ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: ENROLLED STUDENTS LIST PER COURSE */}
      {/* ==================================================== */}
      {selectedCourseForView && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedCourseForView.title}</h3>
                <p className="text-xs text-emerald-400">Enrolled Students Roster</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseForView(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {(() => {
              const list = enrollments.filter(
                (e) =>
                  (e.course_id === selectedCourseForView.id || e.course_slug === selectedCourseForView.slug) &&
                  e.enrollment_status === 'active'
              );

              if (list.length === 0) {
                return (
                  <p className="text-xs text-slate-400 text-center py-8">
                    No students are currently active in this course yet.
                  </p>
                );
              }

              return (
                <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-800/80">
                  {list.map((enr) => (
                    <div key={enr.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-white">{enr.student_name}</p>
                        <p className="text-slate-400 font-mono text-[11px]">{enr.student_email}</p>
                        {enr.student_mobile && (
                          <p className="text-slate-500 text-[11px]">{enr.student_mobile}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded text-[10px]">
                          ACTIVE
                        </span>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Enrolled: {enr.enrolled_at ? new Date(enr.enrolled_at).toLocaleDateString() : 'Active'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCourseForView(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
