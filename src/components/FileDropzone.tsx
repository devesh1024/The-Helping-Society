import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  accept?: string;
  multiple?: boolean;
  files: File[];
  onFiles: (files: File[]) => void;
  hint?: string;
  enablePaste?: boolean;
}

export function FileDropzone({ accept, multiple, files, onFiles, hint, enablePaste = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const accepts = (f: File) => {
    if (!accept) return true;
    return accept.split(",").some((a) => {
      a = a.trim();
      if (a.startsWith(".")) return f.name.toLowerCase().endsWith(a.toLowerCase());
      if (a.endsWith("/*")) return f.type.startsWith(a.slice(0, -1));
      return f.type === a;
    });
  };

  const add = useCallback((incoming: File[]) => {
    const valid = incoming.filter(accepts);
    if (!valid.length) return;
    onFiles(multiple ? [...files, ...valid] : [valid[0]]);
  }, [files, multiple, accept, onFiles]);

  useEffect(() => {
    if (!enablePaste) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.files;
      if (items && items.length) add(Array.from(items));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [add, enablePaste]);

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setOver(false);
          add(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "border-2 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer transition-smooth",
          over ? "border-primary bg-primary/5" : "border-input hover:border-primary/50 hover:bg-muted/40"
        )}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
        <p className="text-sm mt-2">
          <span className="font-medium text-foreground">Click, drag & drop</span>
          <span className="text-muted-foreground"> or paste {multiple ? "files" : "a file"}</span>
        </p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        <input
          ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden"
          onChange={(e) => add(Array.from(e.target.files || []))}
        />
      </div>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1.5">
              <span className="truncate">{f.name} <span className="text-muted-foreground">({Math.round(f.size/1024)} KB)</span></span>
              <button type="button" onClick={(e) => { e.stopPropagation(); onFiles(files.filter((_, j) => j !== i)); }}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
