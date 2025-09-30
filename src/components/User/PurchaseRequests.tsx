import React from 'react';
import { getCurrentUserProfile } from '../../lib/supabase';
import AdvertiserRequests from './AdvertiserRequests';
import PurchaseRequestsPublisher from './PurchaseRequestsPublisher';

const PurchaseRequests: React.FC = () => {
  // ✅ OPTIMISATION: Pas de chargement séparé, laisser les composants enfants gérer
  return <PurchaseRequestsRouter />;
};

// Composant router qui gère la logique de routage
const PurchaseRequestsRouter: React.FC = () => {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUserProfile();
        console.log('🔍 User loaded:', currentUser);
        console.log('🔍 User role:', currentUser?.role);
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ✅ OPTIMISATION: Pas d'écran de chargement séparé
  if (loading) {
    return null; // Laisser les composants enfants gérer leur propre chargement
  }

  if (user?.role === 'advertiser') {
    return <AdvertiserRequests initialUser={user} />;
  } else if (user?.role === 'publisher') {
    return <PurchaseRequestsPublisher initialUser={user} />;
  }

  // Fallback pour les autres rôles
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
      <p className="text-gray-600">
        Cette section n'est disponible que pour les annonceurs et éditeurs.
      </p>
      <div className="mt-4 text-sm text-gray-500">
        <p>Rôle détecté: {user?.role || 'Aucun'}</p>
        <p>Utilisateur: {user?.email || 'Non connecté'}</p>
      </div>
    </div>
  );
};

export default PurchaseRequests;
