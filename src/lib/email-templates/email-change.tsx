import * as React from "react";

import { AuthActionEmail } from "./auth-shell";

export interface EmailChangeEmailProps {
  siteName: string;
  oldEmail: string;
  email: string;
  newEmail: string;
  confirmationUrl: string;
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <AuthActionEmail
    previewText="Confirme a alteração do seu e-mail de acesso"
    eyebrow="Alteração de e-mail"
    title="Confirme seu novo e-mail"
    paragraphs={[
      <>
        Foi solicitada a alteração do e-mail de acesso
        {oldEmail ? (
          <>
            {" "}
            de <strong>{oldEmail}</strong>
          </>
        ) : null}
        {newEmail ? (
          <>
            {" "}
            para <strong>{newEmail}</strong>
          </>
        ) : null}
        .
      </>,
      "Confirme abaixo para concluir a alteração.",
    ]}
    actionLabel="Confirmar alteração"
    actionUrl={confirmationUrl}
    note="Se você não solicitou esta mudança, ignore este e-mail e o endereço atual será mantido."
  />
);

export default EmailChangeEmail;
