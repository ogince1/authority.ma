// Utilitaires pour la confirmation automatique des liens
import { autoConfirmExpiredRequests } from '../lib/supabase';

// Fonction pour exécuter la confirmation automatique
export const runAutoConfirmation = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    console.log('🔄 Exécution de la confirmation automatique des liens expirés...');
    
    const result = await autoConfirmExpiredRequests();
    
    if (result.success) {
      console.log(`✅ Confirmation automatique terminée: ${result.count} lien(s) confirmé(s)`);
    } else {
      console.error('❌ Erreur lors de la confirmation automatique:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de la confirmation automatique:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

// Fonction pour programmer l'exécution périodique (à appeler depuis l'application)
export const scheduleAutoConfirmation = () => {
  // Exécuter immédiatement
  runAutoConfirmation();
  
  // Puis toutes les heures
  setInterval(() => {
    runAutoConfirmation();
  }, 60 * 60 * 1000); // 1 heure
};

// Fonction pour vérifier les demandes expirées (pour affichage)
export const getExpiredRequestsCount = async (): Promise<number> => {
  try {
    // Cette fonction pourrait être implémentée pour compter les demandes expirées
    // sans les traiter, pour affichage dans l'interface admin
    return 0;
  } catch (error) {
    console.error('Erreur lors du comptage des demandes expirées:', error);
    return 0;
  }
};
