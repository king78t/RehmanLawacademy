import { ArrowLeft, BookOpen, Home, MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { StudyShell } from "@/components/study/StudyShell";
import { getGeneralWhatsAppUrl } from "@/lib/brand-config";

const NotFound = () => {
  const location = useLocation();
  const lower = location.pathname.toLowerCase();
  const trimmed = lower.replace(/\/+$/, "");
  const isHomeAlias = trimmed === "/home" || lower === "/home" || lower.startsWith("/home/");

  useEffect(() => {
    if (!isHomeAlias) {
      console.warn(
        "404 Notice: User attempted to access non-existent route:",
        location.pathname
      );
    }
  }, [location.pathname, isHomeAlias]);

  useEffect(() => {
    if (isHomeAlias) return;
    // Signal a real 404 to search engines even though the server responds
    // 200 with the SPA shell.
    const tags = [
      ["prerender-status-code", "404"],
      ["robots", "noindex, nofollow"],
    ].map(([name, content]) => {
      const meta = document.createElement("meta");
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
      return meta;
    });
    return () => tags.forEach((tag) => tag.remove());
  }, [isHomeAlias]);

  // Fallback redirect if /home, /Home, /home/ reaches 404
  if (isHomeAlias) {
    return <Navigate to="/" replace />;
  }

  return (
    <StudyShell>
      <main className="page-wrap flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <div className="mx-auto max-w-md">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-slate-600">
            Error 404
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[#14294d] sm:text-4xl">
            Page Not Found
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            The page you requested (<code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{location.pathname}</code>) could not be located. It may have been moved or updated.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/"
              className="button-primary inline-flex items-center justify-center gap-2 text-xs font-bold"
            >
              <Home size={15} /> Return to Home
            </Link>
            <Link
              to="/lat"
              className="button-secondary inline-flex items-center justify-center gap-2 text-xs font-bold"
            >
              <BookOpen size={15} /> LAT Preparation
            </Link>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400">
              Need assistance finding a specific lecture or paper?
            </p>
            <a
              href={getGeneralWhatsAppUrl(`Assalam-o-Alaikum RehmanLawAcademy, I was trying to access ${location.pathname} but encountered a 404 page.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#1766a9] hover:underline"
            >
              <MessageCircle size={14} /> Contact WhatsApp Support
            </a>
          </div>
        </div>
      </main>
    </StudyShell>
  );
};

export default NotFound;
