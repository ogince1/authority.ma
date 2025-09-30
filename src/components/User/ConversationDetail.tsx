import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowLeft, User, Clock, ExternalLink } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getConversationById, 
  getConversationMessages, 
  sendMessage, 
  markConversationAsRead,
  getCurrentUser
} from '../../lib/supabase';
import { Conversation, ConversationMessage } from '../../types';
import toast from 'react-hot-toast';

const ConversationDetail: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCurrentUser();
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      if (!conversationId) return;

      const [conversationData, messagesData] = await Promise.all([
        getConversationById(conversationId),
        getConversationMessages(conversationId)
      ]);

      setConversation(conversationData);
      setMessages(messagesData);

      // Marquer comme lu
      if (currentUser) {
        await markConversationAsRead(conversationId, currentUser.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
      toast.error('Erreur lors du chargement de la conversation');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending || !currentUser) return;

    try {
      setSending(true);
      const receiverId = currentUser.id === conversation.advertiser_id 
        ? conversation.publisher_id 
        : conversation.advertiser_id;

      const messageData = {
        conversation_id: conversationId!,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content: newMessage.trim(),
        message_type: 'text' as const,
        related_purchase_request_id: conversation.purchase_request_id
      };

      const sentMessage = await sendMessage(messageData);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      toast.success('Message envoyé');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const isOwnMessage = (message: ConversationMessage) => {
    return currentUser?.id === message.sender_id;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Conversation non trouvée</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen"
    >
      {/* En-tête de la conversation */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/messages')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {conversation.subject || 'Conversation'}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Demande: {conversation.purchase_request?.anchor_text}</span>
              <span>•</span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                conversation.purchase_request?.status === 'accepted' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {conversation.purchase_request?.status === 'accepted' ? 'Acceptée' : 'En cours'}
              </span>
            </div>
          </div>

          {conversation.purchase_request?.placed_url && (
            <a
              href={conversation.purchase_request.placed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-gray-600" />
            </a>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${
              isOwnMessage(message)
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-200'
            } rounded-lg p-3 shadow-sm`}>
              {message.message_type === 'system' && (
                <div className="text-xs opacity-75 mb-1">Message système</div>
              )}
              <p className="text-sm">{message.content}</p>
              <div className={`text-xs mt-1 ${
                isOwnMessage(message)
                  ? 'text-blue-100' 
                  : 'text-gray-500'
              }`}>
                {formatMessageTime(message.created_at)}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Tapez votre message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ConversationDetail; 