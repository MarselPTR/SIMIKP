import { useState, useRef, useCallback } from "react";
import type { ChangeEvent, DragEvent } from "react";

interface FileUploaderProps {
  onUpload?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

const FileUploader = ({ onUpload, accept = "*", multiple = false, className = "" }: FileUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      const next = multiple ? [...files, ...dropped] : dropped;
      setFiles(next);
      onUpload?.(next);
    },
    [files, multiple, onUpload],
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const next = multiple ? [...files, ...selected] : selected;
    setFiles(next);
    onUpload?.(next);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">📁</span>
          <p className="text-sm text-gray-600">Seret &amp; lepas file di sini, atau klik untuk memilih</p>
          <p className="text-xs text-gray-400">Maksimal 10 MB per file</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
              <button onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
