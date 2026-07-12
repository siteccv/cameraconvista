import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Contenuti pubblici che l'admin aggiorna dal foglio Google (vini, menu,
// cocktail). Vengono da uno snapshot già pronto: una lettura leggerissima, quindi
// possiamo ricontrollarli spesso senza pesare sul free tier Supabase. Servono a
// far aggiornare il sito ~ogni 5 min anche quando è aperto dalla home del telefono
// (dove i default globali `staleTime: Infinity` lo terrebbero fermo per sempre).
export const PUBLISHED_CONTENT_STALE_TIME_MS = 5 * 60 * 1000; // 5 minuti
export const PUBLISHED_CONTENT_REFETCH_MS = 5 * 60 * 1000; // 5 minuti

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
