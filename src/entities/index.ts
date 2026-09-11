import { supabase } from "@/lib/supabaseClient";
import { localStore } from "@/lib/superdev/local-store";

function createEntity<T = any>(tableName: string) {
  return {
    async filter(where: Record<string, any> = {}, orderBy?: string, limit?: number, offset?: number): Promise<T[]> {
      let query: any = supabase.from(tableName).select("*");
      for (const [key, val] of Object.entries(where)) {
        if (val !== undefined && val !== null) {
          query = query.eq(key, val);
        }
      }
      if (orderBy) {
        const ascending = !orderBy.startsWith("-");
        const column = orderBy.replace(/^[-+]/, "");
        query = query.order(column, { ascending });
      }
      if (limit) {
        query = query.limit(limit);
      }
      const { data, error } = await query;
      if (error) {
        console.warn(`Query ${tableName} error:`, error);
      }
      return (data || []) as T[];
    },

    async get(id: string): Promise<T | null> {
      const { data } = await supabase.from(tableName).select("*").eq("id", id).single();
      return (data || null) as T | null;
    },

    async create(record: Partial<T>): Promise<T> {
      const { data } = await supabase.from(tableName).insert(record);
      return data as T;
    },

    async update(id: string, updates: Partial<T>): Promise<T> {
      const { data } = await supabase.from(tableName).update(updates).eq("id", id);
      return data as T;
    },

    async delete(id: string): Promise<boolean> {
      await supabase.from(tableName).delete().eq("id", id);
      return true;
    },

    async bulkCreate(records: Partial<T>[]): Promise<T[]> {
      const { data } = await supabase.from(tableName).insert(records);
      return (data || []) as T[];
    },
  };
}

export const User = {
  async me() {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      return {
        id: data.user.id,
        email: data.user.email || "",
        full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Student",
        role: (data.user.user_metadata?.role as any) || "student",
        mobile_number: data.user.user_metadata?.mobile_number || "",
      };
    }
    return localStore.getCurrentUser();
  },

  async logout() {
    await supabase.auth.signOut();
  },
};

export const Exam = createEntity("Exam");
export const Subject = createEntity("Subject");
export const Part = createEntity("Part");
export const Question = createEntity("Question");
export const QuizDefinition = createEntity("QuizDefinition");
export const QuizAttempt = createEntity("QuizAttempt");
export const QuizAnswer = createEntity("QuizAnswer");
export const Bookmark = createEntity("Bookmark");
export const WrongQuestion = createEntity("WrongQuestion");
export const Progress = createEntity("Progress");
export const PracticeAnswer = createEntity("PracticeAnswer");
export const Course = createEntity("Course");
export const CourseModule = createEntity("CourseModule");
export const CourseLesson = createEntity("CourseLesson");
export const CoursePaymentRequest = createEntity("CoursePaymentRequest");
export const CourseEnrollment = createEntity("CourseEnrollment");
export const CourseProgress = createEntity("CourseProgress");
