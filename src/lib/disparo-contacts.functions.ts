import { createServerFn } from "@tanstack/react-start";

import {
  listContactsDB,
  createContactDB,
  updateContactDB,
  deleteContactDB,
  importContactsDB,
  type ContactDraft
} from "./disparo-contacts.server";

export const listDisparoContacts = createServerFn({
  method: "GET"
}).handler(async () => listContactsDB());

export const createDisparoContact = createServerFn({
  method: "POST"
})
  .inputValidator((data: ContactDraft) => data)
  .handler(async ({ data }) => createContactDB(data));

export const updateDisparoContact = createServerFn({
  method: "POST"
})
  .inputValidator((data: {
    id: string;
    contact: ContactDraft;
  }) => data)
  .handler(async ({ data }) =>
    updateContactDB(data.id, data.contact)
  );

export const deleteDisparoContact = createServerFn({
  method: "POST"
})
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) =>
    deleteContactDB(data.id)
  );

export const importDisparoContacts = createServerFn({
  method: "POST"
})
  .inputValidator((data: ContactDraft[]) => data)
  .handler(async ({ data }) =>
    importContactsDB(data)
  );
