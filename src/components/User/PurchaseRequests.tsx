import React from 'react';
import { getCurrentUserProfile } from '../../lib/supabase';
import AdvertiserRequests from './AdvertiserRequests';
import PurchaseRequestsPublisher from './PurchaseRequestsPublisher';

const PurchaseRequests: React.FC = () => {
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-600 mt-4">Chargement...</p>
      </div>
    );
  }

  // Afficher le bon composant selon le rôle
  if (userProfile?.role === 'advertiser') {
    return <AdvertiserRequests />;
  } else if (userProfile?.role === 'publisher') {
    return <PurchaseRequestsPublisher />;
  }

  // Fallback pour les autres rôles
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès non autorisé</h2>
      <p className="text-gray-600">
        Cette section n'est disponible que pour les annonceurs et éditeurs.
      </p>
    </div>
  );
};

export default PurchaseRequests;
