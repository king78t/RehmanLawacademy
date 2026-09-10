import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  Filter,
  Image as ImageIcon,
  MessageCircle,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Smartphone,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PaidStatusBadge } from "@/components/paid/PaidStatusBadge";
import { adminApprovePayment, adminRejectPayment } from "@/lib/paid-course-data";
import type { PaidPaymentRequest } from "@/lib/paid-course-types";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[.65rem] font-bold text-slate-600 hover:bg-slate-200"
      title="Copy"
    >
      {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function PaymentReviewManager({
  payments,
  onRefresh,
}: {
  payments: PaidPaymentRequest[];
  onRefresh?: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");

  // Modal inspection for receipt screenshot
  const [inspectImage, setInspectImage] = useState<string | null>(null);

  // Rejection modal
  const [rejectingPayment, setRejectingPayment] = useState<PaidPaymentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Action status
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean } | null>(null);

  const counts = useMemo(() => {
    return {
      all: payments.length,
      pending: payments.filter((p) => p.payment_status === "pending").length,
      approved: payments.filter((p) => p.payment_status === "approved").length,
      rejected: payments.filter((p) => p.payment_status === "rejected").length,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        if (filter !== "all" && p.payment_status !== filter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchEmail = (p.student_email || "").toLowerCase().includes(q);
          const matchCourse = (p.course_title || "").toLowerCase().includes(q);
          const matchTrx = (p.transaction_reference || "").toLowerCase().includes(q);
          const matchMobile = (p.student_mobile || "").toLowerCase().includes(q);
          return matchEmail || matchCourse || matchTrx || matchMobile;
        }
        return true;
      })
      .sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
  }, [payments, filter, search]);

  const handleApprove = async (payment: PaidPaymentRequest) => {
    if (!window.confirm(`Approve payment for ${payment.student_email} (${payment.course_title})? This will immediately unlock the student's course access.`)) {
      return;
    }

    setBusyId(payment.id);
    setFeedback(null);
    try {
      await adminApprovePayment(payment.id);
      setFeedback({ text: `Payment approved! Enrollment activated for ${payment.student_email}.` });
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setFeedback({ text: err?.message || "Failed to approve payment.", error: true });
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingPayment) return;
    const reason = rejectionReason.trim() || "Transaction could not be verified in academy bank records.";

    setBusyId(rejectingPayment.id);
    setFeedback(null);
    try {
      await adminRejectPayment(rejectingPayment.id, reason);
      setFeedback({ text: `Payment marked rejected. Reason sent to student dashboard.` });
      setRejectingPayment(null);
      setRejectionReason("");
      if (onRefresh) await onRefresh();
    } catch (err: any) {
      setFeedback({ text: err?.message || "Failed to reject payment.", error: true });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <p className="eyebrow">Payment Verification Center</p>
            {counts.pending > 0 && (
              <span className="animate-pulse rounded-full bg-amber-100 px-2 py-0.5 text-[.65rem] font-bold text-amber-800">
                {counts.pending} Awaiting Verification
              </span>
            )}
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold text-[#14294d]">
            Manual Payment Receipts & Approvals
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Review Pakistan bank transfers, Easypaisa, and JazzCash receipts uploaded by students.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder="Search email, course, Trx ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 outline-none transition focus:border-[#1766a9]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
            filter === "pending"
              ? "bg-amber-100 text-amber-900 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Clock size={14} className="text-amber-700" />
          Pending Review ({counts.pending})
        </button>

        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
            filter === "all"
              ? "bg-[#14294d] text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Filter size={14} />
          All Requests ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setFilter("approved")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
            filter === "approved"
              ? "bg-emerald-100 text-emerald-900 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <CheckCircle2 size={14} className="text-emerald-700" />
          Approved ({counts.approved})
        </button>

        <button
          type="button"
          onClick={() => setFilter("rejected")}
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
            filter === "rejected"
              ? "bg-rose-100 text-rose-900 shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <XCircle size={14} className="text-rose-700" />
          Rejected ({counts.rejected})
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-semibold ${
            feedback.error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Requests List */}
      {!filteredPayments.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-500">
            No payment requests found matching the current filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPayments.map((payment) => {
            const isPending = payment.payment_status === "pending";
            const isApproved = payment.payment_status === "approved";
            const isRejected = payment.payment_status === "rejected";

            const waDirect = payment.student_mobile
              ? `https://wa.me/${payment.student_mobile.replace(/[\s-]/g, "").replace(/^0/, "92")}?text=${encodeURIComponent(
                  `Assalam-o-Alaikum, regarding your course enrollment for ${payment.course_title} at Rehman Law Academy.`
                )}`
              : null;

            return (
              <article
                key={payment.id}
                className="surface overflow-hidden border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  {/* Left: Info & Student */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-display text-lg font-bold text-[#14294d]">
                        {payment.course_title}
                      </h3>
                      <PaidStatusBadge status={payment.payment_status || "pending"} />
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[.65rem] font-bold text-slate-600">
                        {payment.payment_method || "Bank / Manual"}
                      </span>
                    </div>

                    {/* Metadata Grid */}
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-400">Student Email: </span>
                        <span className="font-bold text-slate-800">{payment.student_email}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-400">Mobile / WhatsApp: </span>
                        <span className="font-bold text-slate-800">
                          {payment.student_mobile || "Not specified"}
                        </span>
                        {waDirect && (
                          <a
                            href={waDirect}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[.65rem] font-bold text-emerald-700 hover:bg-emerald-100"
                            title="Chat with student on WhatsApp"
                          >
                            <MessageCircle size={11} /> WhatsApp
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-400">Trx ID / Ref: </span>
                        <span className="font-mono font-bold text-slate-900">
                          {payment.transaction_reference || "None"}
                        </span>
                        {payment.transaction_reference && (
                          <CopyButton text={payment.transaction_reference} />
                        )}
                      </div>

                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-400">Payable Amount: </span>
                        <span className="font-bold text-[#14294d]">
                          {payment.currency || "PKR"} {Number(payment.amount_pkr || 0).toLocaleString("en-PK")}
                        </span>
                      </div>
                    </div>

                    {/* Student note */}
                    {payment.payment_note && (
                      <div className="mt-2.5 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                        <span className="font-bold text-slate-700">Student Note: </span>
                        {payment.payment_note}
                      </div>
                    )}

                    {/* Rejection reason if rejected */}
                    {isRejected && payment.rejection_reason && (
                      <div className="mt-2.5 rounded-lg border border-rose-100 bg-rose-50/70 p-2.5 text-xs text-rose-900">
                        <span className="font-bold">Rejection Reason: </span>
                        {payment.rejection_reason}
                      </div>
                    )}

                    <div className="mt-2 text-[.68rem] text-slate-400">
                      Submitted: {new Date(payment.requested_at).toLocaleString()}
                      {payment.reviewed_at && (
                        <span> · Reviewed by {payment.reviewed_by || "Admin"} on {new Date(payment.reviewed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Receipt Screenshot Thumbnail & Actions */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                    {/* Proof image preview thumbnail */}
                    {payment.proof_image ? (
                      <button
                        type="button"
                        onClick={() => setInspectImage(payment.proof_image)}
                        className="group relative h-20 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm transition hover:border-[#1766a9]"
                        title="Click to zoom receipt"
                      >
                        <img
                          src={payment.proof_image}
                          alt="Payment receipt proof"
                          className="h-full w-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100 text-white text-[.65rem] font-bold">
                          <Eye size={14} className="mr-1" /> Zoom
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[.65rem] text-slate-400">
                        No image
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === payment.id}
                            onClick={() => handleApprove(payment)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#245e46] px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1b4e38] disabled:opacity-60"
                          >
                            <CheckCircle2 size={14} /> Approve & Unlock
                          </button>
                          <button
                            type="button"
                            disabled={busyId === payment.id}
                            onClick={() => {
                              setRejectingPayment(payment);
                              setRejectionReason("");
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                            <CheckCircle2 size={15} /> Active Enrollment
                          </span>
                        </div>
                      )}

                      {isRejected && (
                        <button
                          type="button"
                          onClick={() => handleApprove(payment)}
                          className="text-xs font-bold text-[#1766a9] hover:underline"
                        >
                          Re-approve this request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* RECEIPT ZOOM INSPECTION MODAL */}
      {inspectImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="relative max-h-[95vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <ImageIcon size={16} className="text-[#1766a9]" /> Official Payment Receipt Inspection
              </span>
              <button
                type="button"
                onClick={() => setInspectImage(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto bg-slate-950/5 p-4 flex items-center justify-center">
              <img
                src={inspectImage}
                alt="Enlarged payment receipt"
                className="max-h-[75vh] w-auto rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <XCircle size={26} />
            </div>

            <h3 className="mt-4 font-display text-xl font-bold text-[#14294d]">
              Decline Payment Receipt
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              State the reason for rejecting this payment. The student will see this on their dashboard so they can provide a correct receipt.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-600" htmlFor="rejection-reason">
                Rejection Reason
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Transaction reference FT240901 does not match academy bank statement; or receipt image was blurry."
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingPayment(null)}
                className="button-secondary text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busyId === rejectingPayment.id}
                onClick={handleConfirmReject}
                className="button-primary !bg-rose-700 text-xs font-bold text-white hover:!bg-rose-800 disabled:opacity-60"
              >
                {busyId === rejectingPayment.id ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
