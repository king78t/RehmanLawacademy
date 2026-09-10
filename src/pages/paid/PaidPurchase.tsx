import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileCheck,
  HelpCircle,
  Image as ImageIcon,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PaidAuthGate } from "@/components/paid/PaidAuthGate";
import { WhatsAppFloatingSupport } from "@/components/paid/WhatsAppFloatingSupport";
import { EmptyState } from "@/components/study/EmptyState";
import { StudyShell } from "@/components/study/StudyShell";
import { getBrandConfig } from "@/lib/brand-config";
import {
  getActiveStudent,
  loadPaymentDetails,
  submitPaymentProof,
} from "@/lib/paid-course-data";
import type {
  PaidCourse,
  PaidPaymentRequest,
  PaymentSettings,
} from "@/lib/paid-course-types";
import { formatPkr } from "@/lib/paid-course-types";

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-[#1766a9]"
      title={`Copy ${label || "value"}`}
    >
      {copied ? (
        <>
          <Check size={13} className="text-emerald-600" />
          <span className="text-emerald-700">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={13} className="text-slate-400" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

function PurchaseContent({ courseSlug }: { courseSlug: string }) {
  const [course, setCourse] = useState<PaidCourse | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [payment, setPayment] = useState<PaidPaymentRequest | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Payment method selection tab
  const [activeTab, setActiveTab] = useState<"bank" | "easypaisa" | "jazzcash">("bank");

  // Form submission state
  const [method, setMethod] = useState<string>("Bank Transfer");
  const [senderMobile, setSenderMobile] = useState<string>("");
  const [trxId, setTrxId] = useState<string>("");
  const [paymentNote, setPaymentNote] = useState<string>("");
  const [proofImage, setProofImage] = useState<string>("");
  const [proofPreview, setProofPreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);

  const student = getActiveStudent();

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await loadPaymentDetails(courseSlug);
      setCourse(data.course);
      setSettings(data.settings);
      setPayment(data.payment);
      setEnrollment(data.enrollment);
      if (student?.mobile_number) {
        setSenderMobile(student.mobile_number);
      }
      setStatus("ready");
    } catch (error) {
      console.error("Failed to load payment details:", error);
      setStatus("error");
    }
  }, [courseSlug, student?.mobile_number]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError("File size exceeds 5MB limit. Please upload a smaller receipt screenshot.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProofImage(base64);
      setProofPreview(base64);
      setFormError(null);
    };
    reader.readAsDataURL(file);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!trxId.trim()) {
      setFormError("Please enter your Transaction ID / Reference Number.");
      return;
    }

    if (!proofImage) {
      setFormError("Please upload a clear screenshot of your payment receipt.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPaymentProof({
        course_slug: courseSlug,
        payment_method: method,
        transaction_reference: trxId.trim(),
        proof_image: proofImage,
        payment_note: paymentNote.trim(),
        student_mobile: senderMobile.trim(),
      });
      setPayment(res.request);
      setShowResubmitForm(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setFormError(err?.message || "Failed to submit payment proof. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <StudyShell>
        <main className="page-wrap py-14">
          <div className="surface p-7">
            <div className="loader-line h-32 w-full" />
            <div className="loader-line mt-6 w-2/3" />
            <div className="loader-line mt-4 w-full" />
          </div>
        </main>
      </StudyShell>
    );
  }

  if (status === "error" || !course || !settings) {
    return (
      <StudyShell>
        <main className="page-wrap py-14">
          <EmptyState
            title="Course payment could not load"
            description="We could not retrieve the course payment instructions. Please try again."
            onRetry={load}
          />
        </main>
      </StudyShell>
    );
  }

  const isApproved = payment?.payment_status === "approved" || enrollment?.enrollment_status === "active";
  const isPending = payment?.payment_status === "pending" && !isApproved;
  const isRejected = payment?.payment_status === "rejected" && !isApproved;

  const brand = getBrandConfig();

  const waHelperText = encodeURIComponent(
    `Assalam-o-Alaikum ${brand.name}, I have submitted my manual payment proof for course: ${course.title}. Trx ID: ${
      payment?.transaction_reference || trxId || "N/A"
    }. Please verify my enrollment.`
  );

  return (
    <StudyShell>
      <main className="page-wrap max-w-[1040px] py-10 sm:py-14">
        {/* Navigation Breadcrumb */}
        <Link
          to={`/paid-courses/${course.slug}`}
          className="inline-flex min-h-11 items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1766a9]"
        >
          <ArrowLeft size={15} /> Back to Course Overview
        </Link>

        {/* Heading Header */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="eyebrow">Manual Pakistan Payment</span>
            <span className="rounded-full border border-[#1766a9]/20 bg-[#eaf4fb] px-3 py-1 text-[.65rem] font-bold text-[#1766a9]">
              Verified Academy Accounts
            </span>
          </div>
          <h1 className="page-heading mt-3 break-words text-3xl font-bold sm:text-4xl">
            Enroll in {course.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Transfer the exact fee through your preferred Pakistani bank or mobile wallet, then submit your transaction receipt below for prompt verification.
          </p>
        </div>

        {/* STATUS BANNER IF SUBMITTED */}
        {isApproved && (
          <div className="mt-8 rounded-2xl border border-[#b8dcc7] bg-[#effaf4] p-6 shadow-sm" role="status">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-[#2e7655]">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-[#1b4e38]">
                    Enrollment Verified & Active
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#356d54]">
                    The academy administrators have verified your payment receipt. All video lectures, notes, and curriculum modules are unlocked.
                  </p>
                </div>
              </div>
              <Link
                to={`/my-courses/${course.slug}`}
                className="button-primary shrink-0 !bg-[#245e46] hover:!bg-[#1b4e38]"
              >
                Access Course Content <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

        {isPending && !showResubmitForm && (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm" role="status">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Clock size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-bold text-amber-900">
                      Payment Under Academy Verification
                    </h3>
                    <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[.68rem] font-extrabold uppercase text-amber-800">
                      Pending Review
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-amber-800">
                    Your payment receipt (Trx ID: <strong>{payment.transaction_reference}</strong> via <strong>{payment.payment_method || "Manual"}</strong>) has been uploaded to our verification desk. Approvals typically take 1–4 hours.
                  </p>
                  <p className="mt-2 text-xs text-amber-700">
                    Submitted on: {new Date(payment.requested_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:shrink-0">
                <a
                  href={`${brand.whatsapp.url}?text=${waHelperText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-primary flex items-center justify-center gap-2 !bg-[#25D366] text-xs font-bold text-white hover:!bg-[#20bd5a]"
                >
                  <MessageCircle size={15} /> Expedite via WhatsApp
                </a>
                {payment.proof_image && (
                  <button
                    type="button"
                    onClick={() => setShowProofModal(true)}
                    className="button-secondary text-xs font-bold"
                  >
                    <ImageIcon size={14} /> View Submitted Receipt
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowResubmitForm(true)}
                  className="text-center text-[.75rem] font-bold text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Need to update receipt?
                </button>
              </div>
            </div>
          </div>
        )}

        {isRejected && !showResubmitForm && (
          <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/90 p-6 shadow-sm" role="alert">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <XCircle size={24} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-bold text-rose-900">
                      Payment Verification Declined
                    </h3>
                    <span className="rounded-full bg-rose-200/80 px-2.5 py-0.5 text-[.68rem] font-extrabold uppercase text-rose-800">
                      Action Required
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-rose-800">
                    The academy was unable to verify this transaction.
                  </p>
                  {payment.rejection_reason && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-white p-3 text-xs text-rose-900 shadow-sm">
                      <span className="font-bold">Reason from Administrator: </span>
                      {payment.rejection_reason}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() => setShowResubmitForm(true)}
                  className="button-primary flex items-center justify-center gap-2 !bg-rose-700 text-xs font-bold text-white hover:!bg-rose-800"
                >
                  <RefreshCcw size={14} /> Submit Correct Receipt
                </button>
                <a
                  href={`${brand.whatsapp.url}?text=${waHelperText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button-secondary flex items-center justify-center gap-1.5 text-xs font-bold"
                >
                  <MessageCircle size={15} className="text-emerald-600" /> WhatsApp Coordinator
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MAIN TWO-COLUMN WORKFLOW */}
        {(!payment || showResubmitForm || (!isApproved && !isPending && !isRejected)) && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
            {/* LEFT COLUMN: OFFICIAL ACCOUNTS & INSTRUCTIONS */}
            <div className="space-y-6">
              {/* Course Summary Card */}
              <div className="surface p-6 sm:p-7">
                <p className="text-[.65rem] font-extrabold uppercase tracking-wider text-slate-400">
                  Selected Course
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">
                  {course.title}
                </h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {course.short_description}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4 rounded-2xl bg-[#f7fafc] p-4">
                  <div>
                    <span className="text-[.65rem] font-bold uppercase tracking-wider text-slate-400">
                      Total Payable Fee
                    </span>
                    <p className="mt-0.5 text-2xl font-extrabold text-[#14294d]">
                      {formatPkr(course)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[.65rem] font-bold uppercase tracking-wider text-slate-400">
                      Access Validity
                    </span>
                    <p className="mt-1 text-sm font-bold text-slate-700">
                      Until Next Exam Cycle
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Accounts Selection */}
              <div className="surface overflow-hidden p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-[#14294d]">
                    Step 1: Choose Payment Method
                  </h3>
                  <span className="text-xs font-semibold text-slate-400">Step 1 of 2</span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Transfer the exact fee of <strong>{formatPkr(course)}</strong> to one of the accounts below:
                </p>

                {/* Account Selection Tabs */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("bank");
                      setMethod("Bank Transfer");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      activeTab === "bank"
                        ? "border-[#1766a9] bg-[#eaf4fb] text-[#14294d] shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 size={20} className={activeTab === "bank" ? "text-[#1766a9]" : "text-slate-400"} />
                    <span className="mt-1.5 text-xs font-bold">Bank Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("easypaisa");
                      setMethod("Easypaisa");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      activeTab === "easypaisa"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone size={20} className={activeTab === "easypaisa" ? "text-emerald-600" : "text-slate-400"} />
                    <span className="mt-1.5 text-xs font-bold">Easypaisa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("jazzcash");
                      setMethod("JazzCash");
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                      activeTab === "jazzcash"
                        ? "border-amber-600 bg-amber-50 text-amber-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone size={20} className={activeTab === "jazzcash" ? "text-amber-600" : "text-slate-400"} />
                    <span className="mt-1.5 text-xs font-bold">JazzCash</span>
                  </button>
                </div>

                {/* Account Details Display */}
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  {activeTab === "bank" && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <span className="text-xs font-semibold text-slate-500">Bank Name</span>
                        <span className="text-sm font-bold text-[#14294d]">{settings.bank_name}</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <span className="text-xs font-semibold text-slate-500">Account Title</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#14294d]">{settings.bank_account_title}</span>
                          <CopyButton text={settings.bank_account_title} label="Title" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <span className="text-xs font-semibold text-slate-500">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[#14294d]">{settings.bank_account_number}</span>
                          <CopyButton text={settings.bank_account_number} label="Account #" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">IBAN</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#14294d]">{settings.bank_iban}</span>
                          <CopyButton text={settings.bank_iban} label="IBAN" />
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
                        {settings.bank_instructions || "Send via mobile banking app (1Link / Raast) or visit any branch."}
                      </div>
                    </div>
                  )}

                  {activeTab === "easypaisa" && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <span className="text-xs font-semibold text-slate-500">Account Title</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-950">{settings.easypaisa_account_title}</span>
                          <CopyButton text={settings.easypaisa_account_title} label="Title" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Easypaisa Mobile #</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-emerald-800">{settings.easypaisa_account_number}</span>
                          <CopyButton text={settings.easypaisa_account_number} label="Mobile #" />
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
                        {settings.easypaisa_instructions || "Open Easypaisa app -> Send Money -> Mobile Account -> Enter number."}
                      </div>
                    </div>
                  )}

                  {activeTab === "jazzcash" && (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <span className="text-xs font-semibold text-slate-500">Account Title</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-amber-950">{settings.jazzcash_account_title}</span>
                          <CopyButton text={settings.jazzcash_account_title} label="Title" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">JazzCash Mobile #</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-amber-800">{settings.jazzcash_account_number}</span>
                          <CopyButton text={settings.jazzcash_account_number} label="Mobile #" />
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
                        {settings.jazzcash_instructions || "Dial *786# or use JazzCash app -> Send Money -> Enter number."}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PROOF SUBMISSION FORM */}
            <div className="surface p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-[#14294d]">
                  Step 2: Submit Payment Proof
                </h3>
                <span className="text-xs font-semibold text-slate-400">Step 2 of 2</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                After transferring the fee, provide your receipt snapshot and Transaction ID for immediate administrative verification.
              </p>

              {formError && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                  <div>{formError}</div>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="mt-5 space-y-4">
                {/* Payment Method Used */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="pay-method">
                    Payment Method Used <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="pay-method"
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value);
                      if (e.target.value === "Bank Transfer") setActiveTab("bank");
                      else if (e.target.value === "Easypaisa") setActiveTab("easypaisa");
                      else if (e.target.value === "JazzCash") setActiveTab("jazzcash");
                    }}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1766a9]"
                  >
                    <option value="Bank Transfer">Bank Transfer / Raast</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>

                {/* Transaction ID / Ref */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="pay-trx">
                    Transaction ID / Trx Ref Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="pay-trx"
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. 24890123847 or FT240901298"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-sm text-slate-900 outline-none transition focus:border-[#1766a9]"
                  />
                  <p className="mt-1 text-[.68rem] text-slate-400">
                    Found in your bank SMS or mobile receipt confirmation.
                  </p>
                </div>

                {/* Sender Mobile / Account Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="pay-sender">
                    Sender Mobile # or Account Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="pay-sender"
                    type="text"
                    required
                    value={senderMobile}
                    onChange={(e) => setSenderMobile(e.target.value)}
                    placeholder="e.g. 0300-1234567 or Ali Raza"
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1766a9]"
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Payment Receipt Screenshot <span className="text-rose-500">*</span>
                  </label>

                  {proofPreview ? (
                    <div className="relative mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={proofPreview}
                          alt="Uploaded receipt preview"
                          className="h-20 w-20 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                            <FileCheck size={15} /> Screenshot ready
                          </p>
                          <p className="mt-0.5 text-[.7rem] text-slate-500">
                            Receipt attached for admin verification
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowProofModal(true)}
                              className="text-xs font-semibold text-[#1766a9] hover:underline"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProofImage("");
                                setProofPreview("");
                              }}
                              className="text-xs font-semibold text-rose-600 hover:underline"
                            >
                              Remove & re-upload
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-6 text-center transition hover:border-[#1766a9] hover:bg-[#eaf4fb]/30">
                      <UploadCloud size={28} className="text-slate-400" />
                      <span className="mt-2 text-xs font-bold text-slate-700">
                        Click to upload payment screenshot
                      </span>
                      <span className="mt-0.5 text-[.68rem] text-slate-400">
                        PNG, JPG or WEBP (Max 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="pay-note">
                    Optional Note / Details
                  </label>
                  <textarea
                    id="pay-note"
                    rows={2}
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="e.g. Paid via brother's Easypaisa account"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none transition focus:border-[#1766a9]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="button-primary flex w-full items-center justify-center gap-2 !py-3 font-bold shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {submitting ? (
                    "Uploading & Submitting..."
                  ) : (
                    <>
                      <FileCheck size={16} /> Submit Payment Proof for Verification
                    </>
                  )}
                </button>

                {showResubmitForm && (
                  <button
                    type="button"
                    onClick={() => setShowResubmitForm(false)}
                    className="button-secondary w-full text-xs font-bold"
                  >
                    Cancel
                  </button>
                )}

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[.7rem] leading-relaxed text-slate-500">
                  <p className="font-semibold text-slate-700">Verification Guarantee:</p>
                  Our coordinators cross-reference your Trx ID with academy bank records. Once verified, access to all course modules is activated immediately.
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PROOF PREVIEW MODAL */}
        {showProofModal && (payment?.proof_image || proofPreview) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Payment Receipt Preview
                </span>
                <button
                  type="button"
                  onClick={() => setShowProofModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="max-h-[75vh] overflow-auto p-4 flex items-center justify-center bg-slate-900/5">
                <img
                  src={payment?.proof_image || proofPreview}
                  alt="Payment Receipt Screenshot"
                  className="max-h-[70vh] rounded-lg object-contain shadow"
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating WhatsApp Support */}
        <WhatsAppFloatingSupport
          courseTitle={course.title}
          studentName={student?.full_name}
          phoneNumber={settings.whatsapp_support_number || "0312-8891288"}
        />
      </main>
    </StudyShell>
  );
}

export default function PaidPurchase() {
  const { courseSlug = "" } = useParams();
  return (
    <PaidAuthGate>
      <PurchaseContent courseSlug={courseSlug} />
    </PaidAuthGate>
  );
}
