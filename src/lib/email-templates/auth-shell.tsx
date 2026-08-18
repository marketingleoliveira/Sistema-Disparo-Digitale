import * as React from "react";
import { Button, Heading, Section, Text } from "@react-email/components";

import { BaseLayout } from "./base-layout";
import { BRAND } from "./template-types";

export interface AuthActionEmailProps {
  /** Texto de prévia na caixa de entrada. */
  previewText: string;
  /** Rótulo pequeno acima do título. */
  eyebrow: string;
  /** Título principal do e-mail. */
  title: string;
  /** Parágrafos do corpo (renderizados em ordem). */
  paragraphs: React.ReactNode[];
  /** Rótulo do botão de ação (omitido quando não há URL). */
  actionLabel?: string;
  /** URL de ação (link assinado enviado pela autenticação). */
  actionUrl?: string;
  /** Código numérico exibido em destaque (reautenticação). */
  code?: string;
  /** Observação final em texto reduzido. */
  note?: React.ReactNode;
}

/**
 * Casca branded reutilizada por todos os e-mails de autenticação.
 * Mantém tipografia, cores e estrutura idênticas aos e-mails de marketing.
 */
export function AuthActionEmail({
  previewText,
  eyebrow,
  title,
  paragraphs,
  actionLabel,
  actionUrl,
  code,
  note,
}: AuthActionEmailProps) {
  return (
    <BaseLayout previewText={previewText} eyebrow={eyebrow}>
      <Heading style={heading}>{title}</Heading>

      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={text}>
          {paragraph}
        </Text>
      ))}

      {code ? (
        <Section style={codeBox}>
          <Text style={codeText}>{code}</Text>
        </Section>
      ) : null}

      {actionUrl && actionLabel ? (
        <Section style={buttonWrapper}>
          <Button href={actionUrl} style={button}>
            {actionLabel}
          </Button>
        </Section>
      ) : null}

      {note ? <Text style={noteText}>{note}</Text> : null}
    </BaseLayout>
  );
}

const heading: React.CSSProperties = {
  fontFamily: BRAND.fontFamily,
  fontSize: "22px",
  lineHeight: "30px",
  fontWeight: 700,
  color: BRAND.navy,
  margin: "0 0 16px",
};

const text: React.CSSProperties = {
  fontFamily: BRAND.fontFamily,
  fontSize: "15px",
  lineHeight: "24px",
  color: BRAND.textMuted,
  margin: "0 0 14px",
};

const buttonWrapper: React.CSSProperties = {
  margin: "24px 0 8px",
};

const button: React.CSSProperties = {
  fontFamily: BRAND.fontFamily,
  backgroundColor: BRAND.orange,
  color: BRAND.white,
  fontSize: "15px",
  fontWeight: 600,
  textDecoration: "none",
  borderRadius: "8px",
  padding: "13px 26px",
  display: "inline-block",
};

const codeBox: React.CSSProperties = {
  backgroundColor: BRAND.ice,
  border: `1px solid ${BRAND.border}`,
  borderRadius: "10px",
  padding: "18px",
  margin: "20px 0",
  textAlign: "center" as const,
};

const codeText: React.CSSProperties = {
  fontFamily: BRAND.fontFamily,
  fontSize: "28px",
  letterSpacing: "6px",
  fontWeight: 700,
  color: BRAND.navy,
  margin: 0,
};

const noteText: React.CSSProperties = {
  fontFamily: BRAND.fontFamily,
  fontSize: "13px",
  lineHeight: "20px",
  color: BRAND.textMuted,
  margin: "18px 0 0",
};
