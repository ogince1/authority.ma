// Scripts de tâches périodiques pour l'application
import { autoConfirmExpiredRequests } from '../lib/supabase';

// Variable globale pour éviter les duplications
let cronJobsStarted = false;
let cronIntervalId: NodeJS.Timeout | null = null;

// Fonction pour exécuter toutes les tâches cron
export const runCronJobs = async () => {
  console.log('🕐 Exécution des tâches cron...');
  
  try {
    // 1. Confirmation automatique des liens expirés
    console.log('📋 Vérification des liens expirés...');
    const autoConfirmationResult = await autoConfirmExpiredRequests();
    
    if (autoConfirmationResult && autoConfirmationResult.confirmed !== undefined) {
      console.log(`✅ ${autoConfirmationResult.confirmed} lien(s) confirmé(s) automatiquement`);
    } else {
      console.error('❌ Erreur lors de la confirmation automatique:', autoConfirmationResult);
    }
    
    // Ici on peut ajouter d'autres tâches cron à l'avenir
    // - Nettoyage des sessions expirées
    // - Envoi d'emails de rappel
    // - Génération de rapports
    // - etc.
    
    console.log('✅ Toutes les tâches cron ont été exécutées');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tâches cron:', error);
  }
};

// Fonction pour programmer l'exécution périodique
export const startCronJobs = () => {
  // Éviter les duplications
  if (cronJobsStarted) {
    console.log('⚠️ Tâches cron déjà démarrées, ignoré');
    return cronIntervalId;
  }
  
  console.log('🚀 Démarrage des tâches cron...');
  cronJobsStarted = true;
  
  // Exécuter immédiatement
  runCronJobs();
  
  // Puis toutes les heures
  cronIntervalId = setInterval(() => {
    runCronJobs();
  }, 60 * 60 * 1000); // 1 heure
  
  console.log('⏰ Tâches cron programmées (exécution toutes les heures)');
  
  // Retourner l'ID de l'intervalle pour pouvoir l'arrêter si nécessaire
  return cronIntervalId;
};

// Fonction pour arrêter les tâches cron
export const stopCronJobs = () => {
  if (cronIntervalId) {
    clearInterval(cronIntervalId);
    cronIntervalId = null;
    cronJobsStarted = false;
    console.log('⏹️ Tâches cron arrêtées');
  }
};

// Fonction pour exécuter une tâche spécifique
export const runSpecificCronJob = async (jobName: string) => {
  console.log(`🔧 Exécution de la tâche: ${jobName}`);
  
  switch (jobName) {
    case 'auto-confirmation':
      const result = await autoConfirmExpiredRequests();
      console.log(`Résultat: ${result ? 'Succès' : 'Échec'}, ${result?.confirmed || 0} élément(s) traité(s)`);
      return result;
    
    default:
      console.error(`❌ Tâche inconnue: ${jobName}`);
      return { success: false, error: 'Tâche inconnue' };
  }
};
