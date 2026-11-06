import { ButtonMediaPicker } from "./ButtonMediaPicker";
import { ImageHotspotEditor } from "./ImageHotspotEditor";
import { useState as useWidthDraftState, useEffect as useWidthDraftEffect } from "react";
import * as React from "react";
import {
  EditorFontLibrary,
  EditorFontStyles,
  editorFontFamily,
} from "./EditorFontLibrary";
import { EditorMediaLibrary } from "./EditorMediaLibrary"; // DIGITALE_MEDIA_LIBRARY_V1
import { 
  Monitor, 
  Smartphone, 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Settings2, 
  Trash2, 
  Copy, 
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  Layers3,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  LIBRARY_BLOCKS, 
  INITIAL_BLOCKS, 
  type EditorBlock, 
  type BlockType 
} from "./editor-types";
import { motion, AnimatePresence } from "framer-motion";
import { RichTextInline } from "./RichTextInline";
import { SocialBlockControls, SocialBlockPreview } from "./SocialBlock";
import { richRunsToHtml } from "@/lib/templates/rich-runs";

export interface VisualEmailEditorProps {
  /** Blocos iniciais; quando ausente, usa o layout padrão da marca. */
  initialBlocks?: EditorBlock[] | undefined;
  /** Chamado ao clicar em "Salvar Template". */
  onSave?: (blocks: EditorBlock[]) => void;
  /** Rótulo do botão de salvar. */
  saveLabel?: string;
}

export function VisualEmailEditor({
  initialBlocks,
  onSave,
  saveLabel = "Salvar Template",
}: VisualEmailEditorProps = {}) {
  const [blocks, setBlocks] = React.useState<EditorBlock[]>(initialBlocks ?? INITIAL_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(null);

  // DIGITALE_INLINE_TEXT_EDIT_V1
  const [editingBlockId, setEditingBlockId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const inlineSnapshot = React.useRef<EditorBlock[] | null>(null);

  const finishInlineEdit = () => {
    const before = inlineSnapshot.current;
    inlineSnapshot.current = null;

    if (before) {
      setPast(prev => [...prev.slice(-49), before]);
      setFuture([]);
    }

    setEditingBlockId(null);
  };
  const [viewMode, setViewMode] = React.useState<"desktop" | "mobile">("desktop");
  const [zoom, setZoom] = React.useState(100);
  const [fontRevision, setFontRevision] = React.useState(0);
  const [showLayers, setShowLayers] = React.useState(false);
  const [past, setPast] = React.useState<EditorBlock[][]>([]);
  const [future, setFuture] = React.useState<EditorBlock[][]>([]);
  const dragId = React.useRef<string | null>(null);

  const commitBlocks = (next: EditorBlock[]) => {
    setPast(prev => [...prev.slice(-49), blocks]);
    setFuture([]);
    setBlocks(next);
  };

  const undo = () => {
    if (!past.length) return;
    setFuture(prev => [blocks, ...prev]);
    setBlocks(past[past.length - 1]!);
    setPast(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (!future.length) return;
    setPast(prev => [...prev, blocks]);
    setBlocks(future[0]!);
    setFuture(prev => prev.slice(1));
  };

  const moveBlock = (id: string, targetId: string) => {
    if (id === targetId) return;
    const from = blocks.findIndex(b => b.id === id);
    const to = blocks.findIndex(b => b.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...blocks];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    commitBlocks(next);
    setSelectedBlockId(id);
  };

  const stepBlock = (id: string, step: number) => {
    const index = blocks.findIndex(b => b.id === id);
    const other = index + step;
    if (index < 0 || other < 0 || other >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[other]] = [next[other]!, next[index]!];
    commitBlocks(next);
  };

  const resetHistory = () => {
    setPast([]);
    setFuture([]);
  };

  // Recarrega os blocos quando outro template é aberto no editor ou PDF é convertido.
  React.useEffect(() => {
    if (initialBlocks) {
      setBlocks(initialBlocks);
      setSelectedBlockId(null);
      resetHistory();
    }
  }, [initialBlocks]);

  const selectedBlock = React.useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) || null,
    [blocks, selectedBlockId]
  );

  const handleAddBlock = (type: BlockType) => {
    const newBlock: EditorBlock = {
      id: `block-${Date.now()}`,
      type,
      content: { ...(type === "social" ? { socialLinks: {} } : {}), text: "Novo bloco de " + type, url: type === 'image' || type === 'logo' ? 'https://placehold.co/400x200' : undefined },
      styles: { 
        paddingTop: "10px", 
        paddingBottom: "10px",
        textAlign: type === "button" ? "center" : "left",
        fontSize: "16px",
        color: "#1e293b",
        fontWeight: "normal"
      }
    };
    commitBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    commitBlocks(blocks.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleDuplicateBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    const blockToDuplicate = blocks[index];
    if (!blockToDuplicate) return;
    
    const newBlock: EditorBlock = { 
      id: `block-${Date.now()}`,
      type: blockToDuplicate.type,
      content: JSON.parse(JSON.stringify(blockToDuplicate.content)),
      styles: JSON.parse(JSON.stringify(blockToDuplicate.styles))
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    commitBlocks(newBlocks);
  };



  const updateBlockStyle = (styleName: string, value: any) => {
    if (!selectedBlockId) return;
    commitBlocks(
      blocks.map((b) =>
        b.id === selectedBlockId
          ? {
              ...b,
              styles: {
                ...b.styles,
                [styleName]: value,
                ...(styleName === 'fontFamily'
                  ? { fontFileId: undefined }
                  : {})
              }
            }
          : b
      )
    );
  };

  const updateBlockContent = (contentName: string, value: any) => {
    if (!selectedBlockId) return;
    commitBlocks(
      blocks.map((b) =>
        b.id === selectedBlockId
          ? { ...b, content: { ...b.content, [contentName]: value } }
          : b
      )
    );
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-xl border bg-card shadow-sm">
      <EditorFontStyles refreshKey={fontRevision} />
      {/* Coluna Esquerda: Biblioteca */}
      <div className="flex w-64 flex-col border-r bg-muted/10">
        <div className="border-b p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo</h3>
        </div>
        <ScrollArea className="flex-1">
          {showLayers ? (
            <div className="space-y-2 p-3">
              <p className="text-xs font-semibold">Camadas da campanha</p>
              {blocks.map((block, index) => (
                <button key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border p-2 text-left text-xs",
                    selectedBlockId === block.id
                      ? "border-accent bg-accent/10" : "bg-card"
                  )}>
                  <span className="text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate">
                    {block.content?.text || block.type}
                  </span>
                  <span className="text-muted-foreground">
                    {block.type}
                  </span>
                </button>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-2 p-4">
            {LIBRARY_BLOCKS.map((block) => (
              <button
                key={block.id}
                onClick={() => handleAddBlock(block.type)}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-card p-3 transition-all hover:border-accent hover:text-accent hover:shadow-sm group"
              >
                <block.icon size={18} className="text-muted-foreground group-hover:text-accent" />
                <span className="text-[10px] font-medium">{block.label}</span>
              </button>
            ))}
          </div>
          )}
        </ScrollArea>
      </div>

      {/* Coluna Central: Canvas */}
      <div className="relative flex flex-1 flex-col bg-muted/30">
        {/* Toolbar do Canvas */}
        <div className="flex items-center justify-between border-b bg-card px-4 py-2">
          <div className="flex items-center gap-2">
            <Button title="Desfazer" variant="ghost" size="icon"
              className="h-8 w-8" disabled={!past.length}
              onClick={undo}><Undo size={16} /></Button>
            <Button title="Refazer" variant="ghost" size="icon"
              className="h-8 w-8" disabled={!future.length}
              onClick={redo}><Redo size={16} /></Button>
            <Button title="Mostrar camadas" variant="ghost" size="icon"
              className="h-8 w-8" onClick={() => setShowLayers(v => !v)}>
              <Layers3 size={16} />
            </Button>
          </div>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
            <TabsList className="h-8 bg-muted/50 p-0.5">
              <TabsTrigger value="desktop" className="h-7 px-3 data-[state=active]:shadow-sm">
                <Monitor size={14} className="mr-1.5" /> Desktop
              </TabsTrigger>
              <TabsTrigger value="mobile" className="h-7 px-3 data-[state=active]:shadow-sm">
                <Smartphone size={14} className="mr-1.5" /> Mobile
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button title="Diminuir zoom" variant="ghost" size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(v => Math.max(50, v - 10))}>
              <ZoomOut size={16} />
            </Button>
            <span className="min-w-[42px] text-center text-xs">
              {zoom}%
            </span>
            <Button title="Aumentar zoom" variant="ghost" size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(v => Math.min(150, v + 10))}>
              <ZoomIn size={16} />
            </Button>
            <Button title="Restaurar zoom" variant="ghost" size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(100)}>
              <RotateCcw size={15} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold"
              onClick={() => setViewMode(viewMode === "desktop" ? "mobile" : "desktop")}
            >
              <Eye size={14} className="mr-1.5" /> Preview
            </Button>
            <Button
              className="h-8 bg-accent text-accent-foreground text-xs font-bold hover:bg-accent/90"
              onClick={() => onSave?.(blocks)}
              disabled={!onSave}
            >
              <Save size={14} className="mr-1.5" /> {saveLabel}
            </Button>
          </div>
        </div>

        {/* Área de Visualização */}
        <ScrollArea className="flex-1 p-8">
          <div className="mx-auto flex justify-center transition-all duration-300">
            <div
              style={{ zoom: `${zoom}%` } as React.CSSProperties}
              className={cn(
                "bg-white shadow-xl transition-all duration-500 min-h-[600px] overflow-hidden rounded-sm",
                viewMode === "desktop" ? "w-[600px]" : "w-[360px]"
              )}
            >
              <div className="p-4 space-y-0 min-h-full flex flex-col">
                <AnimatePresence initial={false}>
                  {blocks.map((block) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={block.id}
                      draggable
                      onDragStart={(e) => {
                        dragId.current = block.id;
                        if ("dataTransfer" in e) {
                          const transfer = e.dataTransfer as DataTransfer;
                          transfer.effectAllowed = "move";
                          transfer.setData("text/plain", block.id);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const source = dragId.current;
                        if (source) moveBlock(source, block.id);
                        dragId.current = null;
                      }}
                      onDragEnd={() => { dragId.current = null; }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlockId(block.id);
                      }}
                      onDoubleClick={(event) => {
                        if (!["text", "title", "button"].includes(block.type)) {
                          return;
                        }
                        event.stopPropagation();
                        inlineSnapshot.current = blocks;
                        setSelectedBlockId(block.id);
                        setEditingText(String(block.content?.text ?? ""));
                        setEditingBlockId(block.id);
                      }}
                      className={cn(
                        "relative group cursor-pointer border-2 border-transparent transition-all hover:border-accent/30",
                        selectedBlockId === block.id && "border-accent ring-2 ring-accent/10"
                      )}
                    >
                      
                      
                      {/* DIGITALE_RICH_TEXT_V2 */}
                      {editingBlockId === block.id &&
                        ["text", "title"].includes(block.type) && (
                          <RichTextInline
                            key={block.id}
                            text={String(block.content?.text ?? "")}
                            runs={block.content?.richRuns}
                            styles={block.styles}
                            onChange={(runs, text) => {
                              setBlocks(previous =>
                                previous.map(item =>
                                  item.id === block.id
                                    ? {
                                        ...item,
                                        content: {
                                          ...item.content,
                                          text,
                                          richRuns: runs
                                        }
                                      }
                                    : item
                                )
                              );
                            }}
                            onFinish={finishInlineEdit}
                            onCancel={() => {
                              const previous = inlineSnapshot.current;
                              inlineSnapshot.current = null;
                              if (previous) setBlocks(previous);
                              setEditingBlockId(null);
                            }}
                          />
                        )}

                      {/* DIGITALE_HOTSPOT_INDICATOR_V2 */}
                      {['image', 'logo'].includes(block.type) &&
                        Array.isArray((block.content as any)?.hotspotData?.areas) &&
                        (block.content as any).hotspotData.areas.length > 0 && (
                          <div className="pointer-events-none absolute bottom-2 left-2 z-40 max-w-[85%] rounded-lg border border-blue-300 bg-blue-950/95 px-3 py-2 text-white shadow-xl">
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span>🔗</span>
                              <span>
                                {(block.content as any).hotspotData.areas.length}
                                {' '}área(s) clicável(is)
                              </span>
                            </div>
                            <div className="mt-1 max-w-[220px] space-y-1">
                              {(block.content as any).hotspotData.areas
                                .slice(0, 3).map((area: any, index: number) => (
                                  <div key={area.id || index}
                                    className="truncate text-[10px] text-blue-100">
                                    {index + 1}. {area.title || area.url || 'Sem link'}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

{/* Contextual Toolbar */}
                      {selectedBlockId === block.id && (
                        <div className="absolute right-2 top-2 z-50 flex flex-col gap-1 rounded-md bg-accent p-1 text-accent-foreground shadow-lg animate-in fade-in slide-in-from-left-2 duration-200">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 hover:bg-white/20"
                            onClick={(e) => handleDuplicateBlock(block.id, e)}
                          >
                            <Copy size={12} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 hover:bg-red-500"
                            onClick={(e) => handleDeleteBlock(block.id, e)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      )}

                      <div style={{
                        ...block.styles,
                        ...(['image', 'logo'].includes(block.type)
                          ? { width: '100%' }
                          : {})
                      } as any}>
                        {block.type === 'logo' && (
                          <div style={{ textAlign: block.styles['textAlign'] || 'center' }}>
                            {block.content.href &&
                              /^https?:\/\//i.test(block.content.href)
                              ? (
                                <a
                                  href={block.content.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.preventDefault()}
                                  style={{ display: 'inline-block', maxWidth: '100%' }}
                                >
                                  <img
                              src={block.content.url}
                              alt={block.content.alt || "Logo"}
                              style={{
                                width: block.styles['width'] || '180px',
                                maxWidth: '100%',
                                height: block.styles['height'] || 'auto',
                                objectFit: block.styles['height'] ? (block.styles['objectFit'] || 'cover') : 'contain',
                                display: 'inline-block'
                              }}
                            />
                                </a>
                              )
                              : (
                                <img
                              src={block.content.url}
                              alt={block.content.alt || "Logo"}
                              style={{
                                width: block.styles['width'] || '180px',
                                maxWidth: '100%',
                                height: block.styles['height'] || 'auto',
                                objectFit: block.styles['height'] ? (block.styles['objectFit'] || 'cover') : 'contain',
                                display: 'inline-block'
                              }}
                            />
                              )}
                          </div>
                        )}
                        {block.type === 'title' && editingBlockId !== block.id && (
                          <h2 style={{
                            backgroundColor:
                              block.styles['backgroundColor'] || 'transparent',
                            borderRadius:
                              block.styles['borderRadius'] || '0px',
                            paddingLeft:
                              block.styles['paddingLeft'] || '0px',
                            paddingRight:
                              block.styles['paddingRight'] || '0px',
                            // DIGITALE_SHADOW_VISIBLE_V2
                            boxShadow:
                              block.styles['boxShadow'] &&
                              block.styles['boxShadow'] !== 'none'
                                ? '0 3px 12px rgba(0,0,0,0.16)'
                                : 'none',
                            border:
                              block.styles['boxShadow'] &&
                              block.styles['boxShadow'] !== 'none'
                                ? '1px solid #e1e5eb'
                                : '1px solid transparent',
                            whiteSpace: 'pre-wrap',

                            fontSize: block.styles['fontSize'],
                            fontFamily: block.styles['fontFamily'],
                            fontWeight: block.styles['fontWeight'],
                            color: block.styles['color'],
                            textAlign: block.styles['textAlign']
                          } as any}>
                            {Array.isArray(block.content.richRuns) &&
                              block.content.richRuns.length > 0
                                ? <span
                                    style={{whiteSpace:"pre-wrap"}}
                                    dangerouslySetInnerHTML={{
                                      __html: richRunsToHtml(
                                        block.content.richRuns,
                                        String(block.content.text ?? "")
                                      )
                                    }}
                                  />
                                : <span style={{whiteSpace:"pre-wrap"}}>
                                    {block.content.text}
                                  </span>}
                          </h2>
                        )}
                        {block.type === 'text' && editingBlockId !== block.id && (
                          <p style={{
                            backgroundColor:
                              block.styles['backgroundColor'] || 'transparent',
                            borderRadius:
                              block.styles['borderRadius'] || '0px',
                            paddingLeft:
                              block.styles['paddingLeft'] || '0px',
                            paddingRight:
                              block.styles['paddingRight'] || '0px',
                            // DIGITALE_SHADOW_VISIBLE_V2
                            boxShadow:
                              block.styles['boxShadow'] &&
                              block.styles['boxShadow'] !== 'none'
                                ? '0 3px 12px rgba(0,0,0,0.16)'
                                : 'none',
                            border:
                              block.styles['boxShadow'] &&
                              block.styles['boxShadow'] !== 'none'
                                ? '1px solid #e1e5eb'
                                : '1px solid transparent',
                            whiteSpace: 'pre-wrap',

                            fontSize: block.styles['fontSize'],
                            fontFamily: block.styles['fontFamily'],
                            lineHeight: block.styles['lineHeight'],
                            color: block.styles['color'],
                            textAlign: block.styles['textAlign']
                          } as any}>
                            {Array.isArray(block.content.richRuns) &&
                              block.content.richRuns.length > 0
                                ? <span
                                    style={{whiteSpace:"pre-wrap"}}
                                    dangerouslySetInnerHTML={{
                                      __html: richRunsToHtml(
                                        block.content.richRuns,
                                        String(block.content.text ?? "")
                                      )
                                    }}
                                  />
                                : <span style={{whiteSpace:"pre-wrap"}}>
                                    {block.content.text}
                                  </span>}
                          </p>
                        )}
                        {block.type === 'image' && (
                          <div style={{ textAlign: block.styles['textAlign'] || 'center' }}>
                            {block.content.href &&
                              /^https?:\/\//i.test(block.content.href)
                              ? (
                                <a
                                  href={block.content.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.preventDefault()}
                                  style={{ display: 'inline-block', maxWidth: '100%' }}
                                >
                                  <img
                              src={block.content.url}
                              alt={block.content.alt || "Imagem"}
                              style={{
                                width: block.styles['width'] || '100%',
                                maxWidth: '100%',
                                height: block.styles['height'] || 'auto',
                                objectFit: block.styles['height'] ? (block.styles['objectFit'] || 'cover') : 'contain',
                                display: 'inline-block',
                                borderRadius: block.styles['borderRadius']
                              }}
                            />
                                </a>
                              )
                              : (
                                <img
                              src={block.content.url}
                              alt={block.content.alt || "Imagem"}
                              style={{
                                width: block.styles['width'] || '100%',
                                maxWidth: '100%',
                                height: block.styles['height'] || 'auto',
                                objectFit: block.styles['height'] ? (block.styles['objectFit'] || 'cover') : 'contain',
                                display: 'inline-block',
                                borderRadius: block.styles['borderRadius']
                              }}
                            />
                              )}
                          </div>
                        )}
                        {block.type === 'button' && (
                          <div style={{ textAlign: block.styles['textAlign'] as any }}>
                            <a 
                              href="#" 
                              style={{
                                backgroundColor: block.styles['backgroundColor'],
                                color: block.styles['color'],
                                paddingTop: block.styles['paddingTop'],
                                paddingRight: block.styles['paddingRight'] || '20px',
                                paddingBottom: block.styles['paddingBottom'],
                                paddingLeft: block.styles['paddingLeft'] || '20px',
                                borderRadius: block.styles['borderRadius'],
                                display: block.styles['display'] || 'inline-block',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                                fontFamily: block.styles['fontFamily'],
                                fontSize: '14px'
                              } as any}
                            >
                              {block.content.text}
                            </a>
                          </div>
                        )}
                        {/* DIGITALE_ADVANCED_BLOCKS_V1 */}
                        {block.type === 'spacer' && (
                          <div style={{ height: 24 }} />
                        )}
                        {block.type === 'footer' && (
                          <p style={{
                            color: block.styles['color'] || '#64748b',
                            fontSize: block.styles['fontSize'] || '12px',
                            fontFamily: block.styles['fontFamily'],
                            textAlign: block.styles['textAlign'] || 'center',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {block.content.text}
                          </p>
                        )}
                        {(['column', 'columns-2', 'columns-3'] as string[]).includes(block.type) && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${block.type === 'columns-3' ? 3 : block.type === 'columns-2' ? 2 : 1}, minmax(0,1fr))`,
                            gap: 12,
                            color: block.styles['color'] || '#1e293b',
                            fontSize: block.styles['fontSize'] || '16px',
                            fontFamily: block.styles['fontFamily']
                          }}>
                            {Array.from({
                              length: block.type === 'columns-3' ? 3 : block.type === 'columns-2' ? 2 : 1
                            }, (_, i) => (
                              <div key={i} style={{
                                padding: 12,
                                border: '1px solid #e2e8f0',
                                overflowWrap: 'anywhere', whiteSpace: 'pre-wrap'
                              }}>
                                {(Array.isArray(block.content.columns)
                                  ? block.content.columns[i]
                                  : String(block.content.text || '').split('|')[i]
                                ) || `Coluna ${i + 1}`}
                              </div>
                            ))}
                          </div>
                        )}
                        {block.type === 'image-text' && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            color: block.styles['color'] || '#1e293b'
                          }}>
                            <img
                              src={block.content.url}
                              alt={block.content.alt || ''}
                              style={{ width: '45%', height: 'auto', objectFit: 'contain' }}
                            />
                            <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                              {block.content.text}
                            </div>
                          </div>
                        )}
                        {block.type === 'social' && (
                          <SocialBlockPreview
                            content={block.content}
                            styles={block.styles}
                          />
                        )}
                        {block.type === 'html' && (
                          <pre style={{
                            padding: 12,
                            background: '#f1f5f9',
                            color: '#334155',
                            fontSize: 12,
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere'
                          }}>
                            {String(block.content.html || block.content.text || '')}
                          </pre>
                        )}
                        {block.type === 'divider' && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {blocks.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                      <Plus size={32} />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">Clique em um bloco ao lado para começar</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Coluna Direita: Propriedades */}
      <div className="flex w-72 flex-col border-l bg-muted/10">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Propriedades</h3>
          {selectedBlock && <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">{selectedBlock.type}</span>}
        </div>
        
        <ScrollArea className="flex-1">
          {selectedBlock ? (
            <div className="space-y-6 p-4">
              {/* Content Settings */}
              <div className="space-y-4">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Conteúdo</Label>
                
                
                {/* DIGITALE_COLUMNS_EDITOR_V2 */}
                {['column', 'columns-2', 'columns-3'].includes(selectedBlock.type) && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-xs font-semibold">
                      Conteúdo das colunas
                    </p>
                    {Array.from({
                      length: selectedBlock.type === 'columns-3' ? 3 :
                        selectedBlock.type === 'columns-2' ? 2 : 1
                    }, (_, index) => {
                      const values = Array.isArray(selectedBlock.content.columns)
                        ? [...selectedBlock.content.columns]
                        : String(selectedBlock.content.text || '').split('|');

                      return (
                        <div key={index} className="space-y-1">
                          <Label className="text-xs">
                            Coluna {index + 1}
                          </Label>
                          <textarea
                            aria-label={`Editar coluna ${index + 1}`}
                            rows={5}
                            value={String(values[index] ?? '')}
                            onChange={(event) => {
                              values[index] = event.target.value;
                              commitBlocks(blocks.map((item) =>
                                item.id === selectedBlock.id
                                  ? {
                                      ...item,
                                      content: {
                                        ...item.content,
                                        columns: values
                                      }
                                    }
                                  : item
                              ));
                            }}
                            className="w-full resize-y rounded-md border bg-white p-2 text-sm"
                            placeholder={`Digite o conteúdo da coluna ${index + 1}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

{['text', 'title', 'button'].includes(selectedBlock.type) && (
                  <div className="space-y-2">
                    <Label className="text-xs">Texto</Label>
                    <Input 
                      value={selectedBlock.content.text || ""} 
                      onChange={(e) => updateBlockContent('text', e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                )}

                {selectedBlock.type === 'button' && (
                  <div className="space-y-2">
                    <Label className="text-xs">Link (URL)</Label>
                    <ButtonMediaPicker
                      onSelect={(url) =>
                        updateBlockContent("url", url)
                      }
                    />
                    <Input 
                      value={selectedBlock.content.url || ""} 
                      onChange={(e) => updateBlockContent('url', e.target.value)}
                      className="text-xs h-8"
                      placeholder="https://..."
                    />
                  </div>
                )}

                {['image', 'logo'].includes(selectedBlock.type) && (
                  <div className="space-y-2">
                    <Label className="text-xs">Texto alternativo</Label>
                    <Input
                      value={selectedBlock.content.alt || ""}
                      onChange={e => updateBlockContent("alt", e.target.value)}
                      placeholder="Descreva a imagem"
                      className="h-8 text-xs"
                    />
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-3 text-xs font-semibold text-slate-700">
                        Biblioteca de imagens
                      </p>
                      <EditorMediaLibrary
                        onSelect={(url) => updateBlockContent("url", url)}
                      />
                    </div>
                    <Label className="text-xs">URL da Imagem</Label>
                    <Input 
                      value={selectedBlock.content.url || ""} 
                      onChange={(e) => updateBlockContent('url', e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                )}
              </div>

              <Separator />

                {selectedBlock.type === 'social' && (
                  <SocialBlockControls
                    content={selectedBlock.content}
                    styles={selectedBlock.styles}
                    onContentChange={updateBlockContent}
                    onStyleChange={updateBlockStyle}
                  />
                )}

              {/* Style Settings */}
              <div className="space-y-4">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Estilo</Label>
                

                {/* DIGITALE_HOTSPOTS_IMAGE_NOTICE_V3 */}
                {selectedBlock &&
                  ["image", "logo"].includes(selectedBlock.type) &&
                  Array.isArray(
                    selectedBlock.content?.hotspotData?.areas
                  ) &&
                  selectedBlock.content.hotspotData.areas.length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950">
                      <strong>
                        Áreas clicáveis na imagem
                      </strong>
                      <p className="mt-1">
                        Os links ficam somente nas regiões
                        selecionadas. Nenhum link de texto será
                        adicionado abaixo da imagem.
                      </p>
                      {!/^(?:https:\/\/disparo\.digitaletextil\.com\.br)?\/editor-media\/[a-f0-9]{64}\.(?:png|jpg|webp)(?:[?#].*)?$/i.test(
                        String(selectedBlock.content.url || "")
                      ) && (
                        <p className="mt-2 font-semibold text-amber-800">
                          Para ativar os links posicionados no e-mail,
                          envie esta imagem PNG para a Biblioteca
                          de Imagens e selecione a versão enviada.
                        </p>
                      )}
                    </div>
                  )}

                {/* DIGITALE_HOTSPOTS_V1 */}
                {['image', 'logo'].includes(selectedBlock.type) && (
                  <ImageHotspotEditor
                    imageUrl={String(selectedBlock.content.url || "")}
                    areas={(
                      (selectedBlock.content as any).hotspotData?.areas || []
                    )}
                    onChange={(areas,ratio) =>
                      updateBlockContent("hotspotData",{areas,ratio})
                    }
                  />
                )}

                {/* DIGITALE_IMAGE_LINKS_V1 */}
                {['image', 'logo'].includes(selectedBlock.type) && (
                  <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
                    <Label className="text-xs font-semibold">
                      Link e espaçamento
                    </Label>

                    <div className="space-y-2">
                      <Label className="text-xs">Link de destino</Label>
                      <Input
                        value={selectedBlock.content.href || ""}
                        onChange={(e) =>
                          updateBlockContent('href', e.target.value)
                        }
                        placeholder="https://seusite.com.br"
                        className="h-8 text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Use um endereço completo começando com https://
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'paddingTop', label: 'Acima' },
                        { key: 'paddingBottom', label: 'Abaixo' }
                      ].map((item) => (
                        <div key={item.key} className="space-y-2">
                          <Label className="text-xs">
                            {item.label} (px)
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            max={120}
                            value={
                              parseInt(
                                selectedBlock.styles[item.key] || '0',
                                10
                              )
                            }
                            onChange={(e) => {
                              const n = Number(e.target.value);
                              if (
                                Number.isFinite(n) &&
                                n >= 0 &&
                                n <= 120
                              ) {
                                updateBlockStyle(item.key, `${n}px`);
                              }
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DIGITALE_IMAGE_CONTROLS_V1 */}
                {['image', 'logo'].includes(selectedBlock.type) && (
                  <div className="space-y-3 rounded-lg border bg-slate-50 p-3">
                    <Label className="text-xs font-semibold">
                      Dimensões e posição
                    </Label>

                    <div className="space-y-2">
                      <Label className="text-xs">Largura (pixels)</Label>
                      <WidthPixelInput
                        key={selectedBlock.id}
                        value={
                          String(selectedBlock.styles['width'] || '').endsWith('px')
                            ? parseInt(selectedBlock.styles['width'], 10)
                            : selectedBlock.type === 'logo' ? 180 : 600
                        }
                        onCommit={(n) => updateBlockStyle('width', `${n}px`)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Defina a largura desejada.
                      </p>

                      {/* DIGITALE_IMAGE_HEIGHT_CONTROL_V1 */}
                      <div className="space-y-2 pt-2">
                        <Label className="text-xs">
                          Altura da imagem (pixels)
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={3000}
                          step={1}
                          placeholder="Automática"
                          className="h-9 text-xs"
                          value={
                            String(selectedBlock.styles['height'] || '')
                              .replace(/px$/, '')
                          }
                          onChange={(event) => {
                            const raw = event.target.value;

                            if (raw === "") {
                              updateBlockStyle('height', '');
                              return;
                            }

                            const height = Number(raw);

                            if (
                              Number.isInteger(height) &&
                              height >= 1 &&
                              height <= 3000
                            ) {
                              updateBlockStyle(
                                'height',
                                `${height}px`
                              );
                            }
                          }}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Deixe vazio para manter a altura original.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">
                          Enquadramento da imagem
                        </Label>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
                          value={
                            selectedBlock.styles['objectFit'] || 'cover'
                          }
                          onChange={(event) =>
                            updateBlockStyle(
                              'objectFit',
                              event.target.value
                            )
                          }
                        >
                          <option value="cover">
                            Preencher e recortar
                          </option>
                          <option value="contain">
                            Ajustar sem recortar
                          </option>
                          <option value="fill">
                            Esticar para preencher
                          </option>
                        </select>
                      </div>

                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Alinhamento da imagem</Label>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { value: 'left', label: 'Esquerda' },
                          { value: 'center', label: 'Centro' },
                          { value: 'right', label: 'Direita' }
                        ].map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={
                              (selectedBlock.styles['textAlign'] || 'center') === option.value
                                ? 'default'
                                : 'outline'
                            }
                            className="h-8 px-1 text-[10px]"
                            onClick={() => updateBlockStyle('textAlign', option.value)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}


                {/* DIGITALE_FONT_SELECTOR_V1 */}
                {['title', 'text', 'button', 'footer',
                  'column', 'columns-2', 'columns-3',
                  'image-text', 'social'].includes(selectedBlock.type) && (
                  <div className="space-y-2">
                    <Label className="text-xs">
                      Família da fonte
                    </Label>
                    <select
                      aria-label="Família da fonte"
                      value={selectedBlock.styles['fontFamily'] || 'Arial, Helvetica, sans-serif'}
                      onChange={(event) =>
                        updateBlockStyle('fontFamily', event.target.value)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    >
                      {[
                        ['Arial', 'Arial, Helvetica, sans-serif'],
                        ['Helvetica', 'Helvetica, Arial, sans-serif'],
                        ['Verdana', 'Verdana, Geneva, sans-serif'],
                        ['Georgia', 'Georgia, serif'],
                        ['Times New Roman', '"Times New Roman", Times, serif'],
                        ['Tahoma', 'Tahoma, Geneva, sans-serif'],
                        ['Trebuchet MS', '"Trebuchet MS", Arial, sans-serif'],
                        ['Courier New', '"Courier New", Courier, monospace']
                      ].map(([label, value]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}

                      {/^\"DigitaleFont-[a-f0-9]{64}\", Arial, Helvetica, sans-serif$/.test(
                        String(selectedBlock.styles['fontFamily'] || '')
                      ) && (
                        <option value={selectedBlock.styles['fontFamily']}>
                          Fonte personalizada selecionada
                        </option>
                      )}
                    </select>
                    {/* DIGITALE_FONT_LIBRARY_INTEGRATION_V1 */}
                    {/* DIGITALE_FONT_FILE_ID_V1 */}
                    <EditorFontLibrary
                      onUploaded={() => setFontRevision((v) => v + 1)}
                      onSelect={(item) => {
                        if (!selectedBlockId) return;
                        commitBlocks(
                          blocks.map((block) =>
                            block.id === selectedBlockId
                              ? {
                                  ...block,
                                  styles: {
                                    ...block.styles,
                                    fontFamily: editorFontFamily(item.id),
                                    fontFileId: item.id,
                                  },
                                }
                              : block
                          )
                        );
                      }}
                    />
                    <p
                      className="rounded-md border bg-white px-3 py-3 text-sm"
                      style={{
                        fontFamily: selectedBlock.styles['fontFamily'] ||
                          'Arial, Helvetica, sans-serif'
                      }}
                    >
                      Exemplo de fonte Aa Bb 123
                    </p>
                  </div>
                )}

                {/* Font Size */}
                {['text', 'title'].includes(selectedBlock.type) && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs">Tamanho da Fonte</Label>
                      <span className="text-[10px] font-mono text-muted-foreground">{selectedBlock.styles['fontSize']}</span>
                    </div>
                    <Slider 
                      value={[parseInt(selectedBlock.styles['fontSize'] || "16")]} 
                      max={72} 
                      min={8} 
                      step={1} 
                      onValueChange={([v]) => updateBlockStyle('fontSize', `${v}px`)}
                    />
                  </div>
                )}

                {/* Text Align */}
                {['text', 'title', 'button', 'logo'].includes(selectedBlock.type) && (
                  <div className="space-y-2">
                    <Label className="text-xs">Alinhamento</Label>
                    <div className="flex items-center gap-1 rounded-md border p-1 bg-white">
                      {[
                        { id: 'left', icon: AlignLeft }, 
                        { id: 'center', icon: AlignCenter }, 
                        { id: 'right', icon: AlignRight }
                      ].map((align) => (
                        <button
                          key={align.id}
                          onClick={() => updateBlockStyle('textAlign', align.id)}
                          className={cn(
                            "flex flex-1 justify-center rounded py-1 transition-all",
                            selectedBlock.styles['textAlign'] === align.id ? "bg-accent text-accent-foreground shadow-sm" : "hover:bg-muted"
                          )}
                        >
                          <align.icon size={12} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}


                {/* DIGITALE_BUTTON_TEXT_COLOR_FIX_V2 */}
                {selectedBlock.type === 'button' && (
                  <div className="space-y-2">
                    <Label className="text-xs">
                      Cor do texto do botão
                    </Label>

                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={
                          /^#[0-9a-fA-F]{6}$/.test(
                            String(selectedBlock.styles['color'] ?? '')
                          )
                            ? String(selectedBlock.styles['color'])
                            : '#ffffff'
                        }
                        onChange={(event) =>
                          updateBlockStyle('color', event.target.value)
                        }
                        className="h-8 w-12 shrink-0 p-0.5"
                        aria-label="Selecionar cor do texto do botão"
                      />

                      <Input
                        value={String(
                          selectedBlock.styles['color'] ?? '#ffffff'
                        )}
                        onChange={(event) =>
                          updateBlockStyle('color', event.target.value)
                        }
                        className="h-8 min-w-0 flex-1 font-mono text-xs"
                        placeholder="#FFFFFF"
                        aria-label="Código HEX da cor do texto"
                      />
                    </div>
                  </div>
                )}


                {/* DIGITALE_TEXT_CARD_APPEARANCE_V1 */}
                {['text', 'title'].includes(selectedBlock.type) && (
                  <div className="space-y-3 rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-semibold">
                      Aparência do bloco
                    </p>

                    <div className="space-y-1">
                      <Label className="text-xs">
                        Cor de fundo
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={
                            /^#[0-9a-f]{6}$/i.test(
                              String(selectedBlock.styles['backgroundColor'] || '')
                            )
                              ? String(selectedBlock.styles['backgroundColor'])
                              : '#f3f5f8'
                          }
                          onChange={e =>
                            updateBlockStyle('backgroundColor', e.target.value)
                          }
                          className="h-8 w-12 shrink-0 p-0.5"
                        />
                        <Input
                          value={String(
                            selectedBlock.styles['backgroundColor'] || ''
                          )}
                          onChange={e =>
                            updateBlockStyle('backgroundColor', e.target.value)
                          }
                          placeholder="Sem fundo ou #F3F5F8"
                          className="h-8 min-w-0 flex-1 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">
                        Arredondamento (px)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={32}
                        value={
                          parseInt(
                            String(selectedBlock.styles['borderRadius'] || '0'),
                            10
                          ) || 0
                        }
                        onChange={e =>
                          updateBlockStyle(
                            'borderRadius',
                            `${Math.max(0, Math.min(32, Number(e.target.value) || 0))}px`
                          )
                        }
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">
                        Espaçamento interno lateral (px)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        max={60}
                        value={
                          parseInt(
                            String(selectedBlock.styles['paddingLeft'] || '0'),
                            10
                          ) || 0
                        }
                        onChange={e => {
                          const px = `${Math.max(
                            0, Math.min(60, Number(e.target.value) || 0)
                          )}px`;
                          updateBlockStyle('paddingLeft', px);
                        }}
                        onBlur={() => {
                          const px = String(
                            selectedBlock.styles['paddingLeft'] || '0px'
                          );
                          updateBlockStyle('paddingRight', px);
                        }}
                        className="h-8 text-xs"
                      />
                      <p className="text-[10px] text-slate-500">
                        Aplica o mesmo espaço à esquerda e à direita.
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={
                          Boolean(
                            selectedBlock.styles['boxShadow'] &&
                            selectedBlock.styles['boxShadow'] !== 'none'
                          )
                        }
                        onChange={e =>
                          updateBlockStyle(
                            'boxShadow',
                            e.target.checked
                              ? '0 3px 12px rgba(0,0,0,0.16)'
                              : 'none'
                          )
                        }
                      />
                      Sombra suave
                    </label>
                  </div>
                )}

                {/* Colors */}
                {['text', 'title', 'button'].includes(selectedBlock.type) && (
                  <div className="space-y-2">
                    <Label className="text-xs">{selectedBlock.type === 'button' ? 'Cor do Fundo' : 'Cor do Texto'}</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        value={selectedBlock.type === 'button' ? selectedBlock.styles['backgroundColor'] : selectedBlock.styles['color']} 
                        onChange={(e) => updateBlockStyle(selectedBlock.type === 'button' ? 'backgroundColor' : 'color', e.target.value)}
                        className="h-8 w-12 p-0.5"
                      />
                      <Input 
                        value={selectedBlock.type === 'button' ? selectedBlock.styles['backgroundColor'] : selectedBlock.styles['color']} 
                        onChange={(e) => updateBlockStyle(selectedBlock.type === 'button' ? 'backgroundColor' : 'color', e.target.value)}
                        className="text-[10px] h-8 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Spacing */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Espaçamento Superior</Label>
                    <span className="text-[10px] font-mono text-muted-foreground">{selectedBlock.styles['paddingTop']}</span>
                  </div>
                  <Slider 
                    value={[parseInt(selectedBlock.styles['paddingTop'] || "0")]} 
                    max={100} 
                    min={0} 
                    onValueChange={([v]) => updateBlockStyle('paddingTop', `${v}px`)}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs">Espaçamento Inferior</Label>
                    <span className="text-[10px] font-mono text-muted-foreground">{selectedBlock.styles['paddingBottom']}</span>
                  </div>
                  <Slider 
                    value={[parseInt(selectedBlock.styles['paddingBottom'] || "0")]} 
                    max={100} 
                    min={0} 
                    onValueChange={([v]) => updateBlockStyle('paddingBottom', `${v}px`)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
              <Settings2 size={32} className="mb-4 text-muted-foreground" />
              <p className="text-xs font-medium">Selecione um elemento para editar suas propriedades</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}


// DIGITALE_WIDTH_TYPING_V1
function WidthPixelInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useWidthDraftState(String(value));

  useWidthDraftEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const numeric = Number(draft);

    if (!draft.trim() || !Number.isFinite(numeric)) {
      setDraft(String(value));
      return;
    }

    const valid = Math.min(900, Math.max(40, Math.round(numeric)));
    setDraft(String(valid));

    if (valid !== value) {
      onCommit(valid);
    }
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      aria-label="Largura da imagem em pixels"
      value={draft}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const next = event.target.value;
        if (/^[0-9]{0,4}$/.test(next)) {
          setDraft(next);
        }
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      className="h-8 text-xs"
    />
  );
}
