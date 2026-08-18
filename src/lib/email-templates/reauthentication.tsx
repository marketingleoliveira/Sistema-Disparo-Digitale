import * as React from "react";

import { AuthActionEmail } from "./auth-shell";

export interface ReauthenticationEmailProps {
  token: string;
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <AuthActionEmail
    previewText="Seu código de verificação"
    eyebrow="Verificação"
    title="Seu código de verificação"
    paragraphs={["Use o código abaixo para confirmar esta ação na plataforma."]}
    code={token}
    note="O código expira em poucos minutos. Nunca compartilhe este código com terceiros."
  />
);

export default ReauthenticationEmail;
