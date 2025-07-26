// Importer automatiquement les utilitaires de synchronisation
import './testUserSync';

// Message d'information au démarrage
console.log(`
🚀 Utilitaires de Synchronisation Utilisateurs chargés !

Pour utiliser dans la console :
- await UserSyncUtils.sync()      // Synchroniser
- await UserSyncUtils.status()    // Vérifier l'état
- await UserSyncUtils.stats()     // Statistiques
- await UserSyncUtils.runAll()    // Tous les tests

Interface admin disponible : /admin/users
`);

// Export pour l'utilisation dans d'autres composants
export { syncUsers, checkSyncStatus, createUserWithProfile, getUserStats } from './fixUserSync';
export { UserSyncUtils } from './testUserSync';