import { useSearchParams } from "react-router-dom";
import { StudentAuthForm } from "@/components/paid/StudentAuthForm";
import { StudyShell } from "@/components/study/StudyShell";

export default function StudentRegister() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/my-courses";

  return (
    <StudyShell>
      <main className="page-wrap flex min-h-[75vh] items-center justify-center py-12">
        <StudentAuthForm initialMode="signup" redirectUrl={redirectUrl} />
      </main>
    </StudyShell>
  );
}
