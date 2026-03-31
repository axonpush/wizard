export interface ApiOptions {
  apiKey: string;
  tenantId: string;
  baseUrl: string;
}

export interface App {
  id: number;
  name: string;
}

export interface Channel {
  id: number;
  name: string;
}

function headers(opts: ApiOptions): Record<string, string> {
  return {
    "X-API-Key": opts.apiKey,
    "x-tenant-id": opts.tenantId,
    "Content-Type": "application/json",
  };
}

async function request<T>(opts: ApiOptions, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${opts.baseUrl}${path}`, {
    method,
    headers: headers(opts),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AxonPush API ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function listApps(opts: ApiOptions): Promise<App[]> {
  return request<App[]>(opts, "GET", "/apps");
}

export async function createApp(opts: ApiOptions, name: string): Promise<App> {
  return request<App>(opts, "POST", "/apps", { name });
}

export async function createChannel(opts: ApiOptions, name: string, appId: number): Promise<Channel> {
  return request<Channel>(opts, "POST", "/channel", { name, appId });
}

export async function getOrCreateApp(opts: ApiOptions, name: string): Promise<App> {
  const apps = await listApps(opts);
  const existing = apps.find((a) => a.name === name);
  if (existing) return existing;
  return createApp(opts, name);
}
