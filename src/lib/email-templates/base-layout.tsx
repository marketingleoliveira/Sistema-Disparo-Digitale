import React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { BRAND } from "./template-types";

export interface BaseLayoutProps {
  /** Texto exibido na prévia da caixa de entrada. */
  previewText: string;
  /** Rótulo pequeno acima do conteúdo (ex: "Confirmação"). */
  eyebrow?: string;
  children: React.ReactNode;
}

/**
 * Layout base compartilhado por todos os e-mails.
 *
 * Regras respeitadas:
 * - fundo do <Body> sempre branco (compatibilidade com clientes de e-mail);
 * - estilos 100% inline, sem <style> ou CSS externo;
 * - nenhum link de descadastro (o rodapé de opt-out é anexado automaticamente).
 */
export function BaseLayout({ previewText, eyebrow, children }: BaseLayoutProps) {
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={wrapper}>
          {/* Cabeçalho marinho com a logo oficial */}
          <Section style={header}>
            <Img
              src={BRAND.logoUrl}
              alt={`${BRAND.name} — ${BRAND.tagline}`}
              width="168"
              style={logo}
            />
          </Section>

          {/* Faixa laranja de acento */}
          <Section style={accentBar} />

          <Section style={content}>
            {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
            {children}
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerBrand}>{BRAND.name}</Text>
            <Text style={footerText}>{BRAND.tagline}</Text>
            <Text style={footerText}>
              <Link href={BRAND.site} style={footerLink}>
                digitaletextil.com.br
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Botão de ação reutilizável (renderizado como link para máxima compatibilidade). */
export function BrandButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={button}>
      {label}
    </Link>
  );
}

/** Bloco de destaque com fundo gelo, usado para resumos e dados. */
export function InfoBox({ children }: { children: React.ReactNode }) {
  return <Section style={infoBox}>{children}</Section>;
}

export const styles = {
  heading: {
    color: BRAND.navy,
    fontSize: "24px",
    lineHeight: "32px",
    fontWeight: 700,
    margin: "0 0 16px",
  } as React.CSSProperties,
  paragraph: {
    color: BRAND.textMuted,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0 0 16px",
  } as React.CSSProperties,
  label: {
    color: BRAND.textMuted,
    fontSize: "10px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    fontWeight: 700,
    margin: "0 0 4px",
  } as React.CSSProperties,
  value: {
    color: BRAND.navy,
    fontSize: "15px",
    fontWeight: 600,
    margin: "0 0 14px",
  } as React.CSSProperties,
};

const body: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: BRAND.fontFamily,
  margin: 0,
  padding: "24px 0",
};

const wrapper: React.CSSProperties = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto",
  border: `1px solid ${BRAND.border}`,
  borderRadius: "12px",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  backgroundColor: BRAND.navy,
  padding: "28px 32px",
  textAlign: "center",
};

const logo: React.CSSProperties = {
  display: "block",
  margin: "0 auto",
  height: "auto",
};

const accentBar: React.CSSProperties = {
  backgroundColor: BRAND.orange,
  height: "4px",
  lineHeight: "4px",
  fontSize: "0",
};

const content: React.CSSProperties = {
  padding: "32px",
};

const eyebrowStyle: React.CSSProperties = {
  color: BRAND.orange,
  fontSize: "10px",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  fontWeight: 700,
  margin: "0 0 10px",
};

const divider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: 0,
};

const footer: React.CSSProperties = {
  backgroundColor: BRAND.ice,
  padding: "24px 32px",
  textAlign: "center",
};

const footerBrand: React.CSSProperties = {
  color: BRAND.navy,
  fontSize: "13px",
  fontWeight: 700,
  margin: "0 0 2px",
};

const footerText: React.CSSProperties = {
  color: BRAND.textMuted,
  fontSize: "11px",
  margin: "0 0 2px",
};

const footerLink: React.CSSProperties = {
  color: BRAND.textMuted,
  textDecoration: "underline",
};

const button: React.CSSProperties = {
  backgroundColor: BRAND.orange,
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  padding: "13px 28px",
  borderRadius: "8px",
  display: "inline-block",
};

const infoBox: React.CSSProperties = {
  backgroundColor: BRAND.ice,
  border: `1px solid ${BRAND.border}`,
  borderRadius: "10px",
  padding: "20px 24px",
  margin: "0 0 24px",
};