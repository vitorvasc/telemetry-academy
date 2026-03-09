import Editor, { OnMount } from '@monaco-editor/react';
import React, { useRef, useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  filename?: string;   // NEW: overrides displayed filename, defaults to 'payment_service.py'
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'python',
  filename,            // NEW
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    if (containerRef.current) {
      observerRef.current = new ResizeObserver(() => {
        editor.layout();
      });
      observerRef.current.observe(containerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-50">{filename ?? 'payment_service.py'}</span>
          <span className="text-xs text-slate-400">Modified</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{language.toUpperCase()}</span>
        </div>
      </div>

      <div ref={containerRef} className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(val) => onChange(val || '')}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: false,
            padding: { top: 16 },
            fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          }}
        />
      </div>
    </div>
  );
};
