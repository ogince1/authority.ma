import { 
  syncUsers, 
  checkSyncStatus, 
  createUserWithProfile, 
  getUserStats,
  getUserByEmail,
  updateUserRole 
} from './fixUserSync';

// Interface pour les tests
interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Teste la synchronisation des utilisateurs
 */
export async function testSync(): Promise<TestResult> {
  console.log('🧪 Test de synchronisation des utilisateurs...');
  
  try {
    const result = await syncUsers();
    
    console.log('📊 Résultat de la synchronisation:', result);
    
    return {
      success: result.success,
      message: result.message,
      data: result.details
    };
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return {
      success: false,
      message: `Erreur: ${error}`,
      data: error
    };
  }
}

/**
 * Vérifie l'état de synchronisation
 */
export async function testStatus(): Promise<TestResult> {
  console.log('🔍 Vérification de l\'état de synchronisation...');
  
  try {
    const status = await checkSyncStatus();
    
    console.log('📊 État de synchronisation:', status);
    
    return {
      success: status.inSync,
      message: status.inSync ? 'Synchronisé' : 'Non synchronisé',
      data: status
    };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    return {
      success: false,
      message: `Erreur: ${error}`,
      data: error
    };
  }
}

/**
 * Teste la création d'un utilisateur
 */
export async function testCreateUser(
  email: string = 'test@example.com',
  password: string = 'password123',
  name: string = 'Test User',
  role: 'entrepreneur' | 'investor' = 'entrepreneur'
): Promise<TestResult> {
  console.log(`👤 Test de création d'utilisateur: ${email}`);
  
  try {
    const result = await createUserWithProfile(email, password, name, role);
    
    console.log('📊 Résultat de la création:', result);
    
    return {
      success: result.success,
      message: result.message,
      data: result.user
    };
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
    return {
      success: false,
      message: `Erreur: ${error}`,
      data: error
    };
  }
}

/**
 * Teste la récupération des statistiques
 */
export async function testStats(): Promise<TestResult> {
  console.log('📊 Test des statistiques utilisateurs...');
  
  try {
    const stats = await getUserStats();
    
    console.log('📊 Statistiques:', stats);
    
    return {
      success: true,
      message: 'Statistiques récupérées avec succès',
      data: stats
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    return {
      success: false,
      message: `Erreur: ${error}`,
      data: error
    };
  }
}

/**
 * Teste la récupération d'un utilisateur par email
 */
export async function testGetUser(email: string): Promise<TestResult> {
  console.log(`🔍 Test de récupération d'utilisateur: ${email}`);
  
  try {
    const user = await getUserByEmail(email);
    
    console.log('📊 Utilisateur trouvé:', user);
    
    return {
      success: !!user,
      message: user ? 'Utilisateur trouvé' : 'Utilisateur non trouvé',
      data: user
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération:', error);
    return {
      success: false,
      message: `Erreur: ${error}`,
      data: error
    };
  }
}

/**
 * Exécute tous les tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Exécution de tous les tests...');
  
  const tests = [
    { name: 'État de synchronisation', fn: testStatus },
    { name: 'Statistiques', fn: testStats },
    { name: 'Synchronisation', fn: testSync },
  ];
  
  for (const test of tests) {
    console.log(`\n📝 Test: ${test.name}`);
    const result = await test.fn();
    
    if (result.success) {
      console.log(`✅ ${test.name} - ${result.message}`);
    } else {
      console.log(`❌ ${test.name} - ${result.message}`);
    }
  }
  
  console.log('\n🎉 Tous les tests terminés !');
}

// Fonctions utilitaires pour la console
export const UserSyncUtils = {
  // Tests rapides
  sync: testSync,
  status: testStatus,
  stats: testStats,
  createUser: testCreateUser,
  getUser: testGetUser,
  runAll: runAllTests,
  
  // Fonctions principales
  syncUsers,
  checkSyncStatus,
  createUserWithProfile,
  getUserStats,
  getUserByEmail,
  updateUserRole
};

// Rendre disponible dans la console
declare global {
  interface Window {
    UserSyncUtils: typeof UserSyncUtils;
  }
}

// Attacher aux fenêtre pour l'utilisation en console
if (typeof window !== 'undefined') {
  window.UserSyncUtils = UserSyncUtils;
}

// Message d'aide
export const HELP_MESSAGE = `
🔧 Utilitaires de Synchronisation Utilisateurs

Pour utiliser dans la console du navigateur :

1. Vérifier l'état :
   await UserSyncUtils.status()

2. Synchroniser :
   await UserSyncUtils.sync()

3. Voir les statistiques :
   await UserSyncUtils.stats()

4. Créer un utilisateur :
   await UserSyncUtils.createUser('test@example.com', 'password123', 'Test User', 'entrepreneur')

5. Récupérer un utilisateur :
   await UserSyncUtils.getUser('test@example.com')

6. Exécuter tous les tests :
   await UserSyncUtils.runAll()

7. Accéder aux fonctions principales :
   await UserSyncUtils.syncUsers()
   await UserSyncUtils.checkSyncStatus()
   await UserSyncUtils.getUserStats()
`;

console.log(HELP_MESSAGE);