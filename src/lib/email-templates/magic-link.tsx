import * as React from "react";

import { AuthActionEmail } from "./auth-shell";

export interface MagicLinkEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <AuthActionEmail
    previewText="Seu link de acesso à plataforma"
    eyebrow="Acesso rápido"
    title="Seu link de acesso"
    paragraphs={[
      "Use o botão abaixo para entrar na plataforma sem digitar senha.",
      "Por segurança, o link é de uso único e expira em pouco tempo.",
    ]}
    actionLabel="Entrar na plataforma"
    actionUrl={confirmationUrl}
    note="Se você não pediu este link, ignore este e-mail."
  />
);

export default MagicLinkEmail;
