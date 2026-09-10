import { ArrowRight, LockKeyhole, LogOut, ShieldAlert, UserCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { superdevClient } from "@/lib/superdev/client";
import { localStore } from "@/lib/superdev/local-store";
import { User } from "@/entities";
import { StudyShell } from "@/components/study/StudyShell";

function adminLoginUrl() {
  const from = encodeURIComponent(window.location.href);
  return (superdevClient.auth.client.options.loginUrl + "&from_url=" + from).replace("/api", "");
}

export function SignInPrompt() {
  const handleAdminSignIn = () => {
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
          <div className="mt-7">
            <a href={adminLoginUrl()} className="button-primary w-full sm:w-auto">
              Continue to admin sign-in <ArrowRight size={16} />
            </a>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">Testing admin features in preview?</p>
            <button
              type="button"
              onClick={handleAdminSignIn}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#1766a9] px-4 py-2 text-xs font-bold text-white hover:bg-[#14568f]"
            >
              <UserCheck size={14} /> Continue with Demo Admin Account
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
