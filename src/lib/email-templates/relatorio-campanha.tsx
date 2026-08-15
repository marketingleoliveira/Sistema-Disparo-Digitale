import React from "react";
import { Column, Row, Section, Text } from "@react-email/components";
import { BaseLayout, BrandButton, InfoBox, styles } from "./base-layout";
import { BRAND, type TemplateEntry } from "./template-types";

export interface RelatorioCampanhaProps {
  /** Nome interno da campanha finalizada. */
  campanha?: string;
  enviados?: number;
  entregues?: number;
  falhas?: number;
  /** Data de conclusão formatada. */
  concluidaEm?: string;
}

/** Aviso enviado ao responsável quando o processamento de uma campanha termina. */
function RelatorioCampanhaEmail({
  campanha,
  enviados = 0,
  entregues = 0,
  falhas = 0,
  concluidaEm,
}: RelatorioCampanhaProps) {
  const metricas: Array<[string, string]> = [
    ["Enviados", enviados.toLocaleString("pt-BR")],
    ["Entregues", entregues.toLocaleString("pt-BR")],
    ["Falhas", falhas.toLocaleString("pt-BR")],
  ];

  return (
    <BaseLayout
      previewText={`Relatório disponível: ${campanha || "sua campanha"}`}
      eyebrow="Relatório de envio"
    >
      <Text style={styles.heading}>Campanha concluída</Text>
      <Text style={styles.paragraph}>
        O processamento da campanha <strong>{campanha || "sem nome"}</strong>{" "}
        terminou{concluidaEm ? ` em ${concluidaEm}` : ""}. Veja o resumo abaixo.
      </Text>

      <InfoBox>
        <Row>
          {metricas.map(([label, value]) => (
            <Column key={label} style={{ textAlign: "center" }}>
              <Text style={{ ...styles.label, margin: "0 0 6px" }}>{label}</Text>
              <Text
                style={{
                  color: BRAND.navy,
                  fontSize: "22px",
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                {value}
              </Text>
            </Column>
          ))}
        </Row>
      </InfoBox>

      <Section style={{ margin: "4px 0" }}>
        <BrandButton href={`${BRAND.site}/reports`} label="Abrir relatório completo" />
      </Section>
    </BaseLayout>
  );
}

export const template = {
  component: RelatorioCampanhaEmail,
  subject: "Relatório da sua campanha está pronto",
  displayName: "Relatório de campanha concluída",
  previewData: {
    campanha: "Lançamento Primavera 2026",
    enviados: 2384,
    entregues: 2351,
    falhas: 33,
    concluidaEm: "15/08/2026 às 18:40",
  },
} satisfies TemplateEntry;

export default RelatorioCampanhaEmail;