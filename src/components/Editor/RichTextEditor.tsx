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

interface ToolbarButton {
  icon: any;
  command?: string;
  value?: string;
  onClick?: () => void;
  title: string;
  label?: string;
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
  const isTypingRef = useRef(false); // Flag pour savoir si l'utilisateur est en train de taper
  const isInitializedRef = useRef(false); // Flag pour savoir si l'éditeur est initialisé

  // ✅ FIX: Initialisation au montage
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      editorRef.current.innerHTML = value || '';
      isInitializedRef.current = true;
    }
  }, []);

  // ✅ FIX: Sauvegarder et restaurer la position du curseur
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  const restoreCursorPosition = (range: Range | null) => {
    if (range) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  useEffect(() => {
    // ✅ FIX: Ne pas réinitialiser si l'utilisateur est en train de taper
    // Seulement mettre à jour si le contenu vient de l'extérieur (ex: chargement de données)
    if (editorRef.current && editorRef.current.innerHTML !== value && !isTypingRef.current && isInitializedRef.current) {
      const cursorPosition = saveCursorPosition();
      editorRef.current.innerHTML = value;
      restoreCursorPosition(cursorPosition);
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      // ✅ FIX: Indiquer que l'utilisateur est en train de taper
      isTypingRef.current = true;
      
      // ✅ FIX: Capturer le contenu SANS le reformater
      // Cela préserve les balises HTML créées par execCommand (liens, listes, titres, etc.)
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // ✅ FIX: Réinitialiser le flag après un court délai
      setTimeout(() => {
        isTypingRef.current = false;
      }, 50);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') {
      alert('⚠️ Veuillez d\'abord sélectionner du texte avant d\'ajouter un lien');
      return;
    }
    
    const url = prompt('Entrez l\'URL du lien:');
    if (url && url.trim()) {
      // Valider l'URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('⚠️ L\'URL doit commencer par http:// ou https://');
        return;
      }
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      // Valider l'URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('L\'URL doit commencer par http:// ou https://');
        return;
      }
      execCommand('insertImage', url);
    }
  };

  const insertHeading = (level: number) => {
    execCommand('formatBlock', `<h${level}>`);
  };

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Gras (Ctrl+B)' },
    { icon: Italic, command: 'italic', title: 'Italique (Ctrl+I)' },
    { icon: Underline, command: 'underline', title: 'Souligné (Ctrl+U)' },
    { icon: Type, onClick: () => insertHeading(1), title: 'Titre H1', label: 'H1' },
    { icon: Type, onClick: () => insertHeading(2), title: 'Titre H2', label: 'H2' },
    { icon: Type, onClick: () => insertHeading(3), title: 'Titre H3', label: 'H3' },
    { icon: Link, onClick: insertLink, title: 'Insérer un lien (sélectionnez d\'abord du texte)' },
    { icon: Image, onClick: insertImage, title: 'Insérer une image' },
    { icon: List, command: 'insertUnorderedList', title: 'Liste à puces' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Liste numérotée' },
    { icon: Quote, onClick: () => execCommand('formatBlock', '<blockquote>'), title: 'Citation' },
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
              onClick={(e) => {
                e.preventDefault();
                if (button.onClick) {
                  button.onClick();
                } else if (button.command) {
                  execCommand(button.command, button.value);
                }
              }}
              className="p-2 hover:bg-gray-200 rounded transition-colors relative group"
              title={button.title}
            >
              <Icon className="h-4 w-4" />
              {button.label && (
                <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-blue-500 text-white px-1 rounded">
                  {button.label}
                </span>
              )}
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
        suppressContentEditableWarning
      />

      {/* Styles pour le placeholder et le formatage */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        /* Styles pour les titres */
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.67em 0;
          line-height: 1.2;
        }
        
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.75em 0;
          line-height: 1.3;
        }
        
        [contenteditable] h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin: 0.83em 0;
          line-height: 1.4;
        }
        
        /* Styles pour les listes */
        [contenteditable] ul {
          list-style-type: disc;
          margin: 1em 0;
          padding-left: 2em;
        }
        
        [contenteditable] ol {
          list-style-type: decimal;
          margin: 1em 0;
          padding-left: 2em;
        }
        
        [contenteditable] li {
          margin: 0.5em 0;
        }
        
        /* Styles pour les citations */
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
          font-style: italic;
        }
        
        /* Styles pour les liens */
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        
        [contenteditable] a:hover {
          color: #1d4ed8;
        }
        
        /* Styles pour les images */
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
          border-radius: 0.5rem;
        }
        
        /* Styles pour le texte formaté */
        [contenteditable] strong,
        [contenteditable] b {
          font-weight: bold;
        }
        
        [contenteditable] em,
        [contenteditable] i {
          font-style: italic;
        }
        
        [contenteditable] u {
          text-decoration: underline;
        }
        
        /* Styles pour les paragraphes */
        [contenteditable] p {
          margin: 0.5em 0;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
