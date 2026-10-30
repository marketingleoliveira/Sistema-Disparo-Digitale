import * as React from "react";
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Minus, 
  Columns, 
  Layout, 
  Share2, 
  Info, 
  MousePointer2, 
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BlockType = 
  | "text" 
  | "title" 
  | "image" 
  | "button" 
  | "divider" 
  | "spacer" 
  | "logo" 
  | "column" 
  | "columns-2" 
  | "columns-3" 
  | "image-text" 
  | "social" 
  | "footer" 
  | "html";

export interface EditorBlock {
  id: string;
  type: BlockType;
  content: any;
  styles: Record<string, any>;
}

export const LIBRARY_BLOCKS = [
  { id: "text", type: "text" as BlockType, label: "Texto", icon: Type },
  { id: "title", type: "title" as BlockType, label: "Título", icon: Layout },
  { id: "image", type: "image" as BlockType, label: "Imagem", icon: ImageIcon },
  { id: "button", type: "button" as BlockType, label: "Botão", icon: Square },
  { id: "divider", type: "divider" as BlockType, label: "Divisor", icon: Minus },
  { id: "spacer", type: "spacer" as BlockType, label: "Espaçamento", icon: Info },
  { id: "logo", type: "logo" as BlockType, label: "Logo", icon: ImageIcon },
  { id: "column", type: "column" as BlockType, label: "Coluna", icon: Columns },
  { id: "columns-2", type: "columns-2" as BlockType, label: "Duas colunas", icon: Columns },
  { id: "columns-3", type: "columns-3" as BlockType, label: "Três colunas", icon: Columns },
  { id: "image-text", type: "image-text" as BlockType, label: "Imagem + texto", icon: Layout },
  { id: "social", type: "social" as BlockType, label: "Social", icon: Share2 },
  { id: "footer", type: "footer" as BlockType, label: "Rodapé", icon: Info },
  { id: "html", type: "html" as BlockType, label: "HTML", icon: Info },
];

// DIGITALE_BRAND_FRAME_V1
// Cabeçalho e rodapé padrão dos novos templates.
export function withDigitaleBrandFrame(blocks: EditorBlock[]): EditorBlock[] {
  const header: EditorBlock = {
    id: "digitale-header-default",
    type: "logo",
    content: {
      url: "https://disparo.digitaletextil.com.br/editor-media/fcb8ef72bd94e156195eefb1926870a2a23465182b598ef9ba2b9e721cf4a8ae.png"
    },
    styles: {
      width: "80px",
      textAlign: "center",
      paddingTop: "10px",
      paddingBottom: "10px"
    }
  };

  const footer: EditorBlock = {
    id: "digitale-social-default",
    type: "social",
    content: {
      socialLinks: {
        instagram: "https://www.instagram.com/digitale.textil",
        facebook: "https://www.facebook.com/digitaletextilbr",
        site: "https://digitaletextil.com.br/"
      }
    },
    styles: {
      textAlign: "center",
      paddingTop: "10px",
      paddingBottom: "10px",
      socialColor: "#082f49",
      socialSize: 30,
      socialGap: 12
    }
  };

  // Evita duplicar logotipo ou ícones sociais.
  const content = blocks.filter(
    block => block.type !== "logo" && block.type !== "social"
  );

  return [header, ...content, footer];
}

export const INITIAL_BLOCKS: EditorBlock[] = [
  {
    id: "block-1",
    type: "logo",
    content: { url: "https://placehold.co/200x60/f8f9fa/1e293b?text=Digitale+Têxtil" },
    styles: { textAlign: "center", paddingTop: "20px", paddingBottom: "20px" }
  },
  {
    id: "block-2",
    type: "title",
    content: { text: "Olá {{nome}}, confira as novidades!" },
    styles: { fontSize: "24px", fontWeight: "bold", textAlign: "center", color: "#1e293b", paddingTop: "10px", paddingBottom: "10px" }
  },
  {
    id: "block-3",
    type: "text",
    content: { text: "Temos o prazer de anunciar o lançamento da nossa nova coleção de tecidos sustentáveis. Explore agora e leve inovação para sua confecção." },
    styles: { fontSize: "16px", lineHeight: "1.5", textAlign: "center", color: "#64748b", paddingTop: "10px", paddingBottom: "20px" }
  },
  {
    id: "block-4",
    type: "image",
    content: { url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1072&auto=format&fit=crop" },
    styles: { width: "100%", borderRadius: "8px", paddingTop: "10px", paddingBottom: "20px" }
  },
  {
    id: "block-5",
    type: "button",
    content: { text: "Ver Coleção", url: "#" },
    styles: { 
      backgroundColor: "#ea580c", 
      color: "#ffffff", 
      paddingTop: "12px", 
      paddingBottom: "12px", 
      paddingLeft: "24px", 
      paddingRight: "24px", 
      borderRadius: "6px",
      textAlign: "center",
      display: "inline-block"
    }
  },
];
