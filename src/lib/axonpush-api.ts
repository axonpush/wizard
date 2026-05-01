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

export interface Environment {
  id: string;
  name: string;
  slug: string;
  color: string;
  isDefault: boolean;
  isProduction: boolean;
  isEphemeral: boolean;
}

export interface PublicIngestToken {
  id: number;
  name: string;
  token: string;
  prefix: string;
  channelId: number;
  environmentId?: string;
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

export async function listEnvironments(
  opts: ApiOptions,
): Promise<Environment[]> {
  try {
    return await request<Environment[]>(opts, "GET", `/environments`);
  } catch (err) {
    if ((err as Error).message.includes("404")) return [];
    throw err;
  }
}

export async function createEnvironment(
  opts: ApiOptions,
  body: { name: string; slug?: string; color?: string },
): Promise<Environment> {
  return request<Environment>(opts, "POST", `/environments`, body);
}

export async function createPublicToken(
  opts: ApiOptions,
  body: { name: string; channelId: number; environmentId?: string },
): Promise<PublicIngestToken> {
  return request<PublicIngestToken>(opts, "POST", `/public-tokens`, body);
}
