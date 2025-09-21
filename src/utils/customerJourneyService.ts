// Service de gestion du parcours client avec emails automatiques
import { emailServiceClient, EMAIL_TEMPLATES } from './emailServiceClient';
import { supabase } from '../lib/supabase';

export interface UserJourneyEvent {
  userId: string;
  userEmail: string;
  userName: string;
  userRole: 'advertiser' | 'publisher';
  eventType: string;
  eventData: any;
  timestamp: Date;
}

class CustomerJourneyService {
  async handleEditorWelcome(userId: string): Promise<void> {
    try {
      // Récupérer les données utilisateur
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('Error fetching user:', error);
        return;
      }

      // Envoyer l'email de bienvenue
      await emailServiceClient.sendTemplateEmail('EDITOR_WELCOME', user.email, {
        user_name: user.name,
        dashboard_url: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/dashboard`
      }, ['welcome', 'editor', 'onboarding']);

      // Enregistrer l'événement
      await this.logJourneyEvent({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: 'publisher',
        eventType: 'editor_welcome_sent',
        eventData: { email_sent: true },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in handleEditorWelcome:', error);
    }
  }

  async handleEditorSiteApproved(userId: string, siteId: string): Promise<void> {
    try {
      // Récupérer les données utilisateur et site
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: site, error: siteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', siteId)
        .single();

      if (userError || !user || siteError || !site) {
        console.error('Error fetching user or site:', userError, siteError);
        return;
      }

      // Envoyer l'email d'approbation
      await emailServiceClient.sendTemplateEmail('EDITOR_SITE_APPROVED', user.email, {
        user_name: user.name,
        site_name: site.title,
        site_url: site.url,
        dashboard_url: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/dashboard`
      }, ['site_approved', 'editor', 'approval']);

      // Enregistrer l'événement
      await this.logJourneyEvent({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: 'publisher',
        eventType: 'site_approved_email_sent',
        eventData: { site_id: siteId, site_title: site.title },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in handleEditorSiteApproved:', error);
    }
  }

  async handleEditorSiteRejected(userId: string, siteId: string, rejectionReason: string): Promise<void> {
    try {
      // Récupérer les données utilisateur et site
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: site, error: siteError } = await supabase
        .from('websites')
        .select('*')
        .eq('id', siteId)
        .single();

      if (userError || !user || siteError || !site) {
        console.error('Error fetching user or site:', userError, siteError);
        return;
      }

      // Envoyer l'email de rejet
      await emailServiceClient.sendTemplateEmail('EDITOR_SITE_REJECTED', user.email, {
        user_name: user.name,
        site_name: site.title,
        rejection_reason: rejectionReason,
        support_url: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/contact`
      }, ['site_rejected', 'editor', 'feedback']);

      // Enregistrer l'événement
      await this.logJourneyEvent({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: 'publisher',
        eventType: 'site_rejected_email_sent',
        eventData: { site_id: siteId, site_title: site.title, rejection_reason: rejectionReason },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in handleEditorSiteRejected:', error);
    }
  }

  async handleEditorNewRequest(userId: string, requestId: string): Promise<void> {
    try {
      // Récupérer les données utilisateur et demande
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: request, error: requestError } = await supabase
        .from('link_purchase_requests')
        .select(`
          *,
          link_listing:link_listings(
            title,
            website:websites(title, url)
          )
        `)
        .eq('id', requestId)
        .single();

      if (userError || !user || requestError || !request) {
        console.error('Error fetching user or request:', userError, requestError);
        return;
      }

      // Envoyer l'email de nouvelle demande
      await emailServiceClient.sendTemplateEmail('EDITOR_NEW_REQUEST', user.email, {
        user_name: user.name,
        site_name: request.link_listing?.website?.title || request.link_listing?.title || 'Site',
        request_id: request.id,
        proposed_price: request.proposed_price,
        dashboard_url: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/dashboard`
      }, ['new_request', 'editor', 'opportunity']);

      // Enregistrer l'événement
      await this.logJourneyEvent({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: 'publisher',
        eventType: 'new_request_email_sent',
        eventData: { request_id: requestId },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in handleEditorNewRequest:', error);
    }
  }

  async handleAdvertiserWelcome(userId: string): Promise<void> {
    try {
      // Récupérer les données utilisateur
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('Error fetching user:', error);
        return;
      }

      // Envoyer l'email de bienvenue
      await emailServiceClient.sendTemplateEmail('ADVERTISER_WELCOME', user.email, {
        user_name: user.name,
        dashboard_url: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/dashboard`
      }, ['welcome', 'advertiser', 'onboarding']);

      // Enregistrer l'événement
      await this.logJourneyEvent({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: 'advertiser',
        eventType: 'advertiser_welcome_sent',
        eventData: { email_sent: true },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in handleAdvertiserWelcome:', error);
    }
  }

  async handleAdvertiserOrderPlaced(userId: string, orderId: string, orderData: any): Promise<void> {
    try {
      // Récupérer les données utilisateur
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('Error fetching user:', error);
        return;
      }

      // Envoyer l'email de confirmation de commande
      await emailServiceClient.sendTemplateEmail('ADVERTISER_ORDER_PLACED', user.email, {
        user_name: user.name,
        order_id: orderId,
        total_amount: orderData.total_amount,
        sites_count: orderData.sites_count,
        dashboard_url: `${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/dashboard`
      }, ['order_placed', 'advertiser', 'confirmation']);

      // Enregistrer l'événement
      await this.logJourneyEvent({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userRole: 'advertiser',
        eventType: 'order_placed_email_sent',
        eventData: { order_id: orderId, order_data: orderData },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in handleAdvertiserOrderPlaced:', error);
    }
  }

  async logJourneyEvent(event: UserJourneyEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_journey_events')
        .insert({
          user_id: event.userId,
          user_email: event.userEmail,
          user_name: event.userName,
          user_role: event.userRole,
          event_type: event.eventType,
          event_data: event.eventData,
          event_timestamp: event.timestamp.toISOString()
        });

      if (error) {
        console.error('Error logging journey event:', error);
      }
    } catch (error) {
      console.error('Error in logJourneyEvent:', error);
    }
  }

  async getUserJourneyEvents(userId: string, limit: number = 10, offset: number = 0): Promise<UserJourneyEvent[]> {
    try {
      const { data, error } = await supabase
        .from('user_journey_events')
        .select('*')
        .eq('user_id', userId)
        .order('event_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching journey events:', error);
        return [];
      }

      return (data || []).map(event => ({
        userId: event.user_id,
        userEmail: event.user_email,
        userName: event.user_name,
        userRole: event.user_role,
        eventType: event.event_type,
        eventData: event.event_data,
        timestamp: new Date(event.event_timestamp)
      }));
    } catch (error) {
      console.error('Error in getUserJourneyEvents:', error);
      return [];
    }
  }
}

// Instance singleton
export const customerJourneyService = new CustomerJourneyService();