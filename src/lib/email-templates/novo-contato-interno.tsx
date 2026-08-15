import React from "react";
import { Text } from "@react-email/components";
import { BaseLayout, InfoBox, styles } from "./base-layout";
import type { TemplateEntry } from "./template-types";

export interface NovoContatoInternoProps {
  nome?: string;
  email?: string;
  empresa?: string;
  origem?: string;
  mensagem?: string;
}

/** Notificação interna disparada quando um novo lead entra na base. */
function NovoContatoInternoEmail({
  nome,
  email,
  empresa,
  origem,
  mensagem,
}: NovoContatoInternoProps) {
  const campos: Array<[string, string]> = [
    ["Nome", nome || "—"],
    ["E-mail", email || "—"],
    ["Empresa", empresa || "—"],
    ["Origem", origem || "Cadastro manual"],
  ];

  return (
    <BaseLayout
      previewText={`Novo contato na base: ${nome || email || "sem identificação"}`}
      eyebrow="Notificação interna"
    >
      <Text style={styles.heading}>Novo contato cadastrado</Text>
      <Text style={styles.paragraph}>
        Um novo contato entrou na base da Digitale Têxtil e está disponível no
        painel para qualificação.
      </Text>

      <InfoBox>
        {campos.map(([label, value]) => (
          <React.Fragment key={label}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </React.Fragment>
        ))}
        {mensagem ? (
          <>
            <Text style={styles.label}>Mensagem</Text>
            <Text style={{ ...styles.value, marginBottom: 0, fontWeight: 400 }}>
              {mensagem}
            </Text>
          </>
        ) : null}
      </InfoBox>
    </BaseLayout>
  );
}

export const template = {
  component: NovoContatoInternoEmail,
  subject: "Novo contato cadastrado no painel",
  displayName: "Alerta interno de novo contato",
  previewData: {
    nome: "Marina Duarte",
    email: "marina@aurora.com.br",
    empresa: "Confecções Aurora",
    origem: "Formulário do site",
    mensagem: "Interesse em tecido antibacteriano.",
  },
} satisfies TemplateEntry;

export default NovoContatoInternoEmail;