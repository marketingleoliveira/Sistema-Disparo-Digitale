import { createServerFn } from "@tanstack/react-start";
import {
  listTemplatesDB,
  upsertTemplateDB,
  deleteTemplateDB,
  clearHiddenOfficialDB,
  type SharedTemplateKind,
} from "./disparo-shared-templates.server";

export const listSharedTemplates = createServerFn({ method: "POST" })
  .inputValidator((data: { kind: SharedTemplateKind }) => data)
  .handler(async ({ data }) => listTemplatesDB(data.kind));

export const saveSharedTemplate = createServerFn({ method: "POST" })
  .inputValidator((data: { kind: SharedTemplateKind; template: unknown }) => data)
  .handler(async ({ data }) => upsertTemplateDB(data.kind, data.template));

export const deleteSharedTemplate = createServerFn({ method: "POST" })
  .inputValidator((data: { kind: SharedTemplateKind; id: string }) => data)
  .handler(async ({ data }) => deleteTemplateDB(data.kind, data.id));

export const clearSharedHiddenOfficials = createServerFn({ method: "POST" })
  .handler(async () => clearHiddenOfficialDB());
