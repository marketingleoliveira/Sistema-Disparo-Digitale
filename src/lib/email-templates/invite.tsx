import * as React from "react";

import { AuthActionEmail } from "./auth-shell";

export interface InviteEmailProps {
  siteName: string;
  siteUrl: string;
  confirmationUrl: string;
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <AuthActionEmail
    previewText="Você foi convidado para a plataforma da Digitale Têxtil"
    eyebrow="Convite de equipe"
    title="Você recebeu um convite"
    paragraphs={[
      "Um administrador convidou você para acessar a plataforma interna de e-mail marketing da Digitale Têxtil.",
      "Aceite o convite para definir sua senha e concluir o cadastro.",
    ]}
    actionLabel="Aceitar convite"
    actionUrl={confirmationUrl}
    note="Se você acredita que recebeu este convite por engano, basta ignorar este e-mail."
  />
);

export default InviteEmail;
