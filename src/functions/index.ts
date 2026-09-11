import { supabase } from "@/lib/supabaseClient";

export async function courseAccess(payload: any) {
  const { data, error } = await supabase.functions.invoke("course-access", {
    body: payload,
  });

  if (error) {
    throw error;
  }

  return data;
}
