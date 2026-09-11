/**
 * Local resilient data store and function runner for RehmanLawAcademy.
 * Provides offline-first persistence, starter catalog data, and seamless
 * fallback when external Superdev API endpoints are unavailable or return HTML.
 */

const STORAGE_PREFIX = "rla_store_";

export interface StoredUser {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "administrator";
  mobile_number?: string;
  password?: string;
  created_at?: string;
}

const DEFAULT_EXAMS = [
  {
    id: "exam-lat",
    slug: "lat",
    title: "Law Admission Test (LAT)",
    description: "Standardized admission examination for 5-year LLB programs across Pakistan.",
    is_active: true,
    sort_order: 1,
  },
];

const DEFAULT_SUBJECTS = [
  {
    id: "subj-pak-studies",
    exam_slug: "lat",
    slug: "pakistan-studies",
    name: "Pakistan Studies",
    description: "Constitutional history, Pakistan Movement, geography, and governance essentials for LAT.",
    is_active: true,
    sort_order: 1,
  },
];

const DEFAULT_PARTS = [
  {
    id: "part-pak-1",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    slug: "part-1",
    name: "Part 1 — Foundations & Constitutional History",
    description: "Foundational events from 1906 to 1973 constitutional milestones.",
    is_active: true,
    sort_order: 1,
  },
];

const DEFAULT_QUESTIONS = [
  {
    id: "q-lat-pak-1",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "Who presented the historic Lahore Resolution on 23rd March 1940?",
    option_a: "Liaquat Ali Khan",
    option_b: "A.K. Fazlul Huq",
    option_c: "Quaid-e-Azam Muhammad Ali Jinnah",
    option_d: "Allama Muhammad Iqbal",
    correct_answer: "B",
    explanation: "The Lahore Resolution (later known as the Pakistan Resolution) was formally presented by Maulvi A.K. Fazlul Huq, the Premier of Bengal, during the annual session of the All India Muslim League on March 23, 1940.",
    difficulty: "medium",
    sort_order: 1,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-2",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "In which year did the All India Muslim League formally come into existence in Dhaka?",
    option_a: "1905",
    option_b: "1906",
    option_c: "1909",
    option_d: "1913",
    correct_answer: "B",
    explanation: "The All India Muslim League was established on 30 December 1906 at Dhaka under the leadership of Nawab Salimullah Khan, Nawab Mohsin-ul-Mulk, and Nawab Waqar-ul-Mulk.",
    difficulty: "easy",
    sort_order: 2,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-3",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "Who served as the first Governor-General of sovereign Pakistan?",
    option_a: "Khawaja Nazimuddin",
    option_b: "Liaquat Ali Khan",
    option_c: "Quaid-e-Azam Muhammad Ali Jinnah",
    option_d: "Malik Ghulam Muhammad",
    correct_answer: "C",
    explanation: "Quaid-e-Azam Muhammad Ali Jinnah took oath of office as the first Governor-General of Pakistan on August 15, 1947, serving until his passing on September 11, 1948.",
    difficulty: "easy",
    sort_order: 3,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-4",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "When was the historic Objectives Resolution adopted by the Constituent Assembly of Pakistan?",
    option_a: "12 March 1949",
    option_b: "14 August 1947",
    option_c: "23 March 1956",
    option_d: "11 August 1948",
    correct_answer: "A",
    explanation: "The Objectives Resolution was moved by Prime Minister Liaquat Ali Khan and adopted by the First Constituent Assembly on March 12, 1949, setting the ideological framework of Pakistan's constitutions.",
    difficulty: "medium",
    sort_order: 4,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-5",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "Under which constitution was Pakistan officially designated as an 'Islamic Republic' for the first time?",
    option_a: "Government of India Act 1935",
    option_b: "1956 Constitution",
    option_c: "1962 Constitution",
    option_d: "1973 Constitution",
    correct_answer: "B",
    explanation: "The first Constitution of Pakistan, promulgated on 23 March 1956, officially named the country the 'Islamic Republic of Pakistan'.",
    difficulty: "medium",
    sort_order: 5,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-6",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "Quaid-e-Azam presented his famous 'Fourteen Points' in 1929 in response to which constitutional document?",
    option_a: "Simon Commission",
    option_b: "Nehru Report",
    option_c: "Cripps Proposals",
    option_d: "Cabinet Mission Plan",
    correct_answer: "B",
    explanation: "Quaid-e-Azam Muhammad Ali Jinnah formulated his historic Fourteen Points in March 1929 as a counter-proposal to the Nehru Report of 1928, safeguarding Muslim political rights.",
    difficulty: "medium",
    sort_order: 6,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-7",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "Which historical mountain pass connects Peshawar in Pakistan with Jalalabad and Kabul?",
    option_a: "Bolan Pass",
    option_b: "Khunjerab Pass",
    option_c: "Khyber Pass",
    option_d: "Gomal Pass",
    correct_answer: "C",
    explanation: "The Khyber Pass is the famous mountain pass in northwestern Pakistan connecting Peshawar with the Afghan border and onward to Kabul.",
    difficulty: "easy",
    sort_order: 7,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-8",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "Which river is the longest and main lifeline of Pakistan's agricultural irrigation network?",
    option_a: "Chenab River",
    option_b: "Jhelum River",
    option_c: "Indus River",
    option_d: "Ravi River",
    correct_answer: "C",
    explanation: "The Indus River is Pakistan's longest river, flowing over 3,180 kilometers from the Himalayas into the Arabian Sea.",
    difficulty: "easy",
    sort_order: 8,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-9",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "At which annual session did Allama Muhammad Iqbal deliver his visionary address proposing a distinct Muslim homeland?",
    option_a: "Lahore Session 1940",
    option_b: "Allahabad Session 1930",
    option_c: "Delhi Session 1929",
    option_d: "Lucknow Session 1916",
    correct_answer: "B",
    explanation: "In December 1930 at Allahabad, Allama Iqbal delivered his presidential address proposing the amalgamation of Punjab, NWFP, Sindh, and Balochistan into a consolidated self-governing Muslim entity.",
    difficulty: "medium",
    sort_order: 9,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
  {
    id: "q-lat-pak-10",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    question_text: "The Indus Waters Treaty of 1960 between Pakistan and India was mediated by which international organization?",
    option_a: "United Nations",
    option_b: "World Bank",
    option_c: "International Court of Justice",
    option_d: "Commonwealth Secretariat",
    correct_answer: "B",
    explanation: "The Indus Waters Treaty was brokered by the World Bank and signed on September 19, 1960, dividing the waters of the six Indus basin rivers between Pakistan and India.",
    difficulty: "medium",
    sort_order: 10,
    is_published: true,
    starter_review: true,
    review_label: "Starter Content — For Academic Review",
  },
];

const DEFAULT_COURSES = [
  {
    id: "course-lat-complete",
    slug: "lat-complete-prep",
    title: "LAT Complete Preparation Masterclass",
    short_description: "Comprehensive preparation covering all LAT subjects with focused lectures, quizzes, and structured guidance.",
    description: "Designed specifically for Law Admission Test (LAT) candidates in Pakistan. Includes detailed video lectures, chapter-wise notes, and regular practice quizzes directly mapped to the HEC syllabus.",
    instructor: "Rehman Law Academy",
    duration_label: "6 Weeks",
    lecture_count: 24,
    test_count: 12,
    currency: "PKR",
    price_pkr: 3500,
    price_configured: true,
    is_published: true,
    publication_status: "published",
    thumbnail_url: "",
    curriculum_summary: "Complete coverage of Essay & Personal Statement, Pakistan Studies, Islamic Studies, English, and General Knowledge.",
    sort_order: 1,
  },
  {
    id: "course-lat-fast-track",
    slug: "lat-fast-track-crash-course",
    title: "LAT Fast-Track Revision & Test Series",
    short_description: "Intensive 2-week crash course with high-yield MCQ practice and model papers.",
    description: "For students taking the upcoming LAT session who need targeted revision, time-management tips, and daily practice tests.",
    instructor: "Sir Rehman & Faculty",
    duration_label: "2 Weeks",
    lecture_count: 14,
    test_count: 8,
    currency: "PKR",
    price_pkr: 2000,
    price_configured: true,
    is_published: true,
    publication_status: "published",
    thumbnail_url: "",
    curriculum_summary: "High-yield topics, past paper trends, essay templates, and daily simulated mock exams.",
    sort_order: 2,
  },
];

const DEFAULT_MODULES = [
  {
    id: "mod-lat-1",
    course_id: "course-lat-complete",
    course_slug: "lat-complete-prep",
    title: "LAT Exam Strategy & Syllabus Blueprint",
    description: "Understand the HEC test pattern, scoring breakdown, and high-priority study topics.",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "mod-lat-2",
    course_id: "course-lat-complete",
    course_slug: "lat-complete-prep",
    title: "Pakistan Studies & Constitutional Milestones",
    description: "Freedom movement timeline, landmark events, and constitutional evolution.",
    sort_order: 2,
    is_published: true,
  },
  {
    id: "mod-lat-3",
    course_id: "course-lat-complete",
    course_slug: "lat-complete-prep",
    title: "English Vocabulary, Grammar & Comprehension",
    description: "Master high-frequency synonyms, antonyms, prepositions, and sentence correction.",
    sort_order: 3,
    is_published: true,
  },
  {
    id: "mod-lat-4",
    course_id: "course-lat-complete",
    course_slug: "lat-complete-prep",
    title: "Essay & Personal Statement Writing Masterclass",
    description: "Techniques for structuring 15-mark essays and 10-mark personal statements.",
    sort_order: 4,
    is_published: true,
  },
];

const DEFAULT_LESSONS = [
  {
    id: "les-lat-1",
    module_id: "mod-lat-1",
    course_id: "course-lat-complete",
    title: "Understanding the LAT Exam Pattern & Scoring Scheme",
    description: "Overview of LAT test structure, marks distribution, and time allocation across all sections.",
    notes: "Key Takeaways:\n1. Total Marks: 100 (Passing: 50)\n2. Objective MCQs: 75 Marks\n3. Subjective Section: 25 Marks (Essay 15, Personal Statement 10)\n4. No negative marking in LAT.",
    attachment_url: "",
    video_provider: "",
    video_reference: "",
    duration_seconds: 1200,
    sort_order: 1,
    is_published: true,
  },
  {
    id: "les-lat-2",
    module_id: "mod-lat-1",
    course_id: "course-lat-complete",
    title: "Time Management Strategy for the 120-Minute Exam",
    description: "How to divide your test time between MCQs, brainstorming, drafting, and final review.",
    notes: "Recommended Allocation:\n- MCQs (75 questions): 60 minutes\n- Essay Drafting: 35 minutes\n- Personal Statement: 20 minutes\n- Final Review: 5 minutes",
    attachment_url: "",
    video_provider: "",
    video_reference: "",
    duration_seconds: 900,
    sort_order: 2,
    is_published: true,
  },
  {
    id: "les-lat-3",
    module_id: "mod-lat-2",
    course_id: "course-lat-complete",
    title: "The 1940 Lahore Resolution to 1947 Independence",
    description: "Detailed walkthrough of critical historical milestones tested in LAT Pakistan Studies.",
    notes: "Critical Chronology:\n- 1940: Lahore Resolution (presented by A.K. Fazlul Huq)\n- 1942: Cripps Mission & Quit India Movement\n- 1944: Gandhi-Jinnah Talks\n- 1945: Simla Conference\n- 1946: Cabinet Mission Plan & Direct Action Day\n- 1947: 3rd June Plan & Indian Independence Act",
    attachment_url: "",
    video_provider: "",
    video_reference: "",
    duration_seconds: 1800,
    sort_order: 1,
    is_published: true,
  },
  {
    id: "les-lat-4",
    module_id: "mod-lat-2",
    course_id: "course-lat-complete",
    title: "Key Constitutional Milestones: 1956, 1962, and 1973",
    description: "Comparison of Pakistan's three constitutions and their key characteristics.",
    notes: "Constitutional Highlights:\n- 1956: Parliamentary, Islamic Republic declared, Unicameral\n- 1962: Presidential system, Indirect elections via Basic Democracies\n- 1973: Bicameral legislature (National Assembly & Senate), Parliamentary democracy, Fundamental rights guarantees.",
    attachment_url: "",
    video_provider: "",
    video_reference: "",
    duration_seconds: 1500,
    sort_order: 2,
    is_published: true,
  },
  {
    id: "les-lat-5",
    module_id: "mod-lat-3",
    course_id: "course-lat-complete",
    title: "High-Yield LAT English Vocabulary & Synonyms",
    description: "Top 100 recurring words and root techniques to deduce unfamiliar terms under exam pressure.",
    notes: "Focus on common LAT word groups: legal terms (acquit, plaintiff, hearsay), formal academic registers, and contextual sentence completion.",
    attachment_url: "",
    video_provider: "",
    video_reference: "",
    duration_seconds: 1600,
    sort_order: 1,
    is_published: true,
  },
  {
    id: "les-lat-6",
    module_id: "mod-lat-4",
    course_id: "course-lat-complete",
    title: "Structuring a High-Scoring LAT Essay (English & Urdu)",
    description: "Crafting thesis statements, cohesive body paragraphs, and impactful conclusions.",
    notes: "LAT Essay Blueprint:\n1. Introduction: Hook + Definition + Thesis (3-4 sentences)\n2. Body Paragraph 1: Core causes or background\n3. Body Paragraph 2: Contemporary challenges or legal dimensions\n4. Body Paragraph 3: Pragmatic, actionable solutions\n5. Conclusion: Synthesize without introducing brand-new arguments.",
    attachment_url: "",
    video_provider: "",
    video_reference: "",
    duration_seconds: 2100,
    sort_order: 1,
    is_published: true,
  },
];

const DEFAULT_QUIZ_DEFS = [
  {
    id: "starter-part-1",
    exam_slug: "lat",
    subject_slug: "pakistan-studies",
    part_slug: "part-1",
    title: "Pakistan Studies · Part 1 Practice Quiz",
    question_count: 10,
    time_limit_seconds: 1800,
    randomize: true,
    is_published: true,
  },
];

export const DEFAULT_PAYMENT_SETTINGS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    bank_name: "Habib Bank Limited (HBL)",
    account_title: "Rehman Law Academy",
    account_number: "00427991823103",
    iban: "PK36HABB0000427991823103",
    bank_instructions: "Please enter the student's name or course title in your online banking transfer remarks. Upload a clear screenshot of the debit receipt below.",
    easypaisa_title: "Rehman Law Academy (Official)",
    easypaisa_number: "0312-8891288",
    easypaisa_instructions: "Transfer the course fee to our official Easypaisa account. Take a screenshot of the Easypaisa successful payment confirmation screen.",
    jazzcash_title: "Rehman Law Academy (Official)",
    jazzcash_number: "0312-8891288",
    jazzcash_instructions: "Transfer the course fee to our official JazzCash account. Keep the JazzCash confirmation SMS or transaction screenshot.",
    whatsapp_number: "923128891288",
    whatsapp_url: "https://wa.me/923128891288",
    whatsapp_message: "Assalam-o-Alaikum, I need assistance regarding RehmanLawAcademy paid course enrollment/payment.",
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_COURSE_TESTS = [
  {
    id: "test-lat-diagnostic-1",
    course_id: "course-lat-complete",
    course_slug: "lat-complete-prep",
    title: "LAT Comprehensive Diagnostic Mock Exam",
    description: "Full-length 10-question diagnostic test evaluating your readiness across key Law Admission Test disciplines with timer and instant answer review.",
    time_limit_minutes: 15,
    passing_score: 50,
    is_published: true,
  },
  {
    id: "test-lat-crash-1",
    course_id: "course-lat-fast-track",
    course_slug: "lat-fast-track-crash-course",
    title: "LAT Fast-Track High-Yield Test Drill",
    description: "Time-pressured test series covering high-frequency constitutional and general knowledge MCQs.",
    time_limit_minutes: 10,
    passing_score: 60,
    is_published: true,
  },
];

export const DEFAULT_COURSE_TEST_QUESTIONS = [
  {
    id: "tq-1",
    test_id: "test-lat-diagnostic-1",
    question_text: "Under the 1973 Constitution of Pakistan, what is the composition and principle of the Senate?",
    option_a: "Direct popular election by district",
    option_b: "Permanent body with equal provincial representation",
    option_c: "Unicameral advisory council",
    option_d: "Dissolved every three years",
    correct_answer: "B",
    explanation: "The Senate of Pakistan is a permanent legislative body ensuring equal representation to all federating provinces, with half of its members retiring every three years.",
    sort_order: 1,
  },
  {
    id: "tq-2",
    test_id: "test-lat-diagnostic-1",
    question_text: "What is the constitutional role of the Supreme Judicial Council in Pakistan?",
    option_a: "Hearing tax and customs appeals",
    option_b: "Enquiring into the conduct and physical/mental capacity of superior court judges",
    option_c: "Appointing lower magistrates",
    option_d: "Drafting federal statutes",
    correct_answer: "B",
    explanation: "Article 209 of the 1973 Constitution establishes the Supreme Judicial Council to investigate allegations of misconduct or incapacity regarding judges of the superior courts.",
    sort_order: 2,
  },
  {
    id: "tq-3",
    test_id: "test-lat-diagnostic-1",
    question_text: "Select the word that is most nearly SYNONYMOUS with 'ACQUIT':",
    option_a: "Convict",
    option_b: "Exonerate",
    option_c: "Incarcerate",
    option_d: "Indict",
    correct_answer: "B",
    explanation: "'Acquit' means to formally free someone from a criminal charge by a verdict of not guilty, synonymous with 'exonerate'.",
    sort_order: 3,
  },
  {
    id: "tq-4",
    test_id: "test-lat-diagnostic-1",
    question_text: "When was the historic Objectives Resolution passed by the Constituent Assembly of Pakistan?",
    option_a: "August 14, 1947",
    option_b: "March 12, 1949",
    option_c: "March 23, 1956",
    option_d: "December 25, 1950",
    correct_answer: "B",
    explanation: "Liaquat Ali Khan presented the Objectives Resolution on March 7, 1949, and it was adopted on March 12, 1949.",
    sort_order: 4,
  },
  {
    id: "tq-5",
    test_id: "test-lat-diagnostic-1",
    question_text: "Which article of the 1973 Constitution specifically guarantees the right to a fair trial and due process?",
    option_a: "Article 4",
    option_b: "Article 9",
    option_c: "Article 10-A",
    option_d: "Article 25",
    correct_answer: "C",
    explanation: "Article 10-A was incorporated into the Constitution via the 18th Constitutional Amendment, establishing the right to a fair trial as an explicit fundamental right.",
    sort_order: 5,
  },
  {
    id: "tq-6",
    test_id: "test-lat-diagnostic-1",
    question_text: "Choose the correct preposition: 'The candidate was exempted _____ taking the preliminary test.'",
    option_a: "to",
    option_b: "from",
    option_c: "at",
    option_d: "with",
    correct_answer: "B",
    explanation: "The standard preposition paired with the verb 'exempt' is 'from'.",
    sort_order: 6,
  },
  {
    id: "tq-7",
    test_id: "test-lat-diagnostic-1",
    question_text: "The historic Lucknow Pact was concluded in which year between the All India Muslim League and Congress?",
    option_a: "1906",
    option_b: "1916",
    option_c: "1928",
    option_d: "1935",
    correct_answer: "B",
    explanation: "The Lucknow Pact was signed in December 1916, where Congress conceded the Muslim League's demand for separate electorates.",
    sort_order: 7,
  },
  {
    id: "tq-8",
    test_id: "test-lat-diagnostic-1",
    question_text: "Which superior court exercises extraordinary constitutional writ jurisdiction under Article 199?",
    option_a: "Sessions Court",
    option_b: "High Court",
    option_c: "Civil Court",
    option_d: "Federal Shariat Court only",
    correct_answer: "B",
    explanation: "High Courts in Pakistan hold constitutional jurisdiction to issue prerogative writs under Article 199 of the 1973 Constitution.",
    sort_order: 8,
  },
  {
    id: "tq-9",
    test_id: "test-lat-diagnostic-1",
    question_text: "What does the Latin legal maxim 'Res Ipsa Loquitur' mean?",
    option_a: "The thing speaks for itself",
    option_b: "Hear the other side",
    option_c: "No one can judge his own cause",
    option_d: "Ignorance of law is no excuse",
    correct_answer: "A",
    explanation: "'Res ipsa loquitur' is a doctrine providing that the very nature of an accident implies that negligence must have occurred: the thing speaks for itself.",
    sort_order: 9,
  },
  {
    id: "tq-10",
    test_id: "test-lat-diagnostic-1",
    question_text: "What is the total maximum marks allocated for the Law Admission Test (LAT) by the HEC?",
    option_a: "75 Marks",
    option_b: "100 Marks",
    option_c: "150 Marks",
    option_d: "200 Marks",
    correct_answer: "B",
    explanation: "The HEC Law Admission Test (LAT) comprises 100 total marks (75 MCQs + 25 Essay/Personal Statement), with 50 marks required to pass.",
    sort_order: 10,
  },
];

function getDefaultsForEntity(entityName: string): any[] {
  switch (entityName) {
    case "Exam":
      return DEFAULT_EXAMS;
    case "Subject":
      return DEFAULT_SUBJECTS;
    case "Part":
      return DEFAULT_PARTS;
    case "Question":
      return DEFAULT_QUESTIONS;
    case "Course":
      return DEFAULT_COURSES;
    case "CourseModule":
      return DEFAULT_MODULES;
    case "CourseLesson":
      return DEFAULT_LESSONS;
    case "QuizDefinition":
      return DEFAULT_QUIZ_DEFS;
    case "PaymentSettings":
      return DEFAULT_PAYMENT_SETTINGS;
    case "CourseTest":
      return DEFAULT_COURSE_TESTS;
    case "CourseTestQuestion":
      return DEFAULT_COURSE_TEST_QUESTIONS;
    default:
      return [];
  }
}

class LocalStore {
  private memory = new Map<string, any[]>();
  private currentUser: StoredUser | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedUser = window.localStorage.getItem("rla_auth_user");
        if (savedUser) {
          this.currentUser = JSON.parse(savedUser);
        }
      } catch {
        // ignore parse error
      }
    }
  }

  getCurrentUser(): StoredUser | null {
    return this.currentUser;
  }

  setCurrentUser(user: StoredUser | null) {
    this.currentUser = user;
    if (typeof window !== "undefined") {
      if (user) {
        window.localStorage.setItem("rla_auth_user", JSON.stringify(user));
      } else {
        window.localStorage.removeItem("rla_auth_user");
      }
    }
  }

  private getKey(entityName: string): string {
    return `${STORAGE_PREFIX}${entityName}`;
  }

  getAll(entityName: string): any[] {
    if (typeof window === "undefined") {
      if (!this.memory.has(entityName)) {
        this.memory.set(entityName, JSON.parse(JSON.stringify(getDefaultsForEntity(entityName))));
      }
      return this.memory.get(entityName) || [];
    }

    const key = this.getKey(entityName);
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    const defaults = JSON.parse(JSON.stringify(getDefaultsForEntity(entityName)));
    try {
      window.localStorage.setItem(key, JSON.stringify(defaults));
    } catch {
      // ignore
    }
    return defaults;
  }

  saveAll(entityName: string, items: any[]): void {
    if (typeof window === "undefined") {
      this.memory.set(entityName, items);
      return;
    }
    try {
      window.localStorage.setItem(this.getKey(entityName), JSON.stringify(items));
    } catch (e) {
      console.warn(`[LocalStore] Could not persist entity ${entityName}:`, e);
    }
  }

  filter(entityName: string, query: Record<string, any> = {}, sort?: string, limit?: number, skip?: number): any[] {
    let rows = [...this.getAll(entityName)];

    // Filter
    if (query && typeof query === "object") {
      rows = rows.filter((item) => {
        for (const [key, value] of Object.entries(query)) {
          if (value === undefined) continue;
          if (typeof value === "object" && value !== null) {
            if ("$ne" in value && item[key] === value.$ne) return false;
            if ("$gt" in value && !(item[key] > value.$gt)) return false;
            if ("$gte" in value && !(item[key] >= value.$gte)) return false;
            if ("$lt" in value && !(item[key] < value.$lt)) return false;
            if ("$lte" in value && !(item[key] <= value.$lte)) return false;
            if ("$in" in value && Array.isArray(value.$in) && !value.$in.includes(item[key])) return false;
            if ("$nin" in value && Array.isArray(value.$nin) && value.$nin.includes(item[key])) return false;
          } else if (item[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }

    // Sort
    if (sort) {
      const isDesc = sort.startsWith("-");
      const field = isDesc ? sort.substring(1) : sort;
      rows.sort((a, b) => {
        const va = a[field];
        const vb = b[field];
        if (va === vb) return 0;
        if (va === undefined || va === null) return isDesc ? 1 : -1;
        if (vb === undefined || vb === null) return isDesc ? -1 : 1;
        if (typeof va === "number" && typeof vb === "number") {
          return isDesc ? vb - va : va - vb;
        }
        return isDesc ? String(vb).localeCompare(String(va)) : String(va).localeCompare(String(vb));
      });
    }

    // Pagination
    if (skip && skip > 0) {
      rows = rows.slice(skip);
    }
    if (limit && limit > 0) {
      rows = rows.slice(0, limit);
    }

    return rows;
  }

  get(entityName: string, id: string): any | null {
    const items = this.getAll(entityName);
    return items.find((item) => String(item.id) === String(id)) || null;
  }

  create(entityName: string, data: any): any {
    const items = this.getAll(entityName);
    const newRecord = {
      id: data.id || `${entityName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    };
    items.push(newRecord);
    this.saveAll(entityName, items);
    return newRecord;
  }

  update(entityName: string, id: string, updates: any): any {
    const items = this.getAll(entityName);
    const index = items.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      // If updating user "me"
      if (entityName === "User" && id === "me" && this.currentUser) {
        this.currentUser = { ...this.currentUser, ...updates };
        this.setCurrentUser(this.currentUser);
        return this.currentUser;
      }
      throw new Error(`Record with id ${id} not found in ${entityName}`);
    }
    items[index] = {
      ...items[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveAll(entityName, items);
    return items[index];
  }

  delete(entityName: string, id: string): { success: boolean } {
    const items = this.getAll(entityName);
    const next = items.filter((item) => String(item.id) !== String(id));
    this.saveAll(entityName, next);
    return { success: true };
  }

  deleteMany(entityName: string, ids: string[]): { success: boolean; count: number } {
    const idSet = new Set(ids.map(String));
    const items = this.getAll(entityName);
    const next = items.filter((item) => !idSet.has(String(item.id)));
    this.saveAll(entityName, next);
    return { success: true, count: items.length - next.length };
  }

  bulkCreate(entityName: string, list: any[]): any[] {
    const items = this.getAll(entityName);
    const created = list.map((data, index) => ({
      id: data.id || `${entityName.toLowerCase()}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...data,
    }));
    items.push(...created);
    this.saveAll(entityName, items);
    return created;
  }

  getRegisteredUsers(): StoredUser[] {
    const DEFAULT_USERS: StoredUser[] = [
      {
        id: "user-admin-main",
        email: "RehmanLawacademy@gmail.com",
        full_name: "Rehman Law Academy Admin",
        role: "administrator",
        mobile_number: "0312-8891288",
        password: "Rehman898#",
      },
      {
        id: "user-admin-1",
        email: "admin@rehmanlawacademy.pk",
        full_name: "Academy Administrator",
        role: "administrator",
        mobile_number: "0312-8891288",
        password: "admin123",
      },
      {
        id: "user-student-1",
        email: "student@rehmanlawacademy.pk",
        full_name: "Muhammad Ali (Student)",
        role: "student",
        mobile_number: "0300-1234567",
        password: "student123",
      },
    ];

    if (typeof window === "undefined") return DEFAULT_USERS;
    try {
      const stored = window.localStorage.getItem("rla_registered_users");
      if (stored) {
        return JSON.parse(stored);
      }
      window.localStorage.setItem("rla_registered_users", JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }

  saveRegisteredUsers(users: StoredUser[]): void {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("rla_registered_users", JSON.stringify(users));
      } catch {
        // ignore
      }
    }
  }

  login(email: string, password: string): StoredUser {
    const users = this.getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanEmail === "rehmanlawacademy@gmail.com" && cleanPass === "Rehman898#") {
      const adminUser: StoredUser = {
        id: "user-admin-main",
        email: "RehmanLawacademy@gmail.com",
        full_name: "Rehman Law Academy Admin",
        role: "administrator",
        mobile_number: "0312-8891288",
      };
      this.setCurrentUser(adminUser);
      return adminUser;
    }

    const match = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!match) {
      throw new Error("No student account found with this email address. Please click Sign Up to register.");
    }
    if (match.password && match.password !== cleanPass) {
      throw new Error("Incorrect password. Please verify your password or contact academy support.");
    }
    const safeUser: StoredUser = {
      id: match.id,
      email: match.email,
      full_name: match.full_name,
      role: match.role,
      mobile_number: match.mobile_number,
    };
    this.setCurrentUser(safeUser);
    return safeUser;
  }

  signup(fullName: string, email: string, mobileNumber: string, password: string): StoredUser {
    const users = this.getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanMobile = mobileNumber.trim();
    const cleanPass = password.trim();

    if (!cleanName) throw new Error("Full name is required.");
    if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("A valid email address is required.");
    if (!cleanMobile) throw new Error("Mobile phone number is required.");
    if (cleanPass.length < 6) throw new Error("Password must be at least 6 characters.");

    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error("An account with this email address already exists. Please sign in instead.");
    }

    const newUser: StoredUser = {
      id: `student-${Date.now()}`,
      email: cleanEmail,
      full_name: cleanName,
      mobile_number: cleanMobile,
      password: cleanPass,
      role: "student",
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveRegisteredUsers(users);

    const safeUser: StoredUser = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      mobile_number: newUser.mobile_number,
    };
    this.setCurrentUser(safeUser);
    return safeUser;
  }

  logout(): void {
    this.setCurrentUser(null);
  }

  getPaymentSettings(): any {
    const rows = this.getAll("PaymentSettings");
    if (rows && rows.length > 0) return rows[0];
    const def = DEFAULT_PAYMENT_SETTINGS[0];
    this.saveAll("PaymentSettings", [def]);
    return def;
  }

  updatePaymentSettings(updates: any): any {
    const current = this.getPaymentSettings();
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveAll("PaymentSettings", [updated]);
    return updated;
  }

  approvePayment(paymentId: string, adminEmail = "admin@rehmanlawacademy.pk"): { payment: any; enrollment: any } {
    const payment = this.get("CoursePaymentRequest", paymentId);
    if (!payment) throw new Error("Payment request not found.");

    const updatedPayment = this.update("CoursePaymentRequest", paymentId, {
      payment_status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail,
    });

    // Check if enrollment exists
    const existingEnrollments = this.filter("CourseEnrollment", {
      student_email: String(payment.student_email),
      course_id: String(payment.course_id),
    });

    let enrollment: any;
    if (existingEnrollments.length > 0) {
      enrollment = this.update("CourseEnrollment", existingEnrollments[0].id, {
        enrollment_status: "active",
        payment_request_id: paymentId,
        amount_pkr: Number(payment.amount_pkr || 0),
        activated_at: new Date().toISOString(),
        approved_by: adminEmail,
      });
    } else {
      enrollment = this.create("CourseEnrollment", {
        student_user_id: String(payment.student_user_id || ""),
        student_email: String(payment.student_email),
        student_name: String(payment.student_name || ""),
        student_mobile: String(payment.student_mobile || ""),
        course_id: String(payment.course_id),
        course_slug: String(payment.course_slug),
        course_title: String(payment.course_title),
        enrollment_status: "active",
        payment_request_id: paymentId,
        amount_pkr: Number(payment.amount_pkr || 0),
        currency: String(payment.currency || "PKR"),
        enrolled_at: payment.requested_at || new Date().toISOString(),
        activated_at: new Date().toISOString(),
        approved_by: adminEmail,
      });
    }

    return { payment: updatedPayment, enrollment };
  }

  rejectPayment(paymentId: string, rejectionReason: string, adminEmail = "admin@rehmanlawacademy.pk"): any {
    const payment = this.get("CoursePaymentRequest", paymentId);
    if (!payment) throw new Error("Payment request not found.");

    const updatedPayment = this.update("CoursePaymentRequest", paymentId, {
      payment_status: "rejected",
      rejection_reason: rejectionReason || "Payment proof could not be verified by the administrator.",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail,
    });

    // Update any matching enrollment to rejected
    const existingEnrollments = this.filter("CourseEnrollment", {
      student_email: String(payment.student_email),
      course_id: String(payment.course_id),
    });
    if (existingEnrollments.length > 0) {
      this.update("CourseEnrollment", existingEnrollments[0].id, {
        enrollment_status: "rejected",
      });
    }

    return updatedPayment;
  }
}

export const localStore = new LocalStore();

function safeCourse(course: any) {
  return {
    id: String(course.id),
    slug: String(course.slug || ""),
    title: String(course.title || ""),
    short_description: String(course.short_description || ""),
    description: String(course.description || ""),
    instructor: String(course.instructor || "Rehman Law Academy"),
    duration_label: String(course.duration_label || ""),
    lecture_count: Number(course.lecture_count || 0),
    test_count: Number(course.test_count || 0),
    currency: String(course.currency || "PKR"),
    price_pkr: Number(course.price_pkr || 0),
    price_configured: Boolean(course.price_configured && Number(course.price_pkr || 0) > 0),
    is_published: Boolean(course.is_published),
    thumbnail_url: String(course.thumbnail_url || ""),
    curriculum_summary: String(course.curriculum_summary || ""),
  };
}

function safePayment(item: any) {
  return {
    id: String(item.id),
    student_user_id: String(item.student_user_id || ""),
    student_name: String(item.student_name || ""),
    student_email: String(item.student_email || ""),
    student_mobile: String(item.student_mobile || ""),
    course_id: String(item.course_id || ""),
    course_slug: String(item.course_slug || ""),
    course_title: String(item.course_title || ""),
    amount_pkr: Number(item.amount_pkr || 0),
    currency: String(item.currency || "PKR"),
    payment_method: String(item.payment_method || item.payment_provider || "bank"),
    payment_provider: String(item.payment_provider || item.payment_method || "manual"),
    payment_status: String(item.payment_status || "pending"),
    transaction_reference: String(item.transaction_reference || ""),
    proof_image: String(item.proof_image || item.proof_url || ""),
    payment_note: String(item.payment_note || ""),
    rejection_reason: String(item.rejection_reason || ""),
    requested_at: String(item.requested_at || item.created_at || ""),
    created_at: String(item.created_at || item.requested_at || ""),
    updated_at: String(item.updated_at || ""),
    reviewed_at: item.reviewed_at ? String(item.reviewed_at) : "",
    reviewed_by: item.reviewed_by ? String(item.reviewed_by) : "",
  };
}

function safeEnrollment(item: any) {
  return {
    id: String(item.id),
    student_user_id: String(item.student_user_id || ""),
    student_name: String(item.student_name || ""),
    student_email: String(item.student_email || ""),
    student_mobile: String(item.student_mobile || ""),
    course_id: String(item.course_id || ""),
    course_slug: String(item.course_slug || ""),
    course_title: String(item.course_title || ""),
    enrollment_status: String(item.enrollment_status || "pending"),
    payment_request_id: String(item.payment_request_id || ""),
    amount_pkr: Number(item.amount_pkr || 0),
    currency: String(item.currency || "PKR"),
    enrolled_at: String(item.enrolled_at || item.created_at || ""),
    activated_at: item.activated_at ? String(item.activated_at) : "",
    approved_by: item.approved_by ? String(item.approved_by) : "",
    last_activity_at: item.last_activity_at ? String(item.last_activity_at) : "",
  };
}

function safeProgress(item: any) {
  return {
    id: String(item.id),
    course_id: String(item.course_id || ""),
    course_slug: String(item.course_slug || ""),
    enrollment_id: String(item.enrollment_id || ""),
    completed_lesson_ids: Array.isArray(item.completed_lesson_ids) ? item.completed_lesson_ids.map(String) : [],
    completed_lessons: Number(item.completed_lessons || 0),
    total_lessons: Number(item.total_lessons || 0),
    progress_percentage: Number(item.progress_percentage || 0),
    last_lesson_id: item.last_lesson_id ? String(item.last_lesson_id) : "",
    last_activity_at: item.last_activity_at ? String(item.last_activity_at) : "",
  };
}

/**
 * Executes courseAccess function actions offline and locally
 */
export async function runLocalCourseAccess(payload: any) {
  const action = String(payload?.action || "");
  const user = localStore.getCurrentUser();

  if (!user && (action === "curriculum" || action === "lesson" || action === "progress" || action === "submit_payment_proof" || action === "course_tests" || action === "submit_course_test")) {
    throw new Error("Authentication required. Please sign in to your student account.");
  }

  const currentUser = user || {
    id: "guest-user",
    email: "guest@rehmanlawacademy.pk",
    full_name: "Guest Student",
    role: "student" as const,
  };

  if (action === "dashboard") {
    const email = String(currentUser.email);
    const allCourses = localStore.filter("Course", { is_published: true }, "sort_order", 100);
    const payments = localStore.filter("CoursePaymentRequest", { student_email: email }, "-created_at", 100);
    const enrollments = localStore.filter("CourseEnrollment", { student_email: email }, "-created_at", 100);
    const progressRows = localStore.filter("CourseProgress", { student_email: email }, "-created_at", 100);
    const testResults = localStore.filter("CourseTestResult", { student_email: email }, "-submitted_at", 100);

    return {
      user: {
        id: String(currentUser.id || ""),
        full_name: String(currentUser.full_name || ""),
        email,
        mobile_number: currentUser.mobile_number || "",
        role: currentUser.role || "student",
      },
      courses: (allCourses || []).map(safeCourse),
      payments: (payments || []).map(safePayment),
      enrollments: (enrollments || []).map(safeEnrollment),
      progress: (progressRows || []).map(safeProgress),
      test_results: testResults || [],
    };
  }

  if (action === "payment_details") {
    const courseSlug = String(payload.course_slug || "").trim();
    const courses = localStore.filter("Course", { slug: courseSlug });
    const course = courses[0];
    if (!course) throw new Error("Course not found.");

    const settings = localStore.getPaymentSettings();
    const payments = localStore.filter("CoursePaymentRequest", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    }, "-created_at", 1);

    const enrollments = localStore.filter("CourseEnrollment", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    }, "-created_at", 1);

    return {
      course: safeCourse(course),
      settings,
      payment: payments[0] ? safePayment(payments[0]) : null,
      enrollment: enrollments[0] ? safeEnrollment(enrollments[0]) : null,
    };
  }

  if (action === "submit_payment_proof") {
    const courseSlug = String(payload.course_slug || "").trim();
    const courses = localStore.filter("Course", { slug: courseSlug });
    const course = courses[0];
    if (!course) throw new Error("Course not found.");

    const paymentMethod = String(payload.payment_method || "bank").toLowerCase();
    const transactionReference = String(payload.transaction_reference || "").trim();
    const proofImage = String(payload.proof_image || "").trim();
    const paymentNote = String(payload.payment_note || "").trim();
    const studentMobile = String(payload.student_mobile || currentUser.mobile_number || "").trim();

    if (!proofImage) {
      throw new Error("Payment proof screenshot is required. Please upload your payment receipt or screenshot.");
    }

    // Check if existing pending payment request exists
    const existingRows = localStore.filter("CoursePaymentRequest", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    }, "-created_at", 1);

    const now = new Date().toISOString();
    let request: any;

    if (existingRows.length > 0 && existingRows[0].payment_status !== "approved") {
      request = localStore.update("CoursePaymentRequest", existingRows[0].id, {
        student_user_id: String(currentUser.id || ""),
        student_name: String(currentUser.full_name || ""),
        student_email: String(currentUser.email),
        student_mobile: studentMobile,
        amount_pkr: Number(course.price_pkr || 0),
        currency: String(course.currency || "PKR"),
        payment_method: paymentMethod,
        payment_provider: paymentMethod,
        payment_status: "pending",
        transaction_reference: transactionReference,
        proof_image: proofImage,
        payment_note: paymentNote,
        rejection_reason: "",
        requested_at: now,
        updated_at: now,
      });
    } else {
      request = localStore.create("CoursePaymentRequest", {
        student_user_id: String(currentUser.id || ""),
        student_name: String(currentUser.full_name || ""),
        student_email: String(currentUser.email),
        student_mobile: studentMobile,
        course_id: String(course.id),
        course_slug: String(course.slug),
        course_title: String(course.title),
        amount_pkr: Number(course.price_pkr || 0),
        currency: String(course.currency || "PKR"),
        payment_method: paymentMethod,
        payment_provider: paymentMethod,
        payment_status: "pending",
        transaction_reference: transactionReference,
        proof_image: proofImage,
        payment_note: paymentNote,
        rejection_reason: "",
        requested_at: now,
      });
    }

    // Record pending enrollment entry if not existing
    const existingEnrollments = localStore.filter("CourseEnrollment", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    });

    if (existingEnrollments.length === 0) {
      localStore.create("CourseEnrollment", {
        student_user_id: String(currentUser.id || ""),
        student_email: String(currentUser.email),
        student_name: String(currentUser.full_name || ""),
        student_mobile: studentMobile,
        course_id: String(course.id),
        course_slug: String(course.slug),
        course_title: String(course.title),
        enrollment_status: "pending",
        payment_request_id: request.id,
        amount_pkr: Number(course.price_pkr || 0),
        currency: "PKR",
        enrolled_at: now,
      });
    } else if (existingEnrollments[0].enrollment_status !== "active") {
      localStore.update("CourseEnrollment", existingEnrollments[0].id, {
        enrollment_status: "pending",
        payment_request_id: request.id,
      });
    }

    return {
      success: true,
      request: safePayment(request),
    };
  }

  if (action === "curriculum") {
    const courseSlug = String(payload.course_slug || "").trim();
    const courses = localStore.filter("Course", { slug: courseSlug });
    const course = courses[0];
    if (!course) throw new Error("Course not found.");

    // STRICT BACKEND VERIFICATION: Check active enrollment
    const enrollmentRows = localStore.filter("CourseEnrollment", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    });
    const enrollment = enrollmentRows.find((item) => item.enrollment_status === "active");

    if (!enrollment) {
      throw new Error("Access Denied: You do not have an active, approved enrollment for this paid course. Once an administrator approves your payment proof, your curriculum will unlock.");
    }

    const modules = localStore.filter("CourseModule", { course_id: String(course.id), is_published: true }, "sort_order", 200);
    const lessons = localStore.filter("CourseLesson", { course_id: String(course.id), is_published: true }, "sort_order", 500);
    const progressRows = localStore.filter("CourseProgress", { student_email: String(currentUser.email), course_id: String(course.id) });
    const courseTests = localStore.filter("CourseTest", { course_id: String(course.id), is_published: true });

    return {
      course: safeCourse(course),
      enrollment: safeEnrollment(enrollment),
      modules: (modules || []).map((m) => ({
        id: String(m.id),
        title: String(m.title || ""),
        description: String(m.description || ""),
        sort_order: Number(m.sort_order || 0),
      })),
      lessons: (lessons || []).map((l) => ({
        id: String(l.id),
        module_id: String(l.module_id || ""),
        title: String(l.title || ""),
        description: String(l.description || ""),
        duration_seconds: Number(l.duration_seconds || 0),
        sort_order: Number(l.sort_order || 0),
      })),
      progress: progressRows[0] ? safeProgress(progressRows[0]) : null,
      tests: (courseTests || []).map((t) => ({
        id: String(t.id),
        title: String(t.title),
        description: String(t.description || ""),
        time_limit_minutes: Number(t.time_limit_minutes || 15),
        passing_score: Number(t.passing_score || 50),
      })),
    };
  }

  if (action === "lesson") {
    const courseSlug = String(payload.course_slug || "").trim();
    const lessonId = String(payload.lesson_id || "").trim();
    const courses = localStore.filter("Course", { slug: courseSlug });
    const course = courses[0];
    if (!course) throw new Error("Course not found.");

    // STRICT BACKEND VERIFICATION: Check active enrollment
    const enrollment = localStore.filter("CourseEnrollment", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    }).find((item) => item.enrollment_status === "active");

    if (!enrollment) {
      throw new Error("Access Denied: You do not have an active enrollment for this lesson. Administrator approval is required.");
    }

    const lesson = localStore.get("CourseLesson", lessonId);
    if (!lesson) throw new Error("That lesson is not available.");

    const module = localStore.get("CourseModule", String(lesson.module_id || ""));
    const allCourseLessons = localStore.filter("CourseLesson", { course_id: String(course.id), is_published: true }, "sort_order", 200);
    const index = allCourseLessons.findIndex((item) => String(item.id) === String(lesson.id));
    const progressRows = localStore.filter("CourseProgress", { student_email: String(currentUser.email), course_id: String(course.id) });

    const linkFor = (item: any) => (item ? { id: String(item.id), title: String(item.title || "") } : null);

    return {
      course: safeCourse(course),
      enrollment: safeEnrollment(enrollment),
      module: { id: String(module?.id || ""), title: String(module?.title || "") },
      lesson: {
        id: String(lesson.id),
        title: String(lesson.title || ""),
        description: String(lesson.description || ""),
        notes: String(lesson.notes || ""),
        attachment_url: String(lesson.attachment_url || ""),
        video_provider: String(lesson.video_provider || ""),
        video_reference: String(lesson.video_reference || ""),
        duration_seconds: Number(lesson.duration_seconds || 0),
        sort_order: Number(lesson.sort_order || 0),
      },
      previous_lesson: linkFor(index > 0 ? allCourseLessons[index - 1] : null),
      next_lesson: linkFor(index >= 0 && index < allCourseLessons.length - 1 ? allCourseLessons[index + 1] : null),
      progress: progressRows[0] ? safeProgress(progressRows[0]) : null,
    };
  }

  if (action === "progress") {
    const courseSlug = String(payload.course_slug || "").trim();
    const lessonId = String(payload.lesson_id || "").trim();
    const courses = localStore.filter("Course", { slug: courseSlug });
    const course = courses[0];
    if (!course) throw new Error("Course not found.");

    // Strict enrollment check
    const enrollment = localStore.filter("CourseEnrollment", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    }).find((item) => item.enrollment_status === "active");
    if (!enrollment) throw new Error("Access Denied: Cannot record progress without active course enrollment.");

    const allCourseLessons = localStore.filter("CourseLesson", { course_id: String(course.id), is_published: true });
    const existingRows = localStore.filter("CourseProgress", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    });
    const existing = existingRows[0];
    const completedIds = Array.isArray(existing?.completed_lesson_ids) ? [...existing.completed_lesson_ids.map(String)] : [];

    if (payload.completed === true && !completedIds.includes(lessonId)) {
      completedIds.push(lessonId);
    }

    const now = new Date().toISOString();
    const data = {
      student_user_id: String(currentUser.id || ""),
      student_email: String(currentUser.email),
      course_id: String(course.id),
      course_slug: String(course.slug),
      completed_lesson_ids: completedIds,
      completed_lessons: completedIds.length,
      total_lessons: allCourseLessons.length || 1,
      progress_percentage: allCourseLessons.length ? Math.round((completedIds.length / allCourseLessons.length) * 100) : 100,
      last_lesson_id: lessonId,
      last_activity_at: now,
    };

    const saved = existing ? localStore.update("CourseProgress", existing.id, data) : localStore.create("CourseProgress", data);
    return { progress: safeProgress(saved) };
  }

  if (action === "course_tests") {
    const courseSlug = String(payload.course_slug || "").trim();
    const courses = localStore.filter("Course", { slug: courseSlug });
    const course = courses[0];
    if (!course) throw new Error("Course not found.");

    // Verify active enrollment
    const enrollment = localStore.filter("CourseEnrollment", {
      student_email: String(currentUser.email),
      course_id: String(course.id),
    }).find((item) => item.enrollment_status === "active");
    if (!enrollment) throw new Error("Access Denied: You must be actively enrolled to take course tests.");

    const tests = localStore.filter("CourseTest", { course_id: String(course.id), is_published: true });
    const testsWithQuestions = tests.map((test) => {
      const questions = localStore.filter("CourseTestQuestion", { test_id: String(test.id) }, "sort_order", 100);
      return {
        ...test,
        question_count: questions.length,
        questions,
      };
    });

    return { course: safeCourse(course), tests: testsWithQuestions };
  }

  if (action === "submit_course_test") {
    const courseSlug = String(payload.course_slug || "").trim();
    const testId = String(payload.test_id || "").trim();
    const userAnswers = (payload.answers || {}) as Record<string, string>;

    const test = localStore.get("CourseTest", testId);
    if (!test) throw new Error("Test not found.");

    const questions = localStore.filter("CourseTestQuestion", { test_id: testId });
    let score = 0;
    for (const q of questions) {
      if (userAnswers[q.id] === q.correct_answer) {
        score += 1;
      }
    }
    const total = questions.length || 1;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= Number(test.passing_score || 50);

    const resultRecord = localStore.create("CourseTestResult", {
      test_id: testId,
      test_title: String(test.title),
      course_id: String(test.course_id),
      course_slug: courseSlug,
      student_email: String(currentUser.email),
      student_user_id: String(currentUser.id || ""),
      score,
      total_questions: total,
      percentage,
      passed,
      submitted_at: new Date().toISOString(),
      answers: userAnswers,
    });

    return {
      result: resultRecord,
      score,
      total,
      percentage,
      passed,
      passing_score: Number(test.passing_score || 50),
    };
  }

  if (action === "get_payment_settings") {
    return localStore.getPaymentSettings();
  }

  if (action === "update_payment_settings") {
    return localStore.updatePaymentSettings(payload.settings || {});
  }

  if (action === "admin_get_payments") {
    const allRequests = localStore.getAll("CoursePaymentRequest");
    return (allRequests || []).map(safePayment);
  }

  if (action === "admin_approve_payment") {
    const paymentId = String(payload.payment_id || "").trim();
    return localStore.approvePayment(paymentId, currentUser.email || "admin@rehmanlawacademy.pk");
  }

  if (action === "admin_reject_payment") {
    const paymentId = String(payload.payment_id || "").trim();
    const reason = String(payload.rejection_reason || "Payment proof could not be verified.");
    return localStore.rejectPayment(paymentId, reason, currentUser.email || "admin@rehmanlawacademy.pk");
  }

  throw new Error(`Unsupported course action: ${action}`);
}
