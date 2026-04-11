import path from "path";
import type { ExistingApp } from "./api-client.js";
import { selectOne, textInput } from "./tui.js";

const CREATE_SENTINEL = "__create__";
const FILTER_SENTINEL = "__filter__";
const PAGE_SIZE = 15;

export type AppSelection = { reuse: ExistingApp } | { create: true };

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isLikelyMatch(appName: string, projectBasename: string): boolean {
  if (!projectBasename) return false;
  const a = normalize(appName);
  const p = normalize(projectBasename);
  if (!a || !p) return false;
  return a.includes(p) || p.includes(a);
}

function sortApps(apps: ExistingApp[]): ExistingApp[] {
  return [...apps].sort((a, b) => {
    const at = a.updatedAt ?? a.createdAt ?? "";
    const bt = b.updatedAt ?? b.createdAt ?? "";
    return bt.localeCompare(at);
  });
}

function describeChannels(app: ExistingApp): string {
  if (app.channels.length === 0) return "no channels";
  if (app.channels.length === 1) return "1 channel";
  return `${app.channels.length} channels`;
}

function labelFor(app: ExistingApp, projectBasename: string): string {
  const match = isLikelyMatch(app.name, projectBasename) ? " (likely match)" : "";
  return `${app.name}  ·  id=${app.id}  ·  ${describeChannels(app)}${match}`;
}

async function pickFromList(
  apps: ExistingApp[],
  projectBasename: string,
  header: string,
): Promise<AppSelection> {
  const visible = apps.slice(0, PAGE_SIZE);
  const choices: Array<{ label: string; value: string }> = [
    { label: "+ Create a new app", value: CREATE_SENTINEL },
    ...visible.map((app) => ({ label: labelFor(app, projectBasename), value: String(app.id) })),
  ];
  if (apps.length > PAGE_SIZE) {
    choices.push({
      label: `… ${apps.length - PAGE_SIZE} more (type to filter)`,
      value: FILTER_SENTINEL,
    });
  }

  const picked = await selectOne<string>(header, choices);
  if (picked === CREATE_SENTINEL) return { create: true };
  if (picked === FILTER_SENTINEL) {
    const query = await textInput("Filter apps by name:");
    const q = normalize(query);
    const filtered = q ? apps.filter((a) => normalize(a.name).includes(q)) : apps;
    if (filtered.length === 0) return { create: true };
    return pickFromList(filtered, projectBasename, "Filtered apps:");
  }
  const id = Number(picked);
  const found = apps.find((a) => a.id === id);
  if (!found) return { create: true };
  return { reuse: found };
}

export async function selectOrCreateApp(
  apps: ExistingApp[],
  projectDir: string,
): Promise<AppSelection> {
  if (apps.length === 0) return { create: true };

  const projectBasename = path.basename(projectDir);
  const sorted = sortApps(apps);
  const withMatchFirst = [...sorted].sort((a, b) => {
    const am = isLikelyMatch(a.name, projectBasename) ? 0 : 1;
    const bm = isLikelyMatch(b.name, projectBasename) ? 0 : 1;
    return am - bm;
  });

  return pickFromList(
    withMatchFirst,
    projectBasename,
    "Reuse an existing AxonPush app, or create a new one?",
  );
}
