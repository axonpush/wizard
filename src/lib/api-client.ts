export interface ApiClientOptions {
  apiKey: string;
  tenantId: string;
  baseUrl: string;
  timeoutMs?: number;
}

export interface ExistingChannel {
  id: number;
  name: string;
}

export interface ExistingApp {
  id: number;
  name: string;
  updatedAt?: string;
  createdAt?: string;
  channels: ExistingChannel[];
}

function headers(opts: ApiClientOptions): HeadersInit {
  return {
    "X-API-Key": opts.apiKey,
    "x-tenant-id": opts.tenantId,
    "Content-Type": "application/json",
  };
}

async function request<T>(opts: ApiClientOptions, method: string, path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);
  try {
    const res = await fetch(opts.baseUrl + path, {
      method,
      headers: headers(opts),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`${method} ${path} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function listApps(opts: ApiClientOptions): Promise<ExistingApp[]> {
  const data = await request<unknown>(opts, "GET", "/apps");
  if (!Array.isArray(data)) return [];
  return data.map((raw) => {
    const a = raw as Record<string, unknown>;
    const channelsRaw = Array.isArray(a.channels) ? (a.channels as Array<Record<string, unknown>>) : [];
    return {
      id: Number(a.id),
      name: String(a.name ?? ""),
      updatedAt: typeof a.updatedAt === "string" ? a.updatedAt : undefined,
      createdAt: typeof a.createdAt === "string" ? a.createdAt : undefined,
      channels: channelsRaw.map((c) => ({ id: Number(c.id), name: String(c.name ?? "") })),
    };
  });
}
