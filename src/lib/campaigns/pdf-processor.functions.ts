import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const processPdfToEmail = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({
    pdfBase64: z.string(),
    fileName: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    // In a real production environment, we would use a heavy-duty PDF-to-HTML converter.
    // Since we are in a limited serverless environment, we will implement a strategy
    // that extracts images from the PDF to use as the email body, similar to the Canva import.
    
    // For now, returning a simulated success response to build the UI flow.
    // We will refine the extraction logic in follow-up steps.
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background-color:#f6f7fb;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="center" style="padding:40px 0;">
                <div style="max-width:600px;background-color:#ffffff;border-radius:12px;padding:40px;text-align:center;border:1px solid #e2e8f0;">
                  <h1 style="color:#1e2d4d;font-family:sans-serif;">Conteúdo do PDF Convertido</h1>
                  <p style="color:#5b6579;font-family:sans-serif;line-height:1.6;">
                    Este é um design gerado a partir do arquivo <strong>${data.fileName}</strong>.
                  </p>
                  <div style="background-color:#f8fafc;border:2px dashed #cbd5e1;padding:40px;margin:20px 0;border-radius:8px;">
                     <p style="color:#94a3b8;font-size:14px;">[Aqui aparecerá o conteúdo visual do PDF]</p>
                  </div>
                  <p style="color:#5b6579;font-family:sans-serif;font-size:14px;">
                    Você pode editar este conteúdo clicando no botão de edição no Wizard.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    return {
      success: true,
      html,
      message: "PDF convertido com sucesso."
    };
  });
