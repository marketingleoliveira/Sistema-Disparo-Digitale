import * as React from "react";

import { AuthActionEmail } from "./auth-shell";

export interface SignupEmailProps {
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl: string;
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <AuthActionEmail
    previewText="Confirme seu e-mail para ativar o acesso"
    eyebrow="Confirmação de acesso"
    title="Confirme seu e-mail"
    paragraphs={[
      <>
        Recebemos uma solicitação de acesso para <strong>{recipient}</strong> na plataforma interna
        da Digitale Têxtil.
      </>,
      "Confirme o endereço abaixo para ativar sua conta e liberar o painel.",
    ]}
    actionLabel="Confirmar meu e-mail"
    actionUrl={confirmationUrl}
    note="Se você não solicitou este acesso, ignore este e-mail — nenhuma conta será ativada."
  />
);

export default SignupEmail;
