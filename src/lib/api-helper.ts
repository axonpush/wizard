export interface ApiHelperOptions {
  apiKey: string;
  tenantId: string;
  baseUrl: string;
}

export function buildApiHelperScript(opts: ApiHelperOptions): string {
  return `const BASE = ${JSON.stringify(opts.baseUrl)};
const HEADERS = {
  "X-API-Key": ${JSON.stringify(opts.apiKey)},
  "x-tenant-id": ${JSON.stringify(opts.tenantId)},
  "Content-Type": "application/json",
};

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) { console.error("ERROR", res.status, text); process.exit(1); }
  try { return JSON.parse(text); } catch { return text; }
}

async function api(method, path, body) {
  const data = await request(method, path, body);
  if (typeof data === "string") { console.log(data); return; }
  console.log(JSON.stringify(data, null, 2));
}

async function showApp(appId) {
  const apps = await request("GET", "/apps");
  if (!Array.isArray(apps)) { console.error("Unexpected /apps response"); process.exit(1); }
  const id = Number(appId);
  const match = apps.find((a) => Number(a.id) === id);
  if (!match) { console.error("App not found:", appId); process.exit(1); }
  console.log(JSON.stringify(match, null, 2));
}

const [,, cmd, ...args] = process.argv;
switch (cmd) {
  case "list-apps":      api("GET",  "/apps"); break;
  case "create-app":     api("POST", "/apps", { name: args[0] }); break;
  case "list-app":       showApp(args[0]); break;
  case "create-channel": api("POST", "/channel", { name: args[0], appId: Number(args[1]) }); break;
  default: console.error("Unknown command:", cmd); process.exit(1);
}
`;
}
