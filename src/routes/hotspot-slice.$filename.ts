
import { createFileRoute } from "@tanstack/react-router";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const execute = promisify(execFile);
const STORAGE = "/var/www/TESTE_DISPARO/storage/editor-media";
const CACHE = "/var/www/TESTE_DISPARO/storage/hotspot-slices";
const BASE = "https://disparo.digitaletextil.com.br";

export const Route = createFileRoute("/hotspot-slice/$filename")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const filename = params.filename;

        if (!/^[a-f0-9]{64}\.(jpg|png|webp)$/.test(filename)) {
          return new Response("Imagem invalida", { status: 404 });
        }

        const url = new URL(request.url);
        const values = ["x","y","w","h"].map(key => {
          const raw = url.searchParams.get(key);
          return raw && /^\d{1,5}$/.test(raw)
            ? Number(raw)
            : NaN;
        });

        const [x=NaN,y=NaN,w=NaN,h=NaN] = values;

        if (
          values.some(v => !Number.isSafeInteger(v)) ||
          x < 0 || y < 0 || w < 1 || h < 1 ||
          x+w > 10000 || y+h > 10000
        ) {
          return new Response("Recorte invalido", { status: 400 });
        }

        const source = path.join(STORAGE,filename);
        const key = crypto.createHash("sha256")
          .update(`${filename}:${x}:${y}:${w}:${h}:v2`)
          .digest("hex");

        const cached = path.join(CACHE,`${key}.png`);

        try {
          let bytes;

          try {
            bytes = await fs.readFile(cached);
          } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== "ENOENT")
              throw err;

            const {stdout:dimensions} = await execute(
              "/usr/bin/identify",
              ["-ping","-format","%w %h",source],
              {timeout:8000,encoding:"utf8"}
            );

            const [iw=NaN,ih=NaN] = dimensions.trim()
              .split(/\s+/).map(Number);

            if (
              !Number.isSafeInteger(iw) ||
              !Number.isSafeInteger(ih) ||
              iw < 1 || ih < 1 ||
              iw*ih > 24000000
            ) {
              return new Response("Dimensoes invalidas", {status:400});
            }

            const left = Math.round(iw*x/10000);
            const top = Math.round(ih*y/10000);
            const right = Math.round(iw*(x+w)/10000);
            const bottom = Math.round(ih*(y+h)/10000);

            const cw = Math.max(1,right-left);
            const ch = Math.max(1,bottom-top);

            const {stdout} = await execute(
              "/usr/bin/convert",
              [
                "-limit","memory","64MiB",
                "-limit","map","128MiB",
                source,
                "-crop",`${cw}x${ch}+${left}+${top}`,
                "+repage",
                "-strip",
                "png:-"
              ],
              {
                encoding:null,
                timeout:12000,
                maxBuffer:12000000
              }
            );

            bytes = stdout as Buffer;
            await fs.mkdir(CACHE,{recursive:true});

            await fs.writeFile(cached,bytes,{
              flag:"wx",
              mode:0o644
            }).catch(async e=>{
              if ((e as NodeJS.ErrnoException).code !== "EEXIST")
                throw e;
            });
          }

          return new Response(new Uint8Array(bytes),{
            headers:{
              "Content-Type":"image/png",
              "Cache-Control":"public,max-age=31536000,immutable",
              "X-Content-Type-Options":"nosniff"
            }
          });

        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return new Response("Imagem nao encontrada",{status:404});
          }
          return new Response("Falha ao processar imagem",{status:500});
        }
      }
    }
  }
});
