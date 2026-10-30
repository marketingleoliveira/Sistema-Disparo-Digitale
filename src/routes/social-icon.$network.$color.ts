import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/social-icon/$network/$color")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { network, color } = params;

        if (!["instagram", "facebook", "site"].includes(network)
          || !/^[0-9a-f]{6}\.png$/i.test(color)) {
          return new Response("Nao encontrado", { status: 404 });
        }

        const { deflateSync } = await import("node:zlib");
        const hex = color.slice(0, 6);
        const rgb = [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16)
        ];

        const N = 96;
        const raw = Buffer.alloc(N * (1 + N * 4));

        function rounded(x: number, y: number, h: number, r: number) {
          const a = Math.max(Math.abs(x) - h + r, 0);
          const b = Math.max(Math.abs(y) - h + r, 0);
          return Math.hypot(a, b) <= r;
        }

        function pixel(x: number, y: number) {
          if (network === "instagram") {
            const d = Math.hypot(x, y);
            return (rounded(x,y,.78,.25) && !rounded(x,y,.60,.15))
              || (d <= .35 && d >= .20)
              || ((x-.42)**2 + (y+.42)**2 < .014);
          }

          if (network === "facebook") {
            return (x >= -.06 && x <= .19 && y >= -.65 && y <= .74)
              || (x >= -.06 && x <= .48 && y >= -.65 && y <= -.39)
              || (x >= -.34 && x <= .34 && y >= -.12 && y <= .12);
          }

          const d = Math.hypot(x,y);
          return (d <= .75 && d >= .63)
            || (Math.abs(x) <= .055 && Math.abs(y) < .72)
            || (Math.abs(y) <= .055 && Math.abs(x) < .72)
            || (Math.abs(x) < .40 &&
                Math.abs(x*x/.18+y*y/.56-1) < .16);
        }

        for (let y = 0; y < N; y++) {
          const row = y * (1 + N * 4);
          for (let x = 0; x < N; x++) {
            let covered = 0;

            for (let sy = 0; sy < 3; sy++)
              for (let sx = 0; sx < 3; sx++) {
                const px = 2*(x+(sx+.5)/3)/N-1;
                const py = 2*(y+(sy+.5)/3)/N-1;
                if (pixel(px,py)) covered++;
              }

            const i = row + 1 + x*4;
            raw[i] = rgb[0];
            raw[i+1] = rgb[1];
            raw[i+2] = rgb[2];
            raw[i+3] = Math.round(255*covered/9);
          }
        }

        function crc(data: Buffer) {
          let c = 0xffffffff;
          for (const b of data) {
            c ^= b;
            for (let k = 0; k < 8; k++)
              c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
          }
          return (c ^ 0xffffffff) >>> 0;
        }

        function chunk(type: string, data: Buffer) {
          const name = Buffer.from(type);
          const length = Buffer.alloc(4);
          length.writeUInt32BE(data.length);
          const checksum = Buffer.alloc(4);
          checksum.writeUInt32BE(crc(Buffer.concat([name,data])));
          return Buffer.concat([length,name,data,checksum]);
        }

        const header = Buffer.alloc(13);
        header.writeUInt32BE(N,0);
        header.writeUInt32BE(N,4);
        header[8] = 8;
        header[9] = 6;

        const png = Buffer.concat([
          Buffer.from([137,80,78,71,13,10,26,10]),
          chunk("IHDR",header),
          chunk("IDAT",deflateSync(raw)),
          chunk("IEND",Buffer.alloc(0))
        ]);

        return new Response(png, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff"
          }
        });
      }
    }
  }
});
