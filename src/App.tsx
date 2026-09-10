import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BrandingBadge } from "./components/BrandingBadge";
import AnswerReview from "./pages/AnswerReview";
import About from "./pages/About";
import Contact from "./pages/Contact";
import LawGat from "./pages/LawGat";
import Information from "./pages/Information";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import LatPreparation from "./pages/LatPreparation";
import NotFound from "./pages/NotFound";
import PakistanStudies from "./pages/PakistanStudies";
import Part1Practice from "./pages/Part1Practice";
import Part1Quiz from "./pages/Part1Quiz";
import QuizHistory from "./pages/QuizHistory";
import QuizResult from "./pages/QuizResult";
import SavedQuestions from "./pages/SavedQuestions";
import WrongQuestions from "./pages/WrongQuestions";
import AdminCatalog from "./pages/admin/Catalog";
import AdminPaidCourses from "./pages/admin/PaidCourses";
import AdminQuestions from "./pages/admin/Questions";
import PaidCourses from "./pages/paid/PaidCourses";
import PublicCourseDetail from "./pages/paid/PublicCourseDetail";
import PaidPurchase from "./pages/paid/PaidPurchase";
import StudentDashboard from "./pages/paid/StudentDashboard";
import MyCourseDetail from "./pages/paid/MyCourseDetail";
import PaidLesson from "./pages/paid/PaidLesson";

const queryClient = new QueryClient();

function PathNormalizer() {
  const location = useLocation();
  const { pathname, search, hash } = location;

  const lower = pathname.toLowerCase();
  const trimmed = lower.replace(/\/+$/, "");

  // If path is /home or /home/ (case-insensitive) -> redirect to '/'
  if (trimmed === "/home" || lower === "/home") {
    return <Navigate to={`/${search}${hash}`} replace />;
  }

  // Handle trailing slash (e.g., /lat/ -> /lat, /about/ -> /about)
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const clean = pathname.replace(/\/+$/, "");
    return <Navigate to={`${clean}${search}${hash}`} replace />;
  }

  return null;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PathNormalizer />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/Home" element={<Navigate to="/" replace />} />
            <Route path="/home/*" element={<Navigate to="/" replace />} />
            <Route path="/Home/*" element={<Navigate to="/" replace />} />
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/index.html" element={<Navigate to="/" replace />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/law-gat" element={<LawGat />} />
            <Route path="/information" element={<Information />} />
            <Route path="/lat" element={<LatPreparation />} />
            <Route path="/lat/pakistan-studies" element={<PakistanStudies />} />
            <Route path="/lat/pakistan-studies/part-1" element={<Part1Practice />} />
            <Route path="/lat/pakistan-studies/part-1/quiz" element={<Part1Quiz />} />
            <Route path="/lat/pakistan-studies/part-1/quiz/:attemptId" element={<Part1Quiz />} />
            <Route path="/results/:attemptId" element={<QuizResult />} />
            <Route path="/results/:attemptId/review" element={<AnswerReview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/saved" element={<SavedQuestions />} />
            <Route path="/wrong" element={<WrongQuestions />} />
            <Route path="/history" element={<QuizHistory />} />
            <Route path="/paid-courses" element={<PaidCourses />} />
            <Route path="/paid-courses/:courseSlug" element={<PublicCourseDetail />} />
            <Route path="/paid-courses/:courseSlug/purchase" element={<PaidPurchase />} />
            <Route path="/my-courses" element={<StudentDashboard />} />
            <Route path="/my-courses/:courseSlug" element={<MyCourseDetail />} />
            <Route path="/my-courses/:courseSlug/lessons/:lessonId" element={<PaidLesson />} />
            <Route path="/admin" element={<Navigate to="/admin/questions" replace />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="/admin/catalog" element={<AdminCatalog />} />
            <Route path="/admin/paid-courses" element={<AdminPaidCourses />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <BrandingBadge />
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
