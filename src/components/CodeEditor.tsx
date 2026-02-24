import Editor from '@monaco-editor/react';
import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  language = 'python' 
}) => {
  return (
    <div className="h-full flex flex-col rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-50">payment_service.py</span>
          <span className="text-xs text-slate-400">Modified</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{language.toUpperCase()}</span>
        </div>
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(val) => onChange(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            padding: { top: 16 },
            fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          }}
        />
      </div>
    </div>
  );
};
