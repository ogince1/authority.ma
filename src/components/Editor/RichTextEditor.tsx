import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Link, 
  Image, 
  Type, 
  List, 
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Rédigez votre contenu ici...",
  className = "",
  rows = 6
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      // S'assurer que le contenu est bien formaté en HTML
      let content = editorRef.current.innerHTML;
      
      // Si le contenu est du texte brut, l'entourer de balises <p>
      if (!content.includes('<') || content.trim() === '') {
        content = `<p>${content}</p>`;
      } else {
        // S'assurer que chaque ligne de texte est dans un paragraphe
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0 && !content.includes('<p>') && !content.includes('<div>')) {
          content = `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
        }
      }
      
      onChange(content);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertHeading = (level: number) => {
    execCommand('formatBlock', `h${level}`);
  };

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Gras' },
    { icon: Italic, command: 'italic', title: 'Italique' },
    { icon: Underline, command: 'underline', title: 'Souligné' },
    { icon: Type, onClick: () => insertHeading(2), title: 'Titre H2' },
    { icon: Type, onClick: () => insertHeading(3), title: 'Titre H3' },
    { icon: Link, onClick: insertLink, title: 'Insérer un lien' },
    { icon: Image, onClick: insertImage, title: 'Insérer une image' },
    { icon: List, command: 'insertUnorderedList', title: 'Liste à puces' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Liste numérotée' },
    { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Citation' },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Aligner à gauche' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Centrer' },
    { icon: AlignRight, command: 'justifyRight', title: 'Aligner à droite' },
    { icon: Undo, command: 'undo', title: 'Annuler' },
    { icon: Redo, command: 'redo', title: 'Refaire' }
  ];

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              type="button"
              onClick={() => button.onClick ? button.onClick() : execCommand(button.command!, button.value)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              title={button.title}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* Zone d'édition */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`p-3 min-h-[${rows * 1.5}rem] focus:outline-none ${
          isFocused ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{ minHeight: `${rows * 1.5}rem` }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
      />

      {/* Styles pour le placeholder */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
