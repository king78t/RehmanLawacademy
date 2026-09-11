import { supabase } from "@/lib/supabaseClient";
import { localStore } from "./local-store";

// Re-export supabase as client
export const superdevClient = {
  auth: {
    me: () => {
      const user = localStore.getCurrentUser();
      return Promise.resolve(user);
    },
    logout: () => {
      localStore.logout();
      return Promise.resolve();
    },
    client: {
      options: {
        loginUrl: "/admin",
      },
    },
  },
  entity: (name: string) => ({
    filter: (where = {}, sort?: string, limit?: number) => {
      return Promise.resolve(localStore.filter(name, where, sort, limit));
    },
    get: (id: string) => {
      return Promise.resolve(localStore.get(name, id));
    },
    create: (data: any) => {
      return Promise.resolve(localStore.create(name, data));
    },
    update: (id: string, data: any) => {
      return Promise.resolve(localStore.update(name, id, data));
    },
    delete: (id: string) => {
      return Promise.resolve(localStore.delete(name, id));
    },
    bulkCreate: (records: any[]) => {
      return Promise.resolve(localStore.bulkCreate(name, records));
    },
  }),
  functions: {
    courseAccess: (payload: any) => supabase.functions.invoke("course-access", { body: payload }).then((res) => res.data),
  },
  options: {
    showBranding: false,
    affiliateId: "",
  },
};

export default superdevClient;
