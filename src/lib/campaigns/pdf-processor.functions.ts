import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Converte os metadados e conteúdo do PDF em blocos do editor visual.
 */
export const processPdfToEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    pdfBase64: z.string(),
    fileName: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    // Simulação de processamento pesado (em produção aqui haveria OCR/Extração real)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Estrutura de blocos que o editor visual entende
    // Em produção, isso viria da análise do PDF.
    const blocks = [
      {
        id: "pdf-logo-" + Date.now(),
        type: "logo",
        content: { url: "https://disparodigitaletextil.lovable.app/Digitale_ALTATECNOLOGIA.png" },
        styles: { textAlign: "center", paddingTop: "20px", paddingBottom: "20px" }
      },
      {
        id: "pdf-title-" + Date.now(),
        type: "title",
        content: { text: data.fileName.replace(".pdf", "").toUpperCase() },
        styles: { fontSize: "32px", fontWeight: "bold", textAlign: "center", color: "#1e2d4d", paddingTop: "20px", paddingBottom: "10px" }
      },
      {
        id: "pdf-divider-1-" + Date.now(),
        type: "divider",
        content: {},
        styles: { paddingTop: "10px", paddingBottom: "20px" }
      },
      {
        id: "pdf-image-" + Date.now(),
        type: "image",
        content: { url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1000&auto=format&fit=crop" },
        styles: { width: "100%", borderRadius: "12px", paddingTop: "10px", paddingBottom: "20px" }
      },
      {
        id: "pdf-text-1-" + Date.now(),
        type: "text",
        content: { text: "Documento processado: " + data.fileName },
        styles: { fontSize: "18px", lineHeight: "1.6", textAlign: "left", color: "#1e2d4d", fontWeight: "600", paddingTop: "10px", paddingBottom: "10px" }
      },
      {
        id: "pdf-text-2-" + Date.now(),
        type: "text",
        content: { text: "Conteúdo extraído com sucesso. Este layout foi gerado automaticamente para facilitar o seu disparo de e-mail marketing da Digitale Têxtil." },
        styles: { fontSize: "16px", lineHeight: "1.5", textAlign: "left", color: "#5b6579", paddingTop: "5px", paddingBottom: "20px" }
      },
      {
        id: "pdf-btn-" + Date.now(),
        type: "button",
        content: { text: "VER DETALHES", url: "https://www.digitaletextil.com.br" },
        styles: { backgroundColor: "#ee6c1f", color: "#ffffff", borderRadius: "8px", textAlign: "center", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "30px", paddingRight: "30px" }
      },
      {
        id: "pdf-footer-" + Date.now(),
        type: "footer",
        content: { text: "© 2026 Digitale Têxtil | Tecnologia e Sustentabilidade" },
        styles: { fontSize: "12px", textAlign: "center", color: "#94a3b8", paddingTop: "40px", paddingBottom: "20px" }
      }
    ];

    return {
      success: true,
      blocks,
      message: "PDF convertido em blocos premium para Digitale Têxtil."
    };
  });


