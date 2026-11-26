import { randomUUID, createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import {
  listTemplatesDB,
  upsertTemplateDB
} from "./disparo-shared-templates.server";

import {
  blocksToEmailHtml
} from "./templates/blocks-to-html";

import {
  withDigitaleBrandFrame,
  type EditorBlock
} from "@/components/editor/editor-types";

const STORAGE = "/var/www/TESTE_DISPARO/storage/editor-media";
const ORIGIN = "https://disparo.digitaletextil.com.br";

type Input = Record<string, unknown>;

function required(value: unknown, max: number): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > max
  ) throw new Error("Campo inválido.");

  return value.trim();
}

function safeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function importImage(p: Input) {

  const name = required(p.imageName, 255);
  const raw = required(p.imageBase64, 7000000);

  const bytes = Buffer.from(raw, "base64");

  if (
    !bytes.length ||
    bytes.length > 5 * 1024 * 1024 ||
    bytes.toString("base64") !== raw
  ) throw new Error("Imagem inválida.");

  let ext: string;
  let mime: string;

  if (
    bytes.length >= 3 &&
    bytes.subarray(0,3).equals(
      Buffer.from([255,216,255])
    )
  ) {
    ext = "jpg";
    mime = "image/jpeg";
  } else if (
    bytes.subarray(0,8).equals(
      Buffer.from([137,80,78,71,13,10,26,10])
    )
  ) {
    ext = "png";
    mime = "image/png";
  } else if (
    bytes.toString("ascii",0,4)==="RIFF" &&
    bytes.toString("ascii",8,12)==="WEBP"
  ) {
    ext = "webp";
    mime = "image/webp";
  } else {
    throw new Error("Formato de imagem inválido.");
  }

  const hash = createHash("sha256")
    .update(bytes).digest("hex");

  const id = `${hash}.${ext}`;

  await fs.mkdir(STORAGE,{recursive:true});

  async function writeOnce(file:string,data:Buffer|string){
    try {
      await fs.writeFile(file,data,{
        flag:"wx",
        mode:0o644
      });
    } catch(error) {
      if (
        (error as NodeJS.ErrnoException).code !== "EEXIST"
      ) throw error;
    }
  }

  await writeOnce(path.join(STORAGE,id),bytes);

  await writeOnce(
    path.join(STORAGE,`${hash}.json`),
    JSON.stringify({
      id,name,mime,
      size:bytes.length,
      createdAt:new Date().toISOString()
    })
  );

  return `${ORIGIN}/editor-media/${id}`;
}

export async function createEditableMarketingTemplate(p:Input){

  const name = required(p.name,200);
  const title = safeText(required(p.title,300));
  const body = safeText(required(p.body,20000));
  const ps = safeText(required(p.ps,4000));
  const subject = required(p.subject,300);
  const preheader = required(p.preheader,500);
  const button = safeText(required(p.button,150));

  const link = new URL(required(p.link,2000));

  if (
    link.protocol !== "https:" ||
    link.username ||
    link.password ||
    ![
      "digitaletextil.com.br",
      "www.digitaletextil.com.br"
    ].includes(link.hostname)
  ) throw new Error("Link não autorizado.");

  const existing = listTemplatesDB("marketing") as Input[];

  if(existing.some(t=>t.name===name)){
    throw new Error("Já existe um template com esse nome.");
  }

  const image = await importImage(p);

  const block = (
    type: EditorBlock["type"],
    content: EditorBlock["content"],
    styles: EditorBlock["styles"]
  ):EditorBlock=>({
    id:randomUUID(),type,content,styles
  });

  const textStyle = {
    fontSize:"16px",
    fontFamily:"Arial, sans-serif",
    lineHeight:"1.6",
    textAlign:"center",
    color:"#334155",
    paddingTop:"12px",
    paddingBottom:"12px"
  };

  const blocks = withDigitaleBrandFrame([

    block("title",{text:title},{
      ...textStyle,
      fontSize:"26px",
      fontWeight:"bold",
      color:"#082f49"
    }),

    block("image",{url:image},{
      width:"100%",
      textAlign:"center",
      paddingTop:"10px",
      paddingBottom:"16px"
    }),

    block("text",{text:body},textStyle),

    block("text",{text:"P.S.: "+ps},{
      ...textStyle,
      fontStyle:"italic"
    }),

    block("button",{
      text:button,
      url:link.toString()
    },{
      backgroundColor:"#082f49",
      color:"#ffffff",
      textAlign:"center",
      borderRadius:"6px",
      paddingTop:"14px",
      paddingBottom:"14px",
      paddingLeft:"24px",
      paddingRight:"24px"
    })

  ]);

  const now = new Date().toISOString();

  const template = {
    id:randomUUID(),
    name,
    category:"Marketing",
    image,
    kind:"editor",
    blocks,
    html:blocksToEmailHtml(blocks,safeText(name)),
    subject,
    preheader,
    linkUrl:link.toString(),
    createdAt:now,
    updatedAt:now
  };

  upsertTemplateDB("marketing",template);

  const saved = (
    listTemplatesDB("marketing") as Input[]
  ).find(t=>t.id===template.id);

  if(!saved || saved.kind!=="editor"){
    throw new Error("Cadastro não confirmado.");
  }

  return {
    created:true,
    verified:true,
    id:template.id,
    name:template.name,
    kind:"editor",
    blocks:blocks.length,
    image
  };
}
