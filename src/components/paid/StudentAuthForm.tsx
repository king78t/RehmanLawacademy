import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, HelpCircle, KeyRound, Lock, Mail, MessageCircle, Phone, ShieldCheck, User, UserCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentLogin, studentSignup } from "@/lib/paid-course-data";
import { localStore } from "@/lib/superdev/local-store";
import { getBrandConfig, getGeneralWhatsAppUrl } from "@/lib/brand-config";

interface StudentAuthFormProps {
  initialMode?: "login" | "signup";
  onSuccess?: () => void;
  redirectUrl?: string;
}

export function StudentAuthForm({ initialMode = "login", onSuccess, redirectUrl }: StudentAuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleQuickFill = (role: "student" | "admin") => {
    if (role === "student") {
      setEmail("student@rehmanlawacademy.pk");
      setPassword("student123");
    } else {
      setEmail("admin@rehmanlawacademy.pk");
      setPassword("admin123");
    }
    setError(null);
  };

  const validateMobile = (mobile: string): boolean => {
    // Standard Pakistan phone pattern: 0300-1234567, 03001234567, +923001234567
    const cleaned = mobile.replace(/[\s-]/g, "");
    return /^(03\d{9}|\+923\d{9})$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (mode === "signup") {
      const cleanName = fullName.trim();
      const cleanMobile = mobileNumber.trim();

      if (!cleanName) {
        setError("Please enter your full legal name as per your student ID/CNIC.");
        return;
      }

      if (!cleanMobile) {
        setError("Please enter your active WhatsApp/Mobile phone number.");
        return;
      }

      if (!validateMobile(cleanMobile)) {
        setError("Please enter a valid Pakistani mobile number (e.g. 0300-1234567 or 03128891288).");
        return;
      }

      if (cleanPassword !== confirmPassword.trim()) {
        setError("Passwords do not match. Please re-enter your password accurately.");
        return;
      }

      setLoading(true);
      try {
        studentSignup(cleanName, cleanEmail, cleanMobile, cleanPassword);
        setSuccessMessage("Account registered successfully! Redirecting...");
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (redirectUrl) {
            navigate(redirectUrl);
          } else {
            navigate("/my-courses");
          }
        }, 600);
      } catch (err: any) {
        setError(err?.message || "Failed to create account. Please check your details.");
      } finally {
        setLoading(false);
      }
    } else {
      // Login Mode
      setLoading(true);
      try {
        studentLogin(cleanEmail, cleanPassword);
        setSuccessMessage("Signed in successfully! Redirecting...");
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else if (redirectUrl) {
            navigate(redirectUrl);
          } else {
            navigate("/my-courses");
          }
        }, 600);
      } catch (err: any) {
        setError(err?.message || "Invalid credentials. Please verify your email and password.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="surface w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      {/* Academy Header */}
      <div className="hero-panel px-6 py-8 text-white sm:px-10">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#ddc275]">
            <ShieldCheck size={26} />
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[.65rem] font-extrabold uppercase tracking-widest text-[#ddc275]">
            Rehman Law Academy
          </span>
        </div>

        <h2 className="mt-5 font-display text-2xl font-bold sm:text-3xl">
          {mode === "login" ? "Student Portal Sign In" : "Student Registration"}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-blue-100/80 sm:text-sm">
          {mode === "login"
            ? "Sign in to access your enrolled courses, upload payment receipts, and review protected video lectures."
            : "Register your official student profile to purchase paid courses and submit manual payment receipts."}
        </p>

        {/* Mode Toggle Tabs */}
        <div className="mt-6 flex rounded-xl border border-white/15 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition ${
              mode === "login"
                ? "bg-[#ddc275] text-[#14294d] shadow"
                : "text-white/70 hover:text-white"
            }`}
          >
            Student Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-center text-xs font-bold transition ${
              mode === "signup"
                ? "bg-[#ddc275] text-[#14294d] shadow"
                : "text-white/70 hover:text-white"
            }`}
          >
            New Student Sign Up
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 sm:p-10">
        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-800" role="alert">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold">Authentication Error</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800" role="status">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
            <p className="font-semibold">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="auth-full-name">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User size={16} />
                </span>
                <input
                  id="auth-full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Muhammad Ali Khan"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#1766a9] focus:bg-white focus:ring-2 focus:ring-[#1766a9]/15"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="auth-email">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail size={16} />
              </span>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#1766a9] focus:bg-white focus:ring-2 focus:ring-[#1766a9]/15"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="auth-mobile">
                  Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                </label>
                <span className="text-[.68rem] text-slate-400">Pakistan Format</span>
              </div>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone size={16} />
                </span>
                <input
                  id="auth-mobile"
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="0300-1234567 or 03128891288"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-[#1766a9] focus:bg-white focus:ring-2 focus:ring-[#1766a9]/15"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="auth-password">
                Password <span className="text-rose-500">*</span>
              </label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-bold text-[#1766a9] hover:underline"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#1766a9] focus:bg-white focus:ring-2 focus:ring-[#1766a9]/15"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="auth-confirm-password">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <KeyRound size={16} />
                </span>
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#1766a9] focus:bg-white focus:ring-2 focus:ring-[#1766a9]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button-primary mt-6 flex w-full items-center justify-center gap-2 !py-3 font-bold shadow-md hover:shadow-lg disabled:opacity-60"
          >
            {loading ? (
              "Processing..."
            ) : mode === "login" ? (
              <>
                Sign In to Student Portal <ArrowRight size={16} />
              </>
            ) : (
              <>
                Complete Student Registration <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Alternative Action */}
        <div className="mt-6 text-center text-xs text-slate-500">
          {mode === "login" ? (
            <p>
              Don't have a student account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="font-bold text-[#1766a9] hover:underline"
              >
                Sign Up here
              </button>
            </p>
          ) : (
            <p>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="font-bold text-[#1766a9] hover:underline"
              >
                Log In to your account
              </button>
            </p>
          )}
        </div>

        {/* Demo Fast-Switch Buttons for Reviewers */}
        <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <p className="flex items-center justify-center gap-1.5 text-center text-[.7rem] font-bold uppercase tracking-wider text-slate-500">
            <UserCheck size={14} className="text-[#1766a9]" /> Testing Accounts Quick-Fill
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("student")}
              className="rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Demo Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("admin")}
              className="rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <Link to="/paid-courses" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
            ← Back to Paid Courses Catalog
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf4fb] text-[#1766a9]">
              <HelpCircle size={26} />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-[#14294d]">Password Assistance</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              For student account security, password resets are processed directly by our academy coordinator via official WhatsApp helpline.
            </p>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
              <p className="font-semibold">Helpline WhatsApp:</p>
              <p className="mt-0.5 text-sm font-bold text-[#1766a9]">{getBrandConfig().whatsapp.display}</p>
            </div>
            <div className="mt-6 flex gap-2">
              <a
                href={getGeneralWhatsAppUrl(
                  `Assalam-o-Alaikum RehmanLawAcademy, I forgot my student portal password. My registered email is: ${email}`
                )}
                target="_blank"
                rel="noreferrer"
                className="button-primary flex-1 text-center text-xs font-bold"
              >
                <MessageCircle size={15} /> Contact on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="button-secondary text-xs font-bold"
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
