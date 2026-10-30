
import * as React from "react";

export type ImageHotspot = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  url: string;
  title: string;
};

type Props = {
  imageUrl: string;
  areas: ImageHotspot[];
  onChange: (areas: ImageHotspot[], ratio: number) => void;
};

const clamp = (n:number,min:number,max:number) =>
  Math.max(min,Math.min(max,n));

export function ImageHotspotEditor({
  imageUrl,areas,onChange
}:Props) {
  const [open,setOpen] = React.useState(false);
  const [selected,setSelected] = React.useState<string|null>(null);
  const [drawing,setDrawing] = React.useState(false);
  const [ratio,setRatio] = React.useState(1);
  const stage = React.useRef<HTMLDivElement>(null);
  const gesture = React.useRef<{
    id:number;
    mode:"draw"|"move"|"resize";
    startX:number;
    startY:number;
    original:ImageHotspot;
  }|null>(null);

  const active = areas.find(a=>a.id===selected);

  function save(next:ImageHotspot[]) {
    onChange(next,ratio);
  }

  function position(e:React.PointerEvent) {
    const rect=stage.current!.getBoundingClientRect();
    return {
      x:clamp((e.clientX-rect.left)/rect.width,0,1),
      y:clamp((e.clientY-rect.top)/rect.height,0,1)
    };
  }

  function start(e:React.PointerEvent,
    mode:"draw"|"move"|"resize",
    area?:ImageHotspot) {
    e.preventDefault();
    e.stopPropagation();

    const p=position(e);
    const item=area || {
      id:"area-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),
      x:p.x,y:p.y,w:.001,h:.001,
      url:"",title:""
    };

    if(mode==="draw") {
      save([...areas,item]);
    }

    setSelected(item.id);
    gesture.current={
      id:e.pointerId,
      mode,
      startX:p.x,
      startY:p.y,
      original:{...item}
    };

    stage.current?.setPointerCapture(e.pointerId);
  }

  function move(e:React.PointerEvent) {
    const g=gesture.current;
    if(!g || g.id!==e.pointerId)return;

    const p=position(e);
    const dx=p.x-g.startX;
    const dy=p.y-g.startY;
    const o=g.original;

    let next:ImageHotspot;

    if(g.mode==="draw") {
      next={
        ...o,
        x:Math.min(p.x,g.startX),
        y:Math.min(p.y,g.startY),
        w:Math.max(.001,Math.abs(dx)),
        h:Math.max(.001,Math.abs(dy))
      };
    } else if(g.mode==="move") {
      next={
        ...o,
        x:clamp(o.x+dx,0,1-o.w),
        y:clamp(o.y+dy,0,1-o.h)
      };
    } else {
      next={
        ...o,
        w:clamp(o.w+dx,.02,1-o.x),
        h:clamp(o.h+dy,.02,1-o.y)
      };
    }

    save(areas.map(a=>a.id===o.id?next:a));
  }

  function finish() {
    const g=gesture.current;
    gesture.current=null;

    if(!g)return;

    const item=areas.find(a=>a.id===g.original.id);
    if(!item)return;

    if(item.w<.01 || item.h<.01) {
      save(areas.filter(a=>a.id!==item.id));
      setSelected(null);
    }
  }

  function update(field:"url"|"title",value:string) {
    if(!active)return;
    save(areas.map(a=>a.id===active.id?{...a,[field]:value}:a));
  }

  return (
    <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-xs">Áreas clicáveis</strong>
        <span className="text-xs text-slate-500">
          {areas.length} área(s)
        </span>
      </div>

      <button
        type="button"
        className="w-full rounded bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
        onClick={()=>setOpen(true)}>
        Selecionar áreas na imagem
      </button>

      <p className="text-[11px] text-slate-500">
        Desenhe retângulos sobre a imagem e atribua links diferentes.
      </p>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3"
          onClick={()=>setOpen(false)}>
          <div
            className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white p-4 text-slate-900"
            onClick={e=>e.stopPropagation()}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Editar áreas clicáveis</h2>
                <p className="text-xs text-slate-500">
                  Ative Nova área e arraste sobre a imagem.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button"
                  className={`rounded border px-3 py-2 text-sm ${drawing?"bg-blue-600 text-white":""}`}
                  onClick={()=>{setDrawing(true);setSelected(null);}}>
                  + Nova área
                </button>
                <button type="button"
                  className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
                  onClick={()=>setOpen(false)}>
                  Concluir
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-4 overflow-auto md:grid-cols-[minmax(0,1fr)_250px]">
              <div className="min-h-0 min-w-0 overflow-auto rounded bg-slate-200 p-3">
                <div
                  ref={stage}
                  className="relative mx-auto w-fit max-w-full select-none touch-none"
                  onPointerDown={e=>{
                    if(drawing && e.target===stage.current) {
                      start(e,"draw");
                    }
                  }}
                  onPointerMove={move}
                  onPointerUp={finish}
                  onPointerCancel={finish}>
                  <img
                    src={imageUrl}
                    alt="Imagem da campanha"
                    draggable={false}
                    className="block h-auto max-w-full pointer-events-none"
                    onLoad={e=>{
                      const img=e.currentTarget;
                      setRatio(
                        img.naturalWidth/Math.max(1,img.naturalHeight)
                      );
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0">
                    {areas.map(a=>(
                      <div
                        key={a.id}
                        className={`pointer-events-auto absolute box-border touch-none border-2 ${
                          selected===a.id
                            ?"border-yellow-400 bg-yellow-300/25"
                            :"border-blue-500 bg-blue-500/15"
                        }`}
                        style={{
                          left:(a.x*100)+"%",
                          top:(a.y*100)+"%",
                          width:(a.w*100)+"%",
                          height:(a.h*100)+"%"
                        }}
                        onPointerDown={e=>{
                          if(!drawing)start(e,"move",a);
                        }}
                      >
                        <span className="absolute left-0 top-0 bg-blue-600 px-1 text-[10px] text-white">
                          {areas.indexOf(a)+1}
                        </span>
                        {selected===a.id && !drawing && (
                          <span
                            className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-yellow-400"
                            onPointerDown={e=>start(e,"resize",a)}
                          />
                        )}
                      </div>
                    ))}
                    {drawing && (
                      <div
                        className="pointer-events-auto absolute inset-0 cursor-crosshair"
                        onPointerDown={e=>{
                          setDrawing(false);
                          start(e,"draw");
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <strong className="text-sm">Links da imagem</strong>
                {areas.map((a,i)=>(
                  <button type="button" key={a.id}
                    className={`block w-full rounded border p-2 text-left text-xs ${
                      selected===a.id?"border-blue-500 bg-blue-50":""
                    }`}
                    onClick={()=>{setDrawing(false);setSelected(a.id);}}>
                    Área {i+1}: {a.title||a.url||"Sem link"}
                  </button>
                ))}

                {active && (
                  <>
                    <label className="block text-xs font-semibold">
                      URL de destino
                      <input
                        className="mt-1 w-full rounded border p-2 font-normal"
                        value={active.url}
                        placeholder="https://..."
                        onChange={e=>update("url",e.target.value)}
                      />
                    </label>

                    <label className="block text-xs font-semibold">
                      Nome da área
                      <input
                        className="mt-1 w-full rounded border p-2 font-normal"
                        value={active.title}
                        placeholder="Ex.: Solicitar amostra"
                        onChange={e=>update("title",e.target.value)}
                      />
                    </label>

                    <button type="button"
                      className="rounded border border-red-300 px-3 py-2 text-xs text-red-700"
                      onClick={()=>{
                        save(areas.filter(a=>a.id!==selected));
                        setSelected(null);
                      }}>
                      Excluir área
                    </button>
                  </>
                )}

                <p className="text-xs leading-relaxed text-slate-500">
                  Clique em uma área para selecionar. Arraste para mover
                  e utilize a alça amarela para redimensionar.
                  Depois clique em Concluir e salve o template.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
