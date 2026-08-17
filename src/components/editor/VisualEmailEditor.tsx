import * as React from "react";
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
  AlignRight
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

export interface VisualEmailEditorProps {
  /** Blocos iniciais; quando ausente, usa o layout padrão da marca. */
  initialBlocks?: EditorBlock[];
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
  const [viewMode, setViewMode] = React.useState<"desktop" | "mobile">("desktop");

  // Recarrega os blocos quando outro template é aberto no editor.
  React.useEffect(() => {
    setBlocks(initialBlocks ?? INITIAL_BLOCKS);
    setSelectedBlockId(null);
  }, [initialBlocks]);

  const selectedBlock = React.useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) || null,
    [blocks, selectedBlockId]
  );

  const handleAddBlock = (type: BlockType) => {
    const newBlock: EditorBlock = {
      id: `block-${Date.now()}`,
      type,
      content: { text: "Novo bloco de " + type, url: type === 'image' || type === 'logo' ? 'https://placehold.co/400x200' : undefined },
      styles: { 
        paddingTop: "10px", 
        paddingBottom: "10px",
        textAlign: "left",
        fontSize: "16px",
        color: "#1e293b",
        fontWeight: "normal"
      }
    };
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleDeleteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBlocks(blocks.filter((b) => b.id !== id));
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
    setBlocks(newBlocks);
  };



  const updateBlockStyle = (styleName: string, value: any) => {
    if (!selectedBlockId) return;
    setBlocks(
      blocks.map((b) =>
        b.id === selectedBlockId
          ? { ...b, styles: { ...b.styles, [styleName]: value } }
          : b
      )
    );
  };

  const updateBlockContent = (contentName: string, value: any) => {
    if (!selectedBlockId) return;
    setBlocks(
      blocks.map((b) =>
        b.id === selectedBlockId
          ? { ...b, content: { ...b.content, [contentName]: value } }
          : b
      )
    );
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Coluna Esquerda: Biblioteca */}
      <div className="flex w-64 flex-col border-r bg-muted/10">
        <div className="border-b p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conteúdo</h3>
        </div>
        <ScrollArea className="flex-1">
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
        </ScrollArea>
      </div>

      {/* Coluna Central: Canvas */}
      <div className="relative flex flex-1 flex-col bg-muted/30">
        {/* Toolbar do Canvas */}
        <div className="flex items-center justify-between border-b bg-card px-4 py-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8"><Undo size={16} /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Redo size={16} /></Button>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlockId(block.id);
                      }}
                      className={cn(
                        "relative group cursor-pointer border-2 border-transparent transition-all hover:border-accent/30",
                        selectedBlockId === block.id && "border-accent ring-2 ring-accent/10"
                      )}
                    >
                      {/* Contextual Toolbar */}
                      {selectedBlockId === block.id && (
                        <div className="absolute -right-10 top-0 z-50 flex flex-col gap-1 rounded-md bg-accent p-1 text-accent-foreground shadow-lg animate-in fade-in slide-in-from-left-2 duration-200">
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

                      <div style={block.styles as any}>
                        {block.type === 'logo' && (
                          <div style={{ textAlign: block.styles['textAlign'] as any }}>
                            <img src={block.content.url} alt="Logo" className="max-h-16 inline-block" />
                          </div>
                        )}
                        {block.type === 'title' && (
                          <h2 style={{
                            fontSize: block.styles['fontSize'],
                            fontWeight: block.styles['fontWeight'],
                            color: block.styles['color'],
                            textAlign: block.styles['textAlign']
                          } as any}>
                            {block.content.text}
                          </h2>
                        )}
                        {block.type === 'text' && (
                          <p style={{
                            fontSize: block.styles['fontSize'],
                            lineHeight: block.styles['lineHeight'],
                            color: block.styles['color'],
                            textAlign: block.styles['textAlign']
                          } as any}>
                            {block.content.text}
                          </p>
                        )}
                        {block.type === 'image' && (
                          <img 
                            src={block.content.url} 
                            alt="Content" 
                            style={{ 
                              width: block.styles['width'], 
                              borderRadius: block.styles['borderRadius'] 
                            } as any} 
                          />
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
                                fontSize: '14px'
                              } as any}
                            >
                              {block.content.text}
                            </a>
                          </div>
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

              {/* Style Settings */}
              <div className="space-y-4">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">Estilo</Label>
                
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
