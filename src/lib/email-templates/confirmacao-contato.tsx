import React from "react";
import { Text } from "@react-email/components";
import { BaseLayout, InfoBox, styles } from "./base-layout";
import type { TemplateEntry } from "./template-types";

export interface ConfirmacaoContatoProps {
  nome?: string;
  /** Mensagem enviada pelo contato no formulário. */
  mensagem?: string;
  /** Protocolo de atendimento gerado no cadastro. */
  protocolo?: string;
}

function ConfirmacaoContatoEmail({
  nome,
  mensagem,
  protocolo,
}: ConfirmacaoContatoProps) {
  return (
    <BaseLayout
      previewText="Recebemos sua mensagem — retornaremos em breve"
      eyebrow="Confirmação de recebimento"
    >
      <Text style={styles.heading}>
        {nome ? `${nome}, recebemos sua mensagem` : "Recebemos sua mensagem"}
      </Text>
      <Text style={styles.paragraph}>
        Obrigado pelo contato. Nossa equipe analisará sua solicitação e responderá
        em até 1 dia útil.
      </Text>

      <InfoBox>
        {protocolo ? (
          <>
            <Text style={styles.label}>Protocolo</Text>
            <Text style={styles.value}>{protocolo}</Text>
          </>
        ) : null}
        <Text style={styles.label}>Sua mensagem</Text>
        <Text style={{ ...styles.value, marginBottom: 0, fontWeight: 400 }}>
          {mensagem || "—"}
        </Text>
      </InfoBox>

      <Text style={{ ...styles.paragraph, marginBottom: 0 }}>
        Não é necessário responder a este e-mail; ele é apenas a confirmação
        automática do seu envio.
      </Text>
    </BaseLayout>
  );
}

export const template = {
  component: ConfirmacaoContatoEmail,
  subject: "Recebemos sua mensagem — Digitale Têxtil",
  displayName: "Confirmação de formulário",
  previewData: {
    nome: "Marina",
    mensagem: "Gostaria de orçamento para tecido com proteção UV.",
    protocolo: "DT-2026-0148",
  },
} satisfies TemplateEntry;

export default ConfirmacaoContatoEmail;