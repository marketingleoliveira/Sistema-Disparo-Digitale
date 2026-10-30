import { requireDisparoUser } from "../disparo-auth.server";

import {
  allowedHelpModules,
  canManageHelp,
  canReadHelpModule,
  type HelpModule,
} from "./permissions";

export function requireHelpReader(): {
  userId: string;
  modules: readonly HelpModule[];
} {
  const user = requireDisparoUser({
    allowSdk: true,
  });

  const modules = allowedHelpModules(user.role);

  if (modules.length === 0) {
    throw new Error("Acesso nao autorizado.");
  }

  return {
    userId: user.id,
    modules,
  };
}

export function requireHelpArticleAccess(
  module: unknown
): void {
  const user = requireDisparoUser({
    allowSdk: true,
  });

  if (!canReadHelpModule(user.role, module)) {
    throw new Error("Conteudo nao encontrado.");
  }
}

export function requireHelpAdministrator(): string {
  const user = requireDisparoUser({
    allowSdk: true,
  });

  if (!canManageHelp(user.role)) {
    throw new Error(
      "Acao exclusiva do Admin Master."
    );
  }

  return user.id;
}
