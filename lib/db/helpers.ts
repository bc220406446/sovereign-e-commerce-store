import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Role } from "@/types/database";

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function requireAuthUser() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function getUserProfile(userId: string) {
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data;
}

export async function requireAdmin() {
  const user = await requireAuthUser();
  const profile = await getUserProfile(user.id);
  if (!profile || profile.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return { user, profile };
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  const service = createServiceClient();
  const { data, error } = await service
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();
  if (error || !data) return defaultValue;
  try {
    return JSON.parse(data.value) as T;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(key: string, value: any) {
  const service = createServiceClient();
  const strVal = typeof value === "string" ? value : JSON.stringify(value);
  const { error } = await service
    .from("settings")
    .upsert({ key, value: strVal }, { onConflict: "key" });
  if (error) throw error;
}

export async function nextOrderNumber(): Promise<string> {
  const service = createServiceClient();
  const { data } = await service
    .from("settings")
    .select("value")
    .eq("key", "orderCounter")
    .single();

  const current = data ? parseInt(data.value, 10) || 1041 : 1041;
  const next = current + 1;
  await setSetting("orderCounter", next.toString());
  return `SV-${next}`;
}
