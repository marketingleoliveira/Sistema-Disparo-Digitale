import React from "react";
import { Section, Text } from "@react-email/components";
import { BaseLayout, BrandButton, styles } from "./base-layout";
import { BRAND, type TemplateEntry } from "./template-types";

export interface BoasVindasProps {
  /** Nome do contato; ausência é tratada com saudação genérica. */
  nome?: string;
  /** Empresa do contato, quando conhecida. */
  empresa?: string;
}

function BoasVindasEmail({ nome, empresa }: BoasVindasProps) {
  const saudacao = nome ? `Olá, ${nome}!` : "Olá!";

  return (
    <BaseLayout
      previewText="Bem-vindo à Digitale Têxtil — tecidos de alta tecnologia"
      eyebrow="Bem-vindo"
    >
      <Text style={styles.heading}>{saudacao}</Text>
      <Text style={styles.paragraph}>
        Que bom ter você{empresa ? ` e a ${empresa}` : ""} com a gente. A partir de
        agora você receberá novidades sobre nossos tecidos técnicos, lançamentos de
        coleção e conteúdos sobre inovação têxtil.
      </Text>
      <Text style={styles.paragraph}>
        Nossa equipe comercial está à disposição para entender sua necessidade de
        aplicação e indicar a composição ideal.
      </Text>
      <Section style={{ margin: "8px 0 4px" }}>
        <BrandButton href={BRAND.site} label="Conhecer a Digitale Têxtil" />
      </Section>
    </BaseLayout>
  );
}

export const template = {
  component: BoasVindasEmail,
  subject: "Bem-vindo à Digitale Têxtil",
  displayName: "Boas-vindas ao contato",
  previewData: { nome: "Marina", empresa: "Confecções Aurora" },
} satisfies TemplateEntry;

export default BoasVindasEmail;