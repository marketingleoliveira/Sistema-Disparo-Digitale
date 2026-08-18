import * as React from "react";

import { AuthActionEmail } from "./auth-shell";

export interface RecoveryEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <AuthActionEmail
    previewText="Redefinição de senha da plataforma"
    eyebrow="Segurança"
    title="Redefinir sua senha"
    paragraphs={[
      "Recebemos um pedido para redefinir a senha da sua conta.",
      "Clique no botão abaixo para criar uma nova senha.",
    ]}
    actionLabel="Criar nova senha"
    actionUrl={confirmationUrl}
    note="Se não foi você, sua senha atual continua válida e nenhuma ação é necessária."
  />
);

export default RecoveryEmail;
