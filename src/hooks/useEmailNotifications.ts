// Hook pour gérer les notifications email avec Brevo
import { useState, useEffect } from 'react';
import { customerJourneyService } from '../utils/customerJourneyService';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface EmailPreferences {
  welcome_emails: boolean;
  order_notifications: boolean;
  site_notifications: boolean;
  weekly_reports: boolean;
  marketing_emails: boolean;
}

export const useEmailNotifications = () => {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    welcome_emails: true,
    order_notifications: true,
    site_notifications: true,
    weekly_reports: true,
    marketing_emails: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<EmailPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedPrefs = { ...preferences, ...newPreferences };
      
      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          user_id: user.id,
          preferences: updatedPrefs,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setPreferences(updatedPrefs);
      toast.success('Préférences email mises à jour !');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      toast.error('Erreur lors de la mise à jour des préférences');
      return false;
    }
  };

  const sendWelcomeEmail = async (userRole: 'advertiser' | 'publisher') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (userRole === 'publisher') {
        await customerJourneyService.handleEditorWelcome(user.id);
        toast.success('Email de bienvenue envoyé à l\'éditeur !');
      } else {
        await customerJourneyService.handleAdvertiserWelcome(user.id);
        toast.success('Email de bienvenue envoyé à l\'annonceur !');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      toast.error('Erreur lors de l\'envoi de l\'email de bienvenue');
    }
  };

  const sendOrderNotification = async (orderId: string, orderData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await customerJourneyService.handleAdvertiserOrderPlaced(user.id, orderId, orderData);
      toast.success('Notification de commande envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de commande:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const sendSiteApprovalNotification = async (userId: string, siteId: string) => {
    try {
      await customerJourneyService.handleEditorSiteApproved(userId, siteId);
      toast.success('Notification d\'approbation envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification d\'approbation:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const sendSiteRejectionNotification = async (userId: string, siteId: string, reason: string) => {
    try {
      await customerJourneyService.handleEditorSiteRejected(userId, siteId, reason);
      toast.success('Notification de rejet envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de rejet:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const sendNewRequestNotification = async (userId: string, requestId: string) => {
    try {
      await customerJourneyService.handleEditorNewRequest(userId, requestId);
      toast.success('Notification de nouvelle demande envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de nouvelle demande:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const sendLinkPlacedNotification = async (userId: string, requestId: string, linkData: any) => {
    try {
      await customerJourneyService.handleAdvertiserLinkPlaced(userId, requestId, linkData);
      toast.success('Notification de lien placé envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de lien placé:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const sendPaymentReceivedNotification = async (userId: string, transactionId: string, amount: number, siteName: string) => {
    try {
      await customerJourneyService.handleEditorPaymentReceived(userId, transactionId, amount, siteName);
      toast.success('Notification de paiement envoyée !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de paiement:', error);
      toast.error('Erreur lors de l\'envoi de la notification');
    }
  };

  const sendPasswordResetEmail = async (userId: string, resetUrl: string) => {
    try {
      await customerJourneyService.handlePasswordReset(userId, resetUrl);
      toast.success('Email de réinitialisation envoyé !');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    }
  };

  const sendCustomEmail = async (
    userId: string,
    templateKey: any,
    variables: Record<string, any>
  ) => {
    try {
      const success = await customerJourneyService.sendCustomEmail(userId, templateKey, variables);
      if (success) {
        toast.success('Email personnalisé envoyé !');
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email personnalisé');
      }
      return success;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email personnalisé:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
      return false;
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    sendWelcomeEmail,
    sendOrderNotification,
    sendSiteApprovalNotification,
    sendSiteRejectionNotification,
    sendNewRequestNotification,
    sendLinkPlacedNotification,
    sendPaymentReceivedNotification,
    sendPasswordResetEmail,
    sendCustomEmail
  };
};

// Hook spécifique pour les administrateurs
export const useAdminEmailNotifications = () => {
  const [loading, setLoading] = useState(false);

  const sendBulkWelcomeEmails = async (userIds: string[], userRole: 'advertiser' | 'publisher') => {
    setLoading(true);
    try {
      const promises = userIds.map(userId => {
        if (userRole === 'publisher') {
          return customerJourneyService.handleEditorWelcome(userId);
        } else {
          return customerJourneyService.handleAdvertiserWelcome(userId);
        }
      });

      await Promise.all(promises);
      toast.success(`${userIds.length} emails de bienvenue envoyés !`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails de bienvenue:', error);
      toast.error('Erreur lors de l\'envoi des emails');
    } finally {
      setLoading(false);
    }
  };

  const sendBulkSiteApprovalEmails = async (approvals: Array<{ userId: string; siteId: string }>) => {
    setLoading(true);
    try {
      const promises = approvals.map(({ userId, siteId }) => 
        customerJourneyService.handleEditorSiteApproved(userId, siteId)
      );

      await Promise.all(promises);
      toast.success(`${approvals.length} notifications d\'approbation envoyées !`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications d\'approbation:', error);
      toast.error('Erreur lors de l\'envoi des notifications');
    } finally {
      setLoading(false);
    }
  };

  const sendBulkSiteRejectionEmails = async (rejections: Array<{ userId: string; siteId: string; reason: string }>) => {
    setLoading(true);
    try {
      const promises = rejections.map(({ userId, siteId, reason }) => 
        customerJourneyService.handleEditorSiteRejected(userId, siteId, reason)
      );

      await Promise.all(promises);
      toast.success(`${rejections.length} notifications de rejet envoyées !`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications de rejet:', error);
      toast.error('Erreur lors de l\'envoi des notifications');
    } finally {
      setLoading(false);
    }
  };

  const sendWeeklyReports = async (userIds: string[]) => {
    setLoading(true);
    try {
      const promises = userIds.map(userId => 
        customerJourneyService.sendCustomEmail(userId, 'WEEKLY_REPORT', {
          period: 'Cette semaine',
          stats: 'Vos statistiques de la semaine',
          dashboard_url: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/dashboard`
        })
      );

      await Promise.all(promises);
      toast.success(`${userIds.length} rapports hebdomadaires envoyés !`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi des rapports hebdomadaires:', error);
      toast.error('Erreur lors de l\'envoi des rapports');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendBulkWelcomeEmails,
    sendBulkSiteApprovalEmails,
    sendBulkSiteRejectionEmails,
    sendWeeklyReports
  };
};
