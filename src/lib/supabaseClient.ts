import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { localStore, runLocalCourseAccess } from "./superdev/local-store";

// Read Supabase credentials from environment
const rawUrl = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : undefined;
const rawAnonKey = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;

export const SUPABASE_URL = rawUrl && !rawUrl.includes("example.com") && rawUrl.startsWith("http")
  ? rawUrl.replace(/\/+$/, "")
  : "https://cuczhjtsygkg4abjnwbs.supabase.co";

export const SUPABASE_ANON_KEY = rawAnonKey && !rawAnonKey.includes("example.com") && rawAnonKey.length > 20
  ? rawAnonKey
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_preview_mode";

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawAnonKey &&
  !rawUrl.includes("example.com") &&
  rawUrl.startsWith("http") &&
  rawAnonKey.length > 20
);

// Standard Supabase client instance
export const rawSupabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Enhanced Supabase query builder wrapper that supports direct Supabase PostgREST
 * and seamlessly provides local-store fallback when credentials are not yet provided
 * or during sandbox preview runs.
 */
class SupabaseQueryAdapter {
  private tableName: string;
  private filters: Record<string, any> = {};
  private orders: { column: string; ascending: boolean }[] = [];
  private limitCount?: number;
  private offsetCount?: number;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = "*") {
    // Returns this adapter for chainable methods
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  neq(column: string, value: any) {
    this.filters[`${column}__neq`] = value;
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orders.push({ column, ascending });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  single(): Promise<{ data: any; error: any }> {
    return this.then((res: any) => ({
      data: Array.isArray(res.data) ? (res.data[0] || null) : res.data,
      error: res.error,
    }));
  }

  async then(resolve: (value: { data: any; error: any }) => any, reject?: (reason: any) => any) {
    try {
      if (isSupabaseConfigured) {
        let query: any = rawSupabase.from(this.tableName).select("*");
        for (const [key, val] of Object.entries(this.filters)) {
          query = query.eq(key, val);
        }
        for (const ord of this.orders) {
          query = query.order(ord.column, { ascending: ord.ascending });
        }
        if (this.limitCount !== undefined) {
          query = query.limit(this.limitCount);
        }
        const result = await query;
        if (!result.error && result.data !== null) {
          return resolve(result);
        }
      }

      // Local store fallback
      let sortStr: string | undefined;
      if (this.orders.length > 0) {
        sortStr = this.orders[0].ascending ? this.orders[0].column : `-${this.orders[0].column}`;
      }
      const data = localStore.filter(this.tableName, this.filters, sortStr, this.limitCount, this.offsetCount);
      return resolve({ data, error: null });
    } catch (err: any) {
      if (reject) return reject(err);
      return resolve({ data: null, error: err });
    }
  }

  async insert(values: any | any[]) {
    if (isSupabaseConfigured) {
      try {
        const res = await rawSupabase.from(this.tableName).insert(values).select();
        if (!res.error) return res;
      } catch (e) {
        console.warn("Supabase insert error, falling back locally:", e);
      }
    }
    const items = Array.isArray(values) ? values : [values];
    const created = items.map((item) => localStore.create(this.tableName, item));
    return { data: Array.isArray(values) ? created : created[0], error: null };
  }

  async upsert(values: any | any[]) {
    if (isSupabaseConfigured) {
      try {
        const res = await rawSupabase.from(this.tableName).upsert(values).select();
        if (!res.error) return res;
      } catch (e) {
        console.warn("Supabase upsert error, falling back locally:", e);
      }
    }
    const items = Array.isArray(values) ? values : [values];
    const results = items.map((item) => {
      if (item.id) {
        const existing = localStore.get(this.tableName, item.id);
        if (existing) {
          return localStore.update(this.tableName, item.id, item);
        }
      }
      return localStore.create(this.tableName, item);
    });
    return { data: Array.isArray(values) ? results : results[0], error: null };
  }

  update(values: any) {
    return {
      eq: async (column: string, value: any) => {
        if (isSupabaseConfigured) {
          try {
            const res = await rawSupabase.from(this.tableName).update(values).eq(column, value).select();
            if (!res.error) return res;
          } catch (e) {
            console.warn("Supabase update error, falling back locally:", e);
          }
        }
        if (column === "id") {
          const updated = localStore.update(this.tableName, String(value), values);
          return { data: updated, error: null };
        }
        const existing = localStore.filter(this.tableName, { [column]: value });
        const updated = existing.map((rec) => localStore.update(this.tableName, rec.id, values));
        return { data: updated, error: null };
      },
    };
  }

  async delete() {
    return {
      eq: async (column: string, value: any) => {
        if (isSupabaseConfigured) {
          try {
            const res = await rawSupabase.from(this.tableName).delete().eq(column, value);
            if (!res.error) return res;
          } catch (e) {
            console.warn("Supabase delete error, falling back locally:", e);
          }
        }
        if (column === "id") {
          const deleted = localStore.delete(this.tableName, String(value));
          return { data: deleted, error: null };
        }
        const existing = localStore.filter(this.tableName, { [column]: value });
        for (const item of existing) {
          localStore.delete(this.tableName, item.id);
        }
        return { data: null, error: null };
      },
    };
  }
}

/**
 * Unified Supabase client exported for all components, routes, and hooks.
 */
export const supabase = {
  ...rawSupabase,

  from(tableName: string) {
    return new SupabaseQueryAdapter(tableName);
  },

  storage: {
    from(bucketName: string) {
      return {
        async upload(path: string, file: File | Blob | string, options?: any) {
          if (isSupabaseConfigured) {
            try {
              const res = await rawSupabase.storage.from(bucketName).upload(path, file, options);
              if (!res.error) return res;
            } catch (e) {
              console.warn("Supabase storage upload error, falling back:", e);
            }
          }
          // Local data-URI storage fallback for receipts
          let dataUrl = typeof file === "string" ? file : "";
          if (!dataUrl && file instanceof Blob) {
            dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          }
          return { data: { path: dataUrl || path }, error: null };
        },
        getPublicUrl(path: string) {
          if (path.startsWith("data:") || path.startsWith("http")) {
            return { data: { publicUrl: path } };
          }
          if (isSupabaseConfigured) {
            return rawSupabase.storage.from(bucketName).getPublicUrl(path);
          }
          return { data: { publicUrl: path } };
        },
      };
    },
  },

  functions: {
    async invoke(functionName: string, { body }: { body: any }) {
      if (isSupabaseConfigured) {
        try {
          const res = await rawSupabase.functions.invoke(functionName, { body });
          if (!res.error && res.data) return res;
        } catch (e) {
          console.warn("Supabase function invoke failed, routing to local runner:", e);
        }
      }
      if (functionName === "course-access") {
        const data = await runLocalCourseAccess(body);
        return { data, error: null };
      }
      return { data: null, error: new Error(`Function ${functionName} not found.`) };
    },
  },

  auth: {
    ...rawSupabase.auth,

    async getUser() {
      if (isSupabaseConfigured) {
        try {
          const res = await rawSupabase.auth.getUser();
          if (!res.error && res.data?.user) return res;
        } catch (e) {
          console.debug("Supabase auth user check failed, falling back:", e);
        }
      }
      const localUser = localStore.getCurrentUser();
      if (!localUser) {
        return { data: { user: null }, error: null };
      }
      return {
        data: {
          user: {
            id: localUser.id,
            email: localUser.email,
            user_metadata: {
              full_name: localUser.full_name,
              role: localUser.role,
              mobile_number: localUser.mobile_number,
            },
          },
        },
        error: null,
      };
    },

    async signInWithPassword({ email, password }: { email: string; password?: string }) {
      if (isSupabaseConfigured) {
        try {
          const res = await rawSupabase.auth.signInWithPassword({ email, password: password || "" });
          if (!res.error && res.data?.user) {
            localStore.setCurrentUser({
              id: res.data.user.id,
              email: res.data.user.email || email,
              full_name: res.data.user.user_metadata?.full_name || email.split("@")[0],
              role: (res.data.user.user_metadata?.role as any) || "student",
              mobile_number: res.data.user.user_metadata?.mobile_number,
            });
            return res;
          }
        } catch (e) {
          console.debug("Supabase signin failed, falling back:", e);
        }
      }
      const logged = localStore.login(email, password || "");
      return {
        data: {
          user: {
            id: logged.id,
            email: logged.email,
            user_metadata: { full_name: logged.full_name, role: logged.role, mobile_number: logged.mobile_number },
          },
          session: { access_token: "local-session-token", user: logged },
        },
        error: null,
      };
    },

    async signUp({ email, password, options }: { email: string; password?: string; options?: any }) {
      const metadata = options?.data || {};
      if (isSupabaseConfigured) {
        try {
          const res = await rawSupabase.auth.signUp({ email, password: password || "", options });
          if (!res.error && res.data?.user) {
            localStore.setCurrentUser({
              id: res.data.user.id,
              email: res.data.user.email || email,
              full_name: metadata.full_name || email.split("@")[0],
              role: metadata.role || "student",
              mobile_number: metadata.mobile_number,
            });
            return res;
          }
        } catch (e) {
          console.debug("Supabase signup failed, falling back:", e);
        }
      }
      const created = localStore.signup(
        metadata.full_name || email.split("@")[0],
        email,
        metadata.mobile_number || "",
        password || "student123"
      );
      return {
        data: {
          user: {
            id: created.id,
            email: created.email,
            user_metadata: { full_name: created.full_name, role: created.role, mobile_number: created.mobile_number },
          },
          session: { access_token: "local-session-token", user: created },
        },
        error: null,
      };
    },

    async signOut() {
      if (isSupabaseConfigured) {
        try {
          await rawSupabase.auth.signOut();
        } catch (e) {
          console.debug("Supabase signout failed, falling back:", e);
        }
      }
      localStore.logout();
      return { error: null };
    },
  },
};
