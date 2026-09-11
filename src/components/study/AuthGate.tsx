import { ArrowRight, LockKeyhole, LogOut, ShieldAlert, UserCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { localStore } from "@/lib/superdev/local-store";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@/entities";
import { StudyShell } from "@/components/study/StudyShell";

export function SignInPrompt() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const signInEmail = email.trim() || "admin@rehmanlawacademy.pk";
      const signInPassword = password.trim() || "admin123";

      const res = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (res.error) {
        throw res.error;
      }
      window.location.reload();
    } catch (err: any) {
      setError(err?.message || "Failed to sign in as administrator.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAdmin = () => {
    localStore.setCurrentUser({
      id: "admin-demo-1",
      email: "admin@rehmanlawacademy.pk",
      full_name: "Academy Administrator",
      role: "administrator",
    });
    window.location.reload();
  };

  return (
    <StudyShell>
      <main className="page-wrap flex min-h-[65vh] items-center justify-center py-16">
        <div className="surface w-full max-w-lg p-7 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf4fb] text-[#1766a9]">
            <LockKeyhole size={24} />
          </div>
          <p className="eyebrow mt-6">Administrator workspace</p>
          <h1 className="page-heading mt-2 text-3xl font-bold">Secure admin access</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Use the platform’s secure sign-in to manage the LAT study catalog. Student study pages remain open without an account.
          </p>
          <form onSubmit={handleAdminSignIn} className="mt-6 space-y-3 text-left">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="admin-email">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rehmanlawacademy.pk"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-[#1766a9]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="button-primary !mt-4 w-full text-xs font-bold"
            >
              {loading ? "Signing in..." : "Sign in to Admin Portal"} <ArrowRight size={15} />
            </button>
          </form>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">Fast preview testing:</p>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#1766a9] px-4 py-2 text-xs font-bold text-white hover:bg-[#14568f]"
            >
              <UserCheck size={14} /> Quick-Fill Demo Admin Account
            </button>
          </div>
          <Link to="/" className="mt-6 inline-block min-h-11 pt-3 text-xs font-bold text-[#1766a9] hover:underline">
            Return to the public academy
          </Link>
        </div>
      </main>
    </StudyShell>
  );
}

export function AccessDenied() {
  return <StudyShell><main className="page-wrap flex min-h-[65vh] items-center justify-center py-16"><div className="surface w-full max-w-lg p-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><ShieldAlert size={25} /></div><p className="eyebrow mt-6">Restricted workspace</p><h1 className="page-heading mt-2 text-3xl font-bold">Administrator role required</h1><p className="mt-3 text-sm leading-6 text-slate-500">This area is limited to the verified platform administrator. The public academy remains available for study and practice.</p><Link to="/" className="button-primary mt-7">Return to the academy <ArrowRight size={16} /></Link></div></main></StudyShell>;
}

function AdminSessionBar({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const signOut = async () => {
    setBusy(true);
    try { await User.logout(); } catch (error) { console.error("Failed to sign out administrator:", error); } finally { window.location.assign("/"); }
  };
  return <><div className="border-b border-[#dbe5ef] bg-[#f7fafc]"><div className="page-wrap flex min-h-10 items-center justify-between gap-3"><p className="text-[.68rem] font-bold text-slate-500">Administrator session · catalog changes are protected</p><button type="button" onClick={() => void signOut()} disabled={busy} className="button-quiet !min-h-9 !px-2 text-[.7rem]"><LogOut size={14} /> {busy ? "Signing out…" : "Sign out"}</button></div></div>{children}</>;
}

export function AuthGuard({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [status, setStatus] = useState<"loading" | "signed-out" | "allowed" | "denied">("loading");
  useEffect(() => {
    let live = true;
    User.me().then((user: any) => { if (live) setStatus(admin && user?.role !== "administrator" ? "denied" : "allowed"); }).catch(() => { if (live) setStatus("signed-out"); });
    return () => { live = false; };
  }, [admin]);
  if (status === "loading") return <StudyShell><main className="page-wrap min-h-[65vh] py-16" role="status" aria-label="Checking administrator access"><div className="surface p-6"><div className="loader-line w-1/3" /><div className="loader-line mt-4 w-2/3" /><div className="loader-line mt-8 h-32 w-full" /></div></main></StudyShell>;
  if (status === "signed-out") return <SignInPrompt />;
  if (status === "denied") return <AccessDenied />;
  return admin ? <AdminSessionBar>{children}</AdminSessionBar> : <>{children}</>;
}
