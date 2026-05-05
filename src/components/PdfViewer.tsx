import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export function PdfViewer({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    pdfjsLib.getDocument(url).promise.then((doc) => {
      if (cancelled) return;
      setPdf(doc); setPages(doc.numPages); setPage(1); setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [url]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    let renderTask: any;
    pdf.getPage(page).then((p: any) => {
      const viewport = p.getViewport({ scale });
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      renderTask = p.render({ canvasContext: ctx, viewport });
    });
    return () => { try { renderTask?.cancel(); } catch {} };
  }, [pdf, page, scale]);

  return (
    <div className="flex flex-col h-full bg-muted/40 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2 bg-background border-b border-border">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm tabular-nums px-2">{page} / {pages || "—"}</span>
          <Button variant="ghost" size="icon" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs tabular-nums">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.2))}><ZoomIn className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto grid place-items-start justify-center p-4">
        {loading ? (
          <div className="grid place-items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <canvas ref={canvasRef} className="shadow-elegant rounded-md" />
        )}
      </div>
    </div>
  );
}
