import { createSuperdevClient, SuperdevClient } from "@superdevhq/client";
import { localStore, runLocalCourseAccess } from "./local-store";

function sanitizeUrl(raw?: string): string {
  if (!raw) return "https://superdev.build/api";
  let cleaned = String(raw).trim();
  const mdMatch = cleaned.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (mdMatch) cleaned = mdMatch[2].trim();
  else cleaned = cleaned.replace(/^\[+|\]+$/g, "").trim();
  if (!cleaned || cleaned.includes("example.com")) {
    return "https://superdev.build/api";
  }
  return cleaned.replace(/\/+$/, "");
}

const rawAppId = typeof import.meta !== "undefined" ? import.meta.env?.VITE_APP_ID : undefined;
export const APP_ID = (rawAppId && String(rawAppId).trim() && !String(rawAppId).includes("example"))
  ? String(rawAppId).trim()
  : "cuczhjtsygkg4abjnwbs";

const rawBaseUrl = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPERDEV_BASE_URL : undefined;
export const BASE_URL = sanitizeUrl(rawBaseUrl);

const authBase = BASE_URL.replace(/\/api\/?$/, "");

export const superdevClient = createSuperdevClient({
  appId: APP_ID,
  requiresAuth: false,
  showBranding: false,
  affiliateId: "",
  baseUrl: BASE_URL,
  loginUrl: `${authBase}/auth/app-login?app_id=${APP_ID}`,
});

async function handleLocalRequest(path: string, options: any = {}): Promise<any> {
  const [urlPath, queryString] = path.split("?");
  const searchParams = new URLSearchParams(queryString || "");
  const method = String(options.method || "GET").toUpperCase();

  // 1. courseAccess function
  if (urlPath.includes("/functions/courseAccess")) {
    let payload = options.body;
    if (typeof payload === "string") {
      try { payload = JSON.parse(payload); } catch { payload = {}; }
    }
    return await runLocalCourseAccess(payload);
  }

  // 2. Auth routes: /auth/me or User/me
  if (urlPath.endsWith("/auth/me") || urlPath.match(/\/entities\/User\/me\/?$/)) {
    if (method === "GET") {
      const user = localStore.getCurrentUser();
      if (!user) {
        throw new Error("Authentication required");
      }
      return user;
    }
    if (method === "PUT" || method === "PATCH") {
      let updates = options.body;
      if (typeof updates === "string") {
        try { updates = JSON.parse(updates); } catch { updates = {}; }
      }
      const existing = localStore.getCurrentUser() || {
        id: "user-1",
        email: "student@rehmanlawacademy.pk",
        full_name: "LAT Student",
        role: "student" as const,
      };
      const updated = { ...existing, ...updates };
      localStore.setCurrentUser(updated);
      return updated;
    }
  }

  if (urlPath.endsWith("/auth/logout")) {
    localStore.setCurrentUser(null);
    return { success: true };
  }

  // 3. Bulk operations: /apps/:appId/entities/:entityName/bulk
  const bulkMatch = urlPath.match(/\/entities\/([^/]+)\/bulk\/?$/);
  if (bulkMatch) {
    const entityName = bulkMatch[1];
    let items = options.body;
    if (typeof items === "string") {
      try { items = JSON.parse(items); } catch { items = []; }
    }
    if (!Array.isArray(items) && items?.items) items = items.items;
    return localStore.bulkCreate(entityName, Array.isArray(items) ? items : []);
  }

  // 4. Single entity operations: /apps/:appId/entities/:entityName/:id
  const singleMatch = urlPath.match(/\/entities\/([^/]+)\/([^/]+)\/?$/);
  if (singleMatch) {
    const [, entityName, id] = singleMatch;
    if (method === "GET") {
      return localStore.get(entityName, id);
    }
    if (method === "PUT" || method === "PATCH") {
      let updates = options.body;
      if (typeof updates === "string") {
        try { updates = JSON.parse(updates); } catch { updates = {}; }
      }
      return localStore.update(entityName, id, updates);
    }
    if (method === "DELETE") {
      return localStore.delete(entityName, id);
    }
  }

  // 5. Entity collection operations: /apps/:appId/entities/:entityName
  const collectionMatch = urlPath.match(/\/entities\/([^/]+)\/?$/);
  if (collectionMatch) {
    const entityName = collectionMatch[1];
    if (method === "GET") {
      let query: Record<string, any> = {};
      const qParam = searchParams.get("q");
      if (qParam) {
        try { query = JSON.parse(qParam); } catch { query = {}; }
      }
      let sort: string | undefined = undefined;
      const sortParam = searchParams.get("sort");
      if (sortParam) {
        try { sort = JSON.parse(sortParam); } catch { sort = sortParam; }
      }
      const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
      const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!, 10) : undefined;
      return localStore.filter(entityName, query, sort, limit, skip);
    }
    if (method === "POST") {
      let data = options.body;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { data = {}; }
      }
      return localStore.create(entityName, data);
    }
    if (method === "DELETE") {
      let data = options.body;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { data = {}; }
      }
      const ids = Array.isArray(data?.ids) ? data.ids : [];
      return localStore.deleteMany(entityName, ids);
    }
  }

  return null;
}

// Intercept requests on superdevClient to ensure offline-first reliability and prevent HTML syntax errors
const originalRequest = superdevClient.request.bind(superdevClient);

superdevClient.request = async function (path: string, options: any = {}) {
  // If remote URL is not suitable or points to localhost/example, handle locally
  const isPlaceholderUrl = !BASE_URL || BASE_URL.includes("example.com") || BASE_URL.startsWith("/") || BASE_URL.includes("localhost");

  if (isPlaceholderUrl) {
    return handleLocalRequest(path, options);
  }

  try {
    const targetUrl = `${BASE_URL}${path}`;
    const token = typeof superdevClient.getToken === "function" ? superdevClient.getToken() : null;
    const headers = new Headers(options.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (APP_ID) headers.set("X-App-ID", APP_ID);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const contentType = response.headers.get("content-type") || "";

    // If server responded with HTML (e.g. Vite SPA index.html fallback), do NOT attempt response.json()
    if (contentType.includes("text/html")) {
      return handleLocalRequest(path, options);
    }

    if (response.status === 401 || response.status === 403 || response.status === 404) {
      // Fallback to local store
      return handleLocalRequest(path, options);
    }

    if (!response.ok) {
      return handleLocalRequest(path, options);
    }

    const text = await response.text();
    if (text.trim().startsWith("<") || text.trim().startsWith("<!DOCTYPE")) {
      return handleLocalRequest(path, options);
    }

    return JSON.parse(text);
  } catch {
    // Network or parse error: seamlessly fall back to local store
    return handleLocalRequest(path, options);
  }
};

SuperdevClient.prototype.request = superdevClient.request;


