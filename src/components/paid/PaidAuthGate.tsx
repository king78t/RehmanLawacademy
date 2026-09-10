import { ArrowRight, KeyRound, LockKeyhole } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { User } from "@/entities";
import { superdevClient } from "@/lib/superdev/client";
import { StudyShell } from "@/components/study/StudyShell";

function authUrl(kind: "login" | "signup") {
  const currentPath = encodeURIComponent(window.location.href);
  const base = superdevClient.auth.client.options.loginUrl;
  const target = kind === "signup" && base.includes("app-login") ? base.replace("app-login", "app-signup") : base;
  return `${target}&from_url=${currentPath}`.replace("/api", "");
}

export function PaidSignInPrompt() {
  return <StudyShell><main className="page-wrap flex min-h-[68vh] items-center justify-center py-16"><div className="surface w-full max-w-xl overflow-hidden"><div className="hero-panel px-6 py-8 text-white sm:px-10"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#ddc275]"><LockKeyhole size={25} /></div><p className="mt-6 text-[.68rem] font-extrabold uppercase tracking-[.16em] text-[#ddc275]">Paid courses</p><h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Sign in to continue</h1><p className="mt-4 max-w-lg text-sm leading-6 text-blue-100/75">Your paid-course dashboard, purchase requests and protected lessons live behind one secure student account. Free preparation stays open without an account.</p></div><div className="p-6 sm:p-10"><div className="grid gap-3 sm:grid-cols-2"><a href={authUrl("login")} className="button-primary w-full">Sign in <ArrowRight size={16} /></a><a href={authUrl("signup")} className="button-secondary w-full">Create account <KeyRound size={16} /></a></div><p className="mt-5 text-xs leading-5 text-slate-500">Forgot your password or need to reset it? The secure platform account screen handles those steps for you.</p><Link to="/paid-courses" className="mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[#1766a9] hover:underline">Browse paid courses <ArrowRight size={15} /></Link></div></div></main></StudyShell>;
}

function PaidLoading() {
  return <StudyShell><main className="page-wrap min-h-[68vh] py-16" role="status" aria-label="Checking paid-course access"><div className="surface p-6 sm:p-8"><div className="loader-line w-1/3" /><div className="loader-line mt-4 w-2/3" /><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="loader-line h-24" /><div className="loader-line h-24" /><div className="loader-line h-24" /></div></div></main></StudyShell>;
}

export function PaidAuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "signed-out" | "allowed">("loading");
  useEffect(() => {
    let live = true;
    User.me().then(() => { if (live) setStatus("allowed"); }).catch(() => { if (live) setStatus("signed-out"); });
    return () => { live = false; };
  }, []);
  if (status === "loading") return <PaidLoading />;
  if (status === "signed-out") return <PaidSignInPrompt />;
  return <>{children}</>;
}
