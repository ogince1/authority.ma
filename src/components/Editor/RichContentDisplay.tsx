import React from 'react';

interface RichContentDisplayProps {
  content: string;
  className?: string;
}

const RichContentDisplay: React.FC<RichContentDisplayProps> = ({
  content,
  className = ""
}) => {
  // Fonction pour nettoyer et sécuriser le contenu HTML
  const sanitizeContent = (html: string) => {
    // Liste des balises autorisées
    const allowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'div', 'span'
    ];
    
    // Créer un élément temporaire pour parser le HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Fonction récursive pour nettoyer les éléments
    const cleanElement = (element: Element): Element | null => {
      if (element.nodeType === Node.TEXT_NODE) {
        return element;
      }
      
      if (element.nodeType === Node.ELEMENT_NODE) {
        const tagName = element.tagName.toLowerCase();
        
        if (!allowedTags.includes(tagName)) {
          // Remplacer par un span si la balise n'est pas autorisée
          const span = document.createElement('span');
          span.innerHTML = element.innerHTML;
          return span;
        }
        
        // Nettoyer les attributs pour les liens et images
        if (tagName === 'a') {
          const href = element.getAttribute('href');
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            element.setAttribute('target', '_blank');
            element.setAttribute('rel', 'noopener noreferrer');
          } else {
            element.removeAttribute('href');
          }
        }
        
        if (tagName === 'img') {
          const src = element.getAttribute('src');
          if (!src || (!src.startsWith('http://') && !src.startsWith('https://'))) {
            element.removeAttribute('src');
          }
          element.setAttribute('loading', 'lazy');
        }
        
        // Nettoyer les enfants
        const children = Array.from(element.childNodes);
        children.forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const cleanedChild = cleanElement(child as Element);
            if (cleanedChild && cleanedChild !== child) {
              element.replaceChild(cleanedChild, child);
            }
          }
        });
        
        return element;
      }
      
      return null;
    };
    
    // Nettoyer tous les éléments
    const children = Array.from(temp.childNodes);
    children.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        cleanElement(child as Element);
      }
    });
    
    return temp.innerHTML;
  };

  if (!content || content.trim() === '') {
    return (
      <div className={`text-gray-500 italic ${className}`}>
        Aucun contenu personnalisé fourni
      </div>
    );
  }

  // Si le contenu est du texte brut (sans balises HTML), le convertir en HTML
  let htmlContent = content;
  if (!content.includes('<')) {
    // Convertir les retours à la ligne en paragraphes
    const paragraphs = content.split('\n').filter(p => p.trim() !== '');
    htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
  }

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ 
        __html: sanitizeContent(htmlContent) 
      }}
    />
  );
};

export default RichContentDisplay;
