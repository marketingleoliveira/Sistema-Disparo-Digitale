import { createServerFn } from "@tanstack/react-start";
import {
  listHelpArticlesAdmin, listHelpArticlesPublished, readHelpArticle,
  saveHelpArticle, deleteHelpArticle, type HelpArticleInput,
} from "./articles.server";

export const listAdminHelpArticles = createServerFn({ method: "GET" })
  .handler(async () => listHelpArticlesAdmin());

export const listPublishedHelpArticles = createServerFn({ method: "GET" })
  .handler(async () => listHelpArticlesPublished());

export const getHelpArticle = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => readHelpArticle(data.id));

export const saveHelpArticleFn = createServerFn({ method: "POST" })
  .inputValidator((data: HelpArticleInput) => data)
  .handler(async ({ data }) => saveHelpArticle(data));

export const deleteHelpArticleFn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => ({ id: String(data?.id ?? "") }))
  .handler(async ({ data }) => deleteHelpArticle(data.id));
