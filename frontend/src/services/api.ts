import { useAuthStore } from "../store/authStore";

const BASE_URL = "/api";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      useAuthStore.getState().logout();
    }
    const errorMessage =
      data?.error?.formErrors?.[0] ||
      (typeof data?.error === "string" ? data.error : "Une erreur est survenue");
    throw new Error(errorMessage);
  }

  return data as T;
}
