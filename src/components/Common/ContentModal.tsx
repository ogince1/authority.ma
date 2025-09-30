import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3, Eye, FileText } from 'lucide-react';
import ProfessionalEditor from '../Editor/ProfessionalEditor';
import RichContentDisplay from '../Editor/RichContentDisplay';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title?: string;
  allowEdit?: boolean;
  onSave?: (newContent: string) => void;
  enableProfessionalEditor?: boolean;
}

const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  content,
  title = "Contenu personnalisé",
  allowEdit = false,
  onSave,
  enableProfessionalEditor = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const handleSave = () => {
    if (onSave) {
      onSave(editedContent);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500">Contenu personnalisé de la demande</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {allowEdit && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Modifier</span>
                    </button>
                  )}
                  
                  {allowEdit && isEditing && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {!content || content.trim() === '' ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun contenu personnalisé</h3>
                    <p className="text-gray-500">Cette demande ne contient pas de contenu personnalisé.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isEditing ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Modifier le contenu
                        </label>
                        {enableProfessionalEditor ? (
                          <ProfessionalEditor
                            value={editedContent}
                            onChange={setEditedContent}
                            placeholder="Saisissez votre contenu personnalisé..."
                            height="300px"
                            className="mb-4"
                          />
                        ) : (
                          <RichTextEditor
                            value={editedContent}
                            onChange={setEditedContent}
                            placeholder="Saisissez votre contenu personnalisé..."
                            rows={8}
                            className="border border-gray-300 rounded-lg"
                          />
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <Eye className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Aperçu du contenu</span>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <RichContentDisplay 
                            content={content} 
                            className="text-base leading-relaxed"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ContentModal;
