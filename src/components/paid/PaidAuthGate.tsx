import { useEffect, useState, type ReactNode } from "react";
import { User } from "@/entities";
import { StudyShell } from "@/components/study/StudyShell";
import { StudentAuthForm } from "@/components/paid/StudentAuthForm";

function PaidLoading() {
  return (
    <StudyShell>
      <main className="page-wrap min-h-[68vh] py-16" role="status" aria-label="Checking paid-course access">
        <div className="surface p-6 sm:p-8">
          <div className="loader-line w-1/3" />
          <div className="loader-line mt-4 w-2/3" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="loader-line h-24" />
            <div className="loader-line h-24" />
            <div className="loader-line h-24" />
          </div>
        </div>
      </main>
    </StudyShell>
  );
}

export function PaidAuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "signed-out" | "allowed">("loading");

  const checkAuth = () => {
    User.me()
      .then((user) => {
        if (user && user.id) {
          setStatus("allowed");
        } else {
          setStatus("signed-out");
        }
      })
      .catch(() => {
        setStatus("signed-out");
      });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (status === "loading") return <PaidLoading />;

  if (status === "signed-out") {
    return (
      <StudyShell>
        <main className="page-wrap flex min-h-[75vh] items-center justify-center py-12">
          <StudentAuthForm onSuccess={() => setStatus("allowed")} />
        </main>
      </StudyShell>
    );
  }

  return <>{children}</>;
}
