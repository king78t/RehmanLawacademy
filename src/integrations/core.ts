import { supabase } from "../lib/supabaseClient";

export const uploadFile = async (file: File | Blob, bucket = "uploads") => {
  const path = `${Date.now()}_${(file as File).name || "file"}`;
  return supabase.storage.from(bucket).upload(path, file);
};

export const core = {
  uploadFile,
};
