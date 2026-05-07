import { useEffect, useRef } from "react";
import WebViewer from "@pdftron/webviewer";

export function PdfViewer({ url }: { url: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    let instance: any = null;

    WebViewer(
      {
        path: "/webviewer",
        initialDoc: url,
      },
      viewerRef.current
    ).then((i) => {
      instance = i;
    });

    return () => {
      // Cleanup on unmount or url change if necessary
    };
  }, [url]);

  return (
    <div className="flex flex-col h-full bg-muted/40 rounded-xl overflow-hidden p-0 m-0">
      <div ref={viewerRef} className="w-full h-full" />
    </div>
  );
}
