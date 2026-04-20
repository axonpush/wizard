import {
  createEnvironment,
  listEnvironments,
  type ApiOptions,
  type Environment,
} from "./axonpush-api.js";
import { selectOne, textInput } from "./tui.js";

const ENV_VAR_HINTS = [
  "AXONPUSH_ENVIRONMENT",
  "SENTRY_ENVIRONMENT",
  "NODE_ENV",
  "APP_ENV",
  "ENV",
];

function detectShellEnv(): string | undefined {
  for (const name of ENV_VAR_HINTS) {
    const v = process.env[name];
    if (v && v.trim().length > 0) return v;
  }
  return undefined;
}

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

export interface EnvironmentSelection {
  environment: Environment;
}

export async function promptEnvironment(
  opts: ApiOptions,
  appId: number,
  preset?: string,
): Promise<EnvironmentSelection | null> {
  const envs = await listEnvironments(opts, appId);
  if (envs.length === 0) {
    return null;
  }

  if (preset) {
    const match = envs.find((e) => e.slug === preset);
    if (match) return { environment: match };
    const created = await createEnvironment(opts, appId, {
      name: preset.charAt(0).toUpperCase() + preset.slice(1),
      slug: preset,
    });
    return { environment: created };
  }

  const shellHint = detectShellEnv();

  const nonEphemeral = envs.filter((e) => !e.isEphemeral);
  const choices: { label: string; value: string }[] = nonEphemeral.map((e) => ({
    label: `${e.name} (${e.slug})${e.isDefault ? " — default" : ""}${e.isProduction ? " [PROD]" : ""}`,
    value: `existing:${e.id}`,
  }));

  if (shellHint && !envs.find((e) => e.slug === shellHint.toLowerCase())) {
    choices.unshift({
      label: `Create: ${shellHint} (detected from shell)`,
      value: `new:${shellHint}`,
    });
  }
  choices.push({ label: "Create new environment…", value: "new" });

  const picked = await selectOne<string>(
    "Which environment does this setup target?",
    choices,
  );

  if (!picked) return null;

  if (picked.startsWith("existing:")) {
    const id = Number(picked.split(":")[1]);
    const env = envs.find((e) => e.id === id);
    if (!env) return null;
    return { environment: env };
  }

  let slug = "";
  if (picked.startsWith("new:")) {
    slug = picked.split(":")[1] ?? "";
  }
  if (!slug) {
    slug = await textInput(
      "Environment slug (1-40 chars of [a-z0-9-], no trailing hyphen)",
    );
  }
  if (!slug || !SLUG_RE.test(slug)) {
    return null;
  }

  const created = await createEnvironment(opts, appId, {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    slug,
  });
  return { environment: created };
}
