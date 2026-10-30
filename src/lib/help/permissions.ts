export const HELP_MODULES = [
  "dashboard",
  "campaigns",
  "templates",
  "email-templates",
  "automations",
  "forms",
  "contacts",
  "lists",
  "segments",
  "reports",
  "settings",
  "users",
] as const;

export type HelpModule =
  (typeof HELP_MODULES)[number];

const OPERATIONAL_MODULES: readonly HelpModule[] = [
  "dashboard",
  "campaigns",
  "templates",
  "email-templates",
  "automations",
  "forms",
  "contacts",
  "lists",
  "segments",
  "reports",
];

const MARKETING_MODULES: readonly HelpModule[] = [
  "dashboard",
  "campaigns",
  "templates",
  "reports",
];

export function isHelpModule(
  value: unknown
): value is HelpModule {
  return (
    typeof value === "string" &&
    (HELP_MODULES as readonly string[]).includes(value)
  );
}

export function allowedHelpModules(
  role: string | null | undefined
): readonly HelpModule[] {
  switch (role) {
    case "Desenvolvedor":
      return HELP_MODULES;

    case "Diretoria":
    case "Gerência":
      return OPERATIONAL_MODULES;

    case "Marketing":
      return MARKETING_MODULES;

    case "SDK":
      return ["templates"];

    default:
      return [];
  }
}

export function canReadHelpModule(
  role: string | null | undefined,
  module: unknown
): boolean {
  if (!isHelpModule(module)) return false;

  return allowedHelpModules(role).includes(module);
}

export function canManageHelp(
  role: string | null | undefined
): boolean {
  return role === "Desenvolvedor";
}
