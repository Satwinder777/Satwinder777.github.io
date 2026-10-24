// ============================================================
//  admin/js/supabase.js
//  Client-side Supabase Storage Uploader for Media Assets
// ============================================================

export const SUPABASE_CONFIG = {
  url: "https://ieusksnnaxhdyfqbzmdf.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlldXNrc25uYXhoZHlmcWJ6bWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTk1NzcsImV4cCI6MjA5Mzk3NTU3N30.oG-l7LH9tyo9z-IeEjTWJohOnEN3Wik1l_hp0nOOmQY",
  buckets: {
    profileImages: "profile-images",
    projectImages: "project-images",
    resume: "resume"
  }
};

/**
 * Upload a File object directly to Supabase Storage
 * @param {File} file 
 * @param {string} bucket 
 * @param {string} path 
 * @returns {Promise<string>} Public URL of the uploaded asset
 */
export async function uploadToSupabase(file, bucket = "profile-images", path = null) {
  if (!file) throw new Error("No file provided for upload.");

  const ext = file.name.split(".").pop().toLowerCase() || "jpg";
  const cleanPath = path || `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const uploadUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/${bucket}/${cleanPath}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_CONFIG.anonKey,
      "Authorization": `Bearer ${SUPABASE_CONFIG.anonKey}`,
      "Content-Type": file.type || "image/jpeg",
      "x-upsert": "true"
    },
    body: file
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Supabase Storage] Upload error:", errText);
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  // Public URL format
  const publicUrl = `${SUPABASE_CONFIG.url}/storage/v1/object/public/${bucket}/${cleanPath}`;
  return publicUrl;
}
