import React, { useMemo, useState, useEffect } from 'react';
import 'react-quill/dist/quill.snow.css';

// Import dynamique pour éviter les problèmes SSR avec Vite
let ReactQuill: any = null;

const loadQuill = async () => {
  if (typeof window !== 'undefined') {
    const { default: Quill } = await import('react-quill');
    ReactQuill = Quill;
  }
};

interface ProfessionalEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
  className?: string;
}

const ProfessionalEditor: React.FC<ProfessionalEditorProps> = ({
  value,
  onChange,
  placeholder = "Saisissez votre contenu...",
  readOnly = false,
  height = "200px",
  className = ""
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadQuill().then(() => {
      setIsLoaded(true);
    });
  }, []);

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image'
  ];

  if (!isLoaded || !ReactQuill) {
    return (
      <div className={`h-32 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-500">Chargement de l'éditeur...</span>
      </div>
    );
  }

  return (
    <div className={`professional-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        modules={modules}
        formats={formats}
        style={{ 
          height: height,
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem'
        }}
      />
      
      {/* Styles personnalisés */}
      <style jsx global>{`
        .professional-editor .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          font-size: 14px;
        }
        
        .professional-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .professional-editor .ql-editor {
          min-height: ${height};
          padding: 12px 15px;
        }
        
        .professional-editor .ql-editor.ql-blank::before {
          font-style: normal;
          color: #9ca3af;
        }
        
        .professional-editor .ql-toolbar .ql-stroke {
          stroke: #374151;
        }
        
        .professional-editor .ql-toolbar .ql-fill {
          fill: #374151;
        }
        
        .professional-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #1f2937;
        }
        
        .professional-editor .ql-toolbar button:hover .ql-fill {
          fill: #1f2937;
        }
        
        .professional-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb;
        }
        
        .professional-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalEditor;
