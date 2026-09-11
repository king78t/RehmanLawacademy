export interface MockCourse {
  id: string;
  slug: string;
  title: string;
  short_description?: string;
  description?: string;
  instructor?: string;
  duration_label?: string;
  lecture_count: number;
  test_count: number;
  currency: string;
  price_pkr: number;
  price_configured?: boolean;
  publication_status?: string;
  is_published: boolean;
  thumbnail_url?: string;
  created_at: string;
  sort_order: number;
}

export interface MockCourseModule {
  id: string;
  course_id: string;
  course_slug: string;
  title: string;
  description?: string;
  sort_order: number;
  is_published: boolean;
}

export const FALLBACK_COURSES: MockCourse[] = [
  {
    id: "course-lat-masterclass-01",
    slug: "lat-complete-masterclass",
    title: "LAT Complete Masterclass 2026",
    short_description: "Comprehensive Law Admission Test preparation covering all subjects, essay writing, and personal statements.",
    description: "The premier all-inclusive preparation track for the HEC Law Admission Test (LAT). Features high-yield lecture series covering Pakistan Studies, Islamic Studies, English Vocabulary & Grammar, General Knowledge, Mathematics, Urdu, and dedicated evaluation sessions for 25-mark subjective essays.",
    instructor: "Advocate Rehman Khan & Senior Faculty",
    duration_label: "8 Weeks Intensive",
    lecture_count: 42,
    test_count: 12,
    currency: "PKR",
    price_pkr: 6500,
    price_configured: true,
    publication_status: "published",
    is_published: true,
    thumbnail_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-01-10T10:00:00Z",
    sort_order: 1,
  },
  {
    id: "course-lat-past-papers-02",
    slug: "lat-past-papers-crash-course",
    title: "LAT Past Papers & 1000 MCQs Crash Course",
    short_description: "Intensive dissection of the past 5 years LAT examinations with model solution keys and trick solving techniques.",
    description: "A fast-paced review course for candidates sitting in the upcoming examination. Deconstruct past paper trends, repetitive questions, HEC testing patterns, and speed drills.",
    instructor: "Academic Law Faculty Panel",
    duration_label: "4 Weeks Fast Track",
    lecture_count: 24,
    test_count: 10,
    currency: "PKR",
    price_pkr: 4000,
    price_configured: true,
    publication_status: "published",
    is_published: true,
    thumbnail_url: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-01-15T12:00:00Z",
    sort_order: 2,
  },
  {
    id: "course-law-gat-prep-03",
    slug: "law-gat-comprehensive-program",
    title: "Law GAT Comprehensive Preparation Program",
    short_description: "Specialized curriculum for LL.B graduates targeting GAT certification by HEC and Pakistan Bar Council.",
    description: "Targeted modules for Constitutional Law, Jurisprudence, Civil Procedure Code, Criminal Procedure Code, Law of Evidence (Qanun-e-Shahadat), and Professional Ethics required for Bar enrollment.",
    instructor: "High Court Advocates & Bar Council Mentors",
    duration_label: "6 Weeks",
    lecture_count: 36,
    test_count: 8,
    currency: "PKR",
    price_pkr: 8500,
    price_configured: true,
    publication_status: "published",
    is_published: true,
    thumbnail_url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-02-01T09:30:00Z",
    sort_order: 3,
  },
  {
    id: "course-lat-subjective-04",
    slug: "lat-essay-personal-statement-workshop",
    title: "LAT Essay & Personal Statement Writing Workshop",
    short_description: "Master the decisive 25 marks subjective portion with expert checked drafts, outlines, and scoring vocabulary.",
    description: "Personalized guidance on crafting high-scoring English/Urdu essays and persuasive personal statements. Includes 10 model essays, outline frameworks, and individual draft reviews.",
    instructor: "Language & Legal Writing Specialist",
    duration_label: "2 Weeks Workshop",
    lecture_count: 14,
    test_count: 5,
    currency: "PKR",
    price_pkr: 3000,
    price_configured: true,
    publication_status: "published",
    is_published: true,
    thumbnail_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    created_at: "2026-02-10T14:00:00Z",
    sort_order: 4,
  },
];

export const FALLBACK_MODULES: MockCourseModule[] = [
  {
    id: "mod-01",
    course_id: "course-lat-masterclass-01",
    course_slug: "lat-complete-masterclass",
    title: "Module 1: Pakistan Studies & Constitution Basics",
    description: "Historical timeline from 1857 to 1947, constitutional developments, and landmark amendments.",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "mod-02",
    course_id: "course-lat-masterclass-01",
    course_slug: "lat-complete-masterclass",
    title: "Module 2: Islamic Studies & Ethics",
    description: "Pillars of Islam, Quranic revelations, Seerat-un-Nabi (PBUH), and fundamental Islamic jurisprudence.",
    sort_order: 2,
    is_published: true,
  },
  {
    id: "mod-03",
    course_id: "course-lat-masterclass-01",
    course_slug: "lat-complete-masterclass",
    title: "Module 3: English Grammar, Synonyms & Antonyms",
    description: "Prepositions, idioms, reading comprehension, and essential legal/academic vocabulary.",
    sort_order: 3,
    is_published: true,
  },
  {
    id: "mod-04",
    course_id: "course-lat-past-papers-02",
    course_slug: "lat-past-papers-crash-course",
    title: "Module 1: 2021 - 2023 Solved Papers with Key",
    description: "Step-by-step breakdown of questions, options, and frequent traps.",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "mod-05",
    course_id: "course-law-gat-prep-03",
    course_slug: "law-gat-comprehensive-program",
    title: "Module 1: Civil Procedure Code & Qanun-e-Shahadat",
    description: "Substantive analysis of procedural law and admissibility rules.",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "mod-06",
    course_id: "course-lat-subjective-04",
    course_slug: "lat-essay-personal-statement-workshop",
    title: "Module 1: Essay Structuring & Thesis Statement",
    description: "Introduction hooks, argument development, and concluding recommendations.",
    sort_order: 1,
    is_published: true,
  },
];

export const FALLBACK_PAYMENT_SETTINGS = {
  id: "00000000-0000-0000-0000-000000000001",
  bank_name: "Habib Bank Limited (HBL)",
  account_title: "Rehman Law Academy",
  account_number: "00427991823103",
  iban: "PK36HABB0000427991823103",
  bank_instructions: "Transfer course fee via 1Link, Raast, or Mobile Banking app. Save digital receipt screenshot or transaction SMS and upload below.",
  easypaisa_title: "Rehman Law Academy (Official)",
  easypaisa_number: "0312-8891288",
  easypaisa_instructions: "Send fee to Easypaisa account. Take a screenshot of the confirmed transfer screen and upload below.",
  jazzcash_title: "Rehman Law Academy (Official)",
  jazzcash_number: "0312-8891288",
  jazzcash_instructions: "Transfer fee to JazzCash mobile account and upload the confirmed transaction receipt.",
  whatsapp_number: "923128891288",
  whatsapp_url: "https://wa.me/923128891288",
  whatsapp_message: "Assalam-o-Alaikum Rehman Law Academy, I submitted my course fee receipt.",
  updated_at: "2026-02-15T10:00:00Z",
};

